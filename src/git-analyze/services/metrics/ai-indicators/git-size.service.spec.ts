import { Test, TestingModule } from '@nestjs/testing';
import { GitSizeService } from './git-size.service';

describe('GitSizeService', () => {
  let service: GitSizeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GitSizeService],
    }).compile();

    service = module.get<GitSizeService>(GitSizeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateSizeMetrics', () => {
    it('should calculate all size metrics correctly', () => {
      const commits = [
        {
          hash: 'hash1',
          author: 'Author 1',
          email: 'author1@example.com',
          date: new Date('2024-01-01'),
          message: 'First commit',
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
          date: new Date('2024-01-03'),
          message: 'Third commit',
          filesChanged: 2,
          insertions: 20,
          deletions: 2,
          files: ['file1.ts', 'file2.ts'],
        },
      ];

      const result = service.calculateSizeMetrics(commits);

      expect(result.avgLinesPerCommit).toBe(39);
      expect(result.largeCommitPercentage).toBe(0);
      expect(result.firstCommitAnalysis.lines).toBe(60);
      expect(result.firstCommitAnalysis.isSuspicious).toBe(false);
      expect(result.avgFilesPerCommit).toBe(3.33);
    });
  });

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

    it('should detect commits above absolute threshold (500 lines)', () => {
      // All commits are uniformly large (no statistical outliers), but exceed 500 lines
      const commits = [
        {
          hash: 'hash1',
          author: 'Author 1',
          email: 'author1@example.com',
          date: new Date('2024-01-01'),
          message: 'Large commit 1',
          filesChanged: 10,
          insertions: 600,
          deletions: 50,
          files: Array(10).fill('file.ts'),
        },
        {
          hash: 'hash2',
          author: 'Author 1',
          email: 'author1@example.com',
          date: new Date('2024-01-02'),
          message: 'Large commit 2',
          filesChanged: 10,
          insertions: 620,
          deletions: 40,
          files: Array(10).fill('file.ts'),
        },
        {
          hash: 'hash3',
          author: 'Author 1',
          email: 'author1@example.com',
          date: new Date('2024-01-03'),
          message: 'Large commit 3',
          filesChanged: 10,
          insertions: 610,
          deletions: 45,
          files: Array(10).fill('file.ts'),
        },
      ];

      const result = (service as any).calculateLargeCommitPercentage(commits);

      // All 3 commits exceed 500 lines, so 100% should be flagged
      expect(result).toBe(100);
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
