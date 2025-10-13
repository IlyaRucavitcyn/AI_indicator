import { Test, TestingModule } from '@nestjs/testing';
import { AnalyzerService } from './analyzer.service';
import { GitService } from './git.service';
import { TempService } from './temp.service';

describe('AnalyzerService', () => {
  let service: AnalyzerService;
  let gitService: GitService;
  let tempService: TempService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AnalyzerService, GitService, TempService],
    }).compile();

    service = module.get<AnalyzerService>(AnalyzerService);
    gitService = module.get<GitService>(GitService);
    tempService = module.get<TempService>(TempService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('analyzeRepository', () => {
    const mockCommits = [
      {
        hash: 'hash1',
        author: 'Author 1',
        email: 'author1@example.com',
        date: new Date('2024-01-01T00:00:00Z'),
        message: 'First commit',
        filesChanged: 5,
      },
      {
        hash: 'hash2',
        author: 'Author 2',
        email: 'author2@example.com',
        date: new Date('2024-01-02T00:00:00Z'),
        message: 'Second commit',
        filesChanged: 3,
      },
      {
        hash: 'hash3',
        author: 'Author 1',
        email: 'author1@example.com',
        date: new Date('2024-01-03T00:00:00Z'),
        message: 'Third commit',
        filesChanged: 2,
      },
    ];

    const mockRepoInfo = {
      branch: 'main',
      remote: 'https://github.com/user/repo.git',
    };

    beforeEach(() => {
      jest.spyOn(gitService, 'cloneRepository').mockResolvedValue({
        git: {} as any,
        repoPath: '/tmp/test-repo',
      });
      jest.spyOn(gitService, 'isValidRepository').mockResolvedValue(true);
      jest.spyOn(gitService, 'getCommitHistory').mockResolvedValue(mockCommits);
      jest
        .spyOn(gitService, 'getRepositoryInfo')
        .mockResolvedValue(mockRepoInfo);
      jest.spyOn(gitService, 'cleanupRepository').mockImplementation(() => { });
      jest.spyOn(tempService, 'extractRepoName').mockReturnValue('user/repo');
    });

    it('should analyze repository successfully', async () => {
      const result = await service.analyzeRepository(
        'https://github.com/user/repo.git',
        'main',
      );

      expect(result).toEqual({
        repository: 'user/repo',
        branch: 'main',
        metrics: {
          totalCommits: 3,
          contributors: 2,
          firstCommit: '2024-01-01T00:00:00.000Z',
          lastCommit: '2024-01-03T00:00:00.000Z',
          durationDays: 2,
          avgCommitsPerDay: 1.5,
          topContributor: 'author1@example.com',
          contributorStats: [
            {
              email: 'author1@example.com',
              name: 'Author 1',
              commitCount: 2,
            },
            {
              email: 'author2@example.com',
              name: 'Author 2',
              commitCount: 1,
            },
          ],
        },
        analyzedAt: expect.any(String),
      });

      expect(gitService.cloneRepository).toHaveBeenCalledWith(
        'https://github.com/user/repo.git',
        'main',
      );
      expect(gitService.isValidRepository).toHaveBeenCalled();
      expect(gitService.getCommitHistory).toHaveBeenCalled();
      expect(gitService.getRepositoryInfo).toHaveBeenCalled();
      expect(gitService.cleanupRepository).toHaveBeenCalledWith(
        '/tmp/test-repo',
      );
    });

    it('should handle invalid repository', async () => {
      jest.spyOn(gitService, 'isValidRepository').mockResolvedValue(false);

      await expect(
        service.analyzeRepository('https://github.com/user/repo.git', 'main'),
      ).rejects.toThrow('Analysis failed: Invalid Git repository');
    });

    it('should handle clone errors', async () => {
      jest
        .spyOn(gitService, 'cloneRepository')
        .mockRejectedValue(new Error('Clone failed'));

      await expect(
        service.analyzeRepository('https://github.com/user/repo.git', 'main'),
      ).rejects.toThrow('Analysis failed: Clone failed');
    });

    it('should handle empty commit history', async () => {
      jest.spyOn(gitService, 'getCommitHistory').mockResolvedValue([]);

      const result = await service.analyzeRepository(
        'https://github.com/user/repo.git',
        'main',
      );

      expect(result.metrics).toEqual({
        totalCommits: 0,
        contributors: 0,
        firstCommit: '',
        lastCommit: '',
        durationDays: 0,
        avgCommitsPerDay: 0,
        topContributor: '',
        contributorStats: [],
      });
    });

    it('should clean up repository even on error', async () => {
      jest
        .spyOn(gitService, 'getCommitHistory')
        .mockRejectedValue(new Error('History failed'));
      const cleanupSpy = jest.spyOn(gitService, 'cleanupRepository');

      await expect(
        service.analyzeRepository('https://github.com/user/repo.git', 'main'),
      ).rejects.toThrow('Analysis failed: History failed');

      expect(cleanupSpy).toHaveBeenCalledWith('/tmp/test-repo');
    });
  });

  describe('calculateMetrics', () => {
    it('should calculate metrics correctly for multiple contributors', () => {
      const commits = [
        {
          hash: 'hash1',
          author: 'Author 1',
          email: 'author1@example.com',
          date: new Date('2024-01-01T00:00:00Z'),
          message: 'First commit',
          filesChanged: 5,
        },
        {
          hash: 'hash2',
          author: 'Author 2',
          email: 'author2@example.com',
          date: new Date('2024-01-02T00:00:00Z'),
          message: 'Second commit',
          filesChanged: 3,
        },
        {
          hash: 'hash3',
          author: 'Author 1',
          email: 'author1@example.com',
          date: new Date('2024-01-03T00:00:00Z'),
          message: 'Third commit',
          filesChanged: 2,
        },
      ];

      // Access private method for testing

      const metrics = (service as any).calculateMetrics(commits);

      expect(metrics.totalCommits).toBe(3);
      expect(metrics.contributors).toBe(2);
      expect(metrics.firstCommit).toBe('2024-01-01T00:00:00.000Z');
      expect(metrics.lastCommit).toBe('2024-01-03T00:00:00.000Z');
      expect(metrics.durationDays).toBe(2);
      expect(metrics.avgCommitsPerDay).toBe(1.5);
      expect(metrics.topContributor).toBe('author1@example.com');
      expect(metrics.contributorStats).toHaveLength(2);
      expect(metrics.contributorStats[0]).toEqual({
        email: 'author1@example.com',
        name: 'Author 1',
        commitCount: 2,
      });
      expect(metrics.contributorStats[1]).toEqual({
        email: 'author2@example.com',
        name: 'Author 2',
        commitCount: 1,
      });
    });

    it('should handle single contributor correctly', () => {
      const commits = [
        {
          hash: 'hash1',
          author: 'Author 1',
          email: 'author1@example.com',
          date: new Date('2024-01-01T00:00:00Z'),
          message: 'First commit',
          filesChanged: 5,
        },
        {
          hash: 'hash2',
          author: 'Author 1',
          email: 'author1@example.com',
          date: new Date('2024-01-02T00:00:00Z'),
          message: 'Second commit',
          filesChanged: 3,
        },
      ];

      const metrics = (service as any).calculateMetrics(commits);

      expect(metrics.totalCommits).toBe(2);
      expect(metrics.contributors).toBe(1);
      expect(metrics.topContributor).toBe('author1@example.com');
      expect(metrics.contributorStats).toHaveLength(1);
    });

    it('should handle same-day commits correctly', () => {
      const commits = [
        {
          hash: 'hash1',
          author: 'Author 1',
          email: 'author1@example.com',
          date: new Date('2024-01-01T00:00:00Z'),
          message: 'First commit',
          filesChanged: 5,
        },
        {
          hash: 'hash2',
          author: 'Author 1',
          email: 'author1@example.com',
          date: new Date('2024-01-01T12:00:00Z'),
          message: 'Second commit',
          filesChanged: 3,
        },
      ];

      const metrics = (service as any).calculateMetrics(commits);

      expect(metrics.durationDays).toBe(1);
      expect(metrics.avgCommitsPerDay).toBe(2);
    });
  });
});
