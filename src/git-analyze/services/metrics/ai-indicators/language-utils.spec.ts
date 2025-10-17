import { LanguageUtils, LANGUAGE_NAMES, FILE_EXTENSIONS } from './language-utils';

describe('LanguageUtils', () => {
  describe('getCommentSyntax', () => {
    it('should return C-style comments for TypeScript', () => {
      const syntax = LanguageUtils.getCommentSyntax('.ts');
      expect(syntax).toEqual({
        single: '//',
        blockStart: '/*',
        blockEnd: '*/',
      });
    });

    it('should return C-style comments for JavaScript', () => {
      const syntax = LanguageUtils.getCommentSyntax('.js');
      expect(syntax).toEqual({
        single: '//',
        blockStart: '/*',
        blockEnd: '*/',
      });
    });

    it('should return C-style comments for Java', () => {
      const syntax = LanguageUtils.getCommentSyntax('.java');
      expect(syntax).toEqual({
        single: '//',
        blockStart: '/*',
        blockEnd: '*/',
      });
    });

    it('should return Python-style comments for Python', () => {
      const syntax = LanguageUtils.getCommentSyntax('.py');
      expect(syntax).toEqual({
        single: '#',
        blockStart: '"""',
        blockEnd: '"""',
      });
    });

    it('should return Ruby-style comments for Ruby', () => {
      const syntax = LanguageUtils.getCommentSyntax('.rb');
      expect(syntax).toEqual({
        single: '#',
        blockStart: '=begin',
        blockEnd: '=end',
      });
    });

    it('should return default syntax for unknown extensions', () => {
      const syntax = LanguageUtils.getCommentSyntax('.unknown');
      expect(syntax).toEqual({
        single: '#',
      });
    });

    it('should handle all C-style languages consistently', () => {
      const cStyleExtensions = [
        ...FILE_EXTENSIONS.TYPESCRIPT,
        ...FILE_EXTENSIONS.JAVASCRIPT,
        ...FILE_EXTENSIONS.JAVA,
        ...FILE_EXTENSIONS.GO,
        ...FILE_EXTENSIONS.C,
        ...FILE_EXTENSIONS.CPP,
        ...FILE_EXTENSIONS.CSHARP,
        ...FILE_EXTENSIONS.RUST,
        ...FILE_EXTENSIONS.SWIFT,
        ...FILE_EXTENSIONS.KOTLIN,
        ...FILE_EXTENSIONS.PHP,
      ];

      cStyleExtensions.forEach((ext) => {
        const syntax = LanguageUtils.getCommentSyntax(ext);
        expect(syntax.single).toBe('//');
        expect(syntax.blockStart).toBe('/*');
        expect(syntax.blockEnd).toBe('*/');
      });
    });
  });

  describe('getLanguageName', () => {
    it('should return correct language name for TypeScript', () => {
      expect(LanguageUtils.getLanguageName('.ts')).toBe(LANGUAGE_NAMES.TYPESCRIPT);
      expect(LanguageUtils.getLanguageName('.tsx')).toBe(LANGUAGE_NAMES.TYPESCRIPT);
    });

    it('should return correct language name for JavaScript', () => {
      expect(LanguageUtils.getLanguageName('.js')).toBe(LANGUAGE_NAMES.JAVASCRIPT);
      expect(LanguageUtils.getLanguageName('.jsx')).toBe(LANGUAGE_NAMES.JAVASCRIPT);
    });

    it('should return correct language name for Python', () => {
      expect(LanguageUtils.getLanguageName('.py')).toBe(LANGUAGE_NAMES.PYTHON);
    });

    it('should return correct language name for all supported languages', () => {
      expect(LanguageUtils.getLanguageName('.java')).toBe(LANGUAGE_NAMES.JAVA);
      expect(LanguageUtils.getLanguageName('.go')).toBe(LANGUAGE_NAMES.GO);
      expect(LanguageUtils.getLanguageName('.rs')).toBe(LANGUAGE_NAMES.RUST);
      expect(LanguageUtils.getLanguageName('.c')).toBe(LANGUAGE_NAMES.C);
      expect(LanguageUtils.getLanguageName('.cpp')).toBe(LANGUAGE_NAMES.CPP);
      expect(LanguageUtils.getLanguageName('.cs')).toBe(LANGUAGE_NAMES.CSHARP);
      expect(LanguageUtils.getLanguageName('.php')).toBe(LANGUAGE_NAMES.PHP);
      expect(LanguageUtils.getLanguageName('.rb')).toBe(LANGUAGE_NAMES.RUBY);
      expect(LanguageUtils.getLanguageName('.swift')).toBe(LANGUAGE_NAMES.SWIFT);
      expect(LanguageUtils.getLanguageName('.kt')).toBe(LANGUAGE_NAMES.KOTLIN);
    });

    it('should return Unknown for unsupported extensions', () => {
      expect(LanguageUtils.getLanguageName('.unknown')).toBe(LANGUAGE_NAMES.UNKNOWN);
      expect(LanguageUtils.getLanguageName('.xyz')).toBe(LANGUAGE_NAMES.UNKNOWN);
      expect(LanguageUtils.getLanguageName('.txt')).toBe(LANGUAGE_NAMES.UNKNOWN);
    });
  });

  describe('isSupported', () => {
    it('should return true for supported extensions', () => {
      expect(LanguageUtils.isSupported('.ts')).toBe(true);
      expect(LanguageUtils.isSupported('.js')).toBe(true);
      expect(LanguageUtils.isSupported('.py')).toBe(true);
      expect(LanguageUtils.isSupported('.java')).toBe(true);
      expect(LanguageUtils.isSupported('.go')).toBe(true);
    });

    it('should return false for unsupported extensions', () => {
      expect(LanguageUtils.isSupported('.txt')).toBe(false);
      expect(LanguageUtils.isSupported('.md')).toBe(false);
      expect(LanguageUtils.isSupported('.unknown')).toBe(false);
      expect(LanguageUtils.isSupported('.json')).toBe(false);
    });

    it('should handle all defined file extensions', () => {
      const allExtensions = Object.values(FILE_EXTENSIONS).flat();
      allExtensions.forEach((ext) => {
        expect(LanguageUtils.isSupported(ext)).toBe(true);
      });
    });
  });

  describe('getSupportedExtensions', () => {
    it('should return array of all supported extensions', () => {
      const extensions = LanguageUtils.getSupportedExtensions();
      expect(Array.isArray(extensions)).toBe(true);
      expect(extensions.length).toBeGreaterThan(0);
    });

    it('should include common programming languages', () => {
      const extensions = LanguageUtils.getSupportedExtensions();
      expect(extensions).toContain('.ts');
      expect(extensions).toContain('.js');
      expect(extensions).toContain('.py');
      expect(extensions).toContain('.java');
      expect(extensions).toContain('.go');
      expect(extensions).toContain('.rs');
    });

    it('should not contain duplicates', () => {
      const extensions = LanguageUtils.getSupportedExtensions();
      const uniqueExtensions = [...new Set(extensions)];
      expect(extensions.length).toBe(uniqueExtensions.length);
    });

    it('should match FILE_EXTENSIONS constants', () => {
      const extensions = LanguageUtils.getSupportedExtensions();
      const allDefinedExtensions = Object.values(FILE_EXTENSIONS).flat();

      expect(extensions.length).toBe(allDefinedExtensions.length);
      allDefinedExtensions.forEach((ext) => {
        expect(extensions).toContain(ext);
      });
    });
  });

  describe('getAllLanguages', () => {
    it('should return array of language configurations', () => {
      const languages = LanguageUtils.getAllLanguages();
      expect(Array.isArray(languages)).toBe(true);
      expect(languages.length).toBeGreaterThan(0);
    });

    it('should return configurations with required properties', () => {
      const languages = LanguageUtils.getAllLanguages();
      languages.forEach((lang) => {
        expect(lang).toHaveProperty('name');
        expect(lang).toHaveProperty('extensions');
        expect(lang).toHaveProperty('commentSyntax');
        expect(Array.isArray(lang.extensions)).toBe(true);
        expect(typeof lang.name).toBe('string');
        expect(lang.commentSyntax).toHaveProperty('single');
      });
    });

    it('should include all defined languages', () => {
      const languages = LanguageUtils.getAllLanguages();
      const languageNames = languages.map((l) => l.name);

      expect(languageNames).toContain(LANGUAGE_NAMES.TYPESCRIPT);
      expect(languageNames).toContain(LANGUAGE_NAMES.JAVASCRIPT);
      expect(languageNames).toContain(LANGUAGE_NAMES.PYTHON);
      expect(languageNames).toContain(LANGUAGE_NAMES.JAVA);
    });
  });

  describe('escapeRegex', () => {
    it('should escape special regex characters', () => {
      expect(LanguageUtils.escapeRegex('.*')).toBe('\\.\\*');
      expect(LanguageUtils.escapeRegex('a+b')).toBe('a\\+b');
      expect(LanguageUtils.escapeRegex('a?b')).toBe('a\\?b');
      expect(LanguageUtils.escapeRegex('a^b')).toBe('a\\^b');
      expect(LanguageUtils.escapeRegex('a$b')).toBe('a\\$b');
    });

    it('should escape brackets and braces', () => {
      expect(LanguageUtils.escapeRegex('a{b}')).toBe('a\\{b\\}');
      expect(LanguageUtils.escapeRegex('a(b)')).toBe('a\\(b\\)');
      expect(LanguageUtils.escapeRegex('a[b]')).toBe('a\\[b\\]');
    });

    it('should escape pipe and backslash', () => {
      expect(LanguageUtils.escapeRegex('a|b')).toBe('a\\|b');
      expect(LanguageUtils.escapeRegex('a\\b')).toBe('a\\\\b');
    });

    it('should not modify normal strings', () => {
      expect(LanguageUtils.escapeRegex('abc123')).toBe('abc123');
      expect(LanguageUtils.escapeRegex('hello-world')).toBe('hello-world');
      expect(LanguageUtils.escapeRegex('test_string')).toBe('test_string');
    });

    it('should handle comment syntax escaping', () => {
      expect(LanguageUtils.escapeRegex('//')).toBe('//');
      expect(LanguageUtils.escapeRegex('/*')).toBe('/\\*');
      expect(LanguageUtils.escapeRegex('*/')).toBe('\\*/');
      expect(LanguageUtils.escapeRegex('#')).toBe('#');
    });

    it('should handle empty strings', () => {
      expect(LanguageUtils.escapeRegex('')).toBe('');
    });
  });
});
