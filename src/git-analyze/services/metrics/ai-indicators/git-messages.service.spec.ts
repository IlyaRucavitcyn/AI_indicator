import { Test, TestingModule } from '@nestjs/testing';
import { GitMessagesService } from './git-messages.service';

describe('GitMessagesService', () => {
  let service: GitMessagesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GitMessagesService],
    }).compile();

    service = module.get<GitMessagesService>(GitMessagesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('analyzeCommitMessagePatterns', () => {
    it('should return 0 for empty commits', () => {
      const result = service.analyzeCommitMessagePatterns([]);
      expect(result).toBe(0);
    });

    it('should detect conventional commit format', () => {
      const commits = [
        {
          hash: 'hash1',
          author: 'Author 1',
          email: 'author1@example.com',
          date: new Date('2024-01-01'),
          message: 'feat: add new feature',
          filesChanged: 5,
          insertions: 50,
          deletions: 10,
          files: ['file1.ts'],
        },
        {
          hash: 'hash2',
          author: 'Author 1',
          email: 'author1@example.com',
          date: new Date('2024-01-02'),
          message: 'fix: resolve bug',
          filesChanged: 2,
          insertions: 10,
          deletions: 5,
          files: ['file2.ts'],
        },
        {
          hash: 'hash3',
          author: 'Author 1',
          email: 'author1@example.com',
          date: new Date('2024-01-03'),
          message: 'this is a normal human commit message explaining the context',
          filesChanged: 3,
          insertions: 20,
          deletions: 2,
          files: ['file3.ts'],
        },
      ];

      const result = service.analyzeCommitMessagePatterns(commits);

      // 2 out of 3 commits match conventional format = 66.67%
      expect(result).toBeCloseTo(66.67, 1);
    });

    it('should detect past tense AI patterns', () => {
      const commits = [
        {
          hash: 'hash1',
          author: 'Author 1',
          email: 'author1@example.com',
          date: new Date('2024-01-01'),
          message: 'Added authentication module',
          filesChanged: 5,
          insertions: 100,
          deletions: 0,
          files: ['auth.ts'],
        },
        {
          hash: 'hash2',
          author: 'Author 1',
          email: 'author1@example.com',
          date: new Date('2024-01-02'),
          message: 'Updated dependencies',
          filesChanged: 1,
          insertions: 10,
          deletions: 10,
          files: ['package.json'],
        },
      ];

      const result = service.analyzeCommitMessagePatterns(commits);

      // Both commits match AI patterns = 100%
      expect(result).toBe(100);
    });

    it('should detect generic commit messages', () => {
      const commits = [
        {
          hash: 'hash1',
          author: 'Author 1',
          email: 'author1@example.com',
          date: new Date('2024-01-01'),
          message: 'Initial commit',
          filesChanged: 10,
          insertions: 200,
          deletions: 0,
          files: Array(10).fill('file.ts'),
        },
        {
          hash: 'hash2',
          author: 'Author 1',
          email: 'author1@example.com',
          date: new Date('2024-01-02'),
          message: 'update',
          filesChanged: 2,
          insertions: 20,
          deletions: 5,
          files: ['file1.ts', 'file2.ts'],
        },
        {
          hash: 'hash3',
          author: 'Author 1',
          email: 'author1@example.com',
          date: new Date('2024-01-03'),
          message: 'fix',
          filesChanged: 1,
          insertions: 5,
          deletions: 2,
          files: ['file3.ts'],
        },
      ];

      const result = service.analyzeCommitMessagePatterns(commits);

      // All 3 commits are generic = 100%
      expect(result).toBe(100);
    });

    it('should not flag normal descriptive commit messages', () => {
      const commits = [
        {
          hash: 'hash1',
          author: 'Author 1',
          email: 'author1@example.com',
          date: new Date('2024-01-01'),
          message: 'fixing the login bug where users could not authenticate',
          filesChanged: 2,
          insertions: 15,
          deletions: 8,
          files: ['auth.ts', 'login.ts'],
        },
        {
          hash: 'hash2',
          author: 'Author 1',
          email: 'author1@example.com',
          date: new Date('2024-01-02'),
          message: 'improving performance by caching results',
          filesChanged: 3,
          insertions: 25,
          deletions: 10,
          files: ['cache.ts', 'db.ts', 'utils.ts'],
        },
      ];

      const result = service.analyzeCommitMessagePatterns(commits);

      // No commits match AI patterns = 0%
      expect(result).toBe(0);
    });

    it('should detect conventional commits with scope', () => {
      const commits = [
        {
          hash: 'hash1',
          author: 'Author 1',
          email: 'author1@example.com',
          date: new Date('2024-01-01'),
          message: 'feat(auth): add login functionality',
          filesChanged: 5,
          insertions: 100,
          deletions: 0,
          files: ['auth.ts'],
        },
        {
          hash: 'hash2',
          author: 'Author 1',
          email: 'author1@example.com',
          date: new Date('2024-01-02'),
          message: 'chore(deps): update packages',
          filesChanged: 1,
          insertions: 10,
          deletions: 10,
          files: ['package.json'],
        },
      ];

      const result = service.analyzeCommitMessagePatterns(commits);

      // Both match conventional format with scope = 100%
      expect(result).toBe(100);
    });
  });
});
