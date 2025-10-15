import { Injectable } from '@nestjs/common';
import { CommitInfo } from '../../git.service';

@Injectable()
export class GitMessagesService {
  /**
   * Analyzes commit messages for AI-typical patterns
   * @param commits Array of commit information
   * @returns Percentage of commits with AI-like message patterns
   */
  analyzeCommitMessagePatterns(commits: CommitInfo[]): number {
    if (commits.length === 0) {
      return 0;
    }

    // Common AI-generated commit message patterns
    const aiPatterns = [
      /^(add|update|fix|refactor|implement|create|remove|delete):/i, // Conventional commits format
      /^(added|updated|fixed|refactored|implemented|created|removed|deleted)\s/i, // Past tense with space
      /^feat:|^feature:/i, // Feature prefix
      /^chore:/i, // Chore prefix
      /initial commit$/i, // Generic "initial commit"
      /^merge\s+(branch|pull\s+request)/i, // Merge commits (often auto-generated)
      /^\w+\(\w+\):/i, // Conventional commits with scope: "feat(auth):"
    ];

    const suspiciousCommits = commits.filter((commit) => {
      const message = commit.message.trim();

      // Check if message matches any AI pattern
      const matchesPattern = aiPatterns.some((pattern) =>
        pattern.test(message),
      );

      // Check for overly generic messages
      const isGeneric =
        message.toLowerCase() === 'initial commit' ||
        message.toLowerCase() === 'update' ||
        message.toLowerCase() === 'fix' ||
        message.toLowerCase() === 'changes' ||
        message.toLowerCase() === 'updates';

      return matchesPattern || isGeneric;
    });

    return Math.round((suspiciousCommits.length / commits.length) * 10000) / 100;
  }
}
