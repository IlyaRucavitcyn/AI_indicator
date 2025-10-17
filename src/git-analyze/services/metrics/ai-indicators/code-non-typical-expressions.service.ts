import { Injectable } from '@nestjs/common';
import { FileAnalyzer } from './file-system-scanner.service';
import { LanguageUtils } from './language-utils';

/**
 * Service to detect non-typical expressions in code that modern developers typically avoid
 * These patterns are often indicators of AI-generated code or less experienced developers
 */
@Injectable()
export class CodeNonTypicalExpressionsService implements FileAnalyzer {
  // Detection patterns for non-typical expressions
  private readonly PATTERNS = {
    forLoop: /\bfor\s*\(/g,
    whileLoop: /\bwhile\s*\(/g,
    doWhileLoop: /\bdo\s*\{/g,
    switchStatement: /\bswitch\s*\(/g,
  };

  // State maintained during scanning
  private totalFiles = 0;
  private filesWithNonTypicalExpressions = 0;

  /**
   * Resets analyzer state before a new scan
   */
  reset(): void {
    this.totalFiles = 0;
    this.filesWithNonTypicalExpressions = 0;
  }

  /**
   * Gets supported file extensions
   */
  getSupportedExtensions(): string[] {
    return LanguageUtils.getSupportedExtensions();
  }

  /**
   * Analyzes a single file for non-typical expressions
   * @param filePath Path to the file
   * @param content File content
   * @param extension File extension
   */
  analyzeFile(filePath: string, content: string, extension: string): void {
    this.totalFiles++;

    // Remove comments and strings to avoid false positives
    const cleanedContent = this.removeCommentsAndStrings(content, extension);

    // Check if file contains any non-typical expressions
    const hasNonTypicalExpressions =
      this.detectNonTypicalExpressions(cleanedContent);

    if (hasNonTypicalExpressions) {
      this.filesWithNonTypicalExpressions++;
    }
  }

  /**
   * Gets the calculated non-typical expression ratio
   * @returns Percentage of files containing non-typical expressions
   */
  getResult(): number {
    if (this.totalFiles === 0) {
      return 0;
    }
    return (
      Math.round(
        (this.filesWithNonTypicalExpressions / this.totalFiles) * 10000,
      ) / 100
    );
  }

  /**
   * Detects non-typical expressions in code
   * @param content Cleaned file content
   * @returns True if non-typical expressions found
   */
  private detectNonTypicalExpressions(content: string): boolean {
    // Reset regex lastIndex for each test
    this.PATTERNS.forLoop.lastIndex = 0;
    this.PATTERNS.whileLoop.lastIndex = 0;
    this.PATTERNS.doWhileLoop.lastIndex = 0;
    this.PATTERNS.switchStatement.lastIndex = 0;

    // Check for traditional for loops
    if (this.PATTERNS.forLoop.test(content)) {
      return true;
    }

    // Check for while loops
    if (this.PATTERNS.whileLoop.test(content)) {
      return true;
    }

    // Check for do-while loops
    if (this.PATTERNS.doWhileLoop.test(content)) {
      return true;
    }

    // Check for switch statements
    if (this.PATTERNS.switchStatement.test(content)) {
      return true;
    }

    return false;
  }

  /**
   * Removes comments and string literals to avoid false positives
   * @param content File content
   * @param extension File extension
   * @returns Cleaned content
   */
  private removeCommentsAndStrings(content: string, extension: string): string {
    let cleaned = content;

    // Remove string literals (simple approach)
    cleaned = cleaned.replace(/"(?:[^"\\]|\\.)*"/g, '""'); // Double quotes
    cleaned = cleaned.replace(/'(?:[^'\\]|\\.)*'/g, "''"); // Single quotes
    cleaned = cleaned.replace(/`(?:[^`\\]|\\.)*`/g, '``'); // Template literals

    // Remove comments based on language
    const commentSyntax = LanguageUtils.getCommentSyntax(extension);

    // Remove single-line comments
    const singleLineRegex = new RegExp(
      `${LanguageUtils.escapeRegex(commentSyntax.single)}.*$`,
      'gm',
    );
    cleaned = cleaned.replace(singleLineRegex, '');

    // Remove block comments
    if (commentSyntax.blockStart && commentSyntax.blockEnd) {
      const blockRegex = new RegExp(
        `${LanguageUtils.escapeRegex(commentSyntax.blockStart)}[\\s\\S]*?${LanguageUtils.escapeRegex(commentSyntax.blockEnd)}`,
        'g',
      );
      cleaned = cleaned.replace(blockRegex, '');
    }

    return cleaned;
  }
}
