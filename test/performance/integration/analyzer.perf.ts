import 'reflect-metadata';
import { Bench } from 'tinybench';
import { AnalyzerService } from '../../../src/git-analyze/services/analyzer.service';
import { GitService } from '../../../src/git-analyze/services/git.service';
import { TempService } from '../../../src/git-analyze/services/temp.service';
import { BasicMetricsService } from '../../../src/git-analyze/services/metrics/basic-metrics.service';
import { GitSizeService } from '../../../src/git-analyze/services/metrics/ai-indicators/git-size.service';
import { GitMessagesService } from '../../../src/git-analyze/services/metrics/ai-indicators/git-messages.service';
import { GitTimingService } from '../../../src/git-analyze/services/metrics/ai-indicators/git-timing.service';
import { CodeQualityService } from '../../../src/git-analyze/services/metrics/ai-indicators/code-quality.service';
import { CodeCommentAnalysisService } from '../../../src/git-analyze/services/metrics/ai-indicators/code-comment-analysis.service';
import { CodeNonTypicalExpressionsService } from '../../../src/git-analyze/services/metrics/ai-indicators/code-non-typical-expressions.service';
import { FileSystemScannerService } from '../../../src/git-analyze/services/metrics/ai-indicators/file-system-scanner.service';
import { GitMetrics } from '../../../src/git-analyze/routes/dto/analyze-response.dto';
import {
  MockDataGenerator,
  MockRepositoryGenerator,
  PERFORMANCE_THRESHOLDS,
  formatBenchmarkResults,
} from '../utils/performance-helpers';

/**
 * Suppresses console output during benchmark execution
 */
function suppressConsoleOutput() {
  const originalLog = console.log;
  const originalWrite = process.stdout.write;

  console.log = () => {};
  process.stdout.write = () => true;

  return () => {
    console.log = originalLog;
    process.stdout.write = originalWrite;
  };
}

async function runBenchmarks() {
  // Create mock repository directory for code comment analysis
  console.log('Creating mock repository for integration tests...');
  const mockRepoPath = MockRepositoryGenerator.createMockRepository({
    fileCount: 50,
    maxDepth: 3,
    fileTypes: ['.ts', '.js'],
    avgFileSize: 'medium',
    includeNonTypicalCode: true,
  });

  try {
    // Manually instantiate services (no NestJS DI in standalone script)
    const tempService = new TempService();
    const gitService = new GitService(tempService);
    const basicMetricsService = new BasicMetricsService();
    const gitSizeService = new GitSizeService();
    const gitMessagesService = new GitMessagesService();
    const gitTimingService = new GitTimingService();
    const codeQualityService = new CodeQualityService();
    const fileSystemScannerService = new FileSystemScannerService();
    const codeCommentAnalysisService = new CodeCommentAnalysisService();
    const codeNonTypicalExpressionsService = new CodeNonTypicalExpressionsService();

    const analyzerService = new AnalyzerService(
      gitService,
      tempService,
      basicMetricsService,
      gitSizeService,
      gitMessagesService,
      gitTimingService,
      codeQualityService,
      fileSystemScannerService,
      codeCommentAnalysisService,
      codeNonTypicalExpressionsService,
    );

    console.log('\n========================================');
    console.log('AnalyzerService Integration Performance');
    console.log('========================================\n');

    // Small dataset
    const smallCommits = MockDataGenerator.generateCommits(
      PERFORMANCE_THRESHOLDS.SMALL_DATASET.size,
    );
    const smallBench = new Bench({ time: 1000 });

    smallBench.add('AnalyzerService - 100 commits', () => {
      const restore = suppressConsoleOutput();
      try {
        (analyzerService as any).calculateMetrics(smallCommits, mockRepoPath);
      } finally {
        restore();
      }
    });

    await smallBench.run();
    const smallResult = smallBench.tasks[0].result;
    console.log(
      formatBenchmarkResults({
        name: 'AnalyzerService - 100 commits (full metrics)',
        ops: smallResult?.throughput.mean || 0,
        margin: smallResult?.latency.rme || 0,
        samples: smallResult?.latency.samples.length || 0,
        mean: smallResult?.latency.mean || 0,
        min: smallResult?.latency.min || 0,
        max: smallResult?.latency.max || 0,
      }),
    );

    // Medium dataset
    const mediumCommits = MockDataGenerator.generateCommits(
      PERFORMANCE_THRESHOLDS.MEDIUM_DATASET.size,
    );
    const mediumBench = new Bench({ time: 1000 });

    mediumBench.add('AnalyzerService - 1,000 commits', () => {
      const restore = suppressConsoleOutput();
      try {
        (analyzerService as any).calculateMetrics(mediumCommits, mockRepoPath);
      } finally {
        restore();
      }
    });

    await mediumBench.run();
    const mediumResult = mediumBench.tasks[0].result;
    console.log(
      formatBenchmarkResults({
        name: 'AnalyzerService - 1,000 commits (full metrics)',
        ops: mediumResult?.throughput.mean || 0,
        margin: mediumResult?.latency.rme || 0,
        samples: mediumResult?.latency.samples.length || 0,
        mean: mediumResult?.latency.mean || 0,
        min: mediumResult?.latency.min || 0,
        max: mediumResult?.latency.max || 0,
      }),
    );

    // Large dataset
    const largeCommits = MockDataGenerator.generateCommits(
      PERFORMANCE_THRESHOLDS.LARGE_DATASET.size,
    );
    const largeBench = new Bench({ time: 1000 });

    largeBench.add('AnalyzerService - 10,000 commits', () => {
      const restore = suppressConsoleOutput();
      try {
        (analyzerService as any).calculateMetrics(largeCommits, mockRepoPath);
      } finally {
        restore();
      }
    });

    await largeBench.run();
    const largeResult = largeBench.tasks[0].result;
    console.log(
      formatBenchmarkResults({
        name: 'AnalyzerService - 10,000 commits (full metrics)',
        ops: largeResult?.throughput.mean || 0,
        margin: largeResult?.latency.rme || 0,
        samples: largeResult?.latency.samples.length || 0,
        mean: largeResult?.latency.mean || 0,
        min: largeResult?.latency.min || 0,
        max: largeResult?.latency.max || 0,
      }),
    );

    console.log('\n========================================');
    console.log('Worst-Case Scenario Analysis');
    console.log('========================================\n');

    // Worst case: many files, high variability, complex patterns
    const worstCaseCommits = MockDataGenerator.generateCommits(5000, {
      avgFilesPerCommit: 20,
      avgLinesPerCommit: 500,
      variability: 1.5,
      testFileRatio: 0.5,
      conventionalCommitRatio: 0.8,
      burstRatio: 0.4,
    });

    const startTime = performance.now();
    const restore = suppressConsoleOutput();
    let metrics: GitMetrics;
    try {
      metrics = (analyzerService as any).calculateMetrics(
        worstCaseCommits,
        mockRepoPath,
      );
    } finally {
      restore();
    }
    const endTime = performance.now();

    const executionTime = endTime - startTime;

    console.log(`Execution time: ${executionTime.toFixed(2)}ms`);
    console.log(`Total commits: ${metrics.totalCommits}`);
    console.log(`Contributors: ${metrics.contributors}`);
    console.log(
      `Avg files/commit: ${metrics.aiIndicators?.avgFilesPerCommit.value}`,
    );
    console.log(
      `Avg lines/commit: ${metrics.aiIndicators?.avgLinesPerCommit.value}`,
    );

    const withinThreshold = executionTime < 1000;
    console.log(
      `\n✓ Performance: ${executionTime.toFixed(2)}ms < 1000ms: ${withinThreshold ? '✅' : '❌'}`,
    );

    console.log('\n✅ All benchmarks completed successfully!\n');
  } finally {
    // Cleanup mock repository
    MockRepositoryGenerator.cleanupMockRepository(mockRepoPath);
  }
}

runBenchmarks().catch((error) => {
  console.error('Benchmark failed:', error);
  process.exit(1);
});
