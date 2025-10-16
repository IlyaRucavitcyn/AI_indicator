/**
 * Configuration constants for AI indicator metrics
 * These values are used in calculations and descriptions
 */

export const METRIC_THRESHOLDS = {
  // Git Size Metrics
  LARGE_COMMIT_LINES: 500, // Lines threshold for large commits
  LARGE_COMMIT_STD_DEV_MULTIPLIER: 2, // Standard deviations above mean for large commits
  AVG_LINES_HIGH_THRESHOLD: 100, // Lines per commit suggesting AI assistance

  // First Commit Analysis
  FIRST_COMMIT_SINGLE_THRESHOLD: 500, // Lines threshold for single commit repos
  FIRST_COMMIT_ABSOLUTE_THRESHOLD: 1000, // Absolute lines threshold for suspicious first commit
  FIRST_COMMIT_MULTIPLIER: 3, // Multiple of average for suspicious first commit

  // Git Timing Metrics
  BURST_WINDOW_MINUTES: 30, // Minutes window for bursty commits

  // Test File Ratio
  LOW_TEST_COVERAGE_THRESHOLD: 20, // Percentage threshold for low test coverage
} as const;

/**
 * Metric descriptions with threshold interpolation
 */
export const METRIC_DESCRIPTIONS = {
  avgLinesPerCommit: () =>
    `Average lines changed per commit. High values (>${METRIC_THRESHOLDS.AVG_LINES_HIGH_THRESHOLD}) may indicate AI-assisted bulk changes.`,

  largeCommitPercentage: () =>
    `Percentage of commits with >${METRIC_THRESHOLDS.LARGE_COMMIT_LINES} lines changed. High values may suggest AI-generated code dumps.`,

  firstCommitAnalysis: () =>
    `Size and suspicion level of the first commit. Large first commits (>${METRIC_THRESHOLDS.FIRST_COMMIT_MULTIPLIER}x average or >${METRIC_THRESHOLDS.FIRST_COMMIT_ABSOLUTE_THRESHOLD} lines) may indicate AI-generated project scaffolding.`,

  avgFilesPerCommit: () =>
    `Average number of files changed per commit. Very high values may indicate automated refactoring or AI assistance.`,

  commitMessagePatterns: () =>
    `Percentage of commits with AI-like message patterns (e.g., "Add:", "Update:", "Fix:"). High values suggest automated or templated commits.`,

  burstyCommitPercentage: () =>
    `Percentage of commits made within ${METRIC_THRESHOLDS.BURST_WINDOW_MINUTES} minutes of the previous commit. High values may indicate rapid AI-assisted development.`,

  testFileRatio: () =>
    `Percentage of commits that modify test files. Low values (<${METRIC_THRESHOLDS.LOW_TEST_COVERAGE_THRESHOLD}%) might suggest AI-generated code without proper test coverage.`,
} as const;
