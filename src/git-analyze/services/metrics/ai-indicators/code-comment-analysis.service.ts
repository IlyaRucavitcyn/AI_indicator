import { Injectable } from '@nestjs/common';
import { FileAnalyzer } from './file-system-scanner.service';
import { LanguageUtils } from './language-utils';

export interface CommentAnalysisResult {
  totalLines: number;
  codeLines: number;
  commentLines: number;
}

@Injectable()
export class CodeCommentAnalysisService implements FileAnalyzer {
  // State maintained during scanning
  private totalLines = 0;
  private codeLines = 0;
  private commentLines = 0;

  /**
   * Resets analyzer state before a new scan
   */
  reset(): void {
    this.totalLines = 0;
    this.codeLines = 0;
    this.commentLines = 0;
  }

  /**
   * Gets supported file extensions
   */
  getSupportedExtensions(): string[] {
    return LanguageUtils.getSupportedExtensions();
  }

  /**
   * Analyzes a single file for comments (called by FileSystemScannerService)
   * @param filePath Path to the file
   * @param content File content
   * @param extension File extension
   */
  analyzeFile(filePath: string, content: string, extension: string): void {
    const lines = content.split('\n');
    const result = this.countComments(lines, extension);

    this.totalLines += result.totalLines;
    this.codeLines += result.codeLines;
    this.commentLines += result.commentLines;
  }

  /**
   * Gets the calculated comment ratio
   * @returns Comment ratio as percentage
   */
  getResult(): number {
    if (this.codeLines === 0) {
      return 0;
    }
    return Math.round((this.commentLines / this.codeLines) * 10000) / 100;
  }

  /**
   * Counts comments in file lines based on language
   * @param lines Array of file lines
   * @param ext File extension
   * @returns Line counts
   */
  private countComments(lines: string[], ext: string): CommentAnalysisResult {
    const commentSyntax = LanguageUtils.getCommentSyntax(ext);
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
}
