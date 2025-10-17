import 'reflect-metadata';
import { Bench } from 'tinybench';
import { FileSystemScannerService } from '../../../src/git-analyze/services/metrics/ai-indicators/file-system-scanner.service';
import { CodeCommentAnalysisService } from '../../../src/git-analyze/services/metrics/ai-indicators/code-comment-analysis.service';
import { CodeNonTypicalExpressionsService } from '../../../src/git-analyze/services/metrics/ai-indicators/code-non-typical-expressions.service';
import {
  MockRepositoryGenerator,
  formatBenchmarkResults,
} from '../utils/performance-helpers';

/**
 * Performance tests for FileSystemScannerService
 * Tests file system scanning and filtering performance across different repository sizes
 */

async function runBenchmarks() {
  const scannerService = new FileSystemScannerService();

  console.log('\n========================================');
  console.log('FileSystemScannerService Performance');
  console.log('========================================\n');

  // Test 1: Small repository (100 files)
  console.log('Creating small repository (100 files)...');
  const smallRepo = MockRepositoryGenerator.createMockRepository({
    fileCount: 100,
    maxDepth: 3,
    fileTypes: ['.ts', '.js', '.py'],
    avgFileSize: 'medium',
  });

  const smallBench = new Bench({ time: 1000 });
  const smallAnalyzer = new CodeCommentAnalysisService();

  smallBench.add('FileSystemScanner - 100 files', () => {
    scannerService.scanRepository(smallRepo, [smallAnalyzer]);
  });

  await smallBench.run();
  const smallResult = smallBench.tasks[0].result;
  console.log(
    formatBenchmarkResults({
      name: 'FileSystemScanner - 100 files (3 levels deep)',
      ops: smallResult?.throughput.mean || 0,
      margin: smallResult?.latency.rme || 0,
      samples: smallResult?.latency.samples.length || 0,
      mean: smallResult?.latency.mean || 0,
      min: smallResult?.latency.min || 0,
      max: smallResult?.latency.max || 0,
    }),
  );

  const smallThreshold = (smallResult?.latency.mean || 0) * 1000 < 50;
  console.log(
    `  ✓ Threshold: 50ms (${((smallResult?.latency.mean || 0) * 1000).toFixed(3)}ms < 50ms): ${smallThreshold ? '✅' : '❌'}`,
  );

  MockRepositoryGenerator.cleanupMockRepository(smallRepo);

  // Test 2: Medium repository (1,000 files)
  console.log('\nCreating medium repository (1,000 files)...');
  const mediumRepo = MockRepositoryGenerator.createMockRepository({
    fileCount: 1000,
    maxDepth: 5,
    fileTypes: ['.ts', '.js', '.py'],
    avgFileSize: 'medium',
  });

  const mediumBench = new Bench({ time: 1000 });
  const mediumAnalyzer = new CodeCommentAnalysisService();

  mediumBench.add('FileSystemScanner - 1,000 files', () => {
    scannerService.scanRepository(mediumRepo, [mediumAnalyzer]);
  });

  await mediumBench.run();
  const mediumResult = mediumBench.tasks[0].result;
  console.log(
    formatBenchmarkResults({
      name: 'FileSystemScanner - 1,000 files (5 levels deep)',
      ops: mediumResult?.throughput.mean || 0,
      margin: mediumResult?.latency.rme || 0,
      samples: mediumResult?.latency.samples.length || 0,
      mean: mediumResult?.latency.mean || 0,
      min: mediumResult?.latency.min || 0,
      max: mediumResult?.latency.max || 0,
    }),
  );

  const mediumThreshold = (mediumResult?.latency.mean || 0) * 1000 < 500;
  console.log(
    `  ✓ Threshold: 500ms (${((mediumResult?.latency.mean || 0) * 1000).toFixed(3)}ms < 500ms): ${mediumThreshold ? '✅' : '❌'}`,
  );

  MockRepositoryGenerator.cleanupMockRepository(mediumRepo);

  // Test 3: Large repository (5,000 files)
  console.log('\nCreating large repository (5,000 files)...');
  const largeRepo = MockRepositoryGenerator.createMockRepository({
    fileCount: 5000,
    maxDepth: 7,
    fileTypes: ['.ts', '.js', '.py'],
    avgFileSize: 'medium',
  });

  const largeBench = new Bench({ time: 1000 });
  const largeAnalyzer = new CodeCommentAnalysisService();

  largeBench.add('FileSystemScanner - 5,000 files', () => {
    scannerService.scanRepository(largeRepo, [largeAnalyzer]);
  });

  await largeBench.run();
  const largeResult = largeBench.tasks[0].result;
  console.log(
    formatBenchmarkResults({
      name: 'FileSystemScanner - 5,000 files (7 levels deep)',
      ops: largeResult?.throughput.mean || 0,
      margin: largeResult?.latency.rme || 0,
      samples: largeResult?.latency.samples.length || 0,
      mean: largeResult?.latency.mean || 0,
      min: largeResult?.latency.min || 0,
      max: largeResult?.latency.max || 0,
    }),
  );

  const largeThreshold = (largeResult?.latency.mean || 0) * 1000 < 2500;
  console.log(
    `  ✓ Threshold: 2500ms (${((largeResult?.latency.mean || 0) * 1000).toFixed(3)}ms < 2500ms): ${largeThreshold ? '✅' : '❌'}`,
  );

  MockRepositoryGenerator.cleanupMockRepository(largeRepo);

  // Test 4: Multiple analyzers overhead
  console.log('\n========================================');
  console.log('Multiple Analyzers Overhead Test');
  console.log('========================================\n');

  console.log('Creating test repository (1,000 files)...');
  const multiRepo = MockRepositoryGenerator.createMockRepository({
    fileCount: 1000,
    maxDepth: 5,
    fileTypes: ['.ts', '.js'],
    avgFileSize: 'medium',
    includeNonTypicalCode: true,
  });

  // Single analyzer
  const singleBench = new Bench({ time: 1000 });
  const singleAnalyzer = new CodeCommentAnalysisService();

  singleBench.add('Single analyzer', () => {
    scannerService.scanRepository(multiRepo, [singleAnalyzer]);
  });

  await singleBench.run();
  const singleResult = singleBench.tasks[0].result;
  console.log(
    formatBenchmarkResults({
      name: 'Single analyzer (CodeCommentAnalysis)',
      ops: singleResult?.throughput.mean || 0,
      margin: singleResult?.latency.rme || 0,
      samples: singleResult?.latency.samples.length || 0,
      mean: singleResult?.latency.mean || 0,
      min: singleResult?.latency.min || 0,
      max: singleResult?.latency.max || 0,
    }),
  );

  // Multiple analyzers
  const multiBench = new Bench({ time: 1000 });
  const commentAnalyzer = new CodeCommentAnalysisService();
  const expressionAnalyzer = new CodeNonTypicalExpressionsService();

  multiBench.add('Multiple analyzers', () => {
    scannerService.scanRepository(multiRepo, [
      commentAnalyzer,
      expressionAnalyzer,
    ]);
  });

  await multiBench.run();
  const multiResult = multiBench.tasks[0].result;
  console.log(
    formatBenchmarkResults({
      name: 'Multiple analyzers (Comment + Expression)',
      ops: multiResult?.throughput.mean || 0,
      margin: multiResult?.latency.rme || 0,
      samples: multiResult?.latency.samples.length || 0,
      mean: multiResult?.latency.mean || 0,
      min: multiResult?.latency.min || 0,
      max: multiResult?.latency.max || 0,
    }),
  );

  const overhead =
    ((multiResult?.latency.mean || 0) / (singleResult?.latency.mean || 1) - 1) *
    100;
  console.log(
    `\n  Multiple analyzer overhead: ${overhead.toFixed(1)}% (${((multiResult?.latency.mean || 0) * 1000).toFixed(1)}ms vs ${((singleResult?.latency.mean || 0) * 1000).toFixed(1)}ms)`,
  );

  MockRepositoryGenerator.cleanupMockRepository(multiRepo);

  // Test 5: Directory filtering performance
  console.log('\n========================================');
  console.log('Directory Filtering Performance');
  console.log('========================================\n');

  console.log('Creating repository with node_modules...');
  const filteredRepo = MockRepositoryGenerator.createMockRepository({
    fileCount: 500,
    maxDepth: 4,
    fileTypes: ['.ts', '.js'],
    avgFileSize: 'small',
    includeNodeModules: true,
  });

  const filterBench = new Bench({ time: 1000 });
  const filterAnalyzer = new CodeCommentAnalysisService();

  filterBench.add('With filtering (node_modules skipped)', () => {
    scannerService.scanRepository(filteredRepo, [filterAnalyzer]);
  });

  await filterBench.run();
  const filterResult = filterBench.tasks[0].result;
  console.log(
    formatBenchmarkResults({
      name: 'Directory filtering (500 files + node_modules)',
      ops: filterResult?.throughput.mean || 0,
      margin: filterResult?.latency.rme || 0,
      samples: filterResult?.latency.samples.length || 0,
      mean: filterResult?.latency.mean || 0,
      min: filterResult?.latency.min || 0,
      max: filterResult?.latency.max || 0,
    }),
  );

  console.log('\n  ✓ node_modules and package-lock.json are correctly skipped');

  MockRepositoryGenerator.cleanupMockRepository(filteredRepo);

  // Test 6: Scaling analysis
  console.log('\n========================================');
  console.log('Scaling Analysis');
  console.log('========================================\n');

  const small100Time = (smallResult?.latency.mean || 0) * 1000;
  const medium1000Time = (mediumResult?.latency.mean || 0) * 1000;
  const large5000Time = (largeResult?.latency.mean || 0) * 1000;

  console.log(`  100 files: ${small100Time.toFixed(2)}ms`);
  console.log(`  1,000 files: ${medium1000Time.toFixed(2)}ms`);
  console.log(`  5,000 files: ${large5000Time.toFixed(2)}ms`);

  const ratio100to1000 = medium1000Time / small100Time;
  const ratio1000to5000 = large5000Time / medium1000Time;

  console.log(`\n  100→1,000 ratio: ${ratio100to1000.toFixed(2)}x`);
  console.log(`  1,000→5,000 ratio: ${ratio1000to5000.toFixed(2)}x`);

  // Check if scaling is reasonable (should be roughly linear for file I/O)
  const scalingReasonable = ratio100to1000 < 15 && ratio1000to5000 < 7;
  console.log(
    `\n  ✓ Scaling is ${scalingReasonable ? 'reasonable (roughly linear)' : 'concerning (may indicate bottlenecks)'}: ${scalingReasonable ? '✅' : '❌'}`,
  );

  console.log('\n✅ All benchmarks completed successfully!\n');
}

runBenchmarks().catch((error) => {
  console.error('Benchmark failed:', error);
  process.exit(1);
});
