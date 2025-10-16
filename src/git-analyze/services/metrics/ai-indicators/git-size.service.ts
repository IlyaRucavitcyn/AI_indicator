import { Injectable } from '@nestjs/common';
import { CommitInfo } from '../../git.service';
import { METRIC_THRESHOLDS } from '../metric-thresholds.constants';

export interface GitSizeMetrics {
  avgLinesPerCommit: number;
  largeCommitPercentage: number;
  firstCommitAnalysis: {
    lines: number;
    isSuspicious: boolean;
  };
  avgFilesPerCommit: number;
}

@Injectable()
export class GitSizeService {
  /**
   * Calculates all size-related metrics
   * @param commits Array of commit information
   * @returns Git size metrics object
   */
  calculateSizeMetrics(commits: CommitInfo[]): GitSizeMetrics {
    const sortedCommits = [...commits].sort(
      (a, b) => a.date.getTime() - b.date.getTime(),
    );

    const firstCommitAnalysis = this.analyzeFirstCommit(sortedCommits);

    return {
      avgLinesPerCommit: this.calculateAvgLinesPerCommit(commits),
      largeCommitPercentage: this.calculateLargeCommitPercentage(commits),
      firstCommitAnalysis: {
        lines: firstCommitAnalysis.firstCommitLines,
        isSuspicious: firstCommitAnalysis.isSuspiciouslyLarge,
      },
      avgFilesPerCommit: this.calculateAvgFilesPerCommit(commits),
    };
  }

  /**
   * Calculates average lines changed per commit
   * @param commits Array of commit information
   * @returns Average lines changed (insertions + deletions)
   */
  private calculateAvgLinesPerCommit(commits: CommitInfo[]): number {
    if (commits.length === 0) {
      return 0;
    }

    const totalLines = commits.reduce(
      (sum, commit) => sum + commit.insertions + commit.deletions,
      0,
    );

    return Math.round((totalLines / commits.length) * 100) / 100;
  }

  /**
   * Calculates percentage of large commits (outliers)
   * @param commits Array of commit information
   * @returns Percentage of commits that are significantly larger than average
   */
  private calculateLargeCommitPercentage(commits: CommitInfo[]): number {
    if (commits.length === 0) {
      return 0;
    }

    // Calculate mean
    const totalLines = commits.reduce(
      (sum, commit) => sum + commit.insertions + commit.deletions,
      0,
    );
    const mean = totalLines / commits.length;

    // Calculate standard deviation
    const squaredDiffs = commits.map((commit) => {
      const lines = commit.insertions + commit.deletions;
      return Math.pow(lines - mean, 2);
    });
    const variance =
      squaredDiffs.reduce((sum, val) => sum + val, 0) / commits.length;
    const stdDev = Math.sqrt(variance);

    // Count commits that are either:
    // 1. More than N standard deviations above the mean, OR
    // 2. Above the absolute threshold
    const largeCommits = commits.filter((commit) => {
      const lines = commit.insertions + commit.deletions;
      return (
        lines >
          mean + METRIC_THRESHOLDS.LARGE_COMMIT_STD_DEV_MULTIPLIER * stdDev ||
        lines > METRIC_THRESHOLDS.LARGE_COMMIT_LINES
      );
    });

    return Math.round((largeCommits.length / commits.length) * 10000) / 100;
  }

  /**
   * Analyzes the first commit to detect suspiciously large initial commits
   * @param commits Array of commit information (sorted by date)
   * @returns Object with first commit size and whether it's suspicious
   */
  private analyzeFirstCommit(commits: CommitInfo[]): {
    firstCommitLines: number;
    isSuspiciouslyLarge: boolean;
  } {
    if (commits.length === 0) {
      return { firstCommitLines: 0, isSuspiciouslyLarge: false };
    }

    // Assume commits are already sorted by date
    const firstCommit = commits[0];
    const firstCommitLines = firstCommit.insertions + firstCommit.deletions;

    // Calculate average of remaining commits (excluding first)
    if (commits.length === 1) {
      // If only one commit, it's suspicious if it's very large
      return {
        firstCommitLines,
        isSuspiciouslyLarge:
          firstCommitLines > METRIC_THRESHOLDS.FIRST_COMMIT_SINGLE_THRESHOLD,
      };
    }

    const remainingCommits = commits.slice(1);
    const avgRemainingLines =
      remainingCommits.reduce(
        (sum, commit) => sum + commit.insertions + commit.deletions,
        0,
      ) / remainingCommits.length;

    // First commit is suspicious if it's Nx larger than the average of other commits
    // OR if it's larger than absolute threshold
    const isSuspiciouslyLarge =
      firstCommitLines >
        avgRemainingLines * METRIC_THRESHOLDS.FIRST_COMMIT_MULTIPLIER ||
      firstCommitLines > METRIC_THRESHOLDS.FIRST_COMMIT_ABSOLUTE_THRESHOLD;

    return { firstCommitLines, isSuspiciouslyLarge };
  }

  /**
   * Calculates average number of files changed per commit
   * @param commits Array of commit information
   * @returns Average files per commit
   */
  private calculateAvgFilesPerCommit(commits: CommitInfo[]): number {
    if (commits.length === 0) {
      return 0;
    }

    const totalFiles = commits.reduce(
      (sum, commit) => sum + commit.filesChanged,
      0,
    );

    return Math.round((totalFiles / commits.length) * 100) / 100;
  }
}
