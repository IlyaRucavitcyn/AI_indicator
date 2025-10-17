import { Test, TestingModule } from '@nestjs/testing';
import { CodeCommentAnalysisService } from './code-comment-analysis.service';

describe('CodeCommentAnalysisService', () => {
  let service: CodeCommentAnalysisService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CodeCommentAnalysisService],
    }).compile();

    service = module.get<CodeCommentAnalysisService>(
      CodeCommentAnalysisService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('reset', () => {
    it('should reset state to zero', () => {
      service.analyzeFile('/test/file.ts', '// Comment\nconst x = 1;', '.ts');
      expect(service.getResult()).toBeGreaterThan(0);

      service.reset();
      expect(service.getResult()).toBe(0);
    });
  });

  describe('getSupportedExtensions', () => {
    it('should return array of supported extensions', () => {
      const extensions = service.getSupportedExtensions();
      expect(Array.isArray(extensions)).toBe(true);
      expect(extensions.length).toBeGreaterThan(0);
    });

    it('should include common programming languages', () => {
      const extensions = service.getSupportedExtensions();
      expect(extensions).toContain('.ts');
      expect(extensions).toContain('.js');
      expect(extensions).toContain('.py');
      expect(extensions).toContain('.java');
    });
  });

  describe('analyzeFile', () => {
    it('should return 0 for no files analyzed', () => {
      service.reset();
      const result = service.getResult();

      expect(result).toBe(0);
    });

    it('should calculate comment ratio for JavaScript files', () => {
      service.reset();
      const mockFileContent = `// This is a comment
function hello() {
  // Another comment
  console.log('hello');
}`;

      service.analyzeFile('/test/file.js', mockFileContent, '.js');
      const result = service.getResult();

      // 2 comment lines, 3 code lines = 66.67%
      expect(result).toBe(66.67);
    });

    it('should calculate comment ratio for TypeScript files with block comments', () => {
      service.reset();
      const mockFileContent = `/*
 * Multi-line comment
 * Another line
 */
function test() {
  return true;
}`;

      service.analyzeFile('/test/file.ts', mockFileContent, '.ts');
      const result = service.getResult();

      // 4 comment lines, 3 code lines = 133.33%
      expect(result).toBe(133.33);
    });

    it('should calculate comment ratio for Python files', () => {
      service.reset();
      const mockFileContent = `# This is a comment
def hello():
    # Another comment
    print("hello")
    return True`;

      service.analyzeFile('/test/script.py', mockFileContent, '.py');
      const result = service.getResult();

      // 2 comment lines, 3 code lines = 66.67%
      expect(result).toBe(66.67);
    });

    it('should handle multiple files', () => {
      service.reset();
      const indexContent = `// Main file
export function main() {}`;

      const utilsContent = `// Utility function
// Another comment
export function util() {
  return 1;
}`;

      service.analyzeFile('/test/index.js', indexContent, '.js');
      service.analyzeFile('/test/utils.ts', utilsContent, '.ts');
      const result = service.getResult();

      // index.js: 1 comment, 1 code
      // utils.ts: 2 comments, 3 code
      // Total: 3 comment lines, 4 code lines = 75%
      expect(result).toBe(75);
    });

    it('should ignore empty lines', () => {
      service.reset();
      const mockFileContent = `// Comment

const x = 1;

const y = 2;`;

      service.analyzeFile('/test/file.js', mockFileContent, '.js');
      const result = service.getResult();

      // 1 comment line, 2 code lines = 50%
      expect(result).toBe(50);
    });

    it('should handle inline block comments on same line', () => {
      service.reset();
      const mockFileContent = `/* inline comment */
const x = 1;`;

      service.analyzeFile('/test/file.js', mockFileContent, '.js');
      const result = service.getResult();

      // 1 comment line, 1 code line = 100%
      expect(result).toBe(100);
    });

    it('should handle files with only comments', () => {
      service.reset();
      const mockFileContent = `// Only comments
// No code here
// Just comments`;

      service.analyzeFile('/test/file.js', mockFileContent, '.js');
      const result = service.getResult();

      // 3 comments, 0 code = 0% (handled by special case)
      expect(result).toBe(0);
    });

    it('should handle files with no comments', () => {
      service.reset();
      const mockFileContent = `const x = 1;
const y = 2;
console.log(x + y);`;

      service.analyzeFile('/test/file.js', mockFileContent, '.js');
      const result = service.getResult();

      // 0 comments, 3 code lines = 0%
      expect(result).toBe(0);
    });
  });

  describe('countComments', () => {
    it('should handle multi-line block comments correctly', () => {
      service.reset();
      const content = `/**
 * This is a JSDoc comment
 * @param x The parameter
 */
function test(x) {
  return x;
}`;
      service.analyzeFile('/test/file.js', content, '.js');
      const result = service.getResult();

      // 4 comment lines, 3 code lines = 133.33%
      expect(result).toBe(133.33);
    });

    it('should handle nested comments in different languages', () => {
      service.reset();
      const rubyContent = `=begin
Multi-line comment
in Ruby
=end
def hello
  puts "world"
end`;
      service.analyzeFile('/test/file.rb', rubyContent, '.rb');
      const result = service.getResult();

      // 4 comment lines, 3 code lines = 133.33%
      expect(result).toBe(133.33);
    });
  });
});
