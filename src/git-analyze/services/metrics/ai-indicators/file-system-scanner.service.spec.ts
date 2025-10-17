import { Test, TestingModule } from '@nestjs/testing';
import {
  FileSystemScannerService,
  FileAnalyzer,
} from './file-system-scanner.service';
import * as fs from 'fs';
import * as path from 'path';

// Mock fs module
jest.mock('fs');

describe('FileSystemScannerService', () => {
  let service: FileSystemScannerService;

  // Mock analyzer for testing
  class MockAnalyzer implements FileAnalyzer {
    private files: Array<{ path: string; content: string; ext: string }> = [];
    private resetCalled = false;

    reset(): void {
      this.resetCalled = true;
      this.files = [];
    }

    getSupportedExtensions(): string[] {
      return ['.ts', '.js', '.py'];
    }

    analyzeFile(filePath: string, content: string, extension: string): void {
      this.files.push({ path: filePath, content, ext: extension });
    }

    getFiles() {
      return this.files;
    }

    wasResetCalled() {
      return this.resetCalled;
    }
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FileSystemScannerService],
    }).compile();

    service = module.get<FileSystemScannerService>(FileSystemScannerService);

    // Clear all mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('scanRepository', () => {
    it('should call reset on all analyzers before scanning', () => {
      const mockAnalyzer = new MockAnalyzer();
      const mockFs = fs as jest.Mocked<typeof fs>;

      mockFs.readdirSync.mockReturnValue([] as any);

      service.scanRepository('/test/repo', [mockAnalyzer]);

      expect(mockAnalyzer.wasResetCalled()).toBe(true);
    });

    it('should scan files and pass to analyzers', () => {
      const mockAnalyzer = new MockAnalyzer();
      const mockFs = fs as jest.Mocked<typeof fs>;

      // Mock directory structure
      mockFs.readdirSync.mockReturnValueOnce([
        { name: 'file1.ts', isDirectory: () => false, isFile: () => true },
        { name: 'file2.js', isDirectory: () => false, isFile: () => true },
      ] as any);

      mockFs.readFileSync
        .mockReturnValueOnce('content of file1')
        .mockReturnValueOnce('content of file2');

      service.scanRepository('/test/repo', [mockAnalyzer]);

      const files = mockAnalyzer.getFiles();
      expect(files).toHaveLength(2);
      expect(files[0]).toEqual({
        path: path.join('/test/repo', 'file1.ts'),
        content: 'content of file1',
        ext: '.ts',
      });
      expect(files[1]).toEqual({
        path: path.join('/test/repo', 'file2.js'),
        content: 'content of file2',
        ext: '.js',
      });
    });

    it('should skip unsupported file extensions', () => {
      const mockAnalyzer = new MockAnalyzer();
      const mockFs = fs as jest.Mocked<typeof fs>;

      mockFs.readdirSync.mockReturnValueOnce([
        { name: 'file1.ts', isDirectory: () => false, isFile: () => true },
        { name: 'file2.txt', isDirectory: () => false, isFile: () => true },
        { name: 'file3.md', isDirectory: () => false, isFile: () => true },
      ] as any);

      mockFs.readFileSync.mockReturnValue('content');

      service.scanRepository('/test/repo', [mockAnalyzer]);

      const files = mockAnalyzer.getFiles();
      expect(files).toHaveLength(1);
      expect(files[0].ext).toBe('.ts');
    });

    it('should skip directories that should be excluded', () => {
      const mockAnalyzer = new MockAnalyzer();
      const mockFs = fs as jest.Mocked<typeof fs>;

      mockFs.readdirSync
        .mockReturnValueOnce([
          {
            name: 'node_modules',
            isDirectory: () => true,
            isFile: () => false,
          },
          { name: '.git', isDirectory: () => true, isFile: () => false },
          { name: 'dist', isDirectory: () => true, isFile: () => false },
          { name: 'src', isDirectory: () => true, isFile: () => false },
        ] as any)
        .mockReturnValueOnce([
          { name: 'file.ts', isDirectory: () => false, isFile: () => true },
        ] as any);

      mockFs.readFileSync.mockReturnValue('content');

      service.scanRepository('/test/repo', [mockAnalyzer]);

      const files = mockAnalyzer.getFiles();
      expect(files).toHaveLength(1);
      // Should only process files in 'src', not in node_modules, .git, or dist
    });

    it('should recursively scan subdirectories', () => {
      const mockAnalyzer = new MockAnalyzer();
      const mockFs = fs as jest.Mocked<typeof fs>;

      mockFs.readdirSync
        .mockReturnValueOnce([
          { name: 'subdir', isDirectory: () => true, isFile: () => false },
        ] as any)
        .mockReturnValueOnce([
          { name: 'file.ts', isDirectory: () => false, isFile: () => true },
        ] as any);

      mockFs.readFileSync.mockReturnValue('nested content');

      service.scanRepository('/test/repo', [mockAnalyzer]);

      const files = mockAnalyzer.getFiles();
      expect(files).toHaveLength(1);
      expect(files[0].path).toBe(path.join('/test/repo', 'subdir', 'file.ts'));
    });

    it('should call progress callback with correct values', () => {
      const mockAnalyzer = new MockAnalyzer();
      const mockFs = fs as jest.Mocked<typeof fs>;
      const progressCallback = jest.fn();

      mockFs.readdirSync.mockReturnValueOnce([
        { name: 'file1.ts', isDirectory: () => false, isFile: () => true },
        { name: 'file2.js', isDirectory: () => false, isFile: () => true },
        { name: 'file3.py', isDirectory: () => false, isFile: () => true },
      ] as any);

      mockFs.readFileSync.mockReturnValue('content');

      service.scanRepository('/test/repo', [mockAnalyzer], progressCallback);

      expect(progressCallback).toHaveBeenCalledTimes(3);
      expect(progressCallback).toHaveBeenNthCalledWith(1, 1, 3);
      expect(progressCallback).toHaveBeenNthCalledWith(2, 2, 3);
      expect(progressCallback).toHaveBeenNthCalledWith(3, 3, 3);
    });

    it('should pass files only to analyzers that support the extension', () => {
      class TypeScriptOnlyAnalyzer implements FileAnalyzer {
        private files: string[] = [];
        reset(): void {
          this.files = [];
        }
        getSupportedExtensions(): string[] {
          return ['.ts'];
        }
        analyzeFile(filePath: string): void {
          this.files.push(filePath);
        }
        getFiles() {
          return this.files;
        }
      }

      const tsAnalyzer = new TypeScriptOnlyAnalyzer();
      const allAnalyzer = new MockAnalyzer();
      const mockFs = fs as jest.Mocked<typeof fs>;

      mockFs.readdirSync.mockReturnValueOnce([
        { name: 'file1.ts', isDirectory: () => false, isFile: () => true },
        { name: 'file2.js', isDirectory: () => false, isFile: () => true },
      ] as any);

      mockFs.readFileSync.mockReturnValue('content');

      service.scanRepository('/test/repo', [tsAnalyzer, allAnalyzer]);

      expect(tsAnalyzer.getFiles()).toHaveLength(1);
      expect(allAnalyzer.getFiles()).toHaveLength(2);
    });

    it('should handle file read errors gracefully', () => {
      const mockAnalyzer = new MockAnalyzer();
      const mockFs = fs as jest.Mocked<typeof fs>;

      mockFs.readdirSync.mockReturnValueOnce([
        { name: 'file1.ts', isDirectory: () => false, isFile: () => true },
        { name: 'file2.js', isDirectory: () => false, isFile: () => true },
      ] as any);

      mockFs.readFileSync
        .mockImplementationOnce(() => {
          throw new Error('Permission denied');
        })
        .mockReturnValueOnce('content of file2');

      // Should not throw
      expect(() => {
        service.scanRepository('/test/repo', [mockAnalyzer]);
      }).not.toThrow();

      // Should only have file2
      const files = mockAnalyzer.getFiles();
      expect(files).toHaveLength(1);
      expect(files[0].path).toContain('file2.js');
    });

    it('should handle directory read errors gracefully', () => {
      const mockAnalyzer = new MockAnalyzer();
      const mockFs = fs as jest.Mocked<typeof fs>;

      mockFs.readdirSync.mockImplementation(() => {
        throw new Error('Directory not found');
      });

      // Should not throw
      expect(() => {
        service.scanRepository('/test/repo', [mockAnalyzer]);
      }).not.toThrow();

      // Should have no files
      const files = mockAnalyzer.getFiles();
      expect(files).toHaveLength(0);
    });

    it('should work with multiple analyzers', () => {
      const analyzer1 = new MockAnalyzer();
      const analyzer2 = new MockAnalyzer();
      const mockFs = fs as jest.Mocked<typeof fs>;

      mockFs.readdirSync.mockReturnValueOnce([
        { name: 'file.ts', isDirectory: () => false, isFile: () => true },
      ] as any);

      mockFs.readFileSync.mockReturnValue('shared content');

      service.scanRepository('/test/repo', [analyzer1, analyzer2]);

      expect(analyzer1.getFiles()).toHaveLength(1);
      expect(analyzer2.getFiles()).toHaveLength(1);
      expect(analyzer1.getFiles()[0].content).toBe('shared content');
      expect(analyzer2.getFiles()[0].content).toBe('shared content');
    });

    it('should skip system and package lock files', () => {
      const mockAnalyzer = new MockAnalyzer();
      const mockFs = fs as jest.Mocked<typeof fs>;

      mockFs.readdirSync.mockReturnValueOnce([
        { name: 'file1.ts', isDirectory: () => false, isFile: () => true },
        {
          name: 'package-lock.json',
          isDirectory: () => false,
          isFile: () => true,
        },
        { name: 'yarn.lock', isDirectory: () => false, isFile: () => true },
        { name: 'file2.js', isDirectory: () => false, isFile: () => true },
        { name: 'Cargo.lock', isDirectory: () => false, isFile: () => true },
        { name: '.DS_Store', isDirectory: () => false, isFile: () => true },
      ] as any);

      mockFs.readFileSync.mockReturnValue('content');

      service.scanRepository('/test/repo', [mockAnalyzer]);

      const files = mockAnalyzer.getFiles();
      expect(files).toHaveLength(2);
      expect(files[0].path).toContain('file1.ts');
      expect(files[1].path).toContain('file2.js');
    });
  });
});
