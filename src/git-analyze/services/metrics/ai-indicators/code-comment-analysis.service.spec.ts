import { Test, TestingModule } from '@nestjs/testing';
import { CodeCommentAnalysisService } from './code-comment-analysis.service';
import * as fs from 'fs';

jest.mock('fs');

describe('CodeCommentAnalysisService', () => {
  let service: CodeCommentAnalysisService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CodeCommentAnalysisService],
    }).compile();

    service = module.get<CodeCommentAnalysisService>(
      CodeCommentAnalysisService,
    );
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('analyzeCommentRatio', () => {
    it('should return 0 for empty directory', () => {
      jest.spyOn(fs, 'readdirSync').mockReturnValue([]);

      const result = service.analyzeCommentRatio('/fake/path');

      expect(result).toBe(0);
    });

    it('should calculate comment ratio for JavaScript files', () => {
      const mockDirEntries = [
        { name: 'file1.js', isDirectory: () => false, isFile: () => true },
      ] as fs.Dirent[];

      const mockFileContent = `// This is a comment
function hello() {
  // Another comment
  console.log('hello');
}`;

      jest.spyOn(fs, 'readdirSync').mockReturnValue(mockDirEntries);
      jest.spyOn(fs, 'readFileSync').mockReturnValue(mockFileContent);

      const result = service.analyzeCommentRatio('/fake/path');

      // 2 comment lines, 3 code lines = 66.67%
      expect(result).toBe(66.67);
    });

    it('should calculate comment ratio for TypeScript files with block comments', () => {
      const mockDirEntries = [
        { name: 'file1.ts', isDirectory: () => false, isFile: () => true },
      ] as fs.Dirent[];

      const mockFileContent = `/*
 * Multi-line comment
 * Another line
 */
function test() {
  return true;
}`;

      jest.spyOn(fs, 'readdirSync').mockReturnValue(mockDirEntries);
      jest.spyOn(fs, 'readFileSync').mockReturnValue(mockFileContent);

      const result = service.analyzeCommentRatio('/fake/path');

      // 4 comment lines, 3 code lines = 133.33%
      expect(result).toBe(133.33);
    });

    it('should calculate comment ratio for Python files', () => {
      const mockDirEntries = [
        { name: 'script.py', isDirectory: () => false, isFile: () => true },
      ] as fs.Dirent[];

      const mockFileContent = `# This is a comment
def hello():
    # Another comment
    print("hello")
    return True`;

      jest.spyOn(fs, 'readdirSync').mockReturnValue(mockDirEntries);
      jest.spyOn(fs, 'readFileSync').mockReturnValue(mockFileContent);

      const result = service.analyzeCommentRatio('/fake/path');

      // 2 comment lines, 3 code lines = 66.67%
      expect(result).toBe(66.67);
    });

    it('should skip node_modules and .git directories', () => {
      const mockDirEntries = [
        { name: 'node_modules', isDirectory: () => true, isFile: () => false },
        { name: '.git', isDirectory: () => true, isFile: () => false },
        { name: 'file1.js', isDirectory: () => false, isFile: () => true },
      ] as fs.Dirent[];

      const mockFileContent = `// Comment
const x = 1;`;

      jest
        .spyOn(fs, 'readdirSync')
        .mockReturnValueOnce(mockDirEntries)
        .mockReturnValue([]);
      jest.spyOn(fs, 'readFileSync').mockReturnValue(mockFileContent);

      const result = service.analyzeCommentRatio('/fake/path');

      // Should only process file1.js: 1 comment, 1 code = 100%
      expect(result).toBe(100);
    });

    it('should handle multiple files across directories', () => {
      const mockRootEntries = [
        { name: 'src', isDirectory: () => true, isFile: () => false },
        { name: 'index.js', isDirectory: () => false, isFile: () => true },
      ] as fs.Dirent[];

      const mockSrcEntries = [
        { name: 'utils.ts', isDirectory: () => false, isFile: () => true },
      ] as fs.Dirent[];

      const indexContent = `// Main file
export function main() {}`;

      const utilsContent = `// Utility function
// Another comment
export function util() {
  return 1;
}`;

      jest
        .spyOn(fs, 'readdirSync')
        .mockReturnValueOnce(mockRootEntries)
        .mockReturnValueOnce(mockSrcEntries);

      jest
        .spyOn(fs, 'readFileSync')
        .mockReturnValueOnce(indexContent)
        .mockReturnValueOnce(utilsContent);

      const result = service.analyzeCommentRatio('/fake/path');

      // index.js: 1 comment, 1 code = 100%
      // utils.ts: 2 comments, 2 code = 100%
      // Total: 3 comment lines, 4 code lines = 75%
      expect(result).toBe(75);
    });

    it('should ignore empty lines', () => {
      const mockDirEntries = [
        { name: 'file1.js', isDirectory: () => false, isFile: () => true },
      ] as fs.Dirent[];

      const mockFileContent = `// Comment

const x = 1;

const y = 2;`;

      jest.spyOn(fs, 'readdirSync').mockReturnValue(mockDirEntries);
      jest.spyOn(fs, 'readFileSync').mockReturnValue(mockFileContent);

      const result = service.analyzeCommentRatio('/fake/path');

      // 1 comment line, 2 code lines = 50%
      expect(result).toBe(50);
    });

    it('should handle inline block comments on same line', () => {
      const mockDirEntries = [
        { name: 'file1.js', isDirectory: () => false, isFile: () => true },
      ] as fs.Dirent[];

      const mockFileContent = `/* inline comment */
const x = 1;`;

      jest.spyOn(fs, 'readdirSync').mockReturnValue(mockDirEntries);
      jest.spyOn(fs, 'readFileSync').mockReturnValue(mockFileContent);

      const result = service.analyzeCommentRatio('/fake/path');

      // 1 comment line, 1 code line = 100%
      expect(result).toBe(100);
    });

    it('should handle files with only comments', () => {
      const mockDirEntries = [
        { name: 'file1.js', isDirectory: () => false, isFile: () => true },
      ] as fs.Dirent[];

      const mockFileContent = `// Only comments
// No code here
// Just comments`;

      jest.spyOn(fs, 'readdirSync').mockReturnValue(mockDirEntries);
      jest.spyOn(fs, 'readFileSync').mockReturnValue(mockFileContent);

      const result = service.analyzeCommentRatio('/fake/path');

      // 3 comments, 0 code = 0% (handled by special case)
      expect(result).toBe(0);
    });

    it('should handle files with no comments', () => {
      const mockDirEntries = [
        { name: 'file1.js', isDirectory: () => false, isFile: () => true },
      ] as fs.Dirent[];

      const mockFileContent = `const x = 1;
const y = 2;
console.log(x + y);`;

      jest.spyOn(fs, 'readdirSync').mockReturnValue(mockDirEntries);
      jest.spyOn(fs, 'readFileSync').mockReturnValue(mockFileContent);

      const result = service.analyzeCommentRatio('/fake/path');

      // 0 comments, 3 code lines = 0%
      expect(result).toBe(0);
    });

    it('should handle read errors gracefully', () => {
      const mockDirEntries = [
        { name: 'file1.js', isDirectory: () => false, isFile: () => true },
      ] as fs.Dirent[];

      jest.spyOn(fs, 'readdirSync').mockReturnValue(mockDirEntries);
      jest.spyOn(fs, 'readFileSync').mockImplementation(() => {
        throw new Error('Read error');
      });

      const result = service.analyzeCommentRatio('/fake/path');

      // Should handle error and return 0
      expect(result).toBe(0);
    });
  });
});
