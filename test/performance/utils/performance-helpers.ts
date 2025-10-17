import { CommitInfo } from '../../../src/git-analyze/services/git.service';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

/**
 * Generates mock commit data for performance testing
 */
export class MockDataGenerator {
  /**
   * Generates an array of mock commits
   * @param count Number of commits to generate
   * @param options Configuration options for commit generation
   * @returns Array of mock CommitInfo objects
   */
  static generateCommits(
    count: number,
    options: {
      avgFilesPerCommit?: number;
      avgLinesPerCommit?: number;
      variability?: number; // 0-1, how much to vary sizes
      testFileRatio?: number; // 0-1, ratio of commits with test files
      conventionalCommitRatio?: number; // 0-1, ratio of conventional commits
      burstRatio?: number; // 0-1, ratio of bursty commits
    } = {},
  ): CommitInfo[] {
    const {
      avgFilesPerCommit = 3,
      avgLinesPerCommit = 50,
      variability = 0.5,
      testFileRatio = 0.3,
      conventionalCommitRatio = 0.5,
      burstRatio = 0.2,
    } = options;

    const commits: CommitInfo[] = [];
    const startDate = new Date('2024-01-01T00:00:00Z');
    const contributors = this.generateContributors(
      Math.min(10, Math.ceil(count / 10)),
    );

    for (let i = 0; i < count; i++) {
      const contributor = contributors[i % contributors.length];

      // Generate file count with variability
      const filesChanged = Math.max(
        1,
        Math.round(
          avgFilesPerCommit +
            (Math.random() - 0.5) * 2 * variability * avgFilesPerCommit,
        ),
      );

      // Generate line changes with variability
      const totalLines = Math.max(
        1,
        Math.round(
          avgLinesPerCommit +
            (Math.random() - 0.5) * 2 * variability * avgLinesPerCommit,
        ),
      );
      const insertions = Math.round(totalLines * (0.5 + Math.random() * 0.5));
      const deletions = totalLines - insertions;

      // Generate files (with test files based on ratio)
      const files = this.generateFiles(
        filesChanged,
        Math.random() < testFileRatio,
      );

      // Generate commit message
      const message = this.generateCommitMessage(
        Math.random() < conventionalCommitRatio,
      );

      // Generate date (with bursts based on ratio)
      const isBursty = i > 0 && Math.random() < burstRatio;
      const timeDelta = isBursty
        ? Math.random() * 20 * 60 * 1000 // 0-20 minutes for bursty
        : Math.random() * 24 * 60 * 60 * 1000; // 0-24 hours for normal

      const date = new Date(startDate.getTime() + i * 3600000 + timeDelta);

      commits.push({
        hash: this.generateHash(i),
        author: contributor.name,
        email: contributor.email,
        date,
        message,
        filesChanged,
        insertions,
        deletions,
        files,
      });
    }

    return commits;
  }

  private static generateContributors(
    count: number,
  ): Array<{ name: string; email: string }> {
    const contributors: Array<{ name: string; email: string }> = [];
    for (let i = 0; i < count; i++) {
      contributors.push({
        name: `Developer ${i + 1}`,
        email: `dev${i + 1}@example.com`,
      });
    }
    return contributors;
  }

  private static generateFiles(count: number, includeTests: boolean): string[] {
    const files: string[] = [];
    const extensions = ['.ts', '.js', '.tsx', '.jsx'];

    for (let i = 0; i < count; i++) {
      const ext = extensions[Math.floor(Math.random() * extensions.length)];
      if (includeTests && i === count - 1) {
        files.push(`src/module${i}/file${i}.spec${ext}`);
      } else {
        files.push(`src/module${i}/file${i}${ext}`);
      }
    }

    return files;
  }

  private static generateCommitMessage(isConventional: boolean): string {
    if (isConventional) {
      const types = ['feat', 'fix', 'refactor', 'chore', 'test', 'docs'];
      const type = types[Math.floor(Math.random() * types.length)];
      return `${type}: implement feature ${Math.floor(Math.random() * 1000)}`;
    } else {
      const messages = [
        'working on the new feature',
        'fixing bugs in the authentication system',
        'improving performance of the data layer',
        'updating documentation',
      ];
      return messages[Math.floor(Math.random() * messages.length)];
    }
  }

  private static generateHash(index: number): string {
    return `hash${index.toString().padStart(8, '0')}`;
  }
}

/**
 * Performance thresholds for different operation scales
 */
export const PERFORMANCE_THRESHOLDS = {
  SMALL_DATASET: {
    size: 100,
    maxTimeMs: 10,
  },
  MEDIUM_DATASET: {
    size: 1000,
    maxTimeMs: 50,
  },
  LARGE_DATASET: {
    size: 10000,
    maxTimeMs: 500,
  },
  XLARGE_DATASET: {
    size: 100000,
    maxTimeMs: 5000,
  },
};

/**
 * Formats benchmark results for console output
 */
export function formatBenchmarkResults(results: {
  name: string;
  ops: number;
  margin: number;
  samples: number;
  mean: number;
  min: number;
  max: number;
}): string {
  return [
    `\n${results.name}`,
    `  Operations/sec: ${results.ops.toFixed(2)} ±${results.margin.toFixed(2)}%`,
    `  Mean time: ${(results.mean * 1000).toFixed(3)}ms`,
    `  Min: ${(results.min * 1000).toFixed(3)}ms | Max: ${(results.max * 1000).toFixed(3)}ms`,
    `  Samples: ${results.samples}`,
  ].join('\n');
}

/**
 * Generates mock repository structures for file system testing
 */
export class MockRepositoryGenerator {
  private static readonly CODE_SAMPLES = {
    typescript: {
      simple: `// Simple TypeScript file
export function calculate(a: number, b: number): number {
  return a + b;
}

/**
 * Multiplies two numbers
 */
export function multiply(a: number, b: number): number {
  return a * b;
}
`,
      withLoops: `// TypeScript with non-typical expressions
export function processArray(items: number[]): number {
  let sum = 0;
  for (let i = 0; i < items.length; i++) {
    sum += items[i];
  }

  let index = 0;
  while (index < items.length) {
    console.log(items[index]);
    index++;
  }

  return sum;
}

export function checkValue(val: number): string {
  switch (val) {
    case 1:
      return 'one';
    case 2:
      return 'two';
    default:
      return 'other';
  }
}
`,
      complex: `// Complex TypeScript file with multiple functions
import { Service } from './service';

/**
 * Main application class
 * Handles business logic
 */
export class Application {
  private readonly service: Service;
  private isRunning = false;

  constructor(service: Service) {
    this.service = service;
  }

  /**
   * Starts the application
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error('Already running');
    }

    this.isRunning = true;
    await this.service.initialize();
  }

  /**
   * Stops the application
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    await this.service.cleanup();
    this.isRunning = false;
  }

  // Process data with validation
  processData(data: unknown): boolean {
    if (!data) {
      return false;
    }

    return this.service.process(data);
  }
}
`,
    },
    javascript: {
      simple: `// Simple JavaScript file
export function greet(name) {
  return \`Hello, \${name}!\`;
}

// Another helper function
export function farewell(name) {
  return \`Goodbye, \${name}!\`;
}
`,
      withLoops: `// JavaScript with non-typical expressions
function processItems(items) {
  let result = [];
  for (let i = 0; i < items.length; i++) {
    result.push(items[i] * 2);
  }

  let counter = 0;
  while (counter < result.length) {
    console.log(result[counter]);
    counter++;
  }

  return result;
}

module.exports = { processItems };
`,
      complex: `// Complex JavaScript file
const config = require('./config');

class DataProcessor {
  constructor(options) {
    this.options = options;
    this.cache = new Map();
  }

  // Process incoming data
  async process(data) {
    if (this.cache.has(data.id)) {
      return this.cache.get(data.id);
    }

    const result = await this.transform(data);
    this.cache.set(data.id, result);
    return result;
  }

  transform(data) {
    return {
      ...data,
      processed: true,
      timestamp: Date.now(),
    };
  }
}

module.exports = DataProcessor;
`,
    },
    python: {
      simple: `# Simple Python file
def add(a, b):
    """Add two numbers together."""
    return a + b

def subtract(a, b):
    """Subtract b from a."""
    return a - b
`,
      withLoops: `# Python with non-typical expressions
def process_list(items):
    """Process items with traditional loops."""
    result = []
    for i in range(len(items)):
        result.append(items[i] * 2)

    index = 0
    while index < len(result):
        print(result[index])
        index += 1

    return result

def check_status(value):
    """Check value with switch-like logic."""
    # Python doesn't have switch, but this demonstrates similar pattern
    if value == 1:
        return "one"
    elif value == 2:
        return "two"
    else:
        return "other"
`,
      complex: `# Complex Python file
from typing import List, Optional
import asyncio

class DataAnalyzer:
    """Analyzes data and provides statistics."""

    def __init__(self, threshold: float = 0.5):
        self.threshold = threshold
        self.results = []

    def analyze(self, data: List[float]) -> dict:
        """
        Analyzes a list of values.

        Args:
            data: List of numeric values

        Returns:
            Dictionary with analysis results
        """
        return {
            'mean': sum(data) / len(data) if data else 0,
            'count': len(data),
            'above_threshold': len([x for x in data if x > self.threshold])
        }

    async def async_process(self, items: List[str]) -> List[str]:
        """Process items asynchronously."""
        tasks = [self._process_item(item) for item in items]
        return await asyncio.gather(*tasks)

    async def _process_item(self, item: str) -> str:
        await asyncio.sleep(0.1)
        return item.upper()
`,
    },
  };

  /**
   * Creates a temporary mock repository with specified structure
   * @param options Configuration for repository generation
   * @returns Path to the temporary directory
   */
  static createMockRepository(options: {
    fileCount: number;
    maxDepth?: number;
    fileTypes?: Array<'.ts' | '.js' | '.py'>;
    avgFileSize?: 'small' | 'medium' | 'large';
    includeNodeModules?: boolean;
    includeNonTypicalCode?: boolean;
  }): string {
    const {
      fileCount,
      maxDepth = 3,
      fileTypes = ['.ts', '.js', '.py'],
      avgFileSize = 'medium',
      includeNodeModules = false,
      includeNonTypicalCode = false,
    } = options;

    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'perf-repo-'));

    // Calculate directory structure
    const filesPerDir = Math.max(3, Math.ceil(Math.sqrt(fileCount)));
    const dirCount = Math.ceil(fileCount / filesPerDir);

    let filesCreated = 0;

    // Create nested directory structure
    for (let depth = 0; depth < Math.min(maxDepth, 10); depth++) {
      const dirsAtThisLevel = Math.ceil(dirCount / (depth + 1));

      for (let dirIdx = 0; dirIdx < dirsAtThisLevel && filesCreated < fileCount; dirIdx++) {
        const dirPath = this.createNestedPath(tempDir, depth, dirIdx);
        fs.mkdirSync(dirPath, { recursive: true });

        // Create files in this directory
        const filesToCreate = Math.min(filesPerDir, fileCount - filesCreated);

        for (let fileIdx = 0; fileIdx < filesToCreate; fileIdx++) {
          const fileType = fileTypes[Math.floor(Math.random() * fileTypes.length)];
          const fileName = `file${filesCreated}${fileType}`;
          const filePath = path.join(dirPath, fileName);

          const content = this.generateFileContent(
            fileType,
            avgFileSize,
            includeNonTypicalCode,
          );

          fs.writeFileSync(filePath, content);
          filesCreated++;
        }

        if (filesCreated >= fileCount) break;
      }
    }

    // Optionally create node_modules with lock files
    if (includeNodeModules) {
      const nodeModulesPath = path.join(tempDir, 'node_modules');
      fs.mkdirSync(nodeModulesPath, { recursive: true });

      // Create package-lock.json (should be skipped)
      fs.writeFileSync(
        path.join(tempDir, 'package-lock.json'),
        JSON.stringify({ name: 'test', version: '1.0.0' }, null, 2),
      );

      // Create some dummy modules
      const dummyModulePath = path.join(nodeModulesPath, 'dummy-module');
      fs.mkdirSync(dummyModulePath, { recursive: true });
      fs.writeFileSync(
        path.join(dummyModulePath, 'index.js'),
        '// This should be skipped\nmodule.exports = {};',
      );
    }

    return tempDir;
  }

  /**
   * Creates a nested directory path
   */
  private static createNestedPath(
    baseDir: string,
    depth: number,
    index: number,
  ): string {
    let currentPath = baseDir;
    for (let i = 0; i <= depth; i++) {
      currentPath = path.join(currentPath, `level${i}_dir${index % 5}`);
    }
    return currentPath;
  }

  /**
   * Generates file content based on type and size
   */
  private static generateFileContent(
    fileType: string,
    size: 'small' | 'medium' | 'large',
    includeNonTypical: boolean,
  ): string {
    const lang = this.getLanguageFromExtension(fileType);
    const samples = this.CODE_SAMPLES[lang];

    let content = '';

    switch (size) {
      case 'small':
        content = includeNonTypical && samples.withLoops
          ? samples.withLoops
          : samples.simple;
        break;
      case 'medium':
        content = includeNonTypical && samples.withLoops
          ? samples.simple + '\n\n' + samples.withLoops
          : samples.simple + '\n\n' + samples.complex;
        break;
      case 'large':
        // Repeat content to make it larger
        const baseContent = includeNonTypical && samples.withLoops
          ? samples.withLoops
          : samples.complex;
        content = baseContent + '\n\n' + baseContent + '\n\n' + samples.simple;
        break;
    }

    return content;
  }

  /**
   * Maps file extension to language key
   */
  private static getLanguageFromExtension(
    ext: string,
  ): 'typescript' | 'javascript' | 'python' {
    if (ext === '.ts' || ext === '.tsx') return 'typescript';
    if (ext === '.js' || ext === '.jsx') return 'javascript';
    if (ext === '.py') return 'python';
    return 'typescript'; // default
  }

  /**
   * Cleans up a mock repository
   * @param repoPath Path to the repository to clean up
   */
  static cleanupMockRepository(repoPath: string): void {
    try {
      fs.rmSync(repoPath, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  }
}
