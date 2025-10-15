import { Injectable } from '@nestjs/common';
import { CommitInfo } from '../../git.service';

@Injectable()
export class CodeQualityService {
  /**
   * Analyzes ratio of commits that include test files
   * @param commits Array of commit information
   * @returns Percentage of commits that modify test files
   */
  analyzeTestFileRatio(commits: CommitInfo[]): number {
    if (commits.length === 0) {
      return 0;
    }

    // Common test file patterns
    const testFilePatterns = [
      /\.test\./i,
      /\.spec\./i,
      /__tests__\//i,
      /\/tests?\//i,
      /\.test$/i,
      /\.spec$/i,
    ];

    const commitsWithTests = commits.filter((commit) =>
      commit.files.some((file) =>
        testFilePatterns.some((pattern) => pattern.test(file)),
      ),
    );

    return Math.round((commitsWithTests.length / commits.length) * 10000) / 100;
  }
}
