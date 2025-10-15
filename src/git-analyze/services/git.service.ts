import { Injectable } from '@nestjs/common';
import { simpleGit, SimpleGit } from 'simple-git';

export type { SimpleGit };
import { TempService } from './temp.service';

export interface CommitInfo {
  hash: string;
  author: string;
  email: string;
  date: Date;
  message: string;
  filesChanged: number;
  insertions: number;
  deletions: number;
  files: string[];
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
      const log = await git.log();

      return Promise.all(
        log.all.map(async (commit) => {
          try {
            // Get detailed diff stats for this commit
            // Use --root flag for first commit that has no parent
            const diffSummary = await git.diffSummary([
              `${commit.hash}^`,
              commit.hash,
            ]).catch(async () => {
              // If the above fails (first commit), use --root
              return await git.diffSummary([commit.hash, '--root']);
            });

            return {
              hash: commit.hash || '',
              author: commit.author_name || '',
              email: commit.author_email || '',
              date: new Date(commit.date || ''),
              message: commit.message || '',
              filesChanged: diffSummary.files.length,
              insertions: diffSummary.insertions,
              deletions: diffSummary.deletions,
              files: diffSummary.files.map((f) => f.file),
            };
          } catch {
            // If diff fails, return commit with zero stats
            return {
              hash: commit.hash || '',
              author: commit.author_name || '',
              email: commit.author_email || '',
              date: new Date(commit.date || ''),
              message: commit.message || '',
              filesChanged: 0,
              insertions: 0,
              deletions: 0,
              files: [],
            };
          }
        }),
      );
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
