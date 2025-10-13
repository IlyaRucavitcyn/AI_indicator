import chalk from 'chalk';
import Table from 'cli-table3';
import { AnalyzeResponseDto } from '../../git-analyzer/dto/analyze-response.dto';

export class ConsoleFormatter {
  /**
   * Formats analysis results for console output
   * @param data Analysis results
   * @returns Formatted string for console display
   */
  format(data: AnalyzeResponseDto): string {
    const { repository, branch, metrics } = data;

    // Create main metrics table
    const mainTable = new Table({
      head: [chalk.bold.blue('Metric'), chalk.bold.blue('Value')],
      style: {
        head: ['cyan'],
        border: ['gray'],
      },
    });

    mainTable.push(
      ['Repository', chalk.green(repository)],
      ['Branch', chalk.yellow(branch)],
      ['Total Commits', chalk.bold(metrics.totalCommits.toString())],
      ['Contributors', chalk.bold(metrics.contributors.toString())],
      ['Development Duration', chalk.bold(`${metrics.durationDays} days`)],
      ['First Commit', chalk.gray(metrics.firstCommit)],
      ['Last Commit', chalk.gray(metrics.lastCommit)],
      ['Avg Commits/Day', chalk.bold(metrics.avgCommitsPerDay.toString())],
      ['Top Contributor', chalk.cyan(metrics.topContributor)],
    );

    // Create contributors table if there are multiple contributors
    let contributorsTable = '';
    if (metrics.contributorStats.length > 1) {
      const contributorsTableObj = new Table({
        head: [
          chalk.bold.blue('Rank'),
          chalk.bold.blue('Contributor'),
          chalk.bold.blue('Commits'),
          chalk.bold.blue('Percentage'),
        ],
        style: {
          head: ['cyan'],
          border: ['gray'],
        },
      });

      const totalCommits = metrics.totalCommits;
      metrics.contributorStats.forEach((contributor, index) => {
        const percentage = (
          (contributor.commitCount / totalCommits) *
          100
        ).toFixed(1);
        contributorsTableObj.push([
          (index + 1).toString(),
          contributor.email,
          contributor.commitCount.toString(),
          `${percentage}%`,
        ]);
      });

      contributorsTable = `\n${chalk.bold.blue('Contributors Breakdown:')}\n${contributorsTableObj.toString()}`;
    }

    // Header
    const header = chalk.bold.blue('📊 Git Repository Analysis Report');
    const separator = '━'.repeat(50);

    return `${header}\n${separator}\n${mainTable.toString()}${contributorsTable}\n${separator}\n${chalk.gray(`Analyzed at: ${data.analyzedAt}`)}`;
  }
}
