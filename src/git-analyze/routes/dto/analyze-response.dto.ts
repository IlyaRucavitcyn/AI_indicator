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

export interface AIIndicators {
  avgLinesPerCommit: number;
  largeCommitPercentage: number;
  firstCommitAnalysis: {
    lines: number;
    isSuspicious: boolean;
  };
  avgFilesPerCommit: number;
  commitMessagePatterns: number;
  burstyCommitPercentage: number;
  testFileRatio: number;
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
