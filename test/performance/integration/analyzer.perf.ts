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
import {
  MockDataGenerator,
  PERFORMANCE_THRESHOLDS,
  formatBenchmarkResults,
} from '../utils/performance-helpers';

async function runBenchmarks() {
  // Manually instantiate services (no NestJS DI in standalone script)
  const gitService = new GitService();
  const tempService = new TempService();
  const basicMetricsService = new BasicMetricsService();
  const gitSizeService = new GitSizeService();
  const gitMessagesService = new GitMessagesService();
  const gitTimingService = new GitTimingService();
  const codeQualityService = new CodeQualityService();

  const analyzerService = new AnalyzerService(
    gitService,
    tempService,
    basicMetricsService,
    gitSizeService,
    gitMessagesService,
    gitTimingService,
    codeQualityService,
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
    (analyzerService as any).calculateMetrics(smallCommits);
  });

  await smallBench.run();
  const smallResult = smallBench.tasks[0].result;
  console.log(
    formatBenchmarkResults({
      name: 'AnalyzerService - 100 commits (full metrics)',
      ops: smallResult?.hz || 0,
      margin: smallResult?.rme || 0,
      samples: smallResult?.samples.length || 0,
      mean: smallResult?.mean || 0,
      min: smallResult?.min || 0,
      max: smallResult?.max || 0,
    }),
  );

  // Medium dataset
  const mediumCommits = MockDataGenerator.generateCommits(
    PERFORMANCE_THRESHOLDS.MEDIUM_DATASET.size,
  );
  const mediumBench = new Bench({ time: 1000 });

  mediumBench.add('AnalyzerService - 1,000 commits', () => {
    (analyzerService as any).calculateMetrics(mediumCommits);
  });

  await mediumBench.run();
  const mediumResult = mediumBench.tasks[0].result;
  console.log(
    formatBenchmarkResults({
      name: 'AnalyzerService - 1,000 commits (full metrics)',
      ops: mediumResult?.hz || 0,
      margin: mediumResult?.rme || 0,
      samples: mediumResult?.samples.length || 0,
      mean: mediumResult?.mean || 0,
      min: mediumResult?.min || 0,
      max: mediumResult?.max || 0,
    }),
  );

  // Large dataset
  const largeCommits = MockDataGenerator.generateCommits(
    PERFORMANCE_THRESHOLDS.LARGE_DATASET.size,
  );
  const largeBench = new Bench({ time: 1000 });

  largeBench.add('AnalyzerService - 10,000 commits', () => {
    (analyzerService as any).calculateMetrics(largeCommits);
  });

  await largeBench.run();
  const largeResult = largeBench.tasks[0].result;
  console.log(
    formatBenchmarkResults({
      name: 'AnalyzerService - 10,000 commits (full metrics)',
      ops: largeResult?.hz || 0,
      margin: largeResult?.rme || 0,
      samples: largeResult?.samples.length || 0,
      mean: largeResult?.mean || 0,
      min: largeResult?.min || 0,
      max: largeResult?.max || 0,
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
  const metrics = (analyzerService as any).calculateMetrics(worstCaseCommits);
  const endTime = performance.now();

  const executionTime = endTime - startTime;

  console.log(`Execution time: ${executionTime.toFixed(2)}ms`);
  console.log(`Total commits: ${metrics.totalCommits}`);
  console.log(`Contributors: ${metrics.contributors}`);
  console.log(`Avg files/commit: ${metrics.aiIndicators.avgFilesPerCommit}`);
  console.log(`Avg lines/commit: ${metrics.aiIndicators.avgLinesPerCommit}`);

  const withinThreshold = executionTime < 1000;
  console.log(
    `\n✓ Performance: ${executionTime.toFixed(2)}ms < 1000ms: ${withinThreshold ? '✅' : '❌'}`,
  );

  console.log('\n✅ All benchmarks completed successfully!\n');
}

runBenchmarks().catch((error) => {
  console.error('Benchmark failed:', error);
  process.exit(1);
});
