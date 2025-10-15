import { Bench } from 'tinybench';
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
  const basicMetricsService = new BasicMetricsService();
  const gitSizeService = new GitSizeService();
  const gitMessagesService = new GitMessagesService();
  const gitTimingService = new GitTimingService();
  const codeQualityService = new CodeQualityService();

  console.log('\n========================================');
  console.log('All Services Performance Comparison');
  console.log('========================================\n');

  const commits = MockDataGenerator.generateCommits(
    PERFORMANCE_THRESHOLDS.LARGE_DATASET.size,
    {
      testFileRatio: 0.5,
      conventionalCommitRatio: 0.5,
      burstRatio: 0.3,
    },
  );

  console.log(`Dataset: ${commits.length.toLocaleString()} commits\n`);

  const bench = new Bench({ time: 1000 });

  bench
    .add('BasicMetricsService', () => {
      basicMetricsService.calculateBasicMetrics(commits);
    })
    .add('GitSizeService', () => {
      gitSizeService.calculateSizeMetrics(commits);
    })
    .add('GitMessagesService', () => {
      gitMessagesService.analyzeCommitMessagePatterns(commits);
    })
    .add('GitTimingService', () => {
      gitTimingService.analyzeBurstyCommits(commits);
    })
    .add('CodeQualityService', () => {
      codeQualityService.analyzeTestFileRatio(commits);
    })
    .add('All Services Combined', () => {
      basicMetricsService.calculateBasicMetrics(commits);
      gitSizeService.calculateSizeMetrics(commits);
      gitMessagesService.analyzeCommitMessagePatterns(commits);
      gitTimingService.analyzeBurstyCommits(commits);
      codeQualityService.analyzeTestFileRatio(commits);
    });

  await bench.run();

  bench.tasks.forEach((task) => {
    const result = task.result;
    if (result) {
      console.log(
        formatBenchmarkResults({
          name: task.name,
          ops: result.hz,
          margin: result.rme,
          samples: result.samples.length,
          mean: result.mean,
          min: result.min,
          max: result.max,
        }),
      );
    }
  });

  console.log('\n========================================');
  console.log('Memory Efficiency Test (100,000 commits)');
  console.log('========================================\n');

  const xlargeCommits = MockDataGenerator.generateCommits(
    PERFORMANCE_THRESHOLDS.XLARGE_DATASET.size,
  );

  const startMemory = process.memoryUsage();
  const startTime = performance.now();

  basicMetricsService.calculateBasicMetrics(xlargeCommits);
  gitSizeService.calculateSizeMetrics(xlargeCommits);
  gitMessagesService.analyzeCommitMessagePatterns(xlargeCommits);
  gitTimingService.analyzeBurstyCommits(xlargeCommits);
  codeQualityService.analyzeTestFileRatio(xlargeCommits);

  const endTime = performance.now();
  const endMemory = process.memoryUsage();

  const executionTime = endTime - startTime;
  const memoryDelta = {
    heapUsed: (endMemory.heapUsed - startMemory.heapUsed) / 1024 / 1024,
    rss: (endMemory.rss - startMemory.rss) / 1024 / 1024,
  };

  console.log(`Execution time: ${executionTime.toFixed(2)}ms`);
  console.log(`Memory delta (heap): ${memoryDelta.heapUsed.toFixed(2)}MB`);
  console.log(`Memory delta (RSS): ${memoryDelta.rss.toFixed(2)}MB`);

  const withinThreshold =
    executionTime < PERFORMANCE_THRESHOLDS.XLARGE_DATASET.maxTimeMs;
  const memoryEfficient = memoryDelta.heapUsed < 500;

  console.log(
    `\n✓ Performance: ${executionTime.toFixed(2)}ms < ${PERFORMANCE_THRESHOLDS.XLARGE_DATASET.maxTimeMs}ms: ${withinThreshold ? '✅' : '❌'}`,
  );
  console.log(
    `✓ Memory: ${memoryDelta.heapUsed.toFixed(2)}MB < 500MB: ${memoryEfficient ? '✅' : '❌'}`,
  );

  console.log('\n✅ All benchmarks completed successfully!\n');
}

runBenchmarks().catch((error) => {
  console.error('Benchmark failed:', error);
  process.exit(1);
});
