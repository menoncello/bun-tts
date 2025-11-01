/**
 * Document structure creation utilities for Markdown parser.
 * Handles document metrics calculation and final structure creation.
 */

import type { MarkdownParserConfig } from '../config/markdown-parser-config';
import { MarkdownParseError } from '../errors/markdown-parse-error';
import type {
  DocumentStructure,
  DocumentMetadata,
  Chapter,
  MarkdownElement,
} from '../types';
import { calculateDocumentConfidence } from './document-confidence';
import { extractMetadata } from './document-metadata-extractor';
import {
  calculateStatisticsFromChapters,
  calculateEstimatedDurationFromChapters,
} from './document-utils';
import { extractElements } from './element-extractor';
import { validateConfidenceThreshold } from './parser-config';
import { tokenizeMarkdown, type ParsedToken } from './parser-core';

/** Processing metrics for document structure */
export interface ProcessingMetrics {
  parseStartTime: Date;
  parseEndTime: Date;
  parseDurationMs: number;
  sourceLength: number;
  processingErrors: string[];
}

/** Interface for document metrics calculation result */
interface DocumentMetricsResult {
  statistics: { totalParagraphs: number; totalSentences: number };
  estimatedDuration: number;
  confidence: number;
}

/**
 * Build document structure from tokens
 * @param {string} content - Original markdown content
 * @param {ParsedToken[] | MarkdownParseError} tokens - Array of parsed tokens or parse error
 * @param {Date} startTime - Start time for processing metrics
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
 * Calculate document processing metrics
 * @param {Chapter[]} chapters - Array of processed chapters
 * @param {DocumentMetadata} metadata - Document metadata
 * @param {ProcessingMetrics} _metrics - Processing metrics (unused parameter)
 * @param {MarkdownElement[]} _elements - Array of markdown elements (unused parameter)
 * @returns {DocumentMetricsResult} Processing statistics and confidence
 */
const calculateDocumentMetrics = (
  chapters: Chapter[],
  metadata: DocumentMetadata,
  _metrics: ProcessingMetrics,
  _elements: MarkdownElement[] = []
): DocumentMetricsResult => {
  const statistics = calculateStatisticsFromChapters(chapters);
  const estimatedDuration = calculateEstimatedDurationFromChapters(chapters);
  const confidence = calculateDocumentConfidence(
    chapters,
    statistics.totalParagraphs,
    statistics.totalSentences,
    metadata.wordCount
  );

  return { statistics, estimatedDuration, confidence };
};

/**
 * Create document stats object
 * @param {ProcessingMetrics} metrics - Processing metrics to extract stats from
 * @param {number} totalWords - Total word count in the document
 * @returns {{totalWords: number, processingTime: number, confidenceScore: number, extractionMethod: string}} Document stats object
 */
const createDocumentStats = (
  metrics: ProcessingMetrics,
  totalWords = 0
): {
  totalWords: number;
  processingTime: number;
  confidenceScore: number;
  extractionMethod: string;
} => ({
  totalWords,
  processingTime: metrics.parseDurationMs,
  confidenceScore: 0.95, // Default confidence
  extractionMethod: 'markdown',
});

/**
 * Extract elements from content
 * @param {string} content - Content to extract elements from
 * @returns {MarkdownElement[]} Extracted elements
 */
function extractContentElements(content: string): MarkdownElement[] {
  const tokens = tokenizeMarkdown(content);
  return tokens instanceof MarkdownParseError ? [] : extractElements(tokens);
}

/**
 * Create processing metrics object
 * @param {number} contentLength - Length of the content
 * @returns {ProcessingMetrics} Processing metrics object
 */
function createProcessingMetrics(contentLength: number): ProcessingMetrics {
  return {
    parseStartTime: new Date(),
    parseEndTime: new Date(),
    parseDurationMs: 0,
    sourceLength: contentLength,
    processingErrors: [],
  };
}

/**
 * Create the final document structure object
 * @param {string} content - Original markdown content
 * @param {DocumentMetadata} metadata - Document metadata
 * @param {Chapter[]} chapters - Array of processed chapters
 * @param {ProcessingMetrics} metrics - Processing metrics
 * @returns {DocumentStructure} Complete document structure
 */
export const createDocumentStructure = (
  content: string,
  metadata: DocumentMetadata,
  chapters: Chapter[],
  metrics: ProcessingMetrics
): DocumentStructure => {
  const elements = extractContentElements(content);
  const { statistics, estimatedDuration, confidence } =
    calculateDocumentMetrics(chapters, metadata, metrics, elements);
  const processingMetrics = createProcessingMetrics(content.length);

  return {
    metadata,
    chapters,
    elements,
    totalParagraphs: statistics.totalParagraphs,
    totalSentences: statistics.totalSentences,
    totalChapters: chapters.length,
    totalWordCount: metadata.wordCount,
    estimatedTotalDuration: estimatedDuration,
    confidence,
    stats: createDocumentStats(metrics, metadata.wordCount),
    processingMetrics,
  };
};

/**
 * Build document structure from content
 *
 * @param {string} content - Original markdown content
 * @param {Date} startTime - Start time for processing metrics
 * @param {MarkdownParserConfig} config - Parser configuration
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
