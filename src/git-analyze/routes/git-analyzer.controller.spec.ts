import { Test, TestingModule } from '@nestjs/testing';
import { GitAnalyzerController } from './git-analyzer.controller';
import { AnalyzerService } from '../services/analyzer.service';
import { AnalyzeRequestDto, OutputFormat } from './dto/analyze-request.dto';
import { AnalyzeResponseDto } from './dto/analyze-response.dto';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('GitAnalyzerController', () => {
  let controller: GitAnalyzerController;
  let service: AnalyzerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GitAnalyzerController],
      providers: [
        {
          provide: AnalyzerService,
          useValue: {
            analyzeRepository: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<GitAnalyzerController>(GitAnalyzerController);
    service = module.get<AnalyzerService>(AnalyzerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
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
          duration: '9 days 0 hours 0 minutes',
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
        .spyOn(service, 'analyzeRepository')
        .mockResolvedValue(expectedResponse);

      const result = await controller.analyzeRepository(request);

      expect(service.analyzeRepository).toHaveBeenCalledWith(
        request.repositoryUrl,
        request.branch,
      );
      expect(result).toEqual(expectedResponse);
    });

    it('should handle analysis errors with proper HTTP exception', async () => {
      const request: AnalyzeRequestDto = {
        repositoryUrl: 'https://github.com/user/repo.git',
        branch: 'main',
        format: OutputFormat.JSON,
      };

      const errorMessage = 'Repository not found';
      jest
        .spyOn(service, 'analyzeRepository')
        .mockRejectedValue(new Error(errorMessage));

      await expect(controller.analyzeRepository(request)).rejects.toThrow(
        HttpException,
      );

      try {
        await controller.analyzeRepository(request);
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);

        expect(error.getStatus()).toBe(HttpStatus.BAD_REQUEST);

        expect(error.getResponse()).toEqual({
          message: 'Analysis failed',
          error: errorMessage,
          statusCode: HttpStatus.BAD_REQUEST,
        });
      }
    });

    it('should handle validation errors', async () => {
      const request: AnalyzeRequestDto = {
        repositoryUrl: 'invalid-url',
        branch: 'main',
        format: OutputFormat.JSON,
      };

      const errorMessage = 'Invalid repository URL';
      jest
        .spyOn(service, 'analyzeRepository')
        .mockRejectedValue(new Error(errorMessage));

      await expect(controller.analyzeRepository(request)).rejects.toThrow(
        HttpException,
      );
    });
  });

  describe('healthCheck', () => {
    it('should return health status', () => {
      const result = controller.healthCheck();

      expect(result).toEqual({
        status: 'ok',
        timestamp: expect.any(String),
      });
      expect(new Date(result.timestamp)).toBeInstanceOf(Date);
    });

    it('should return current timestamp', () => {
      const before = new Date();
      const result = controller.healthCheck();
      const after = new Date();

      const resultTime = new Date(result.timestamp);
      expect(resultTime.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(resultTime.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });
});
