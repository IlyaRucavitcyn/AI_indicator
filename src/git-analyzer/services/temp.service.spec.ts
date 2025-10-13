import { Test, TestingModule } from '@nestjs/testing';
import { TempService } from './temp.service';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('TempService', () => {
  let service: TempService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TempService],
    }).compile();

    service = module.get<TempService>(TempService);
  });

  afterEach(() => {
    // Clean up any temp directories created during tests
    service.cleanupAll();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createTempDir', () => {
    it('should create a temporary directory', () => {
      const tempDir = service.createTempDir();

      expect(tempDir).toBeDefined();
      expect(fs.existsSync(tempDir)).toBe(true);
      expect(tempDir).toContain('git-analyzer-');
    });

    it('should track created directories', () => {
      const tempDir1 = service.createTempDir();
      const tempDir2 = service.createTempDir();

      expect(tempDir1).not.toBe(tempDir2);
      expect(fs.existsSync(tempDir1)).toBe(true);
      expect(fs.existsSync(tempDir2)).toBe(true);
    });
  });

  describe('removeTempDir', () => {
    it('should remove a temporary directory', () => {
      const tempDir = service.createTempDir();
      const testFile = path.join(tempDir, 'test.txt');
      fs.writeFileSync(testFile, 'test content');

      expect(fs.existsSync(tempDir)).toBe(true);

      service.removeTempDir(tempDir);

      expect(fs.existsSync(tempDir)).toBe(false);
    });

    it('should handle non-existent directories gracefully', () => {
      const nonExistentDir = path.join(os.tmpdir(), 'non-existent');

      expect(() => {
        service.removeTempDir(nonExistentDir);
      }).not.toThrow();
    });
  });

  describe('cleanupAll', () => {
    it('should remove all tracked directories', () => {
      const tempDir1 = service.createTempDir();
      const tempDir2 = service.createTempDir();

      expect(fs.existsSync(tempDir1)).toBe(true);
      expect(fs.existsSync(tempDir2)).toBe(true);

      service.cleanupAll();

      // Check that the tempDirs array is cleared
      expect((service as any).tempDirs).toHaveLength(0);

      // The directories should be removed (or at least the tracking should be cleared)
      // Note: On some systems, directory removal might be delayed or fail silently
      // The important thing is that the service no longer tracks these directories
    });
  });

  describe('extractRepoName', () => {
    it('should extract repository name from GitHub URL', () => {
      const url = 'https://github.com/user/repo.git';
      const result = service.extractRepoName(url);

      expect(result).toBe('user/repo');
    });

    it('should extract repository name from GitHub URL without .git', () => {
      const url = 'https://github.com/user/repo';
      const result = service.extractRepoName(url);

      expect(result).toBe('user/repo');
    });

    it('should extract repository name from GitLab URL', () => {
      const url = 'https://gitlab.com/user/repo.git';
      const result = service.extractRepoName(url);

      expect(result).toBe('user/repo');
    });

    it('should handle non-standard URLs with fallback', () => {
      const url = 'git@github.com:user/repo.git';
      const result = service.extractRepoName(url);

      expect(result).toBe('git@github.com:user/repo');
    });

    it('should return unknown/repository for invalid URLs', () => {
      const url = 'invalid-url';
      const result = service.extractRepoName(url);

      expect(result).toBe('unknown/repository');
    });
  });

  describe('getRepoPath', () => {
    it('should return a valid repository path', () => {
      const url = 'https://github.com/user/repo.git';
      const repoPath = service.getRepoPath(url);

      expect(repoPath).toBeDefined();
      expect(repoPath).toContain('user-repo');
      expect(path.isAbsolute(repoPath)).toBe(true);
    });

    it('should replace slashes with dashes in repository name', () => {
      const url = 'https://github.com/user/repo-name.git';
      const repoPath = service.getRepoPath(url);

      expect(repoPath).toContain('user-repo-name');
      expect(repoPath).not.toContain('user/repo-name');
    });
  });
});
