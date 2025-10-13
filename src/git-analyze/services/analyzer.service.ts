import { Injectable } from '@nestjs/common';
import { GitService, CommitInfo, SimpleGit } from './git.service';
import { TempService } from './temp.service';
import {
  AnalyzeResponseDto,
  GitMetrics,
  ContributorStats,
} from '../routes/dto/analyze-response.dto';

@Injectable()
export class AnalyzerService {
  constructor(
    private readonly gitService: GitService,
    private readonly tempService: TempService,
  ) { }

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

    // Contributor analysis
    const contributorMap = new Map<
      string,
      { name: string; email: string; count: number }
    >();

    commits.forEach((commit) => {
      const key = commit.email;
      if (contributorMap.has(key)) {
        contributorMap.get(key)!.count++;
      } else {
        contributorMap.set(key, {
          name: commit.author,
          email: commit.email,
          count: 1,
        });
      }
    });

    // Convert to array and sort by commit count
    const contributorStats: ContributorStats[] = Array.from(
      contributorMap.values(),
    )
      .map((contributor) => ({
        email: contributor.email,
        name: contributor.name,
        commitCount: contributor.count,
      }))
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
}
