import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { GitAnalyzerController } from '../src/git-analyzer/git-analyzer.controller';
import { GitAnalyzerService } from '../src/git-analyzer/git-analyzer.service';
import { AnalyzerService } from '../src/git-analyzer/services/analyzer.service';
import { GitService } from '../src/git-analyzer/services/git.service';
import { TempService } from '../src/git-analyzer/services/temp.service';

describe('GitAnalyzer (e2e)', () => {
  let app: INestApplication;
  let analyzerService: AnalyzerService;
  let gitService: GitService;
  let tempService: TempService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    analyzerService = moduleFixture.get<AnalyzerService>(AnalyzerService);
    gitService = moduleFixture.get<GitService>(GitService);
    tempService = moduleFixture.get<TempService>(TempService);

    await app.init();
  });

  afterAll(async () => {
    await app.close();
    tempService.cleanupAll();
  });

  describe('/git-analyzer/health (POST)', () => {
    it('should return health status', () => {
      return request(app.getHttpServer())
        .post('/git-analyzer/health')
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('status', 'ok');
          expect(res.body).toHaveProperty('timestamp');
          expect(new Date(res.body.timestamp)).toBeInstanceOf(Date);
        });
    });
  });

  describe('/git-analyzer/analyze (POST)', () => {
    it('should analyze a valid repository', async () => {
      const analyzeRequest = {
        repositoryUrl: 'https://github.com/octocat/Hello-World.git',
        branch: 'main',
        format: 'json',
      };

      // Mock the git operations to avoid actual cloning
      jest.spyOn(gitService, 'cloneRepository').mockResolvedValue({
        git: {} as any,
        repoPath: '/tmp/test-repo',
      });
      jest.spyOn(gitService, 'isValidRepository').mockResolvedValue(true);
      jest.spyOn(gitService, 'getCommitHistory').mockResolvedValue([
        {
          hash: 'hash1',
          author: 'Test Author',
          email: 'test@example.com',
          date: new Date('2024-01-01T00:00:00Z'),
          message: 'Test commit',
          filesChanged: 1,
        },
      ]);
      jest.spyOn(gitService, 'getRepositoryInfo').mockResolvedValue({
        branch: 'main',
        remote: 'https://github.com/octocat/Hello-World.git',
      });
      jest.spyOn(gitService, 'cleanupRepository').mockImplementation(() => {});
      jest
        .spyOn(tempService, 'extractRepoName')
        .mockReturnValue('octocat/Hello-World');

      return request(app.getHttpServer())
        .post('/git-analyzer/analyze')
        .send(analyzeRequest)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('repository', 'octocat/Hello-World');
          expect(res.body).toHaveProperty('branch', 'main');
          expect(res.body).toHaveProperty('metrics');
          expect(res.body).toHaveProperty('analyzedAt');
          expect(res.body.metrics).toHaveProperty('totalCommits', 1);
          expect(res.body.metrics).toHaveProperty('contributors', 1);
          expect(res.body.metrics).toHaveProperty(
            'topContributor',
            'test@example.com',
          );
        });
    });

    it('should handle invalid repository URL', async () => {
      const analyzeRequest = {
        repositoryUrl: 'not-a-url-at-all',
        branch: 'main',
        format: 'json',
      };

      // Mock the git operations to simulate a failure
      jest
        .spyOn(gitService, 'cloneRepository')
        .mockRejectedValue(new Error('Invalid repository URL'));

      return request(app.getHttpServer())
        .post('/git-analyzer/analyze')
        .send(analyzeRequest)
        .expect(400)
        .expect((res) => {
          expect(res.body).toHaveProperty('message', 'Analysis failed');
          expect(res.body).toHaveProperty(
            'error',
            'Analysis failed: Invalid repository URL',
          );
          expect(res.body).toHaveProperty('statusCode', 400);
        });
    });

    it('should handle repository clone failure', async () => {
      const analyzeRequest = {
        repositoryUrl: 'https://github.com/nonexistent/repo.git',
        branch: 'main',
        format: 'json',
      };

      jest
        .spyOn(gitService, 'cloneRepository')
        .mockRejectedValue(new Error('Repository not found'));

      return request(app.getHttpServer())
        .post('/git-analyzer/analyze')
        .send(analyzeRequest)
        .expect(400)
        .expect((res) => {
          expect(res.body).toHaveProperty('message', 'Analysis failed');
          expect(res.body).toHaveProperty(
            'error',
            'Analysis failed: Repository not found',
          );
          expect(res.body).toHaveProperty('statusCode', 400);
        });
    });

    it('should validate request body', async () => {
      const invalidRequest = {
        // Missing required repositoryUrl
        branch: 'main',
        format: 'json',
      };

      return request(app.getHttpServer())
        .post('/git-analyzer/analyze')
        .send(invalidRequest)
        .expect(400);
    });

    it('should handle different output formats', async () => {
      const analyzeRequest = {
        repositoryUrl: 'https://github.com/octocat/Hello-World.git',
        branch: 'main',
        format: 'html',
      };

      jest.spyOn(gitService, 'cloneRepository').mockResolvedValue({
        git: {} as any,
        repoPath: '/tmp/test-repo',
      });
      jest.spyOn(gitService, 'isValidRepository').mockResolvedValue(true);
      jest.spyOn(gitService, 'getCommitHistory').mockResolvedValue([]);
      jest.spyOn(gitService, 'getRepositoryInfo').mockResolvedValue({
        branch: 'main',
        remote: 'https://github.com/octocat/Hello-World.git',
      });
      jest.spyOn(gitService, 'cleanupRepository').mockImplementation(() => {});
      jest
        .spyOn(tempService, 'extractRepoName')
        .mockReturnValue('octocat/Hello-World');

      return request(app.getHttpServer())
        .post('/git-analyzer/analyze')
        .send(analyzeRequest)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('repository', 'octocat/Hello-World');
          expect(res.body).toHaveProperty('metrics');
        });
    });
  });

  describe('Error Handling', () => {
    it('should handle network timeouts gracefully', async () => {
      const analyzeRequest = {
        repositoryUrl: 'https://github.com/octocat/Hello-World.git',
        branch: 'main',
        format: 'json',
      };

      jest
        .spyOn(gitService, 'cloneRepository')
        .mockRejectedValue(new Error('Network timeout'));

      return request(app.getHttpServer())
        .post('/git-analyzer/analyze')
        .send(analyzeRequest)
        .expect(400)
        .expect((res) => {
          expect(res.body).toHaveProperty('message', 'Analysis failed');
          expect(res.body).toHaveProperty(
            'error',
            'Analysis failed: Network timeout',
          );
        });
    });

    it('should handle authentication errors', async () => {
      const analyzeRequest = {
        repositoryUrl: 'https://github.com/private/repo.git',
        branch: 'main',
        format: 'json',
      };

      jest
        .spyOn(gitService, 'cloneRepository')
        .mockRejectedValue(new Error('Authentication failed'));

      return request(app.getHttpServer())
        .post('/git-analyzer/analyze')
        .send(analyzeRequest)
        .expect(400)
        .expect((res) => {
          expect(res.body).toHaveProperty('message', 'Analysis failed');
          expect(res.body).toHaveProperty(
            'error',
            'Analysis failed: Authentication failed',
          );
        });
    });
  });
});
