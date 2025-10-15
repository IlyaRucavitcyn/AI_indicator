import { CommitInfo } from '../../../src/git-analyze/services/git.service';

/**
 * Generates mock commit data for performance testing
 */
export class MockDataGenerator {
  /**
   * Generates an array of mock commits
   * @param count Number of commits to generate
   * @param options Configuration options for commit generation
   * @returns Array of mock CommitInfo objects
   */
  static generateCommits(
    count: number,
    options: {
      avgFilesPerCommit?: number;
      avgLinesPerCommit?: number;
      variability?: number; // 0-1, how much to vary sizes
      testFileRatio?: number; // 0-1, ratio of commits with test files
      conventionalCommitRatio?: number; // 0-1, ratio of conventional commits
      burstRatio?: number; // 0-1, ratio of bursty commits
    } = {},
  ): CommitInfo[] {
    const {
      avgFilesPerCommit = 3,
      avgLinesPerCommit = 50,
      variability = 0.5,
      testFileRatio = 0.3,
      conventionalCommitRatio = 0.5,
      burstRatio = 0.2,
    } = options;

    const commits: CommitInfo[] = [];
    const startDate = new Date('2024-01-01T00:00:00Z');
    const contributors = this.generateContributors(Math.min(10, Math.ceil(count / 10)));

    for (let i = 0; i < count; i++) {
      const contributor = contributors[i % contributors.length];

      // Generate file count with variability
      const filesChanged = Math.max(
        1,
        Math.round(
          avgFilesPerCommit + (Math.random() - 0.5) * 2 * variability * avgFilesPerCommit,
        ),
      );

      // Generate line changes with variability
      const totalLines = Math.max(
        1,
        Math.round(
          avgLinesPerCommit + (Math.random() - 0.5) * 2 * variability * avgLinesPerCommit,
        ),
      );
      const insertions = Math.round(totalLines * (0.5 + Math.random() * 0.5));
      const deletions = totalLines - insertions;

      // Generate files (with test files based on ratio)
      const files = this.generateFiles(filesChanged, Math.random() < testFileRatio);

      // Generate commit message
      const message = this.generateCommitMessage(Math.random() < conventionalCommitRatio);

      // Generate date (with bursts based on ratio)
      const isBursty = i > 0 && Math.random() < burstRatio;
      const timeDelta = isBursty
        ? Math.random() * 20 * 60 * 1000 // 0-20 minutes for bursty
        : Math.random() * 24 * 60 * 60 * 1000; // 0-24 hours for normal

      const date = new Date(
        startDate.getTime() + i * 3600000 + timeDelta,
      );

      commits.push({
        hash: this.generateHash(i),
        author: contributor.name,
        email: contributor.email,
        date,
        message,
        filesChanged,
        insertions,
        deletions,
        files,
      });
    }

    return commits;
  }

  private static generateContributors(count: number): Array<{ name: string; email: string }> {
    const contributors: Array<{ name: string; email: string }> = [];
    for (let i = 0; i < count; i++) {
      contributors.push({
        name: `Developer ${i + 1}`,
        email: `dev${i + 1}@example.com`,
      });
    }
    return contributors;
  }

  private static generateFiles(count: number, includeTests: boolean): string[] {
    const files: string[] = [];
    const extensions = ['.ts', '.js', '.tsx', '.jsx'];

    for (let i = 0; i < count; i++) {
      const ext = extensions[Math.floor(Math.random() * extensions.length)];
      if (includeTests && i === count - 1) {
        files.push(`src/module${i}/file${i}.spec${ext}`);
      } else {
        files.push(`src/module${i}/file${i}${ext}`);
      }
    }

    return files;
  }

  private static generateCommitMessage(isConventional: boolean): string {
    if (isConventional) {
      const types = ['feat', 'fix', 'refactor', 'chore', 'test', 'docs'];
      const type = types[Math.floor(Math.random() * types.length)];
      return `${type}: implement feature ${Math.floor(Math.random() * 1000)}`;
    } else {
      const messages = [
        'working on the new feature',
        'fixing bugs in the authentication system',
        'improving performance of the data layer',
        'updating documentation',
      ];
      return messages[Math.floor(Math.random() * messages.length)];
    }
  }

  private static generateHash(index: number): string {
    return `hash${index.toString().padStart(8, '0')}`;
  }
}

/**
 * Performance thresholds for different operation scales
 */
export const PERFORMANCE_THRESHOLDS = {
  SMALL_DATASET: {
    size: 100,
    maxTimeMs: 10,
  },
  MEDIUM_DATASET: {
    size: 1000,
    maxTimeMs: 50,
  },
  LARGE_DATASET: {
    size: 10000,
    maxTimeMs: 500,
  },
  XLARGE_DATASET: {
    size: 100000,
    maxTimeMs: 5000,
  },
};

/**
 * Formats benchmark results for console output
 */
export function formatBenchmarkResults(results: {
  name: string;
  ops: number;
  margin: number;
  samples: number;
  mean: number;
  min: number;
  max: number;
}): string {
  return [
    `\n${results.name}`,
    `  Operations/sec: ${results.ops.toFixed(2)} ±${results.margin.toFixed(2)}%`,
    `  Mean time: ${(results.mean * 1000).toFixed(3)}ms`,
    `  Min: ${(results.min * 1000).toFixed(3)}ms | Max: ${(results.max * 1000).toFixed(3)}ms`,
    `  Samples: ${results.samples}`,
  ].join('\n');
}
