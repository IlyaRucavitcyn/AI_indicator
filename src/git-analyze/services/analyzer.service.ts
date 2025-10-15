import { Injectable } from '@nestjs/common';
import { GitService, CommitInfo, SimpleGit } from './git.service';
import { TempService } from './temp.service';
import {
  AnalyzeResponseDto,
  GitMetrics,
} from '../routes/dto/analyze-response.dto';
import { BasicMetricsService } from './metrics/basic-metrics.service';
import { GitSizeService } from './metrics/ai-indicators/git-size.service';
import { GitMessagesService } from './metrics/ai-indicators/git-messages.service';
import { GitTimingService } from './metrics/ai-indicators/git-timing.service';
import { CodeQualityService } from './metrics/ai-indicators/code-quality.service';

@Injectable()
export class AnalyzerService {
  constructor(
    private readonly gitService: GitService,
    private readonly tempService: TempService,
    private readonly basicMetricsService: BasicMetricsService,
    private readonly gitSizeService: GitSizeService,
    private readonly gitMessagesService: GitMessagesService,
    private readonly gitTimingService: GitTimingService,
    private readonly codeQualityService: CodeQualityService,
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
    // Get basic metrics from BasicMetricsService
    const basicMetrics = this.basicMetricsService.calculateBasicMetrics(commits);

    // Get size-related metrics from GitSizeService
    const sizeMetrics = this.gitSizeService.calculateSizeMetrics(commits);

    // Get AI indicator metrics from specialized services
    const commitMessagePatterns =
      this.gitMessagesService.analyzeCommitMessagePatterns(commits);
    const burstyCommitPercentage =
      this.gitTimingService.analyzeBurstyCommits(commits);
    const testFileRatio = this.codeQualityService.analyzeTestFileRatio(commits);

    return {
      ...basicMetrics,
      aiIndicators: {
        ...sizeMetrics,
        commitMessagePatterns,
        burstyCommitPercentage,
        testFileRatio,
      },
    };
  }
}
