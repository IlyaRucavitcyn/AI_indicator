import { Test, TestingModule } from '@nestjs/testing';
import { GitService } from './git.service';
import { TempService } from './temp.service';
import { simpleGit } from 'simple-git';

// Mock simple-git
jest.mock('simple-git');
const mockSimpleGit = simpleGit as jest.MockedFunction<typeof simpleGit>;

describe('GitService', () => {
  let service: GitService;
  let tempService: TempService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GitService, TempService],
    }).compile();

    service = module.get<GitService>(GitService);
    tempService = module.get<TempService>(TempService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    tempService.cleanupAll();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('cloneRepository', () => {
    it('should clone a repository successfully', async () => {
      const mockGit = {
        clone: jest.fn().mockResolvedValue(undefined),
      };
      const mockGitInstance = {
        checkout: jest.fn().mockResolvedValue(undefined),
      };

      mockSimpleGit.mockReturnValueOnce(mockGit as any);
      mockSimpleGit.mockReturnValueOnce(mockGitInstance as any);

      const result = await service.cloneRepository(
        'https://github.com/user/repo.git',
        'main',
      );

      expect(mockGit.clone).toHaveBeenCalledWith(
        'https://github.com/user/repo.git',
        expect.any(String),
      );
      expect(mockGitInstance.checkout).toHaveBeenCalledWith('main');
      expect(result).toHaveProperty('git');
      expect(result).toHaveProperty('repoPath');
    });

    it('should handle clone errors', async () => {
      const mockGit = {
        clone: jest.fn().mockRejectedValue(new Error('Clone failed')),
      };

      mockSimpleGit.mockReturnValue(mockGit as any);

      await expect(
        service.cloneRepository('https://github.com/user/repo.git', 'main'),
      ).rejects.toThrow('Failed to clone repository: Clone failed');
    });
  });

  describe('getCommitHistory', () => {
    it('should return commit history', async () => {
      const mockGit = {
        log: jest.fn().mockResolvedValue({
          all: [
            {
              message:
                'hash1|author1|email1|2024-01-01T00:00:00Z|commit message 1',
              diff: { files: ['file1.txt', 'file2.txt'] },
            },
            {
              message:
                'hash2|author2|email2|2024-01-02T00:00:00Z|commit message 2',
              diff: { files: ['file3.txt'] },
            },
          ],
        }),
      };

      const result = await service.getCommitHistory(mockGit as any);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        hash: 'hash1',
        author: 'author1',
        email: 'email1',
        date: new Date('2024-01-01T00:00:00Z'),
        message: 'commit message 1',
        filesChanged: 2,
      });
      expect(result[1]).toEqual({
        hash: 'hash2',
        author: 'author2',
        email: 'email2',
        date: new Date('2024-01-02T00:00:00Z'),
        message: 'commit message 2',
        filesChanged: 1,
      });
    });

    it('should handle git log errors', async () => {
      const mockGit = {
        log: jest.fn().mockRejectedValue(new Error('Git log failed')),
      };

      await expect(service.getCommitHistory(mockGit as any)).rejects.toThrow(
        'Failed to read commit history: Git log failed',
      );
    });
  });

  describe('getRepositoryInfo', () => {
    it('should return repository information', async () => {
      const mockGit = {
        revparse: jest.fn().mockResolvedValue('main'),
        remote: jest.fn().mockResolvedValue('https://github.com/user/repo.git'),
      };

      const result = await service.getRepositoryInfo(mockGit as any);

      expect(result).toEqual({
        branch: 'main',
        remote: 'https://github.com/user/repo.git',
      });
    });

    it('should handle remote errors gracefully', async () => {
      const mockGit = {
        revparse: jest.fn().mockResolvedValue('main'),
        remote: jest.fn().mockRejectedValue(new Error('Remote failed')),
      };

      const result = await service.getRepositoryInfo(mockGit as any);

      expect(result).toEqual({
        branch: 'main',
        remote: 'unknown',
      });
    });

    it('should handle git info errors', async () => {
      const mockGit = {
        revparse: jest.fn().mockRejectedValue(new Error('Git info failed')),
        remote: jest.fn().mockResolvedValue('https://github.com/user/repo.git'),
      };

      await expect(service.getRepositoryInfo(mockGit as any)).rejects.toThrow(
        'Failed to get repository info: Git info failed',
      );
    });
  });

  describe('isValidRepository', () => {
    it('should return true for valid repository', async () => {
      const mockGit = {
        status: jest.fn().mockResolvedValue({}),
      };

      const result = await service.isValidRepository(mockGit as any);

      expect(result).toBe(true);
    });

    it('should return false for invalid repository', async () => {
      const mockGit = {
        status: jest.fn().mockRejectedValue(new Error('Not a git repository')),
      };

      const result = await service.isValidRepository(mockGit as any);

      expect(result).toBe(false);
    });
  });

  describe('cleanupRepository', () => {
    it('should clean up repository directory', () => {
      const repoPath = '/tmp/test-repo';
      const removeTempDirSpy = jest.spyOn(tempService, 'removeTempDir');

      service.cleanupRepository(repoPath);

      expect(removeTempDirSpy).toHaveBeenCalledWith(repoPath);
    });
  });
});
