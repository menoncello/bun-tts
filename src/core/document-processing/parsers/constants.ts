/**
 * Constants for Markdown parser operations
 */

export const PARSER_CONSTANTS = {
  // File and size limits
  MAX_CHUNK_MULTIPLIER: 100,
  MAX_FILE_SIZE_MULTIPLIER: 100,

  // Sentence and text processing
  MIN_SENTENCE_LENGTH: 1,
  HEADING_PREFIX_LENGTH: 2,

  // Validation scoring
  CHAPTER_WEIGHT: 10,
  PARAGRAPH_WEIGHT: 5,
  ERROR_WEIGHT_MULTIPLIER: 2,
  WARNING_WEIGHT_MULTIPLIER: 1,

  // TTS estimation
  WORDS_PER_MINUTE: 150,
  WORDS_PER_SECOND: 2.5,

  // Confidence calculation
  BASE_CONFIDENCE: 0.5,
  GOOD_SENTENCE_LENGTH_MIN: 10,
  GOOD_SENTENCE_LENGTH_MAX: 100,
  SENTENCE_LENGTH_CONFIDENCE_BOOST: 0.2,
  PUNCTUATION_CONFIDENCE_BOOST: 0.2,
  MULTIPLE_SENTENCE_CONFIDENCE_BOOST: 0.1,
  MAX_CONFIDENCE: 1.0,

  // Error messages
  UNKNOWN_ERROR: 'Unknown error',
  EMPTY_CONTENT_ERROR: 'Empty content',
  STREAMING_DISABLED_ERROR: 'Streaming is not enabled in configuration',
  TABLE_PLACEHOLDER: '[Table content]',
} as const;

export const REGEX_PATTERNS = {
  // Formatting patterns for text detection (optimized to avoid backtracking)
  BOLD: /\*\*[^*]*\*\*/,
  ITALIC: /\*[^*]*\*/,
  CODE: /`[^`]*`/,
  LINKS: /\[[^[\]]*]\([^()]*\)/,

  // Sentence boundaries (optimized to avoid backtracking)
  SENTENCE_END: /[!.?](?=\s|$)/,
  ABBREVIATION_PATTERN: /(?:Mr|Mrs|Dr|Prof|Sr|Jr|St)\./,
  ELLIPSIS: /\.{3}/,

  // Word counting
  WORD_SEPARATOR: /\s+/,
} as const;
