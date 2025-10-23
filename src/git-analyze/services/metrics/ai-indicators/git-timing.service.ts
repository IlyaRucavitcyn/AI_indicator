import { Injectable } from '@nestjs/common';
import { CommitInfo } from '../../git.service';
import { METRIC_THRESHOLDS } from '../metric-thresholds.constants';

@Injectable()
export class GitTimingService {
  private readonly BURST_WINDOW_MS =
    METRIC_THRESHOLDS.BURST_WINDOW_MINUTES * 60 * 1000;

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

    // Convert to percentage and round to 2 decimal places
    const percentage = (burstyCommits / (commits.length - 1)) * 100;
    return Math.round(percentage * 100) / 100;
  }
}
