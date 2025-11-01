/**
 * Error codes for different types of Markdown parsing failures
 */
export const MARKDOWN_PARSE_ERROR_CODES = {
  /** Invalid Markdown syntax */
  INVALID_SYNTAX: 'INVALID_SYNTAX',
  /** Malformed header structure */
  MALFORMED_HEADER: 'MALFORMED_HEADER',
  /** Unclosed code block */
  UNCLOSED_CODE_BLOCK: 'UNCLOSED_CODE_BLOCK',
  /** Invalid table format */
  INVALID_TABLE: 'INVALID_TABLE',
  /** Malformed list structure */
  MALFORMED_LIST: 'MALFORMED_LIST',
  /** Nested structure too deep */
  NESTING_TOO_DEEP: 'NESTING_TOO_DEEP',
  /** File too large for processing */
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  /** Cannot read file or file does not exist */
  FILE_READ_ERROR: 'FILE_READ_ERROR',
  /** Invalid encoding detected */
  INVALID_ENCODING: 'INVALID_ENCODING',
  /** Encoding issues */
  ENCODING_ERROR: 'ENCODING_ERROR',
  /** Memory allocation failed */
  MEMORY_ERROR: 'MEMORY_ERROR',
  /** Generic parsing failure */
  PARSE_FAILED: 'PARSE_FAILED',
  /** Chapter detection failed */
  CHAPTER_DETECTION_FAILED: 'CHAPTER_DETECTION_FAILED',
  /** Sentence boundary detection failed */
  SENTENCE_DETECTION_FAILED: 'SENTENCE_DETECTION_FAILED',
  /** Structure validation failed */
  STRUCTURE_VALIDATION_FAILED: 'STRUCTURE_VALIDATION_FAILED',
  /** Low confidence in structure detection */
  LOW_CONFIDENCE: 'LOW_CONFIDENCE',
  /** Invalid input type */
  INVALID_INPUT: 'INVALID_INPUT',
  /** Unexpected parsing error */
  UNEXPECTED_ERROR: 'UNEXPECTED_ERROR',
} as const;

/**
 * Markdown parse error codes type
 */
export type MarkdownParseErrorCode = keyof typeof MARKDOWN_PARSE_ERROR_CODES;

/**
 * Markdown parse error codes enum for backward compatibility
 */
export enum MarkdownParseErrorCodeEnum {
  INVALID_SYNTAX = 'INVALID_SYNTAX',
  MALFORMED_HEADER = 'MALFORMED_HEADER',
  UNCLOSED_CODE_BLOCK = 'UNCLOSED_CODE_BLOCK',
  INVALID_TABLE = 'INVALID_TABLE',
  MALFORMED_LIST = 'MALFORMED_LIST',
  NESTING_TOO_DEEP = 'NESTING_TOO_DEEP',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  FILE_READ_ERROR = 'FILE_READ_ERROR',
  INVALID_ENCODING = 'INVALID_ENCODING',
  ENCODING_ERROR = 'ENCODING_ERROR',
  MEMORY_ERROR = 'MEMORY_ERROR',
  PARSE_FAILED = 'PARSE_FAILED',
  CHAPTER_DETECTION_FAILED = 'CHAPTER_DETECTION_FAILED',
  SENTENCE_DETECTION_FAILED = 'SENTENCE_DETECTION_FAILED',
  STRUCTURE_VALIDATION_FAILED = 'STRUCTURE_VALIDATION_FAILED',
  LOW_CONFIDENCE = 'LOW_CONFIDENCE',
  INVALID_INPUT = 'INVALID_INPUT',
  UNEXPECTED_ERROR = 'UNEXPECTED_ERROR',
}

/**
 * Location where parsing error occurred
 */
export interface ErrorLocation {
  /** Line number where error occurred */
  line: number;
  /** Column number where error occurred */
  column: number;
  /** Optional context information about the error */
  context?: string;
}

/**
 * Configuration for MarkdownParseError
 */
export interface MarkdownParseErrorConfig {
  /** Location where error occurred */
  location?: ErrorLocation;
  /** Confidence score (0-1) */
  confidence?: number;
  /** Original error that caused this failure */
  cause?: Error;
}
