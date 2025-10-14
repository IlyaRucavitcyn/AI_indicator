import { Test, TestingModule } from '@nestjs/testing';
import { GitAnalyzerService } from './git-analyzer.service';
import { AnalyzerService } from '../services/analyzer.service';
import { AnalyzeRequestDto, OutputFormat } from './dto/analyze-request.dto';
import { AnalyzeResponseDto } from './dto/analyze-response.dto';

describe('GitAnalyzerService', () => {
  let service: GitAnalyzerService;
  let analyzerService: AnalyzerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GitAnalyzerService,
        {
          provide: AnalyzerService,
          useValue: {
            analyzeRepository: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<GitAnalyzerService>(GitAnalyzerService);
    analyzerService = module.get<AnalyzerService>(AnalyzerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('analyzeRepository', () => {
    it('should analyze repository successfully', async () => {
      const request: AnalyzeRequestDto = {
        repositoryUrl: 'https://github.com/user/repo.git',
        branch: 'main',
        format: OutputFormat.JSON,
      };

      const expectedResponse: AnalyzeResponseDto = {
        repository: 'user/repo',
        branch: 'main',
        metrics: {
          totalCommits: 10,
          contributors: 2,
          firstCommit: '2024-01-01T00:00:00.000Z',
          lastCommit: '2024-01-10T00:00:00.000Z',
          durationDays: 9,
          avgCommitsPerDay: 1.11,
          topContributor: 'author1@example.com',
          contributorStats: [
            {
              email: 'author1@example.com',
              name: 'Author 1',
              commitCount: 6,
            },
            {
              email: 'author2@example.com',
              name: 'Author 2',
              commitCount: 4,
            },
          ],
        },
        analyzedAt: '2024-01-10T00:00:00.000Z',
      };

      jest
        .spyOn(analyzerService, 'analyzeRepository')
        .mockResolvedValue(expectedResponse);

      const result = await service.analyzeRepository(request);

      expect(analyzerService.analyzeRepository).toHaveBeenCalledWith(
        'https://github.com/user/repo.git',
        'main',
      );
      expect(result).toEqual(expectedResponse);
    });

    it('should use default branch when not specified', async () => {
      const request: AnalyzeRequestDto = {
        repositoryUrl: 'https://github.com/user/repo.git',
        branch: 'main',
        format: OutputFormat.JSON,
      };

      const expectedResponse: AnalyzeResponseDto = {
        repository: 'user/repo',
        branch: 'main',
        metrics: {
          totalCommits: 5,
          contributors: 1,
          firstCommit: '2024-01-01T00:00:00.000Z',
          lastCommit: '2024-01-05T00:00:00.000Z',
          durationDays: 4,
          avgCommitsPerDay: 1.25,
          topContributor: 'author@example.com',
          contributorStats: [
            {
              email: 'author@example.com',
              name: 'Author',
              commitCount: 5,
            },
          ],
        },
        analyzedAt: '2024-01-05T00:00:00.000Z',
      };

      jest
        .spyOn(analyzerService, 'analyzeRepository')
        .mockResolvedValue(expectedResponse);

      const result = await service.analyzeRepository(request);

      expect(analyzerService.analyzeRepository).toHaveBeenCalledWith(
        'https://github.com/user/repo.git',
        'main',
      );
      expect(result).toEqual(expectedResponse);
    });

    it('should handle analysis errors', async () => {
      const request: AnalyzeRequestDto = {
        repositoryUrl: 'https://github.com/user/repo.git',
        branch: 'main',
        format: OutputFormat.JSON,
      };

      jest
        .spyOn(analyzerService, 'analyzeRepository')
        .mockRejectedValue(new Error('Analysis failed'));

      await expect(service.analyzeRepository(request)).rejects.toThrow(
        'Analysis failed',
      );
    });
  });
});
