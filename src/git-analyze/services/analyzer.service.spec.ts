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
        insertions: 50,
        deletions: 10,
        files: ['file1.ts', 'file2.ts', 'file3.ts', 'file4.ts', 'file5.ts'],
      },
      {
        hash: 'hash2',
        author: 'Author 2',
        email: 'author2@example.com',
        date: new Date('2024-01-02T00:00:00Z'),
        message: 'Second commit',
        filesChanged: 3,
        insertions: 30,
        deletions: 5,
        files: ['file1.ts', 'file2.ts', 'file3.ts'],
      },
      {
        hash: 'hash3',
        author: 'Author 1',
        email: 'author1@example.com',
        date: new Date('2024-01-03T00:00:00Z'),
        message: 'Third commit',
        filesChanged: 2,
        insertions: 20,
        deletions: 2,
        files: ['file1.ts', 'file2.ts'],
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
      jest.spyOn(gitService, 'cleanupRepository').mockImplementation(() => {});
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
          aiIndicators: {
            avgLinesPerCommit: 39,
            largeCommitPercentage: 0,
            firstCommitAnalysis: {
              lines: 60,
              isSuspicious: false,
            },
            avgFilesPerCommit: 3.33,
          },
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

  describe('AI Indicator Metrics', () => {
    describe('calculateAvgLinesPerCommit', () => {
      it('should calculate average lines per commit correctly', () => {
        const commits = [
          {
            hash: 'hash1',
            author: 'Author 1',
            email: 'author1@example.com',
            date: new Date('2024-01-01'),
            message: 'Commit 1',
            filesChanged: 2,
            insertions: 10,
            deletions: 5,
            files: ['file1.ts', 'file2.ts'],
          },
          {
            hash: 'hash2',
            author: 'Author 1',
            email: 'author1@example.com',
            date: new Date('2024-01-02'),
            message: 'Commit 2',
            filesChanged: 1,
            insertions: 20,
            deletions: 3,
            files: ['file3.ts'],
          },
          {
            hash: 'hash3',
            author: 'Author 1',
            email: 'author1@example.com',
            date: new Date('2024-01-03'),
            message: 'Commit 3',
            filesChanged: 3,
            insertions: 5,
            deletions: 2,
            files: ['file4.ts', 'file5.ts', 'file6.ts'],
          },
        ];

        const result = (service as any).calculateAvgLinesPerCommit(commits);

        // (10+5) + (20+3) + (5+2) = 15 + 23 + 7 = 45 / 3 = 15
        expect(result).toBe(15);
      });

      it('should return 0 for empty commits', () => {
        const result = (service as any).calculateAvgLinesPerCommit([]);
        expect(result).toBe(0);
      });

      it('should round to 2 decimal places', () => {
        const commits = [
          {
            hash: 'hash1',
            author: 'Author 1',
            email: 'author1@example.com',
            date: new Date('2024-01-01'),
            message: 'Commit 1',
            filesChanged: 1,
            insertions: 10,
            deletions: 0,
            files: ['file1.ts'],
          },
          {
            hash: 'hash2',
            author: 'Author 1',
            email: 'author1@example.com',
            date: new Date('2024-01-02'),
            message: 'Commit 2',
            filesChanged: 1,
            insertions: 11,
            deletions: 0,
            files: ['file2.ts'],
          },
          {
            hash: 'hash3',
            author: 'Author 1',
            email: 'author1@example.com',
            date: new Date('2024-01-03'),
            message: 'Commit 3',
            filesChanged: 1,
            insertions: 12,
            deletions: 0,
            files: ['file3.ts'],
          },
        ];

        const result = (service as any).calculateAvgLinesPerCommit(commits);

        // (10 + 11 + 12) / 3 = 11
        expect(result).toBe(11);
      });
    });

    describe('calculateLargeCommitPercentage', () => {
      it('should return 0 for empty commits', () => {
        const result = (service as any).calculateLargeCommitPercentage([]);
        expect(result).toBe(0);
      });

      it('should detect large outlier commits', () => {
        // Create 20 small commits of ~10 lines each, and 1 huge commit of 5000 lines
        const smallCommits = Array.from({ length: 20 }, (_, i) => ({
          hash: `hash${i + 1}`,
          author: 'Author 1',
          email: 'author1@example.com',
          date: new Date(`2024-01-${String(i + 1).padStart(2, '0')}`),
          message: 'Small commit',
          filesChanged: 1,
          insertions: 10,
          deletions: 0,
          files: ['file.ts'],
        }));

        const largeCommit = {
          hash: 'hash_large',
          author: 'Author 1',
          email: 'author1@example.com',
          date: new Date('2024-01-25'),
          message: 'Large outlier commit',
          filesChanged: 100,
          insertions: 5000,
          deletions: 0,
          files: Array(100).fill('file.ts'),
        };

        const commits = [...smallCommits, largeCommit];

        const result = (service as any).calculateLargeCommitPercentage(commits);

        // 1 out of 21 commits is a large outlier
        expect(result).toBeGreaterThan(0);
        expect(result).toBeLessThanOrEqual(100);
      });

      it('should return 0 when all commits are similar size', () => {
        const commits = [
          {
            hash: 'hash1',
            author: 'Author 1',
            email: 'author1@example.com',
            date: new Date('2024-01-01'),
            message: 'Commit 1',
            filesChanged: 1,
            insertions: 10,
            deletions: 5,
            files: ['file1.ts'],
          },
          {
            hash: 'hash2',
            author: 'Author 1',
            email: 'author1@example.com',
            date: new Date('2024-01-02'),
            message: 'Commit 2',
            filesChanged: 1,
            insertions: 11,
            deletions: 4,
            files: ['file2.ts'],
          },
          {
            hash: 'hash3',
            author: 'Author 1',
            email: 'author1@example.com',
            date: new Date('2024-01-03'),
            message: 'Commit 3',
            filesChanged: 1,
            insertions: 12,
            deletions: 3,
            files: ['file3.ts'],
          },
        ];

        const result = (service as any).calculateLargeCommitPercentage(commits);

        expect(result).toBe(0);
      });
    });

    describe('analyzeFirstCommit', () => {
      it('should return 0 for empty commits', () => {
        const result = (service as any).analyzeFirstCommit([]);
        expect(result).toEqual({
          firstCommitLines: 0,
          isSuspiciouslyLarge: false,
        });
      });

      it('should detect suspiciously large single commit', () => {
        const commits = [
          {
            hash: 'hash1',
            author: 'Author 1',
            email: 'author1@example.com',
            date: new Date('2024-01-01'),
            message: 'Initial commit',
            filesChanged: 50,
            insertions: 800,
            deletions: 0,
            files: Array(50).fill('file.ts'),
          },
        ];

        const result = (service as any).analyzeFirstCommit(commits);

        expect(result.firstCommitLines).toBe(800);
        expect(result.isSuspiciouslyLarge).toBe(true);
      });

      it('should not flag small single commit as suspicious', () => {
        const commits = [
          {
            hash: 'hash1',
            author: 'Author 1',
            email: 'author1@example.com',
            date: new Date('2024-01-01'),
            message: 'Initial commit',
            filesChanged: 2,
            insertions: 50,
            deletions: 0,
            files: ['file1.ts', 'file2.ts'],
          },
        ];

        const result = (service as any).analyzeFirstCommit(commits);

        expect(result.firstCommitLines).toBe(50);
        expect(result.isSuspiciouslyLarge).toBe(false);
      });

      it('should detect first commit 3x larger than average', () => {
        const commits = [
          {
            hash: 'hash1',
            author: 'Author 1',
            email: 'author1@example.com',
            date: new Date('2024-01-01'),
            message: 'Huge initial commit',
            filesChanged: 20,
            insertions: 600,
            deletions: 0,
            files: Array(20).fill('file.ts'),
          },
          {
            hash: 'hash2',
            author: 'Author 1',
            email: 'author1@example.com',
            date: new Date('2024-01-02'),
            message: 'Small commit',
            filesChanged: 1,
            insertions: 10,
            deletions: 5,
            files: ['file.ts'],
          },
          {
            hash: 'hash3',
            author: 'Author 1',
            email: 'author1@example.com',
            date: new Date('2024-01-03'),
            message: 'Small commit',
            filesChanged: 1,
            insertions: 12,
            deletions: 3,
            files: ['file.ts'],
          },
        ];

        const result = (service as any).analyzeFirstCommit(commits);

        expect(result.firstCommitLines).toBe(600);
        expect(result.isSuspiciouslyLarge).toBe(true);
      });

      it('should not flag normal first commit', () => {
        const commits = [
          {
            hash: 'hash1',
            author: 'Author 1',
            email: 'author1@example.com',
            date: new Date('2024-01-01'),
            message: 'Initial commit',
            filesChanged: 2,
            insertions: 30,
            deletions: 0,
            files: ['file1.ts', 'file2.ts'],
          },
          {
            hash: 'hash2',
            author: 'Author 1',
            email: 'author1@example.com',
            date: new Date('2024-01-02'),
            message: 'Second commit',
            filesChanged: 1,
            insertions: 20,
            deletions: 5,
            files: ['file3.ts'],
          },
        ];

        const result = (service as any).analyzeFirstCommit(commits);

        expect(result.firstCommitLines).toBe(30);
        expect(result.isSuspiciouslyLarge).toBe(false);
      });
    });

    describe('calculateAvgFilesPerCommit', () => {
      it('should calculate average files per commit correctly', () => {
        const commits = [
          {
            hash: 'hash1',
            author: 'Author 1',
            email: 'author1@example.com',
            date: new Date('2024-01-01'),
            message: 'Commit 1',
            filesChanged: 5,
            insertions: 50,
            deletions: 10,
            files: ['file1.ts', 'file2.ts', 'file3.ts', 'file4.ts', 'file5.ts'],
          },
          {
            hash: 'hash2',
            author: 'Author 1',
            email: 'author1@example.com',
            date: new Date('2024-01-02'),
            message: 'Commit 2',
            filesChanged: 3,
            insertions: 30,
            deletions: 5,
            files: ['file1.ts', 'file2.ts', 'file3.ts'],
          },
          {
            hash: 'hash3',
            author: 'Author 1',
            email: 'author1@example.com',
            date: new Date('2024-01-03'),
            message: 'Commit 3',
            filesChanged: 2,
            insertions: 20,
            deletions: 2,
            files: ['file1.ts', 'file2.ts'],
          },
        ];

        const result = (service as any).calculateAvgFilesPerCommit(commits);

        // (5 + 3 + 2) / 3 = 10 / 3 = 3.33
        expect(result).toBe(3.33);
      });

      it('should return 0 for empty commits', () => {
        const result = (service as any).calculateAvgFilesPerCommit([]);
        expect(result).toBe(0);
      });

      it('should handle single file commits', () => {
        const commits = [
          {
            hash: 'hash1',
            author: 'Author 1',
            email: 'author1@example.com',
            date: new Date('2024-01-01'),
            message: 'Commit 1',
            filesChanged: 1,
            insertions: 10,
            deletions: 0,
            files: ['file1.ts'],
          },
          {
            hash: 'hash2',
            author: 'Author 1',
            email: 'author1@example.com',
            date: new Date('2024-01-02'),
            message: 'Commit 2',
            filesChanged: 1,
            insertions: 15,
            deletions: 0,
            files: ['file2.ts'],
          },
        ];

        const result = (service as any).calculateAvgFilesPerCommit(commits);

        expect(result).toBe(1);
      });

      it('should detect commits with many files (AI indicator)', () => {
        const commits = [
          {
            hash: 'hash1',
            author: 'Author 1',
            email: 'author1@example.com',
            date: new Date('2024-01-01'),
            message: 'Initial AI-generated commit',
            filesChanged: 50,
            insertions: 1000,
            deletions: 0,
            files: Array(50).fill('file.ts'),
          },
          {
            hash: 'hash2',
            author: 'Author 1',
            email: 'author1@example.com',
            date: new Date('2024-01-02'),
            message: 'Small fix',
            filesChanged: 1,
            insertions: 5,
            deletions: 2,
            files: ['file1.ts'],
          },
        ];

        const result = (service as any).calculateAvgFilesPerCommit(commits);

        // (50 + 1) / 2 = 25.5
        expect(result).toBe(25.5);
      });
    });
  });
});
