import { Injectable } from '@nestjs/common';
import { simpleGit, SimpleGit, LogResult } from 'simple-git';

export type { SimpleGit };
import { TempService } from './temp.service';

export interface CommitInfo {
  hash: string;
  author: string;
  email: string;
  date: Date;
  message: string;
  filesChanged: number;
}

@Injectable()
export class GitService {
  constructor(private readonly tempService: TempService) {}

  /**
   * Clones a repository and returns the git instance
   * @param repositoryUrl Git repository URL
   * @param branch Branch to checkout (default: main)
   * @returns SimpleGit instance and repository path
   */
  async cloneRepository(
    repositoryUrl: string,
    branch: string = 'main',
  ): Promise<{ git: SimpleGit; repoPath: string }> {
    const repoPath = this.tempService.getRepoPath(repositoryUrl);

    try {
      const git = simpleGit();
      await git.clone(repositoryUrl, repoPath);

      // Checkout the specified branch
      const gitInstance = simpleGit(repoPath);
      await gitInstance.checkout(branch);

      return { git: gitInstance, repoPath };
    } catch (error) {
      // Clean up on failure
      this.tempService.removeTempDir(
        this.tempService.extractRepoName(repositoryUrl),
      );
      throw new Error(
        `Failed to clone repository: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Gets commit history from a git repository
   * @param git SimpleGit instance
   * @returns Array of commit information
   */
  async getCommitHistory(git: SimpleGit): Promise<CommitInfo[]> {
    try {
      const log: LogResult = await git.log();

      return log.all.map((commit) => {
        // Use the standard fields from simple-git
        return {
          hash: commit.hash || '',
          author: commit.author_name || '',
          email: commit.author_email || '',
          date: new Date(commit.date || ''),
          message: commit.message || '',
          filesChanged: 0, // We'll calculate this separately if needed
        };
      });
    } catch (error) {
      throw new Error(
        `Failed to read commit history: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Gets repository information including branch and remote
   * @param git SimpleGit instance
   * @returns Repository metadata
   */
  async getRepositoryInfo(
    git: SimpleGit,
  ): Promise<{ branch: string; remote: string }> {
    try {
      const [branch, remote] = await Promise.all([
        git.revparse(['--abbrev-ref', 'HEAD']).catch(() => 'unknown'),
        git.remote(['get-url', 'origin']).catch(() => 'unknown'),
      ]);

      return {
        branch: (branch || 'unknown').trim(),
        remote: (remote || 'unknown').trim(),
      };
    } catch (error) {
      throw new Error(
        `Failed to get repository info: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Checks if a repository is valid
   * @param git SimpleGit instance
   * @returns True if repository is valid
   */
  async isValidRepository(git: SimpleGit): Promise<boolean> {
    try {
      await git.status();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Cleans up repository directory
   * @param repoPath Path to the repository directory
   */
  cleanupRepository(repoPath: string): void {
    this.tempService.removeTempDir(repoPath);
  }
}
