import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export interface CommentAnalysisResult {
  totalLines: number;
  codeLines: number;
  commentLines: number;
}

@Injectable()
export class CodeCommentAnalysisService {
  private readonly SUPPORTED_EXTENSIONS = [
    '.ts',
    '.js',
    '.tsx',
    '.jsx',
    '.py',
    '.java',
    '.go',
    '.rs',
    '.c',
    '.cpp',
    '.cs',
    '.php',
    '.rb',
    '.swift',
    '.kt',
  ];

  /**
   * Analyzes comment ratio in repository files
   * @param repoPath Path to the cloned repository
   * @param onProgress Optional callback for progress updates
   * @returns Comment ratio as percentage
   */
  analyzeCommentRatio(
    repoPath: string,
    onProgress?: (current: number, total: number) => void,
  ): number {
    const files = this.getAllSourceFiles(repoPath);
    const results = files.map((file, index) => {
      if (onProgress) {
        onProgress(index + 1, files.length);
      }
      return this.analyzeFile(file);
    });

    const totals = results.reduce(
      (acc, result) => ({
        totalLines: acc.totalLines + result.totalLines,
        codeLines: acc.codeLines + result.codeLines,
        commentLines: acc.commentLines + result.commentLines,
      }),
      { totalLines: 0, codeLines: 0, commentLines: 0 },
    );

    if (totals.codeLines === 0) {
      return 0;
    }

    return Math.round((totals.commentLines / totals.codeLines) * 10000) / 100;
  }

  /**
   * Gets all source files from directory tree
   * @param rootPath Root directory path
   * @returns Array of file paths
   */
  private getAllSourceFiles(rootPath: string): string[] {
    const collectFiles = (dirPath: string): string[] => {
      try {
        const entries = fs.readdirSync(dirPath, { withFileTypes: true });

        return entries.flatMap((entry): string[] => {
          const fullPath = path.join(dirPath, entry.name);

          if (entry.isDirectory()) {
            return this.shouldSkipDirectory(entry.name)
              ? []
              : collectFiles(fullPath);
          }

          if (entry.isFile()) {
            const ext = path.extname(entry.name);
            return this.SUPPORTED_EXTENSIONS.includes(ext) ? [fullPath] : [];
          }

          return [];
        });
      } catch {
        return [];
      }
    };

    return collectFiles(rootPath);
  }

  /**
   * Checks if a directory should be skipped
   * @param dirName Directory name
   * @returns True if directory should be skipped
   */
  private shouldSkipDirectory(dirName: string): boolean {
    const skipDirs = [
      'node_modules',
      '.git',
      'dist',
      'build',
      'coverage',
      '.next',
      '.nuxt',
      'vendor',
      '__pycache__',
      '.venv',
      'venv',
      'target',
    ];
    return skipDirs.includes(dirName) || dirName.startsWith('.');
  }

  /**
   * Analyzes a single file for comments
   * @param filePath Path to the file
   * @returns Comment analysis result for the file
   */
  private analyzeFile(filePath: string): CommentAnalysisResult {
    try {
      const ext = path.extname(filePath);
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');

      return this.countComments(lines, ext);
    } catch {
      return { totalLines: 0, codeLines: 0, commentLines: 0 };
    }
  }

  /**
   * Counts comments in file lines based on language
   * @param lines Array of file lines
   * @param ext File extension
   * @returns Line counts
   */
  private countComments(lines: string[], ext: string): CommentAnalysisResult {
    const commentSyntax = this.getCommentSyntax(ext);
    const totalLines = lines.length;

    const { codeLines, commentLines } = lines.reduce(
      (acc, line) => {
        const trimmed = line.trim();

        // Skip empty lines
        if (trimmed.length === 0) {
          return acc;
        }

        // Check for block comment state
        if (commentSyntax.blockStart && commentSyntax.blockEnd) {
          if (!acc.inBlock && trimmed.includes(commentSyntax.blockStart)) {
            acc.inBlock = true;
            acc.commentLines++;
            // Check if block comment ends on same line
            if (trimmed.includes(commentSyntax.blockEnd)) {
              acc.inBlock = false;
            }
            return acc;
          }

          if (acc.inBlock) {
            acc.commentLines++;
            if (trimmed.includes(commentSyntax.blockEnd)) {
              acc.inBlock = false;
            }
            return acc;
          }
        }

        // Check for single-line comments
        if (trimmed.startsWith(commentSyntax.single)) {
          acc.commentLines++;
        } else {
          acc.codeLines++;
        }

        return acc;
      },
      { codeLines: 0, commentLines: 0, inBlock: false },
    );

    return { totalLines, codeLines, commentLines };
  }

  /**
   * Gets comment syntax for a file extension
   * @param ext File extension
   * @returns Comment syntax configuration
   */
  private getCommentSyntax(ext: string): {
    single: string;
    blockStart?: string;
    blockEnd?: string;
  } {
    // C-style comments (JS, TS, Java, Go, C, C++, C#, Rust, Swift, Kotlin, PHP)
    const cStyleExts = [
      '.ts',
      '.js',
      '.tsx',
      '.jsx',
      '.java',
      '.go',
      '.c',
      '.cpp',
      '.cs',
      '.rs',
      '.swift',
      '.kt',
      '.php',
    ];
    if (cStyleExts.includes(ext)) {
      return { single: '//', blockStart: '/*', blockEnd: '*/' };
    }

    // Python
    if (ext === '.py') {
      return { single: '#', blockStart: '"""', blockEnd: '"""' };
    }

    // Ruby
    if (ext === '.rb') {
      return { single: '#', blockStart: '=begin', blockEnd: '=end' };
    }

    // Default to # for single-line comments
    return { single: '#' };
  }
}
