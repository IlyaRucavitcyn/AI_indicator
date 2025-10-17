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
 * Performance tests for code analyzer services
 * Tests CodeCommentAnalysisService and CodeNonTypicalExpressionsService
 */

async function runBenchmarks() {
  const scannerService = new FileSystemScannerService();

  console.log('\n========================================');
  console.log('Code Analyzers Performance Tests');
  console.log('========================================\n');

  // Test 1: CodeCommentAnalysisService on varying file counts
  console.log('--- CodeCommentAnalysisService ---\n');

  // Small dataset (100 files)
  console.log('Creating small repository (100 files)...');
  const smallRepo = MockRepositoryGenerator.createMockRepository({
    fileCount: 100,
    maxDepth: 3,
    fileTypes: ['.ts', '.js', '.py'],
    avgFileSize: 'medium',
  });

  const commentSmallBench = new Bench({ time: 1000 });
  const commentSmallAnalyzer = new CodeCommentAnalysisService();

  commentSmallBench.add('CodeCommentAnalysis - 100 files', () => {
    scannerService.scanRepository(smallRepo, [commentSmallAnalyzer]);
  });

  await commentSmallBench.run();
  const commentSmallResult = commentSmallBench.tasks[0].result;
  console.log(
    formatBenchmarkResults({
      name: 'CodeCommentAnalysis - 100 files',
      ops: commentSmallResult?.throughput.mean || 0,
      margin: commentSmallResult?.latency.rme || 0,
      samples: commentSmallResult?.latency.samples.length || 0,
      mean: commentSmallResult?.latency.mean || 0,
      min: commentSmallResult?.latency.min || 0,
      max: commentSmallResult?.latency.max || 0,
    }),
  );

  const commentRatio = commentSmallAnalyzer.getResult();
  console.log(`  Comment ratio detected: ${commentRatio}%`);

  MockRepositoryGenerator.cleanupMockRepository(smallRepo);

  // Medium dataset (1,000 files)
  console.log('\nCreating medium repository (1,000 files)...');
  const mediumRepo = MockRepositoryGenerator.createMockRepository({
    fileCount: 1000,
    maxDepth: 5,
    fileTypes: ['.ts', '.js', '.py'],
    avgFileSize: 'medium',
  });

  const commentMediumBench = new Bench({ time: 1000 });
  const commentMediumAnalyzer = new CodeCommentAnalysisService();

  commentMediumBench.add('CodeCommentAnalysis - 1,000 files', () => {
    scannerService.scanRepository(mediumRepo, [commentMediumAnalyzer]);
  });

  await commentMediumBench.run();
  const commentMediumResult = commentMediumBench.tasks[0].result;
  console.log(
    formatBenchmarkResults({
      name: 'CodeCommentAnalysis - 1,000 files',
      ops: commentMediumResult?.throughput.mean || 0,
      margin: commentMediumResult?.latency.rme || 0,
      samples: commentMediumResult?.latency.samples.length || 0,
      mean: commentMediumResult?.latency.mean || 0,
      min: commentMediumResult?.latency.min || 0,
      max: commentMediumResult?.latency.max || 0,
    }),
  );

  MockRepositoryGenerator.cleanupMockRepository(mediumRepo);

  // Large dataset (5,000 files)
  console.log('\nCreating large repository (5,000 files)...');
  const largeRepo = MockRepositoryGenerator.createMockRepository({
    fileCount: 5000,
    maxDepth: 7,
    fileTypes: ['.ts', '.js', '.py'],
    avgFileSize: 'medium',
  });

  const commentLargeBench = new Bench({ time: 1000 });
  const commentLargeAnalyzer = new CodeCommentAnalysisService();

  commentLargeBench.add('CodeCommentAnalysis - 5,000 files', () => {
    scannerService.scanRepository(largeRepo, [commentLargeAnalyzer]);
  });

  await commentLargeBench.run();
  const commentLargeResult = commentLargeBench.tasks[0].result;
  console.log(
    formatBenchmarkResults({
      name: 'CodeCommentAnalysis - 5,000 files',
      ops: commentLargeResult?.throughput.mean || 0,
      margin: commentLargeResult?.latency.rme || 0,
      samples: commentLargeResult?.latency.samples.length || 0,
      mean: commentLargeResult?.latency.mean || 0,
      min: commentLargeResult?.latency.min || 0,
      max: commentLargeResult?.latency.max || 0,
    }),
  );

  MockRepositoryGenerator.cleanupMockRepository(largeRepo);

  // Test 2: CodeNonTypicalExpressionsService on varying file counts
  console.log('\n--- CodeNonTypicalExpressionsService ---\n');

  // Small dataset (100 files) with non-typical code
  console.log('Creating small repository with non-typical code (100 files)...');
  const ntSmallRepo = MockRepositoryGenerator.createMockRepository({
    fileCount: 100,
    maxDepth: 3,
    fileTypes: ['.ts', '.js'],
    avgFileSize: 'medium',
    includeNonTypicalCode: true,
  });

  const ntSmallBench = new Bench({ time: 1000 });
  const ntSmallAnalyzer = new CodeNonTypicalExpressionsService();

  ntSmallBench.add('NonTypicalExpressions - 100 files', () => {
    scannerService.scanRepository(ntSmallRepo, [ntSmallAnalyzer]);
  });

  await ntSmallBench.run();
  const ntSmallResult = ntSmallBench.tasks[0].result;
  console.log(
    formatBenchmarkResults({
      name: 'NonTypicalExpressions - 100 files',
      ops: ntSmallResult?.throughput.mean || 0,
      margin: ntSmallResult?.latency.rme || 0,
      samples: ntSmallResult?.latency.samples.length || 0,
      mean: ntSmallResult?.latency.mean || 0,
      min: ntSmallResult?.latency.min || 0,
      max: ntSmallResult?.latency.max || 0,
    }),
  );

  const ntRatio = ntSmallAnalyzer.getResult();
  console.log(`  Non-typical expression ratio: ${ntRatio}%`);

  MockRepositoryGenerator.cleanupMockRepository(ntSmallRepo);

  // Medium dataset (1,000 files)
  console.log(
    '\nCreating medium repository with non-typical code (1,000 files)...',
  );
  const ntMediumRepo = MockRepositoryGenerator.createMockRepository({
    fileCount: 1000,
    maxDepth: 5,
    fileTypes: ['.ts', '.js'],
    avgFileSize: 'medium',
    includeNonTypicalCode: true,
  });

  const ntMediumBench = new Bench({ time: 1000 });
  const ntMediumAnalyzer = new CodeNonTypicalExpressionsService();

  ntMediumBench.add('NonTypicalExpressions - 1,000 files', () => {
    scannerService.scanRepository(ntMediumRepo, [ntMediumAnalyzer]);
  });

  await ntMediumBench.run();
  const ntMediumResult = ntMediumBench.tasks[0].result;
  console.log(
    formatBenchmarkResults({
      name: 'NonTypicalExpressions - 1,000 files',
      ops: ntMediumResult?.throughput.mean || 0,
      margin: ntMediumResult?.latency.rme || 0,
      samples: ntMediumResult?.latency.samples.length || 0,
      mean: ntMediumResult?.latency.mean || 0,
      min: ntMediumResult?.latency.min || 0,
      max: ntMediumResult?.latency.max || 0,
    }),
  );

  MockRepositoryGenerator.cleanupMockRepository(ntMediumRepo);

  // Large dataset (5,000 files)
  console.log(
    '\nCreating large repository with non-typical code (5,000 files)...',
  );
  const ntLargeRepo = MockRepositoryGenerator.createMockRepository({
    fileCount: 5000,
    maxDepth: 7,
    fileTypes: ['.ts', '.js'],
    avgFileSize: 'medium',
    includeNonTypicalCode: true,
  });

  const ntLargeBench = new Bench({ time: 1000 });
  const ntLargeAnalyzer = new CodeNonTypicalExpressionsService();

  ntLargeBench.add('NonTypicalExpressions - 5,000 files', () => {
    scannerService.scanRepository(ntLargeRepo, [ntLargeAnalyzer]);
  });

  await ntLargeBench.run();
  const ntLargeResult = ntLargeBench.tasks[0].result;
  console.log(
    formatBenchmarkResults({
      name: 'NonTypicalExpressions - 5,000 files',
      ops: ntLargeResult?.throughput.mean || 0,
      margin: ntLargeResult?.latency.rme || 0,
      samples: ntLargeResult?.latency.samples.length || 0,
      mean: ntLargeResult?.latency.mean || 0,
      min: ntLargeResult?.latency.min || 0,
      max: ntLargeResult?.latency.max || 0,
    }),
  );

  MockRepositoryGenerator.cleanupMockRepository(ntLargeRepo);

  // Test 3: Performance comparison
  console.log('\n========================================');
  console.log('Analyzer Performance Comparison');
  console.log('========================================\n');

  const commentSmallTime = (commentSmallResult?.latency.mean || 0) * 1000;
  const commentMediumTime = (commentMediumResult?.latency.mean || 0) * 1000;
  const commentLargeTime = (commentLargeResult?.latency.mean || 0) * 1000;

  const ntSmallTime = (ntSmallResult?.latency.mean || 0) * 1000;
  const ntMediumTime = (ntMediumResult?.latency.mean || 0) * 1000;
  const ntLargeTime = (ntLargeResult?.latency.mean || 0) * 1000;

  console.log('CodeCommentAnalysis:');
  console.log(`  100 files: ${commentSmallTime.toFixed(2)}ms`);
  console.log(`  1,000 files: ${commentMediumTime.toFixed(2)}ms`);
  console.log(`  5,000 files: ${commentLargeTime.toFixed(2)}ms`);

  console.log('\nNonTypicalExpressions:');
  console.log(`  100 files: ${ntSmallTime.toFixed(2)}ms`);
  console.log(`  1,000 files: ${ntMediumTime.toFixed(2)}ms`);
  console.log(`  5,000 files: ${ntLargeTime.toFixed(2)}ms`);

  console.log('\nRelative Performance (NonTypical vs Comment):');
  console.log(`  100 files: ${(ntSmallTime / commentSmallTime).toFixed(2)}x`);
  console.log(
    `  1,000 files: ${(ntMediumTime / commentMediumTime).toFixed(2)}x`,
  );
  console.log(`  5,000 files: ${(ntLargeTime / commentLargeTime).toFixed(2)}x`);

  // Test 4: Different file sizes impact
  console.log('\n========================================');
  console.log('File Size Impact Analysis');
  console.log('========================================\n');

  // Small files
  console.log('Creating repository with small files (1,000 files)...');
  const smallFilesRepo = MockRepositoryGenerator.createMockRepository({
    fileCount: 1000,
    maxDepth: 5,
    fileTypes: ['.ts'],
    avgFileSize: 'small',
  });

  const smallFilesBench = new Bench({ time: 1000 });
  const smallFilesAnalyzer = new CodeCommentAnalysisService();

  smallFilesBench.add('Small files', () => {
    scannerService.scanRepository(smallFilesRepo, [smallFilesAnalyzer]);
  });

  await smallFilesBench.run();
  const smallFilesResult = smallFilesBench.tasks[0].result;
  console.log(
    formatBenchmarkResults({
      name: 'Small files (1,000 files)',
      ops: smallFilesResult?.throughput.mean || 0,
      margin: smallFilesResult?.latency.rme || 0,
      samples: smallFilesResult?.latency.samples.length || 0,
      mean: smallFilesResult?.latency.mean || 0,
      min: smallFilesResult?.latency.min || 0,
      max: smallFilesResult?.latency.max || 0,
    }),
  );

  MockRepositoryGenerator.cleanupMockRepository(smallFilesRepo);

  // Large files
  console.log('\nCreating repository with large files (1,000 files)...');
  const largeFilesRepo = MockRepositoryGenerator.createMockRepository({
    fileCount: 1000,
    maxDepth: 5,
    fileTypes: ['.ts'],
    avgFileSize: 'large',
  });

  const largeFilesBench = new Bench({ time: 1000 });
  const largeFilesAnalyzer = new CodeCommentAnalysisService();

  largeFilesBench.add('Large files', () => {
    scannerService.scanRepository(largeFilesRepo, [largeFilesAnalyzer]);
  });

  await largeFilesBench.run();
  const largeFilesResult = largeFilesBench.tasks[0].result;
  console.log(
    formatBenchmarkResults({
      name: 'Large files (1,000 files)',
      ops: largeFilesResult?.throughput.mean || 0,
      margin: largeFilesResult?.latency.rme || 0,
      samples: largeFilesResult?.latency.samples.length || 0,
      mean: largeFilesResult?.latency.mean || 0,
      min: largeFilesResult?.latency.min || 0,
      max: largeFilesResult?.latency.max || 0,
    }),
  );

  MockRepositoryGenerator.cleanupMockRepository(largeFilesRepo);

  const fileSizeImpact =
    ((largeFilesResult?.latency.mean || 0) /
      (smallFilesResult?.latency.mean || 1)) *
    100;
  console.log(
    `\n  File size impact: Large files take ${fileSizeImpact.toFixed(0)}% of small files time`,
  );
  console.log(
    `  Difference: ${(((largeFilesResult?.latency.mean || 0) - (smallFilesResult?.latency.mean || 0)) * 1000).toFixed(1)}ms`,
  );

  // Test 5: Performance thresholds validation
  console.log('\n========================================');
  console.log('Performance Threshold Validation');
  console.log('========================================\n');

  const thresholds = {
    small: { limit: 50, actual: commentSmallTime },
    medium: { limit: 500, actual: commentMediumTime },
    large: { limit: 2500, actual: commentLargeTime },
  };

  Object.entries(thresholds).forEach(([size, { limit, actual }]) => {
    const pass = actual < limit;
    console.log(
      `  ${size}: ${actual.toFixed(2)}ms < ${limit}ms: ${pass ? '✅' : '❌'}`,
    );
  });

  console.log('\n✅ All benchmarks completed successfully!\n');
}

runBenchmarks().catch((error) => {
  console.error('Benchmark failed:', error);
  process.exit(1);
});
