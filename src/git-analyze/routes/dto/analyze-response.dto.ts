export interface MetricResult<T = any> {
  value: number;
  details?: T;
  description: string;
}

export interface ContributorStats {
  email: string;
  name: string;
  commitCount: number;
}

export interface AIIndicatorMetric<T = number> {
  value: T;
  description: string;
}

export interface AIIndicators {
  avgLinesPerCommit: AIIndicatorMetric<number>;
  largeCommitPercentage: AIIndicatorMetric<number>;
  firstCommitAnalysis: AIIndicatorMetric<{
    lines: number;
    isSuspicious: boolean;
  }>;
  avgFilesPerCommit: AIIndicatorMetric<number>;
  commitMessagePatterns: AIIndicatorMetric<number>;
  burstyCommitPercentage: AIIndicatorMetric<number>;
  testFileRatio: AIIndicatorMetric<number>;
}

export interface GitMetrics {
  totalCommits: number;
  contributors: number;
  firstCommit: string;
  lastCommit: string;
  durationDays: number;
  avgCommitsPerDay: number;
  topContributor: string;
  contributorStats: ContributorStats[];
  aiIndicators?: AIIndicators;
}

export interface AnalyzeResponseDto {
  repository: string;
  branch: string;
  metrics: GitMetrics;
  analyzedAt: string;
}
