import { Injectable } from '@nestjs/common';
import { GitService, CommitInfo, SimpleGit } from './git.service';
import { TempService } from './temp.service';
import {
  AnalyzeResponseDto,
  GitMetrics,
} from '../routes/dto/analyze-response.dto';

@Injectable()
export class AnalyzerService {
  constructor(
    private readonly gitService: GitService,
    private readonly tempService: TempService,
  ) {}

  /**
   * Analyzes a Git repository and returns metrics
   * @param repositoryUrl Git repository URL
   * @param branch Branch to analyze (default: main)
   * @returns Analysis results
   */
  async analyzeRepository(
    repositoryUrl: string,
    branch: string = 'main',
  ): Promise<AnalyzeResponseDto> {
    let git: SimpleGit;
    let repoPath: string | undefined;

    try {
      // Clone the repository
      const cloneResult = await this.gitService.cloneRepository(
        repositoryUrl,
        branch,
      );
      git = cloneResult.git;
      repoPath = cloneResult.repoPath;

      // Validate repository
      const isValid = await this.gitService.isValidRepository(git);
      if (!isValid) {
        throw new Error('Invalid Git repository');
      }

      // Get commit history
      const commits = await this.gitService.getCommitHistory(git);

      // Get repository info
      const repoInfo = await this.gitService.getRepositoryInfo(git);

      // Calculate metrics
      const metrics = this.calculateMetrics(commits);

      // Extract repository name
      const repository = this.tempService.extractRepoName(repositoryUrl);

      return {
        repository,
        branch: repoInfo.branch,
        metrics,
        analyzedAt: new Date().toISOString(),
      };
    } catch (error) {
      throw new Error(`Analysis failed: ${(error as Error).message}`);
    } finally {
      // Clean up repository
      if (repoPath) {
        this.gitService.cleanupRepository(repoPath);
      }
    }
  }

  /**
   * Calculates metrics from commit history
   * @param commits Array of commit information
   * @returns Calculated metrics
   */
  private calculateMetrics(commits: CommitInfo[]): GitMetrics {
    if (commits.length === 0) {
      return {
        totalCommits: 0,
        contributors: 0,
        firstCommit: '',
        lastCommit: '',
        durationDays: 0,
        avgCommitsPerDay: 0,
        topContributor: '',
        contributorStats: [],
      };
    }

    // Sort commits by date
    const sortedCommits = commits.sort(
      (a, b) => a.date.getTime() - b.date.getTime(),
    );

    // Basic metrics
    const totalCommits = commits.length;
    const firstCommit = sortedCommits[0].date.toISOString();
    const lastCommit =
      sortedCommits[sortedCommits.length - 1].date.toISOString();

    // Calculate duration
    const durationMs =
      new Date(lastCommit).getTime() - new Date(firstCommit).getTime();
    const durationDays = Math.ceil(durationMs / (1000 * 60 * 60 * 24));

    // Calculate average commits per day
    const avgCommitsPerDay = durationDays > 0 ? totalCommits / durationDays : 0;

    // Contributor analysis using reduce with immutable operations
    const contributorStats = commits
      .reduce(
        (stats, commit) => {
          const existingIndex = stats.findIndex(
            (s) => s.email === commit.email,
          );
          if (existingIndex !== -1) {
            return [
              ...stats.slice(0, existingIndex),
              {
                ...stats[existingIndex],
                commitCount: stats[existingIndex].commitCount + 1,
              },
              ...stats.slice(existingIndex + 1),
            ];
          }
          return [
            ...stats,
            {
              name: commit.author,
              email: commit.email,
              commitCount: 1,
            },
          ];
        },
        [] as Array<{ name: string; email: string; commitCount: number }>,
      )
      .sort((a, b) => b.commitCount - a.commitCount);

    const contributors = contributorStats.length;
    const topContributor = contributors > 0 ? contributorStats[0].email : '';

    return {
      totalCommits,
      contributors,
      firstCommit,
      lastCommit,
      durationDays,
      avgCommitsPerDay: Math.round(avgCommitsPerDay * 100) / 100,
      topContributor,
      contributorStats,
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

    // Count commits that are more than 2 standard deviations above the mean
    const largeCommits = commits.filter((commit) => {
      const lines = commit.insertions + commit.deletions;
      return lines > mean + 2 * stdDev;
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
      // If only one commit, it's suspicious if it's very large (>500 lines)
      return {
        firstCommitLines,
        isSuspiciouslyLarge: firstCommitLines > 500,
      };
    }

    const remainingCommits = commits.slice(1);
    const avgRemainingLines =
      remainingCommits.reduce(
        (sum, commit) => sum + commit.insertions + commit.deletions,
        0,
      ) / remainingCommits.length;

    // First commit is suspicious if it's 3x larger than the average of other commits
    // OR if it's larger than 1000 lines
    const isSuspiciouslyLarge =
      firstCommitLines > avgRemainingLines * 3 || firstCommitLines > 1000;

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
