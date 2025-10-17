# Performance Testing

This directory contains **standalone** performance tests for the Git Analyzer services using [tinybench](https://github.com/tinylibs/tinybench).

These are **NOT Jest tests** - they are standalone TypeScript scripts that run independently using tinybench for accurate performance benchmarking.

## Structure

```
test/performance/
├── utils/
│   └── performance-helpers.ts              # Mock data & repository generators
├── unit/
│   ├── basic-metrics.perf.ts               # BasicMetricsService performance
│   ├── all-services.perf.ts                # All services comparison + memory test
│   ├── file-system-scanner.perf.ts         # FileSystemScannerService performance
│   └── code-analyzers.perf.ts              # Code analyzers performance
└── integration/
    └── analyzer.perf.ts                    # Full AnalyzerService integration tests
```

## Running Performance Tests

### Run all performance tests
```bash
npm run perf
```

### Run individual performance tests
```bash
npm run perf:basic          # BasicMetricsService only
npm run perf:all            # All services comparison
npm run perf:scanner        # FileSystemScannerService performance
npm run perf:code-analyzers # Code analyzers (Comment & Expression analysis)
npm run perf:analyzer       # AnalyzerService integration
```

## Performance Thresholds

The tests validate against these performance thresholds:

| Dataset Size | Commits | Max Time |
|--------------|---------|----------|
| Small        | 100     | 10ms     |
| Medium       | 1,000   | 50ms     |
| Large        | 10,000  | 500ms    |
| X-Large      | 100,000 | 5000ms   |

## Test Utilities

### MockDataGenerator

The `MockDataGenerator` utility creates realistic commit data for testing commit-based metrics:

```typescript
const commits = MockDataGenerator.generateCommits(1000, {
  avgFilesPerCommit: 3,
  avgLinesPerCommit: 50,
  variability: 0.5,           // 0-1, size variation
  testFileRatio: 0.3,         // 0-1, commits with tests
  conventionalCommitRatio: 0.5, // 0-1, conventional commits
  burstRatio: 0.2,            // 0-1, bursty commits
});
```

### MockRepositoryGenerator

The `MockRepositoryGenerator` utility creates realistic temporary repositories for testing file-based analysis:

```typescript
const repoPath = MockRepositoryGenerator.createMockRepository({
  fileCount: 1000,              // Number of files to generate
  maxDepth: 5,                  // Directory nesting depth
  fileTypes: ['.ts', '.js', '.py'], // File types to create
  avgFileSize: 'medium',        // 'small' | 'medium' | 'large'
  includeNodeModules: false,    // Include node_modules for filter testing
  includeNonTypicalCode: false, // Include for/while/switch patterns
});

// Use the repository
scannerService.scanRepository(repoPath, [analyzer]);

// Clean up when done
MockRepositoryGenerator.cleanupMockRepository(repoPath);
```

**Features:**
- Creates nested directory structures
- Generates realistic TypeScript, JavaScript, and Python files
- Supports configurable file sizes and code patterns
- Can simulate node_modules and lock files for testing filtering
- Automatic cleanup utility

## Benchmark Output

Performance tests output detailed statistics:

```
BasicMetrics - 1,000 commits
  Operations/sec: 245.67 ±1.23%
  Mean time: 4.070ms
  Min: 3.850ms | Max: 4.520ms
  Samples: 247
```

## Adding New Performance Tests

1. Create a new `.perf.ts` file (NOT `.spec.ts`) in the appropriate directory
2. Import `Bench` from `tinybench`
3. Import performance helpers from `../utils/performance-helpers`
4. Create an `async function runBenchmarks()` with your tests
5. Call `runBenchmarks().catch(...)` at the end

Example:

```typescript
import { Bench } from 'tinybench';
import { MyService } from '../../../src/path/to/service';
import {
  MockDataGenerator,
  PERFORMANCE_THRESHOLDS,
  formatBenchmarkResults,
} from '../utils/performance-helpers';

async function runBenchmarks() {
  const service = new MyService();

  console.log('\n========================================');
  console.log('MyService Performance Tests');
  console.log('========================================\n');

  const commits = MockDataGenerator.generateCommits(10000);
  const bench = new Bench({ time: 1000 });

  bench.add('MyService - 10,000 items', () => {
    service.process(commits);
  });

  await bench.run();

  const result = bench.tasks[0].result;
  console.log(
    formatBenchmarkResults({
      name: 'MyService - 10,000 items',
      ops: result?.hz || 0,
      margin: result?.rme || 0,
      samples: result?.samples.length || 0,
      mean: result?.mean || 0,
      min: result?.min || 0,
      max: result?.max || 0,
    }),
  );

  console.log('\n✅ Benchmarks completed!\n');
}

runBenchmarks().catch((error) => {
  console.error('Benchmark failed:', error);
  process.exit(1);
});
```

Then add to `package.json`:
```json
"perf:myservice": "ts-node -r tsconfig-paths/register test/performance/unit/myservice.perf.ts"
```

## CI/CD Integration

Performance tests can be integrated into CI/CD pipelines:

```yaml
- name: Run performance tests
  run: npm run perf
```

Consider:
- Running on dedicated hardware for consistent results
- Comparing results against baseline metrics
- Failing builds if performance degrades significantly
- Storing performance metrics over time for trend analysis
- Using `npm run perf:basic` for quick checks during development

## Memory Testing

Large dataset tests also verify memory efficiency:

```typescript
const startMemory = process.memoryUsage();
// ... perform operations
const endMemory = process.memoryUsage();
const memoryDelta = (endMemory.heapUsed - startMemory.heapUsed) / 1024 / 1024;
console.log(`Memory used: ${memoryDelta.toFixed(2)}MB`);
```

## Troubleshooting

### Tests timing out
- Increase timeout in test: `it('test', async () => { ... }, 30000)`
- Reduce dataset size for faster iteration
- Check for infinite loops or blocking operations

### Inconsistent results
- Close other applications consuming resources
- Run tests multiple times to establish baseline
- Use `runInBand` flag to prevent parallel execution interference

### High memory usage
- Check for memory leaks in tested code
- Verify data is properly garbage collected
- Use smaller datasets for development, larger for CI

## Test Coverage

### Commit-Based Metrics
- **BasicMetricsService** - Core repository statistics (commits, contributors, timing)
- **GitSizeService** - File and line change metrics
- **GitMessagesService** - Commit message pattern analysis
- **GitTimingService** - Burst pattern detection
- **CodeQualityService** - Test file ratio analysis

### File-Based Analysis
- **FileSystemScannerService** - Repository scanning with directory filtering
  - Tests file system traversal performance
  - Validates node_modules and lock file exclusion
  - Measures multiple analyzer overhead
  - Scaling analysis (100 to 5,000 files)

- **CodeCommentAnalysisService** - Comment ratio detection
  - Tests across varying file counts and sizes
  - Validates comment detection accuracy

- **CodeNonTypicalExpressionsService** - Non-typical code pattern detection
  - Tests for/while/switch statement detection
  - Validates pattern matching across languages
  - Compares performance with comment analysis

### Integration Tests
- **AnalyzerService** - End-to-end analysis with all services
  - Tests full metric calculation pipeline
  - Uses realistic mock repositories
  - Worst-case scenario analysis

## Performance Insights

### Key Findings from Testing

1. **File I/O is the Bottleneck**
   - File scanning dominates execution time
   - Both comment and expression analysis have similar performance
   - Bottleneck is disk I/O, not regex processing

2. **Efficient Multi-Analyzer Architecture**
   - Running two analyzers adds only ~25% overhead
   - FileSystemScannerService reads files once, passes to all analyzers
   - Much better than scanning twice

3. **Linear Scaling**
   - All file operations scale linearly with file count
   - 100→1,000 files: ~10x time
   - 1,000→5,000 files: ~5.75x time
   - No algorithmic bottlenecks detected

4. **Directory Filtering Works**
   - node_modules, .git, and lock files correctly skipped
   - Prevents processing thousands of dependency files
