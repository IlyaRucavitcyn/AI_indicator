import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

@Injectable()
export class TempService {
  private tempDirs: string[] = [];

  /**
   * Creates a temporary directory for cloning repositories
   * @returns Path to the created temporary directory
   */
  createTempDir(): string {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-analyzer-'));
    this.tempDirs.push(tempDir);
    return tempDir;
  }

  /**
   * Safely removes a temporary directory and all its contents
   * @param dirPath Path to the directory to remove
   */
  removeTempDir(dirPath: string): void {
    try {
      if (fs.existsSync(dirPath)) {
        fs.rmSync(dirPath, { recursive: true, force: true });
        // Remove from tracking array
        const index = this.tempDirs.indexOf(dirPath);
        if (index > -1) {
          this.tempDirs.splice(index, 1);
        }
      }
    } catch (error) {
      console.warn(
        `Failed to remove temporary directory ${dirPath}:`,
        (error as Error).message,
      );
    }
  }

  /**
   * Cleans up all tracked temporary directories
   */
  cleanupAll(): void {
    this.tempDirs.forEach((dir) => {
      this.removeTempDir(dir);
    });
    this.tempDirs = [];
  }

  /**
   * Gets the repository name from a Git URL
   * @param repositoryUrl Git repository URL
   * @returns Repository name (e.g., "user/repo" from "https://github.com/user/repo.git")
   */
  extractRepoName(repositoryUrl: string): string {
    try {
      const url = new URL(repositoryUrl);
      const pathname = url.pathname.replace(/\.git$/, '').replace(/^\//, '');
      return pathname;
    } catch {
      // Fallback for non-standard URLs
      const match = repositoryUrl.match(/([^/]+)\/([^/]+?)(?:\.git)?$/);
      if (match) {
        return `${match[1]}/${match[2]}`;
      }
      return 'unknown/repository';
    }
  }

  /**
   * Gets the full path for a repository clone
   * @param repositoryUrl Git repository URL
   * @returns Full path where the repository should be cloned
   */
  getRepoPath(repositoryUrl: string): string {
    const tempDir = this.createTempDir();
    const repoName = this.extractRepoName(repositoryUrl);
    return path.join(tempDir, repoName.replace('/', '-'));
  }
}
