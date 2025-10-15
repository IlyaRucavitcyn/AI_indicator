import { Injectable } from '@nestjs/common';
import { CommitInfo } from '../../git.service';

@Injectable()
export class GitTimingService {
  private readonly BURST_WINDOW_MS = 30 * 60 * 1000; // 30 minutes

  /**
   * Analyzes commit time distribution for bursty patterns
   * @param commits Array of commit information
   * @returns Percentage of commits that occur within burst window of previous commit
   */
  analyzeBurstyCommits(commits: CommitInfo[]): number {
    if (commits.length <= 1) {
      return 0;
    }

    // Sort commits by date
    const sortedCommits = [...commits].sort(
      (a, b) => a.date.getTime() - b.date.getTime(),
    );

    // Count commits that occur within burst window of previous commit
    const burstyCommits = sortedCommits.slice(1).filter((commit, index) => {
      const timeDiff =
        commit.date.getTime() - sortedCommits[index].date.getTime();
      return timeDiff < this.BURST_WINDOW_MS;
    }).length;

    return Math.round((burstyCommits / (commits.length - 1)) * 10000) / 100;
  }
}
