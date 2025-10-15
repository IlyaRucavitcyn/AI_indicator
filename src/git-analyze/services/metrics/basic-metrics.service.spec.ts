import { Test, TestingModule } from '@nestjs/testing';
import { BasicMetricsService } from './basic-metrics.service';

describe('BasicMetricsService', () => {
  let service: BasicMetricsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BasicMetricsService],
    }).compile();

    service = module.get<BasicMetricsService>(BasicMetricsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateBasicMetrics', () => {
    it('should return empty metrics for empty commits array', () => {
      const result = service.calculateBasicMetrics([]);

      expect(result).toEqual({
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

    it('should calculate metrics correctly for multiple contributors', () => {
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
        {
          hash: 'hash2',
          author: 'Author 2',
          email: 'author2@example.com',
          date: new Date('2024-01-02T00:00:00Z'),
          message: 'Second commit',
          filesChanged: 3,
          insertions: 30,
          deletions: 5,
          files: ['file3.ts'],
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
          files: ['file4.ts'],
        },
      ];

      const result = service.calculateBasicMetrics(commits);

      expect(result.totalCommits).toBe(3);
      expect(result.contributors).toBe(2);
      expect(result.firstCommit).toBe('2024-01-01T00:00:00.000Z');
      expect(result.lastCommit).toBe('2024-01-03T00:00:00.000Z');
      expect(result.durationDays).toBe(2);
      expect(result.avgCommitsPerDay).toBe(1.5);
      expect(result.topContributor).toBe('author1@example.com');
      expect(result.contributorStats).toHaveLength(2);
      expect(result.contributorStats[0]).toEqual({
        email: 'author1@example.com',
        name: 'Author 1',
        commitCount: 2,
      });
      expect(result.contributorStats[1]).toEqual({
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
          insertions: 50,
          deletions: 10,
          files: ['file1.ts'],
        },
        {
          hash: 'hash2',
          author: 'Author 1',
          email: 'author1@example.com',
          date: new Date('2024-01-02T00:00:00Z'),
          message: 'Second commit',
          filesChanged: 3,
          insertions: 30,
          deletions: 5,
          files: ['file2.ts'],
        },
      ];

      const result = service.calculateBasicMetrics(commits);

      expect(result.totalCommits).toBe(2);
      expect(result.contributors).toBe(1);
      expect(result.topContributor).toBe('author1@example.com');
      expect(result.contributorStats).toHaveLength(1);
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
          insertions: 50,
          deletions: 10,
          files: ['file1.ts'],
        },
        {
          hash: 'hash2',
          author: 'Author 1',
          email: 'author1@example.com',
          date: new Date('2024-01-01T12:00:00Z'),
          message: 'Second commit',
          filesChanged: 3,
          insertions: 30,
          deletions: 5,
          files: ['file2.ts'],
        },
      ];

      const result = service.calculateBasicMetrics(commits);

      expect(result.durationDays).toBe(1);
      expect(result.avgCommitsPerDay).toBe(2);
    });
  });
});
