import { Test, TestingModule } from '@nestjs/testing';
import { CodeQualityService } from './code-quality.service';

describe('CodeQualityService', () => {
  let service: CodeQualityService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CodeQualityService],
    }).compile();

    service = module.get<CodeQualityService>(CodeQualityService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('analyzeTestFileRatio', () => {
    it('should return 0 for empty commits', () => {
      const result = service.analyzeTestFileRatio([]);
      expect(result).toBe(0);
    });

    it('should detect commits with .test. files', () => {
      const commits = [
        {
          hash: 'hash1',
          author: 'Author 1',
          email: 'author1@example.com',
          date: new Date('2024-01-01'),
          message: 'Add feature',
          filesChanged: 2,
          insertions: 50,
          deletions: 10,
          files: ['src/feature.ts', 'src/feature.test.ts'],
        },
        {
          hash: 'hash2',
          author: 'Author 1',
          email: 'author1@example.com',
          date: new Date('2024-01-02'),
          message: 'Update logic',
          filesChanged: 1,
          insertions: 20,
          deletions: 5,
          files: ['src/logic.ts'],
        },
      ];

      const result = service.analyzeTestFileRatio(commits);

      // 1 out of 2 commits has test files = 50%
      expect(result).toBe(50);
    });

    it('should detect commits with .spec. files', () => {
      const commits = [
        {
          hash: 'hash1',
          author: 'Author 1',
          email: 'author1@example.com',
          date: new Date('2024-01-01'),
          message: 'Add service',
          filesChanged: 2,
          insertions: 100,
          deletions: 0,
          files: ['src/service.ts', 'src/service.spec.ts'],
        },
        {
          hash: 'hash2',
          author: 'Author 1',
          email: 'author1@example.com',
          date: new Date('2024-01-02'),
          message: 'Add controller',
          filesChanged: 2,
          insertions: 80,
          deletions: 0,
          files: ['src/controller.ts', 'src/controller.spec.ts'],
        },
      ];

      const result = service.analyzeTestFileRatio(commits);

      // Both commits have test files = 100%
      expect(result).toBe(100);
    });

    it('should detect commits with __tests__ directory', () => {
      const commits = [
        {
          hash: 'hash1',
          author: 'Author 1',
          email: 'author1@example.com',
          date: new Date('2024-01-01'),
          message: 'Add tests',
          filesChanged: 2,
          insertions: 50,
          deletions: 0,
          files: ['src/utils.ts', 'src/__tests__/utils.test.ts'],
        },
      ];

      const result = service.analyzeTestFileRatio(commits);

      // 1 out of 1 commits has test files = 100%
      expect(result).toBe(100);
    });

    it('should detect commits with /test/ or /tests/ directory', () => {
      const commits = [
        {
          hash: 'hash1',
          author: 'Author 1',
          email: 'author1@example.com',
          date: new Date('2024-01-01'),
          message: 'Update tests',
          filesChanged: 1,
          insertions: 30,
          deletions: 10,
          files: ['tests/integration/api.test.js'],
        },
        {
          hash: 'hash2',
          author: 'Author 1',
          email: 'author1@example.com',
          date: new Date('2024-01-02'),
          message: 'Fix unit test',
          filesChanged: 1,
          insertions: 5,
          deletions: 2,
          files: ['test/unit/helper.spec.js'],
        },
      ];

      const result = service.analyzeTestFileRatio(commits);

      // Both commits have test files = 100%
      expect(result).toBe(100);
    });

    it('should return 0 when no commits have test files', () => {
      const commits = [
        {
          hash: 'hash1',
          author: 'Author 1',
          email: 'author1@example.com',
          date: new Date('2024-01-01'),
          message: 'Add feature',
          filesChanged: 2,
          insertions: 100,
          deletions: 0,
          files: ['src/feature.ts', 'src/utils.ts'],
        },
        {
          hash: 'hash2',
          author: 'Author 1',
          email: 'author1@example.com',
          date: new Date('2024-01-02'),
          message: 'Update config',
          filesChanged: 1,
          insertions: 10,
          deletions: 5,
          files: ['config.json'],
        },
      ];

      const result = service.analyzeTestFileRatio(commits);

      // No commits have test files = 0%
      expect(result).toBe(0);
    });

    it('should handle mixed commits with and without tests', () => {
      const commits = [
        {
          hash: 'hash1',
          author: 'Author 1',
          email: 'author1@example.com',
          date: new Date('2024-01-01'),
          message: 'Add feature with test',
          filesChanged: 2,
          insertions: 50,
          deletions: 0,
          files: ['src/feature.ts', 'src/feature.test.ts'],
        },
        {
          hash: 'hash2',
          author: 'Author 1',
          email: 'author1@example.com',
          date: new Date('2024-01-02'),
          message: 'Update config',
          filesChanged: 1,
          insertions: 5,
          deletions: 2,
          files: ['config.json'],
        },
        {
          hash: 'hash3',
          author: 'Author 1',
          email: 'author1@example.com',
          date: new Date('2024-01-03'),
          message: 'Refactor',
          filesChanged: 1,
          insertions: 20,
          deletions: 15,
          files: ['src/utils.ts'],
        },
        {
          hash: 'hash4',
          author: 'Author 1',
          email: 'author1@example.com',
          date: new Date('2024-01-04'),
          message: 'Add more tests',
          filesChanged: 1,
          insertions: 30,
          deletions: 0,
          files: ['tests/integration.spec.js'],
        },
      ];

      const result = service.analyzeTestFileRatio(commits);

      // 2 out of 4 commits have test files = 50%
      expect(result).toBe(50);
    });

    it('should be case insensitive', () => {
      const commits = [
        {
          hash: 'hash1',
          author: 'Author 1',
          email: 'author1@example.com',
          date: new Date('2024-01-01'),
          message: 'Add test',
          filesChanged: 1,
          insertions: 20,
          deletions: 0,
          files: ['src/Feature.TEST.ts'],
        },
        {
          hash: 'hash2',
          author: 'Author 1',
          email: 'author1@example.com',
          date: new Date('2024-01-02'),
          message: 'Add spec',
          filesChanged: 1,
          insertions: 15,
          deletions: 0,
          files: ['src/Service.SPEC.js'],
        },
      ];

      const result = service.analyzeTestFileRatio(commits);

      // Both commits have test files = 100%
      expect(result).toBe(100);
    });
  });
});
