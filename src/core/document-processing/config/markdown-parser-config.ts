/**
 * Configuration interface for Markdown parser functionality.
 * Provides customizable settings for document processing behavior.
 */

/**
 * Constants for magic numbers in configuration
 */
export const CONFIG_CONSTANTS = {
  /** Default chapter header level (H2) */
  DEFAULT_CHAPTER_LEVEL: 2,
  /** H1 header level */
  H1_LEVEL: 1,
  /** H2 header level */
  H2_LEVEL: 2,
  /** H3 header level */
  H3_LEVEL: 3,
  /** High confidence threshold for technical documents */
  TECHNICAL_CONFIDENCE_THRESHOLD: 0.9,
  /** Very high confidence threshold for academic papers */
  ACADEMIC_CONFIDENCE_THRESHOLD: 0.95,
  /** Moderate confidence threshold for blog posts */
  BLOG_CONFIDENCE_THRESHOLD: 0.75,
  /** Maximum sentence length for academic papers */
  ACADEMIC_MAX_SENTENCE_LENGTH: 1000,
} as const;

/**
 * Markdown parser configuration options
 */
export interface MarkdownParserConfig {
  /** Pattern for detecting chapter headers (regex string) */
  chapterDetectionPattern: string;
  /** Minimum confidence threshold for structure detection (0-1) */
  confidenceThreshold: number;
  /** Enable streaming architecture for large documents */
  enableStreaming: boolean;
  /** Maximum chunk size for streaming processing (characters) */
  maxChunkSize: number;
  /** Header levels to treat as chapters (1-6) */
  chapterHeaderLevels: number[];
  /** Whether to include code blocks in audio output */
  includeCodeBlocks: boolean;
  /** Whether to include tables in audio output */
  includeTables: boolean;
  /** Whether to include blockquotes in audio output */
  includeBlockquotes: boolean;
  /** Whether to include list items in audio output */
  includeLists: boolean;
  /** Strategy for handling malformed Markdown */
  errorHandlingStrategy: 'strict' | 'lenient' | 'recover';
  /** Enable detailed parsing logs */
  enableDebugLogging: boolean;
  /** Custom sentence boundary detection patterns */
  sentenceBoundaryPatterns: string[];
  /** Minimum sentence length (characters) */
  minSentenceLength: number;
  /** Maximum sentence length (characters) */
  maxSentenceLength: number;
  /** Maximum file size (MB) */
  maxFileSize: number;
  /** Language-specific parsing rules */
  languageRules: LanguageSpecificRules;
}

/**
 * Language-specific parsing rules
 */
export interface LanguageSpecificRules {
  /** Language code (e.g., 'en', 'pt') */
  language: string;
  /** Custom sentence boundary patterns */
  sentencePatterns: string[];
  /** Abbreviation list that shouldn't end sentences */
  abbreviations: string[];
  /** Quote characters for this language */
  quotes: {
    opening: string[];
    closing: string[];
  };
  /** Custom formatting rules */
  formatting: FormattingRules;
}

/**
 * Text formatting rules by language
 */
export interface FormattingRules {
  /** How to handle emphasis (bold, italic) */
  emphasis: 'ignore' | 'announce' | 'tone';
  /** How to handle code formatting */
  code: 'ignore' | 'announce' | 'spell';
  /** How to handle links */
  links: 'ignore' | 'announce' | 'describe';
  /** How to handle headings */
  headings: 'ignore' | 'announce' | 'describe';
}

/**
 * Default configuration values
 */
export const DEFAULT_MARKDOWN_PARSER_CONFIG: MarkdownParserConfig = {
  chapterDetectionPattern: '^#{1,6}\\s+(.+)$',
  confidenceThreshold: 0.8,
  enableStreaming: true,
  maxChunkSize: 50000,
  chapterHeaderLevels: [CONFIG_CONSTANTS.DEFAULT_CHAPTER_LEVEL], // ## headers by default
  includeCodeBlocks: false,
  includeTables: false,
  includeBlockquotes: true,
  includeLists: true,
  errorHandlingStrategy: 'recover',
  enableDebugLogging: false,
  sentenceBoundaryPatterns: [
    '[.!?]+\\s+', // Standard sentence endings
    '[.!?]\\s+[A-Z]', // Sentence ending followed by capital
    '\\n\\s*', // Line breaks as potential sentence boundaries
  ],
  minSentenceLength: 5,
  maxSentenceLength: 500,
  maxFileSize: 10, // 10MB default
  languageRules: {
    language: 'en',
    sentencePatterns: ['[.!?]+\\s+', '[.!?]\\s+[A-Z]', '\\n\\s*'],
    abbreviations: [
      'Mr',
      'Mrs',
      'Ms',
      'Dr',
      'Prof',
      'St',
      'Ave',
      'Rd',
      'Blvd',
      'etc',
      'e.g',
      'i.e',
      'vs',
      'al',
      'et',
      'ca',
      'cf',
    ],
    quotes: {
      opening: ['"', "'"],
      closing: ['"', "'"],
    },
    formatting: {
      emphasis: 'tone',
      code: 'announce',
      links: 'describe',
      headings: 'describe',
    },
  },
};

/**
 * Configuration presets for different use cases
 */
export const MARKDOWN_PARSER_PRESETS = {
  /** Optimized for technical documentation */
  technical: {
    ...DEFAULT_MARKDOWN_PARSER_CONFIG,
    includeCodeBlocks: true,
    includeTables: true,
    chapterHeaderLevels: [CONFIG_CONSTANTS.H1_LEVEL, CONFIG_CONSTANTS.H2_LEVEL], // # and ## headers
    confidenceThreshold: CONFIG_CONSTANTS.TECHNICAL_CONFIDENCE_THRESHOLD,
  } satisfies MarkdownParserConfig,

  /** Optimized for narrative content */
  narrative: {
    ...DEFAULT_MARKDOWN_PARSER_CONFIG,
    includeCodeBlocks: false,
    includeTables: false,
    includeBlockquotes: true,
    chapterHeaderLevels: [CONFIG_CONSTANTS.H1_LEVEL], // Only # headers
    errorHandlingStrategy: 'lenient',
  } satisfies MarkdownParserConfig,

  /** Optimized for academic papers */
  academic: {
    ...DEFAULT_MARKDOWN_PARSER_CONFIG,
    includeCodeBlocks: true,
    includeTables: true,
    includeBlockquotes: true,
    chapterHeaderLevels: [
      CONFIG_CONSTANTS.H1_LEVEL,
      CONFIG_CONSTANTS.H2_LEVEL,
      CONFIG_CONSTANTS.H3_LEVEL,
    ], // #, ##, ### headers
    confidenceThreshold: CONFIG_CONSTANTS.ACADEMIC_CONFIDENCE_THRESHOLD,
    maxSentenceLength: CONFIG_CONSTANTS.ACADEMIC_MAX_SENTENCE_LENGTH,
  } satisfies MarkdownParserConfig,

  /** Optimized for blog posts */
  blog: {
    ...DEFAULT_MARKDOWN_PARSER_CONFIG,
    includeCodeBlocks: true,
    includeTables: false,
    chapterHeaderLevels: [CONFIG_CONSTANTS.H2_LEVEL], // ## headers
    errorHandlingStrategy: 'recover',
    confidenceThreshold: CONFIG_CONSTANTS.BLOG_CONFIDENCE_THRESHOLD,
  } satisfies MarkdownParserConfig,
} as const;

/**
 * Type for preset names
 */
export type MarkdownParserPreset = keyof typeof MARKDOWN_PARSER_PRESETS;
