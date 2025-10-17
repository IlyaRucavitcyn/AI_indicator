import { Test, TestingModule } from '@nestjs/testing';
import { AnalyzerService } from './analyzer.service';
import { GitService } from './git.service';
import { TempService } from './temp.service';
import { BasicMetricsService } from './metrics/basic-metrics.service';
import { GitSizeService } from './metrics/ai-indicators/git-size.service';
import { GitMessagesService } from './metrics/ai-indicators/git-messages.service';
import { GitTimingService } from './metrics/ai-indicators/git-timing.service';
import { CodeQualityService } from './metrics/ai-indicators/code-quality.service';
import { CodeCommentAnalysisService } from './metrics/ai-indicators/code-comment-analysis.service';
import { CodeNonTypicalExpressionsService } from './metrics/ai-indicators/code-non-typical-expressions.service';
import { FileSystemScannerService } from './metrics/ai-indicators/file-system-scanner.service';

describe('AnalyzerService', () => {
  let service: AnalyzerService;
  let gitService: GitService;
  let tempService: TempService;
  let basicMetricsService: BasicMetricsService;
  let gitSizeService: GitSizeService;
  let gitMessagesService: GitMessagesService;
  let gitTimingService: GitTimingService;
  let codeQualityService: CodeQualityService;
  let fileSystemScannerService: FileSystemScannerService;
  let codeCommentAnalysisService: CodeCommentAnalysisService;
  let codeNonTypicalExpressionsService: CodeNonTypicalExpressionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyzerService,
        GitService,
        TempService,
        BasicMetricsService,
        GitSizeService,
        GitMessagesService,
        GitTimingService,
        CodeQualityService,
        FileSystemScannerService,
        CodeCommentAnalysisService,
        CodeNonTypicalExpressionsService,
      ],
    }).compile();

    service = module.get<AnalyzerService>(AnalyzerService);
    gitService = module.get<GitService>(GitService);
    tempService = module.get<TempService>(TempService);
    basicMetricsService = module.get<BasicMetricsService>(BasicMetricsService);
    gitSizeService = module.get<GitSizeService>(GitSizeService);
    gitMessagesService = module.get<GitMessagesService>(GitMessagesService);
    gitTimingService = module.get<GitTimingService>(GitTimingService);
    codeQualityService = module.get<CodeQualityService>(CodeQualityService);
    fileSystemScannerService = module.get<FileSystemScannerService>(
      FileSystemScannerService,
    );
    codeCommentAnalysisService = module.get<CodeCommentAnalysisService>(
      CodeCommentAnalysisService,
    );
    codeNonTypicalExpressionsService =
      module.get<CodeNonTypicalExpressionsService>(
        CodeNonTypicalExpressionsService,
      );
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
            avgLinesPerCommit: {
              value: 39,
              description: expect.any(String),
            },
            largeCommitPercentage: {
              value: 0,
              description: expect.any(String),
            },
            firstCommitAnalysis: {
              value: {
                lines: 60,
                isSuspicious: false,
              },
              description: expect.any(String),
            },
            avgFilesPerCommit: {
              value: 3.33,
              description: expect.any(String),
            },
            commitMessagePatterns: {
              value: 0,
              description: expect.any(String),
            },
            burstyCommitPercentage: {
              value: 0,
              description: expect.any(String),
            },
            testFileRatio: {
              value: 0,
              description: expect.any(String),
            },
            codeCommentRatio: {
              value: 0,
              description: expect.any(String),
            },
            codeNonTypicalExpressionRatio: {
              value: 0,
              description: expect.any(String),
            },
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
        aiIndicators: {
          avgLinesPerCommit: {
            value: 0,
            description: expect.any(String),
          },
          largeCommitPercentage: {
            value: 0,
            description: expect.any(String),
          },
          firstCommitAnalysis: {
            value: {
              lines: 0,
              isSuspicious: false,
            },
            description: expect.any(String),
          },
          avgFilesPerCommit: {
            value: 0,
            description: expect.any(String),
          },
          commitMessagePatterns: {
            value: 0,
            description: expect.any(String),
          },
          burstyCommitPercentage: {
            value: 0,
            description: expect.any(String),
          },
          testFileRatio: {
            value: 0,
            description: expect.any(String),
          },
          codeCommentRatio: {
            value: 0,
            description: expect.any(String),
          },
          codeNonTypicalExpressionRatio: {
            value: 0,
            description: expect.any(String),
          },
        },
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
    it('should orchestrate all metric services correctly', () => {
      const commits = [
        {
          hash: 'hash1',
          author: 'Author 1',
          email: 'author1@example.com',
          date: new Date('2024-01-01T00:00:00Z'),
          message: 'First commit',
          filesChanged: 5,
          insertions: 50,
          deletions: 10,
          files: ['file1.ts', 'file2.ts'],
        },
      ];

      // Mock all service responses
      jest.spyOn(basicMetricsService, 'calculateBasicMetrics').mockReturnValue({
        totalCommits: 1,
        contributors: 1,
        firstCommit: '2024-01-01T00:00:00.000Z',
        lastCommit: '2024-01-01T00:00:00.000Z',
        durationDays: 1,
        avgCommitsPerDay: 1,
        topContributor: 'author1@example.com',
        contributorStats: [
          {
            name: 'Author 1',
            email: 'author1@example.com',
            commitCount: 1,
          },
        ],
      });

      jest.spyOn(gitSizeService, 'calculateSizeMetrics').mockReturnValue({
        avgLinesPerCommit: 60,
        largeCommitPercentage: 0,
        firstCommitAnalysis: {
          lines: 60,
          isSuspicious: false,
        },
        avgFilesPerCommit: 5,
      });

      jest
        .spyOn(gitMessagesService, 'analyzeCommitMessagePatterns')
        .mockReturnValue(0);
      jest.spyOn(gitTimingService, 'analyzeBurstyCommits').mockReturnValue(0);
      jest.spyOn(codeQualityService, 'analyzeTestFileRatio').mockReturnValue(0);

      // Mock the new file-based architecture
      jest
        .spyOn(fileSystemScannerService, 'scanRepository')
        .mockImplementation(() => {});
      jest.spyOn(codeCommentAnalysisService, 'getResult').mockReturnValue(0);
      jest
        .spyOn(codeNonTypicalExpressionsService, 'getResult')
        .mockReturnValue(0);

      const metrics = (service as any).calculateMetrics(
        commits,
        '/tmp/test-repo',
      );

      // Verify all services were called
      expect(basicMetricsService.calculateBasicMetrics).toHaveBeenCalledWith(
        commits,
      );
      expect(gitSizeService.calculateSizeMetrics).toHaveBeenCalledWith(commits);
      expect(
        gitMessagesService.analyzeCommitMessagePatterns,
      ).toHaveBeenCalledWith(commits);
      expect(gitTimingService.analyzeBurstyCommits).toHaveBeenCalledWith(
        commits,
      );
      expect(codeQualityService.analyzeTestFileRatio).toHaveBeenCalledWith(
        commits,
      );
      expect(fileSystemScannerService.scanRepository).toHaveBeenCalledWith(
        '/tmp/test-repo',
        [codeCommentAnalysisService, codeNonTypicalExpressionsService],
        expect.any(Function),
      );
      expect(codeCommentAnalysisService.getResult).toHaveBeenCalled();
      expect(codeNonTypicalExpressionsService.getResult).toHaveBeenCalled();

      // Verify the structure is correct
      expect(metrics).toEqual({
        totalCommits: 1,
        contributors: 1,
        firstCommit: '2024-01-01T00:00:00.000Z',
        lastCommit: '2024-01-01T00:00:00.000Z',
        durationDays: 1,
        avgCommitsPerDay: 1,
        topContributor: 'author1@example.com',
        contributorStats: [
          {
            name: 'Author 1',
            email: 'author1@example.com',
            commitCount: 1,
          },
        ],
        aiIndicators: {
          avgLinesPerCommit: {
            value: 60,
            description: expect.any(String),
          },
          largeCommitPercentage: {
            value: 0,
            description: expect.any(String),
          },
          firstCommitAnalysis: {
            value: {
              lines: 60,
              isSuspicious: false,
            },
            description: expect.any(String),
          },
          avgFilesPerCommit: {
            value: 5,
            description: expect.any(String),
          },
          commitMessagePatterns: {
            value: 0,
            description: expect.any(String),
          },
          burstyCommitPercentage: {
            value: 0,
            description: expect.any(String),
          },
          testFileRatio: {
            value: 0,
            description: expect.any(String),
          },
          codeCommentRatio: {
            value: 0,
            description: expect.any(String),
          },
          codeNonTypicalExpressionRatio: {
            value: 0,
            description: expect.any(String),
          },
        },
      });
    });
  });
});
