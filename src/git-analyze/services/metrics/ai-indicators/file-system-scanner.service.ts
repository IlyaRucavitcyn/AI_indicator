import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Interface for file analyzers that process files during scanning
 */
export interface FileAnalyzer {
  /**
   * Processes a single file
   * @param filePath Absolute path to the file
   * @param content File content as string
   * @param extension File extension (e.g., '.ts', '.js')
   */
  analyzeFile(filePath: string, content: string, extension: string): void;

  /**
   * Resets the analyzer state before a new scan
   */
  reset(): void;

  /**
   * Gets the file extensions this analyzer is interested in
   * @returns Array of file extensions (e.g., ['.ts', '.js', '.py'])
   */
  getSupportedExtensions(): string[];
}

@Injectable()
export class FileSystemScannerService {
  private readonly SKIP_DIRECTORIES = [
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

  /**
   * Scans repository and passes files to all registered analyzers
   * @param repoPath Path to the repository
   * @param analyzers Array of file analyzers to apply
   * @param onProgress Optional progress callback
   */
  scanRepository(
    repoPath: string,
    analyzers: FileAnalyzer[],
    onProgress?: (current: number, total: number) => void,
  ): void {
    // Reset all analyzers before scanning
    analyzers.forEach((analyzer) => analyzer.reset());

    // Get all supported extensions from analyzers
    const supportedExtensions = this.getAllSupportedExtensions(analyzers);

    // Collect all files matching any analyzer's extensions
    const files = this.getAllSourceFiles(repoPath, supportedExtensions);

    // Process each file
    files.forEach((file, index) => {
      if (onProgress) {
        onProgress(index + 1, files.length);
      }

      try {
        const content = fs.readFileSync(file, 'utf-8');
        const extension = path.extname(file);

        // Pass file to all analyzers that support this extension
        analyzers.forEach((analyzer) => {
          if (analyzer.getSupportedExtensions().includes(extension)) {
            analyzer.analyzeFile(file, content, extension);
          }
        });
      } catch {
        // Silently skip files that can't be read
        // This matches the existing behavior in CodeCommentAnalysisService
      }
    });
  }

  /**
   * Gets all unique extensions supported by the analyzers
   * @param analyzers Array of file analyzers
   * @returns Array of unique file extensions
   */
  private getAllSupportedExtensions(analyzers: FileAnalyzer[]): string[] {
    const extensions = new Set<string>();
    analyzers.forEach((analyzer) => {
      analyzer.getSupportedExtensions().forEach((ext) => extensions.add(ext));
    });
    return Array.from(extensions);
  }

  /**
   * Recursively collects all source files from directory tree
   * @param rootPath Root directory path
   * @param supportedExtensions Array of file extensions to include
   * @returns Array of file paths
   */
  private getAllSourceFiles(
    rootPath: string,
    supportedExtensions: string[],
  ): string[] {
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
            return supportedExtensions.includes(ext) ? [fullPath] : [];
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
   * Checks if a directory should be skipped during traversal
   * @param dirName Directory name
   * @returns True if directory should be skipped
   */
  private shouldSkipDirectory(dirName: string): boolean {
    return this.SKIP_DIRECTORIES.includes(dirName) || dirName.startsWith('.');
  }
}
