export interface ContributorStats {
  email: string;
  name: string;
  commitCount: number;
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
}

export interface AnalyzeResponseDto {
  repository: string;
  branch: string;
  metrics: GitMetrics;
  analyzedAt: string;
}
