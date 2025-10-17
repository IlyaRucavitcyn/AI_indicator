/**
 * Comment syntax configuration for different programming languages
 */
export interface CommentSyntax {
  single: string;
  blockStart?: string;
  blockEnd?: string;
}

/**
 * Programming language configuration
 */
export interface LanguageConfig {
  extensions: string[];
  commentSyntax: CommentSyntax;
  name: string;
}

/**
 * File extension constants
 */
export const FILE_EXTENSIONS = {
  TYPESCRIPT: ['.ts', '.tsx'],
  JAVASCRIPT: ['.js', '.jsx'],
  PYTHON: ['.py'],
  JAVA: ['.java'],
  GO: ['.go'],
  RUST: ['.rs'],
  C: ['.c'],
  CPP: ['.cpp'],
  CSHARP: ['.cs'],
  PHP: ['.php'],
  RUBY: ['.rb'],
  SWIFT: ['.swift'],
  KOTLIN: ['.kt'],
} as const;

/**
 * Language name constants
 */
export const LANGUAGE_NAMES = {
  TYPESCRIPT: 'TypeScript',
  JAVASCRIPT: 'JavaScript',
  PYTHON: 'Python',
  JAVA: 'Java',
  GO: 'Go',
  RUST: 'Rust',
  C: 'C',
  CPP: 'C++',
  CSHARP: 'C#',
  PHP: 'PHP',
  RUBY: 'Ruby',
  SWIFT: 'Swift',
  KOTLIN: 'Kotlin',
  UNKNOWN: 'Unknown',
} as const;

/**
 * Comment syntax constants
 */
const COMMENT_SYNTAX = {
  C_STYLE: { single: '//', blockStart: '/*', blockEnd: '*/' },
  PYTHON: { single: '#', blockStart: '"""', blockEnd: '"""' },
  RUBY: { single: '#', blockStart: '=begin', blockEnd: '=end' },
  DEFAULT: { single: '#' },
} as const;

/**
 * Supported programming languages and their configurations
 */
const LANGUAGE_CONFIGS: LanguageConfig[] = [
  {
    name: LANGUAGE_NAMES.TYPESCRIPT,
    extensions: [...FILE_EXTENSIONS.TYPESCRIPT],
    commentSyntax: COMMENT_SYNTAX.C_STYLE,
  },
  {
    name: LANGUAGE_NAMES.JAVASCRIPT,
    extensions: [...FILE_EXTENSIONS.JAVASCRIPT],
    commentSyntax: COMMENT_SYNTAX.C_STYLE,
  },
  {
    name: LANGUAGE_NAMES.PYTHON,
    extensions: [...FILE_EXTENSIONS.PYTHON],
    commentSyntax: COMMENT_SYNTAX.PYTHON,
  },
  {
    name: LANGUAGE_NAMES.JAVA,
    extensions: [...FILE_EXTENSIONS.JAVA],
    commentSyntax: COMMENT_SYNTAX.C_STYLE,
  },
  {
    name: LANGUAGE_NAMES.GO,
    extensions: [...FILE_EXTENSIONS.GO],
    commentSyntax: COMMENT_SYNTAX.C_STYLE,
  },
  {
    name: LANGUAGE_NAMES.RUST,
    extensions: [...FILE_EXTENSIONS.RUST],
    commentSyntax: COMMENT_SYNTAX.C_STYLE,
  },
  {
    name: LANGUAGE_NAMES.C,
    extensions: [...FILE_EXTENSIONS.C],
    commentSyntax: COMMENT_SYNTAX.C_STYLE,
  },
  {
    name: LANGUAGE_NAMES.CPP,
    extensions: [...FILE_EXTENSIONS.CPP],
    commentSyntax: COMMENT_SYNTAX.C_STYLE,
  },
  {
    name: LANGUAGE_NAMES.CSHARP,
    extensions: [...FILE_EXTENSIONS.CSHARP],
    commentSyntax: COMMENT_SYNTAX.C_STYLE,
  },
  {
    name: LANGUAGE_NAMES.PHP,
    extensions: [...FILE_EXTENSIONS.PHP],
    commentSyntax: COMMENT_SYNTAX.C_STYLE,
  },
  {
    name: LANGUAGE_NAMES.RUBY,
    extensions: [...FILE_EXTENSIONS.RUBY],
    commentSyntax: COMMENT_SYNTAX.RUBY,
  },
  {
    name: LANGUAGE_NAMES.SWIFT,
    extensions: [...FILE_EXTENSIONS.SWIFT],
    commentSyntax: COMMENT_SYNTAX.C_STYLE,
  },
  {
    name: LANGUAGE_NAMES.KOTLIN,
    extensions: [...FILE_EXTENSIONS.KOTLIN],
    commentSyntax: COMMENT_SYNTAX.C_STYLE,
  },
];

/**
 * Utility class for programming language detection and syntax information
 */
export class LanguageUtils {
  private static extensionToConfigMap: Map<string, LanguageConfig>;

  /**
   * Initializes the extension-to-config mapping
   */
  private static initializeMap(): void {
    if (!this.extensionToConfigMap) {
      this.extensionToConfigMap = new Map();
      LANGUAGE_CONFIGS.forEach((config) => {
        config.extensions.forEach((ext) => {
          this.extensionToConfigMap.set(ext, config);
        });
      });
    }
  }

  /**
   * Gets comment syntax for a file extension
   * @param extension File extension (e.g., '.ts', '.py')
   * @returns Comment syntax configuration
   */
  static getCommentSyntax(extension: string): CommentSyntax {
    this.initializeMap();
    const config = this.extensionToConfigMap.get(extension);
    return config?.commentSyntax || COMMENT_SYNTAX.DEFAULT;
  }

  /**
   * Gets language name for a file extension
   * @param extension File extension
   * @returns Language name or 'Unknown'
   */
  static getLanguageName(extension: string): string {
    this.initializeMap();
    const config = this.extensionToConfigMap.get(extension);
    return config?.name || LANGUAGE_NAMES.UNKNOWN;
  }

  /**
   * Checks if an extension is supported
   * @param extension File extension
   * @returns True if language is supported
   */
  static isSupported(extension: string): boolean {
    this.initializeMap();
    return this.extensionToConfigMap.has(extension);
  }

  /**
   * Gets all supported file extensions
   * @returns Array of supported file extensions
   */
  static getSupportedExtensions(): string[] {
    this.initializeMap();
    return Array.from(this.extensionToConfigMap.keys());
  }

  /**
   * Gets all language configurations
   * @returns Array of language configurations
   */
  static getAllLanguages(): LanguageConfig[] {
    return [...LANGUAGE_CONFIGS];
  }

  /**
   * Escapes special regex characters in a string
   * @param str String to escape
   * @returns Escaped string safe for use in regex
   */
  static escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
