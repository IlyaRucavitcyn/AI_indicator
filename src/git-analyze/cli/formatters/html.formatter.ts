import { AnalyzeResponseDto } from '../../routes/dto/analyze-response.dto';

export class HtmlFormatter {
  /**
   * Formats analysis results as HTML
   * @param data Analysis results
   * @returns HTML string
   */
  format(data: AnalyzeResponseDto): string {
    const { repository, branch, metrics, analyzedAt } = data;

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Git Analysis Report - ${repository}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 10px;
            margin-bottom: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 2.5em;
        }
        .header p {
            margin: 10px 0 0 0;
            opacity: 0.9;
        }
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .metric-card {
            background: white;
            padding: 25px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            border-left: 4px solid #667eea;
        }
        .metric-card h3 {
            margin: 0 0 15px 0;
            color: #667eea;
            font-size: 1.1em;
        }
        .metric-value {
            font-size: 2em;
            font-weight: bold;
            color: #2c3e50;
            margin: 10px 0;
        }
        .metric-label {
            color: #7f8c8d;
            font-size: 0.9em;
        }
        .contributors-table {
            background: white;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            overflow: hidden;
            margin-bottom: 30px;
        }
        .contributors-table h3 {
            background: #667eea;
            color: white;
            margin: 0;
            padding: 20px;
            font-size: 1.2em;
        }
        table {
            width: 100%;
            border-collapse: collapse;
        }
        th, td {
            padding: 15px;
            text-align: left;
            border-bottom: 1px solid #eee;
        }
        th {
            background-color: #f8f9fa;
            font-weight: 600;
            color: #2c3e50;
        }
        .rank {
            font-weight: bold;
            color: #667eea;
        }
        .percentage {
            color: #27ae60;
            font-weight: bold;
        }
        .footer {
            text-align: center;
            color: #7f8c8d;
            font-size: 0.9em;
            margin-top: 30px;
        }
        .badge {
            display: inline-block;
            background: #667eea;
            color: white;
            padding: 5px 10px;
            border-radius: 15px;
            font-size: 0.8em;
            margin: 5px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>📊 Git Repository Analysis</h1>
        <p>${repository} • Branch: ${branch}</p>
    </div>

    <div class="metrics-grid">
        <div class="metric-card">
            <h3>📈 Total Commits</h3>
            <div class="metric-value">${metrics.totalCommits.toLocaleString()}</div>
            <div class="metric-label">All commits in the repository</div>
        </div>

        <div class="metric-card">
            <h3>👥 Contributors</h3>
            <div class="metric-value">${metrics.contributors}</div>
            <div class="metric-label">Unique contributors</div>
        </div>

        <div class="metric-card">
            <h3>📅 Development Duration</h3>
            <div class="metric-value">${metrics.durationDays}</div>
            <div class="metric-label">Days of development</div>
        </div>

        <div class="metric-card">
            <h3>⚡ Average Activity</h3>
            <div class="metric-value">${metrics.avgCommitsPerDay}</div>
            <div class="metric-label">Commits per day</div>
        </div>

        <div class="metric-card">
            <h3>🏆 Top Contributor</h3>
            <div class="metric-value" style="font-size: 1.2em;">${metrics.topContributor}</div>
            <div class="metric-label">Most active contributor</div>
        </div>

        <div class="metric-card">
            <h3>📊 Timeline</h3>
            <div class="metric-label">First Commit</div>
            <div style="margin-bottom: 10px;">${new Date(metrics.firstCommit).toLocaleDateString()}</div>
            <div class="metric-label">Last Commit</div>
            <div>${new Date(metrics.lastCommit).toLocaleDateString()}</div>
        </div>
    </div>

    ${this.generateContributorsTable(metrics)}

    <div class="footer">
        <p>Report generated on ${new Date(analyzedAt).toLocaleString()}</p>
        <div>
            <span class="badge">Git Analyzer</span>
            <span class="badge">${repository}</span>
        </div>
    </div>
</body>
</html>`;
  }

  private generateContributorsTable(metrics: {
    contributorStats: any[];
    totalCommits: number;
  }): string {
    if (metrics.contributorStats.length <= 1) {
      return '';
    }

    const contributorsRows = metrics.contributorStats
      .map(
        (
          contributor: { email: string; name: string; commitCount: number },
          index: number,
        ) => {
          const percentage = (
            (contributor.commitCount / metrics.totalCommits) *
            100
          ).toFixed(1);
          return `
          <tr>
            <td class="rank">#${index + 1}</td>
            <td>${contributor.email}</td>
            <td>${contributor.name}</td>
            <td>${contributor.commitCount.toLocaleString()}</td>
            <td class="percentage">${percentage}%</td>
          </tr>
        `;
        },
      )
      .join('');

    return `
    <div class="contributors-table">
        <h3>👥 Contributors Breakdown</h3>
        <table>
            <thead>
                <tr>
                    <th>Rank</th>
                    <th>Email</th>
                    <th>Name</th>
                    <th>Commits</th>
                    <th>Percentage</th>
                </tr>
            </thead>
            <tbody>
                ${contributorsRows}
            </tbody>
        </table>
    </div>`;
  }
}
