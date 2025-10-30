/**
 * Document building utilities for Markdown parser.
 * Handles document structure creation and chapter processing.
 */

import type { Result } from '../../../errors/result.js';
import type { Logger } from '../../../interfaces/logger.js';
import type { MarkdownParserConfig } from '../config/markdown-parser-config.js';
import { MarkdownParseError } from '../errors/markdown-parse-error.js';
import type { DocumentStructure, DocumentMetadata, Chapter } from '../types.js';
import { calculateDocumentConfidence } from './document-confidence.js';
import {
  calculateStatisticsFromChapters,
  calculateEstimatedDurationFromChapters,
} from './document-utils.js';
import {
  validateInput,
  checkFileSize,
  validateConfidenceThreshold,
} from './parser-config.js';
import { tokenizeMarkdown, type ParsedToken } from './parser-core.js';
import { countWords } from './text-processing-utils.js';

/** Processing metrics for document structure */
interface ProcessingMetrics {
  parseStartTime: Date;
  parseEndTime: Date;
  parseDurationMs: number;
  sourceLength: number;
  processingErrors: string[];
}

/**
 * Build document structure from tokens
 * @param {string} content - The original markdown content
 * @param {ParsedToken[] | MarkdownParseError} tokens - Parsed tokens or error from tokenization
 * @param {Date} startTime - Timestamp when processing started
 * @param {(tokens: ParsedToken[]) => Chapter[] | Promise<Chapter[]>} chapterExtractor - Function to extract chapters from tokens
 * @returns {Promise<DocumentStructure | MarkdownParseError>} Document structure or error if processing failed
 */
export const buildDocumentStructure = async (
  content: string,
  tokens: ParsedToken[] | MarkdownParseError,
  startTime: Date,
  chapterExtractor: (tokens: ParsedToken[]) => Chapter[] | Promise<Chapter[]>
): Promise<DocumentStructure | MarkdownParseError> => {
  if (tokens instanceof Error) {
    return tokens;
  }

  const endTime = new Date();
  const metadata = extractMetadata(content, tokens);
  const chapters = await Promise.resolve(chapterExtractor(tokens));

  const metrics: ProcessingMetrics = {
    parseStartTime: startTime,
    parseEndTime: endTime,
    parseDurationMs: endTime.getTime() - startTime.getTime(),
    sourceLength: content.length,
    processingErrors: [],
  };

  return createDocumentStructure(content, metadata, chapters, metrics);
};

/**
 * Extract metadata from content and tokens
 * @param {string} content - The original markdown content
 * @param {ParsedToken[]} tokens - Parsed tokens to extract metadata from
 * @returns {DocumentMetadata} Document metadata object
 */
const extractMetadata = (
  content: string,
  tokens: ParsedToken[]
): DocumentMetadata => {
  // Try to extract title from first h1
  let title = 'Untitled Document';
  for (const token of tokens) {
    if (token.type === 'heading' && token.depth === 1 && token.text) {
      title = token.text;
      break;
    }
  }

  // Calculate word count
  const wordCount = countWords(content);

  return {
    title,
    wordCount,
    customMetadata: {},
  };
};

/**
 * Create the final document structure object
 * @param {string} content - The original markdown content
 * @param {any} metadata - Extracted document metadata
 * @param {Chapter[]} chapters - Array of processed chapters
 * @param {any} metrics - Processing metrics including timestamps
 * @returns {DocumentStructure} Complete document structure
 */
const createDocumentStructure = (
  content: string,
  metadata: DocumentMetadata,
  chapters: Chapter[],
  metrics: ProcessingMetrics
): DocumentStructure => {
  const statistics = calculateStatisticsFromChapters(chapters);
  const estimatedDuration = calculateEstimatedDurationFromChapters(chapters);
  const confidence = calculateDocumentConfidence(
    chapters,
    statistics.totalParagraphs,
    statistics.totalSentences,
    metadata.wordCount
  );

  return {
    metadata,
    chapters,
    ...statistics,
    totalWordCount: metadata.wordCount,
    estimatedTotalDuration: estimatedDuration,
    totalChapters: chapters.length,
    confidence,
    processingMetrics: metrics,
  };
};

/**
 * Validate and prepare input content
 *
 * @param {string | Buffer} input - Raw input content
 * @param {object} config - Parser configuration
 * @returns {string | MarkdownParseError} Validated string content or MarkdownParseError
 */
export function validateAndPrepareInput(
  input: string | Buffer,
  config: MarkdownParserConfig
): string | MarkdownParseError {
  const content = validateInput(input);
  if (content instanceof MarkdownParseError) {
    return content;
  }

  const sizeCheck = checkFileSize(content, config);
  if (sizeCheck instanceof MarkdownParseError) {
    return sizeCheck;
  }

  return content;
}

/**
 * Handle parsing errors
 *
 * @param {Error} error - Error that occurred
 * @param {Date} startTime - Parse start time
 * @param {Logger} logger - Logger instance
 * @returns {any} Result<DocumentStructure, MarkdownParseError> Result with error
 */
export function handleParsingError(
  error: unknown,
  startTime: Date,
  logger: Logger
): Result<DocumentStructure, MarkdownParseError> {
  const parseError = MarkdownParseError.parseFailed(
    error instanceof Error ? error.message : 'Unknown error',
    error instanceof Error ? error : undefined
  );

  logger.error('Markdown parsing failed', {
    error: parseError.message,
    duration: Date.now() - startTime.getTime(),
  });

  return { success: false, error: parseError };
}

/**
 * Build document structure from content
 *
 * @param {string} content - Validated markdown content
 * @param {Date} startTime - Parse start time
 * @param {object} config - Parser configuration
 * @param {(tokens: ParsedToken[]) => Promise<Chapter[]>} extractChaptersCallback - Function to extract chapters from tokens
 * @returns {Promise<DocumentStructure | MarkdownParseError>} DocumentStructure or MarkdownParseError
 */
export async function buildDocument(
  content: string,
  startTime: Date,
  config: MarkdownParserConfig,
  extractChaptersCallback: (tokens: ParsedToken[]) => Promise<Chapter[]>
): Promise<DocumentStructure | MarkdownParseError> {
  const tokens = tokenizeMarkdown(content);
  if (tokens instanceof MarkdownParseError) {
    return tokens;
  }

  const documentStructure = await buildDocumentStructure(
    content,
    tokens,
    startTime,
    extractChaptersCallback
  );

  if (documentStructure instanceof MarkdownParseError) {
    return documentStructure;
  }

  const validationResult = validateConfidenceThreshold(
    documentStructure,
    config
  );
  return validationResult instanceof MarkdownParseError
    ? validationResult
    : documentStructure;
}
