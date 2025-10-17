import { Test, TestingModule } from '@nestjs/testing';
import { CodeNonTypicalExpressionsService } from './code-non-typical-expressions.service';

describe('CodeNonTypicalExpressionsService', () => {
  let service: CodeNonTypicalExpressionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CodeNonTypicalExpressionsService],
    }).compile();

    service = module.get<CodeNonTypicalExpressionsService>(
      CodeNonTypicalExpressionsService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('reset', () => {
    it('should reset state to zero', () => {
      service.analyzeFile(
        '/test/file.ts',
        'for (let i = 0; i < 10; i++) {}',
        '.ts',
      );
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

  describe('analyzeFile - for loops', () => {
    it('should detect traditional for loop', () => {
      service.reset();
      service.analyzeFile(
        '/test/file.ts',
        'for (let i = 0; i < 10; i++) { console.log(i); }',
        '.ts',
      );
      expect(service.getResult()).toBe(100);
    });

    it('should detect for-in loop', () => {
      service.reset();
      service.analyzeFile(
        '/test/file.js',
        'for (const key in object) { }',
        '.js',
      );
      expect(service.getResult()).toBe(100);
    });

    it('should detect for-of loop', () => {
      service.reset();
      service.analyzeFile(
        '/test/file.ts',
        'for (const item of array) { }',
        '.ts',
      );
      expect(service.getResult()).toBe(100);
    });

    it('should not detect for in string literals', () => {
      service.reset();
      service.analyzeFile(
        '/test/file.ts',
        'const message = "Use for loop here";',
        '.ts',
      );
      expect(service.getResult()).toBe(0);
    });

    it('should not detect for in comments', () => {
      service.reset();
      service.analyzeFile(
        '/test/file.ts',
        '// Use for (let i = 0; i < 10; i++) loop\nconst x = 5;',
        '.ts',
      );
      expect(service.getResult()).toBe(0);
    });
  });

  describe('analyzeFile - while loops', () => {
    it('should detect while loop', () => {
      service.reset();
      service.analyzeFile(
        '/test/file.ts',
        'while (condition) { doSomething(); }',
        '.ts',
      );
      expect(service.getResult()).toBe(100);
    });

    it('should not detect while in string literals', () => {
      service.reset();
      service.analyzeFile(
        '/test/file.ts',
        'const text = "while loop example";',
        '.ts',
      );
      expect(service.getResult()).toBe(0);
    });

    it('should not detect while in comments', () => {
      service.reset();
      service.analyzeFile(
        '/test/file.ts',
        '// Use while (condition) to loop\nconst x = 5;',
        '.ts',
      );
      expect(service.getResult()).toBe(0);
    });
  });

  describe('analyzeFile - do-while loops', () => {
    it('should detect do-while loop', () => {
      service.reset();
      service.analyzeFile(
        '/test/file.ts',
        'do { processItem(); } while (hasMore);',
        '.ts',
      );
      expect(service.getResult()).toBe(100);
    });

    it('should not detect do in string literals', () => {
      service.reset();
      service.analyzeFile(
        '/test/file.ts',
        'const message = "do { something }";',
        '.ts',
      );
      expect(service.getResult()).toBe(0);
    });
  });

  describe('analyzeFile - switch statements', () => {
    it('should detect switch statement', () => {
      service.reset();
      service.analyzeFile(
        '/test/file.ts',
        'switch (value) { case 1: break; default: break; }',
        '.ts',
      );
      expect(service.getResult()).toBe(100);
    });

    it('should not detect switch in string literals', () => {
      service.reset();
      service.analyzeFile(
        '/test/file.ts',
        'const text = "switch (x) case";',
        '.ts',
      );
      expect(service.getResult()).toBe(0);
    });

    it('should not detect switch in comments', () => {
      service.reset();
      service.analyzeFile(
        '/test/file.ts',
        '// switch (value) statement\nconst x = 5;',
        '.ts',
      );
      expect(service.getResult()).toBe(0);
    });
  });

  describe('analyzeFile - multiple expressions', () => {
    it('should detect file with multiple non-typical expressions', () => {
      service.reset();
      const code = `
        for (let i = 0; i < 10; i++) {
          while (condition) {
            switch (value) {
              case 1: break;
            }
          }
        }
      `;
      service.analyzeFile('/test/file.ts', code, '.ts');
      expect(service.getResult()).toBe(100);
    });

    it('should count file only once even with multiple expressions', () => {
      service.reset();
      const code = `
        for (let i = 0; i < 10; i++) {}
        while (x) {}
        switch (y) {}
      `;
      service.analyzeFile('/test/file1.ts', code, '.ts');
      service.analyzeFile('/test/file2.ts', 'const x = 5;', '.ts');

      // 1 out of 2 files has non-typical expressions = 50%
      expect(service.getResult()).toBe(50);
    });
  });

  describe('analyzeFile - clean code', () => {
    it('should not detect expressions in modern JavaScript', () => {
      service.reset();
      const code = `
        const numbers = [1, 2, 3, 4, 5];
        const doubled = numbers.map(n => n * 2);
        const filtered = numbers.filter(n => n > 2);
        const sum = numbers.reduce((acc, n) => acc + n, 0);
      `;
      service.analyzeFile('/test/file.ts', code, '.ts');
      expect(service.getResult()).toBe(0);
    });

    it('should not detect expressions in object methods', () => {
      service.reset();
      const code = `
        const obj = {
          getValue: () => 42,
          processItems: (items) => items.map(x => x * 2)
        };
      `;
      service.analyzeFile('/test/file.ts', code, '.ts');
      expect(service.getResult()).toBe(0);
    });
  });

  describe('getResult', () => {
    it('should return 0 when no files analyzed', () => {
      service.reset();
      expect(service.getResult()).toBe(0);
    });

    it('should return 100 when all files have non-typical expressions', () => {
      service.reset();
      service.analyzeFile(
        '/test/file1.ts',
        'for (let i = 0; i < 10; i++) {}',
        '.ts',
      );
      service.analyzeFile('/test/file2.ts', 'while (x) {}', '.ts');
      service.analyzeFile('/test/file3.ts', 'switch (y) {}', '.ts');
      expect(service.getResult()).toBe(100);
    });

    it('should return 0 when no files have non-typical expressions', () => {
      service.reset();
      service.analyzeFile('/test/file1.ts', 'const x = 5;', '.ts');
      service.analyzeFile('/test/file2.ts', 'const y = 10;', '.ts');
      expect(service.getResult()).toBe(0);
    });

    it('should calculate correct percentage for mixed files', () => {
      service.reset();
      service.analyzeFile(
        '/test/file1.ts',
        'for (let i = 0; i < 10; i++) {}',
        '.ts',
      );
      service.analyzeFile('/test/file2.ts', 'const x = 5;', '.ts');
      service.analyzeFile('/test/file3.ts', 'const y = 10;', '.ts');
      service.analyzeFile('/test/file4.ts', 'const z = 15;', '.ts');

      // 1 out of 4 files = 25%
      expect(service.getResult()).toBe(25);
    });

    it('should round percentage to 2 decimal places', () => {
      service.reset();
      service.analyzeFile(
        '/test/file1.ts',
        'for (let i = 0; i < 10; i++) {}',
        '.ts',
      );
      service.analyzeFile('/test/file2.ts', 'const x = 5;', '.ts');
      service.analyzeFile('/test/file3.ts', 'const y = 10;', '.ts');

      // 1 out of 3 files = 33.33...%
      expect(service.getResult()).toBe(33.33);
    });
  });

  describe('analyzeFile - different languages', () => {
    it('should not detect Python for loops without parentheses', () => {
      service.reset();
      const pythonCode = `
# This is a comment with for loop
for i in range(10):
    print(i)
      `;
      // Python doesn't use for ( syntax, so our detector won't catch it
      // This is expected behavior as we're focused on C-style languages
      service.analyzeFile('/test/file.py', pythonCode, '.py');
      expect(service.getResult()).toBe(0);
    });

    it('should handle Java syntax', () => {
      service.reset();
      const javaCode = `
/* Block comment with for loop */
for (int i = 0; i < 10; i++) {
    System.out.println(i);
}
      `;
      service.analyzeFile('/test/file.java', javaCode, '.java');
      expect(service.getResult()).toBe(100);
    });
  });

  describe('analyzeFile - edge cases', () => {
    it('should handle empty file content', () => {
      service.reset();
      service.analyzeFile('/test/empty.ts', '', '.ts');
      expect(service.getResult()).toBe(0);
    });

    it('should handle file with only whitespace', () => {
      service.reset();
      service.analyzeFile('/test/whitespace.ts', '   \n\n   \t  ', '.ts');
      expect(service.getResult()).toBe(0);
    });

    it('should handle file with only comments', () => {
      service.reset();
      service.analyzeFile(
        '/test/comments.ts',
        '// Comment 1\n/* Comment 2 */\n// Comment 3',
        '.ts',
      );
      expect(service.getResult()).toBe(0);
    });

    it('should handle nested block comments', () => {
      service.reset();
      const code = `
        /* Comment with for (let i = 0; i < 10; i++) inside */
        const x = 5;
      `;
      service.analyzeFile('/test/file.ts', code, '.ts');
      expect(service.getResult()).toBe(0);
    });
  });
});
