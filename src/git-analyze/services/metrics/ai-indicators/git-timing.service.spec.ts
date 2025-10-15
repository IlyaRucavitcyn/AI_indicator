import { Test, TestingModule } from '@nestjs/testing';
import { GitTimingService } from './git-timing.service';

describe('GitTimingService', () => {
  let service: GitTimingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GitTimingService],
    }).compile();

    service = module.get<GitTimingService>(GitTimingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('analyzeBurstyCommits', () => {
    it('should return 0 for empty commits', () => {
      const result = service.analyzeBurstyCommits([]);
      expect(result).toBe(0);
    });

    it('should return 0 for single commit', () => {
      const commits = [
        {
          hash: 'hash1',
          author: 'Author 1',
          email: 'author1@example.com',
          date: new Date('2024-01-01T10:00:00Z'),
          message: 'Commit 1',
          filesChanged: 1,
          insertions: 10,
          deletions: 0,
          files: ['file.ts'],
        },
      ];

      const result = service.analyzeBurstyCommits(commits);
      expect(result).toBe(0);
    });

    it('should detect commits within 30 minute burst window', () => {
      const commits = [
        {
          hash: 'hash1',
          author: 'Author 1',
          email: 'author1@example.com',
          date: new Date('2024-01-01T10:00:00Z'),
          message: 'Commit 1',
          filesChanged: 5,
          insertions: 50,
          deletions: 10,
          files: ['file1.ts'],
        },
        {
          hash: 'hash2',
          author: 'Author 1',
          email: 'author1@example.com',
          date: new Date('2024-01-01T10:15:00Z'), // 15 minutes later
          message: 'Commit 2',
          filesChanged: 3,
          insertions: 30,
          deletions: 5,
          files: ['file2.ts'],
        },
        {
          hash: 'hash3',
          author: 'Author 1',
          email: 'author1@example.com',
          date: new Date('2024-01-01T10:20:00Z'), // 5 minutes after previous
          message: 'Commit 3',
          filesChanged: 2,
          insertions: 20,
          deletions: 2,
          files: ['file3.ts'],
        },
      ];

      const result = service.analyzeBurstyCommits(commits);

      // 2 out of 2 transitions are bursty = 100%
      expect(result).toBe(100);
    });

    it('should not flag commits outside burst window', () => {
      const commits = [
        {
          hash: 'hash1',
          author: 'Author 1',
          email: 'author1@example.com',
          date: new Date('2024-01-01T10:00:00Z'),
          message: 'Commit 1',
          filesChanged: 5,
          insertions: 50,
          deletions: 10,
          files: ['file1.ts'],
        },
        {
          hash: 'hash2',
          author: 'Author 1',
          email: 'author1@example.com',
          date: new Date('2024-01-01T12:00:00Z'), // 2 hours later
          message: 'Commit 2',
          filesChanged: 3,
          insertions: 30,
          deletions: 5,
          files: ['file2.ts'],
        },
        {
          hash: 'hash3',
          author: 'Author 1',
          email: 'author1@example.com',
          date: new Date('2024-01-01T14:00:00Z'), // 2 hours later
          message: 'Commit 3',
          filesChanged: 2,
          insertions: 20,
          deletions: 2,
          files: ['file3.ts'],
        },
      ];

      const result = service.analyzeBurstyCommits(commits);

      // No commits within burst window = 0%
      expect(result).toBe(0);
    });

    it('should handle mixed bursty and non-bursty commits', () => {
      const commits = [
        {
          hash: 'hash1',
          author: 'Author 1',
          email: 'author1@example.com',
          date: new Date('2024-01-01T10:00:00Z'),
          message: 'Commit 1',
          filesChanged: 5,
          insertions: 50,
          deletions: 10,
          files: ['file1.ts'],
        },
        {
          hash: 'hash2',
          author: 'Author 1',
          email: 'author1@example.com',
          date: new Date('2024-01-01T10:10:00Z'), // 10 min - bursty
          message: 'Commit 2',
          filesChanged: 3,
          insertions: 30,
          deletions: 5,
          files: ['file2.ts'],
        },
        {
          hash: 'hash3',
          author: 'Author 1',
          email: 'author1@example.com',
          date: new Date('2024-01-01T12:00:00Z'), // 1h50m - not bursty
          message: 'Commit 3',
          filesChanged: 2,
          insertions: 20,
          deletions: 2,
          files: ['file3.ts'],
        },
      ];

      const result = service.analyzeBurstyCommits(commits);

      // 1 out of 2 transitions is bursty = 50%
      expect(result).toBe(50);
    });

    it('should handle unsorted commit dates', () => {
      const commits = [
        {
          hash: 'hash3',
          author: 'Author 1',
          email: 'author1@example.com',
          date: new Date('2024-01-01T10:20:00Z'),
          message: 'Commit 3',
          filesChanged: 2,
          insertions: 20,
          deletions: 2,
          files: ['file3.ts'],
        },
        {
          hash: 'hash1',
          author: 'Author 1',
          email: 'author1@example.com',
          date: new Date('2024-01-01T10:00:00Z'),
          message: 'Commit 1',
          filesChanged: 5,
          insertions: 50,
          deletions: 10,
          files: ['file1.ts'],
        },
        {
          hash: 'hash2',
          author: 'Author 1',
          email: 'author1@example.com',
          date: new Date('2024-01-01T10:15:00Z'),
          message: 'Commit 2',
          filesChanged: 3,
          insertions: 30,
          deletions: 5,
          files: ['file2.ts'],
        },
      ];

      const result = service.analyzeBurstyCommits(commits);

      // Should sort first, then all transitions are bursty = 100%
      expect(result).toBe(100);
    });
  });
});
