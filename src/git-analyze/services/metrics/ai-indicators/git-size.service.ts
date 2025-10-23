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

    const commitSizes = commits.map(
      (commit) => commit.insertions + commit.deletions,
    );
    const { mean, standardDeviation } =
      this.calculateMeanAndStdDev(commitSizes);

    // Count commits that are either:
    // 1. More than N standard deviations above the mean, OR
    // 2. Above the absolute threshold
    const largeCommits = commitSizes.filter((lines) => {
      return (
        lines >
          mean +
            METRIC_THRESHOLDS.LARGE_COMMIT_STD_DEV_MULTIPLIER *
              standardDeviation || lines > METRIC_THRESHOLDS.LARGE_COMMIT_LINES
      );
    });

    return Math.round((largeCommits.length / commits.length) * 10000) / 100;
  }

  /**
   * Calculates mean and standard deviation for a set of values
   * @param values Array of numeric values
   * @returns Object containing mean and standard deviation
   */
  private calculateMeanAndStdDev(values: number[]): {
    mean: number;
    standardDeviation: number;
  } {
    if (values.length === 0) {
      return { mean: 0, standardDeviation: 0 };
    }

    const mean = values.reduce((sum, value) => sum + value, 0) / values.length;

    const squaredDiffs = values.map((value) => Math.pow(value - mean, 2));
    const variance =
      squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
    const standardDeviation = Math.sqrt(variance);

    return { mean, standardDeviation };
  }

  /**
   * Analyzes the first commit to detect suspiciously large initial commits
   * @param sortedCommits Array of commit information sorted by date (ascending)
   * @returns Object with first commit size and whether it's suspicious
   */
  private analyzeFirstCommit(sortedCommits: CommitInfo[]): {
    firstCommitLines: number;
    isSuspiciouslyLarge: boolean;
  } {
    if (sortedCommits.length === 0) {
      return { firstCommitLines: 0, isSuspiciouslyLarge: false };
    }

    const firstCommit = sortedCommits[0];
    const firstCommitLines = firstCommit.insertions + firstCommit.deletions;

    // Calculate average of remaining commits (excluding first)
    if (sortedCommits.length === 1) {
      // If only one commit, it's suspicious if it's very large
      return {
        firstCommitLines,
        isSuspiciouslyLarge:
          firstCommitLines > METRIC_THRESHOLDS.FIRST_COMMIT_SINGLE_THRESHOLD,
      };
    }

    const remainingCommits = sortedCommits.slice(1);
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
