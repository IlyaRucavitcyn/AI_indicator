import { Injectable } from '@nestjs/common';
import { CommitInfo } from '../git.service';
import { ContributorStats } from '../../routes/dto/analyze-response.dto';

export interface BasicMetrics {
  totalCommits: number;
  contributors: number;
  firstCommit: string;
  lastCommit: string;
  durationDays: number;
  avgCommitsPerDay: number;
  topContributor: string;
  contributorStats: ContributorStats[];
}

@Injectable()
export class BasicMetricsService {
  /**
   * Calculates basic repository metrics from commit history
   * @param commits Array of commit information
   * @returns Basic metrics object
   */
  calculateBasicMetrics(commits: CommitInfo[]): BasicMetrics {
    if (commits.length === 0) {
      return {
        totalCommits: 0,
        contributors: 0,
        firstCommit: '',
        lastCommit: '',
        durationDays: 0,
        avgCommitsPerDay: 0,
        topContributor: '',
        contributorStats: [],
      };
    }

    // Sort commits by date
    const sortedCommits = [...commits].sort(
      (a, b) => a.date.getTime() - b.date.getTime(),
    );

    // Basic metrics
    const totalCommits = commits.length;
    const firstCommit = sortedCommits[0].date.toISOString();
    const lastCommit =
      sortedCommits[sortedCommits.length - 1].date.toISOString();

    // Calculate duration
    const durationMs =
      new Date(lastCommit).getTime() - new Date(firstCommit).getTime();
    const durationDays = Math.ceil(durationMs / (1000 * 60 * 60 * 24));

    // Calculate average commits per day
    const avgCommitsPerDay = durationDays > 0 ? totalCommits / durationDays : 0;

    // Contributor analysis using reduce with immutable operations
    const contributorStats = commits
      .reduce(
        (stats, commit) => {
          const existingIndex = stats.findIndex(
            (s) => s.email === commit.email,
          );
          if (existingIndex !== -1) {
            return [
              ...stats.slice(0, existingIndex),
              {
                ...stats[existingIndex],
                commitCount: stats[existingIndex].commitCount + 1,
              },
              ...stats.slice(existingIndex + 1),
            ];
          }
          return [
            ...stats,
            {
              name: commit.author,
              email: commit.email,
              commitCount: 1,
            },
          ];
        },
        [] as Array<{ name: string; email: string; commitCount: number }>,
      )
      .sort((a, b) => b.commitCount - a.commitCount);

    const contributors = contributorStats.length;
    const topContributor = contributors > 0 ? contributorStats[0].email : '';

    return {
      totalCommits,
      contributors,
      firstCommit,
      lastCommit,
      durationDays,
      avgCommitsPerDay: Math.round(avgCommitsPerDay * 100) / 100,
      topContributor,
      contributorStats,
    };
  }
}
