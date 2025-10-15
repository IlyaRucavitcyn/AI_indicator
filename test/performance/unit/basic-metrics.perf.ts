import { Bench } from 'tinybench';
import { BasicMetricsService } from '../../../src/git-analyze/services/metrics/basic-metrics.service';
import {
  MockDataGenerator,
  PERFORMANCE_THRESHOLDS,
  formatBenchmarkResults,
} from '../utils/performance-helpers';

async function runBenchmarks() {
  const service = new BasicMetricsService();

  console.log('\n========================================');
  console.log('BasicMetricsService Performance Tests');
  console.log('========================================\n');

  // Small dataset
  const smallCommits = MockDataGenerator.generateCommits(
    PERFORMANCE_THRESHOLDS.SMALL_DATASET.size,
  );
  const smallBench = new Bench({ time: 1000 });

  smallBench.add('BasicMetrics - 100 commits', () => {
    service.calculateBasicMetrics(smallCommits);
  });

  await smallBench.run();
  const smallResult = smallBench.tasks[0].result;
  console.log(
    formatBenchmarkResults({
      name: 'BasicMetrics - 100 commits',
      ops: smallResult?.hz || 0,
      margin: smallResult?.rme || 0,
      samples: smallResult?.samples.length || 0,
      mean: smallResult?.mean || 0,
      min: smallResult?.min || 0,
      max: smallResult?.max || 0,
    }),
  );

  const smallMeanMs = (smallResult?.mean || 0) * 1000;
  console.log(
    `  ✓ Threshold: ${PERFORMANCE_THRESHOLDS.SMALL_DATASET.maxTimeMs}ms (${smallMeanMs.toFixed(3)}ms < ${PERFORMANCE_THRESHOLDS.SMALL_DATASET.maxTimeMs}ms)`,
  );

  // Medium dataset
  const mediumCommits = MockDataGenerator.generateCommits(
    PERFORMANCE_THRESHOLDS.MEDIUM_DATASET.size,
  );
  const mediumBench = new Bench({ time: 1000 });

  mediumBench.add('BasicMetrics - 1,000 commits', () => {
    service.calculateBasicMetrics(mediumCommits);
  });

  await mediumBench.run();
  const mediumResult = mediumBench.tasks[0].result;
  console.log(
    formatBenchmarkResults({
      name: 'BasicMetrics - 1,000 commits',
      ops: mediumResult?.hz || 0,
      margin: mediumResult?.rme || 0,
      samples: mediumResult?.samples.length || 0,
      mean: mediumResult?.mean || 0,
      min: mediumResult?.min || 0,
      max: mediumResult?.max || 0,
    }),
  );

  const mediumMeanMs = (mediumResult?.mean || 0) * 1000;
  console.log(
    `  ✓ Threshold: ${PERFORMANCE_THRESHOLDS.MEDIUM_DATASET.maxTimeMs}ms (${mediumMeanMs.toFixed(3)}ms < ${PERFORMANCE_THRESHOLDS.MEDIUM_DATASET.maxTimeMs}ms)`,
  );

  // Large dataset
  const largeCommits = MockDataGenerator.generateCommits(
    PERFORMANCE_THRESHOLDS.LARGE_DATASET.size,
  );
  const largeBench = new Bench({ time: 1000 });

  largeBench.add('BasicMetrics - 10,000 commits', () => {
    service.calculateBasicMetrics(largeCommits);
  });

  await largeBench.run();
  const largeResult = largeBench.tasks[0].result;
  console.log(
    formatBenchmarkResults({
      name: 'BasicMetrics - 10,000 commits',
      ops: largeResult?.hz || 0,
      margin: largeResult?.rme || 0,
      samples: largeResult?.samples.length || 0,
      mean: largeResult?.mean || 0,
      min: largeResult?.min || 0,
      max: largeResult?.max || 0,
    }),
  );

  const largeMeanMs = (largeResult?.mean || 0) * 1000;
  console.log(
    `  ✓ Threshold: ${PERFORMANCE_THRESHOLDS.LARGE_DATASET.maxTimeMs}ms (${largeMeanMs.toFixed(3)}ms < ${PERFORMANCE_THRESHOLDS.LARGE_DATASET.maxTimeMs}ms)`,
  );

  // Scaling analysis
  console.log('\n========================================');
  console.log('Scaling Analysis');
  console.log('========================================\n');

  const times = [smallMeanMs, mediumMeanMs, largeMeanMs];
  console.log(`  100 commits: ${times[0].toFixed(3)}ms`);
  console.log(`  1,000 commits: ${times[1].toFixed(3)}ms`);
  console.log(`  10,000 commits: ${times[2].toFixed(3)}ms`);

  const ratio1 = times[1] / times[0];
  const ratio2 = times[2] / times[1];

  console.log(`\n  100→1,000 ratio: ${ratio1.toFixed(2)}x`);
  console.log(`  1,000→10,000 ratio: ${ratio2.toFixed(2)}x`);

  console.log('\n✅ All benchmarks completed successfully!\n');
}

runBenchmarks().catch((error) => {
  console.error('Benchmark failed:', error);
  process.exit(1);
});
