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
import { CodeCommentAnalysisService } from './metrics/ai-indicators/code-comment-analysis.service';
import { CodeNonTypicalExpressionsService } from './metrics/ai-indicators/code-non-typical-expressions.service';
import { FileSystemScannerService } from './metrics/ai-indicators/file-system-scanner.service';
import { METRIC_DESCRIPTIONS } from './metrics/metric-thresholds.constants';

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
    private readonly fileSystemScannerService: FileSystemScannerService,
    private readonly codeCommentAnalysisService: CodeCommentAnalysisService,
    private readonly codeNonTypicalExpressionsService: CodeNonTypicalExpressionsService,
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
      // Clone the repository with progress indication
      process.stdout.write('📥 Cloning repository...');
      const cloneStartTime = Date.now();
      const cloneProgressInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - cloneStartTime) / 1000);
        process.stdout.write(`\r📥 Cloning repository... ${elapsed}s`);
      }, 1000);

      const cloneResult = await this.gitService.cloneRepository(
        repositoryUrl,
        branch,
      );
      clearInterval(cloneProgressInterval);
      git = cloneResult.git;
      repoPath = cloneResult.repoPath;
      const cloneTotalTime = Math.floor((Date.now() - cloneStartTime) / 1000);
      process.stdout.write(
        `\r✓ Repository cloned successfully (${cloneTotalTime}s)\n`,
      );

      // Validate repository
      const isValid = await this.gitService.isValidRepository(git);
      if (!isValid) {
        throw new Error('Invalid Git repository');
      }

      // Get commit history with progress indication
      process.stdout.write('📜 Fetching commit history...');
      const historyStartTime = Date.now();
      const historyProgressInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - historyStartTime) / 1000);
        process.stdout.write(`\r📜 Fetching commit history... ${elapsed}s`);
      }, 1000);

      const commits = await this.gitService.getCommitHistory(git);
      clearInterval(historyProgressInterval);
      const historyTotalTime = Math.floor(
        (Date.now() - historyStartTime) / 1000,
      );
      process.stdout.write(
        `\r✓ Loaded ${commits.length} commits (${historyTotalTime}s)\n`,
      );

      // Get repository info
      const repoInfo = await this.gitService.getRepositoryInfo(git);

      // Calculate metrics
      const metrics = this.calculateMetrics(commits, repoPath);

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
   * @param repoPath Path to the cloned repository
   * @returns Calculated metrics
   */
  private calculateMetrics(
    commits: CommitInfo[],
    repoPath: string,
  ): GitMetrics {
    // Get basic metrics from BasicMetricsService
    const basicMetrics =
      this.basicMetricsService.calculateBasicMetrics(commits);

    // Get size-related metrics from GitSizeService
    const sizeMetrics = this.gitSizeService.calculateSizeMetrics(commits);

    // Get AI indicator metrics from specialized services
    const commitMessagePatterns =
      this.gitMessagesService.analyzeCommitMessagePatterns(commits);
    const burstyCommitPercentage =
      this.gitTimingService.analyzeBurstyCommits(commits);
    const testFileRatio = this.codeQualityService.analyzeTestFileRatio(commits);

    // File-based analysis with unified scanning (comments + non-typical expressions)
    console.log('📝 Analyzing source files...');
    let lastProgress = 0;
    this.fileSystemScannerService.scanRepository(
      repoPath,
      [this.codeCommentAnalysisService, this.codeNonTypicalExpressionsService],
      (current, total) => {
        const progress = Math.floor((current / total) * 100);
        // Only update every 10% to avoid too much output
        if (progress >= lastProgress + 10 || current === total) {
          process.stdout.write(
            `\r📝 Analyzing source files... ${current}/${total} files (${progress}%)`,
          );
          lastProgress = progress;
          if (current === total) {
            process.stdout.write('\n');
          }
        }
      },
    );

    const codeCommentRatio = this.codeCommentAnalysisService.getResult();
    const codeNonTypicalExpressionRatio =
      this.codeNonTypicalExpressionsService.getResult();

    return {
      ...basicMetrics,
      aiIndicators: {
        avgLinesPerCommit: {
          value: sizeMetrics.avgLinesPerCommit,
          description: METRIC_DESCRIPTIONS.avgLinesPerCommit(),
        },
        largeCommitPercentage: {
          value: sizeMetrics.largeCommitPercentage,
          description: METRIC_DESCRIPTIONS.largeCommitPercentage(),
        },
        firstCommitAnalysis: {
          value: sizeMetrics.firstCommitAnalysis,
          description: METRIC_DESCRIPTIONS.firstCommitAnalysis(),
        },
        avgFilesPerCommit: {
          value: sizeMetrics.avgFilesPerCommit,
          description: METRIC_DESCRIPTIONS.avgFilesPerCommit(),
        },
        commitMessagePatterns: {
          value: commitMessagePatterns,
          description: METRIC_DESCRIPTIONS.commitMessagePatterns(),
        },
        burstyCommitPercentage: {
          value: burstyCommitPercentage,
          description: METRIC_DESCRIPTIONS.burstyCommitPercentage(),
        },
        testFileRatio: {
          value: testFileRatio,
          description: METRIC_DESCRIPTIONS.testFileRatio(),
        },
        codeCommentRatio: {
          value: codeCommentRatio,
          description: METRIC_DESCRIPTIONS.codeCommentRatio(),
        },
        codeNonTypicalExpressionRatio: {
          value: codeNonTypicalExpressionRatio,
          description: METRIC_DESCRIPTIONS.codeNonTypicalExpressionRatio(),
        },
      },
    };
  }
}
