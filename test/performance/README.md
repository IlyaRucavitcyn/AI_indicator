# Performance Testing

This directory contains **standalone** performance tests for the Git Analyzer services using [tinybench](https://github.com/tinylibs/tinybench).

These are **NOT Jest tests** - they are standalone TypeScript scripts that run independently using tinybench for accurate performance benchmarking.

## Structure

```
test/performance/
├── utils/
│   └── performance-helpers.ts      # Mock data generator and utilities
├── unit/
│   ├── basic-metrics.perf.ts       # BasicMetricsService performance
│   └── all-services.perf.ts        # All services comparison + memory test
└── integration/
    └── analyzer.perf.ts            # Full AnalyzerService integration tests
```

## Running Performance Tests

### Run all performance tests
```bash
npm run perf
```

### Run individual performance tests
```bash
npm run perf:basic       # BasicMetricsService only
npm run perf:all         # All services comparison
npm run perf:analyzer    # AnalyzerService integration
```

## Performance Thresholds

The tests validate against these performance thresholds:

| Dataset Size | Commits | Max Time |
|--------------|---------|----------|
| Small        | 100     | 10ms     |
| Medium       | 1,000   | 50ms     |
| Large        | 10,000  | 500ms    |
| X-Large      | 100,000 | 5000ms   |

## Mock Data Generator

The `MockDataGenerator` utility creates realistic commit data for testing:

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
