/**
 * Structure Data Preparator
 * Functions for preparing structure data components
 */

import type { DocumentMetadata, Chapter } from '../types.js';
import {
  calculateDocumentTotals,
  calculateEstimatedDuration,
  createProcessingMetrics,
} from './epub-parser-structure-builder-utils.js';
import type {
  DocumentStatistics,
  EPUBParseOptions,
} from './epub-parser-types.js';

// ProcessingMetrics type definition
interface ProcessingMetrics {
  parseStartTime: Date;
  parseEndTime: Date;
  parseDurationMs: number;
  sourceLength: number;
  processingErrors: string[];
}

/**
 * Creates processing metrics for structure data
 * @param {object} params - Parameters for creating processing metrics
 * @param {DocumentStatistics} params.stats - Document statistics containing parsed content metrics
 * @param {DocumentMetadata} params.metadata - Document metadata information
 * @param {EPUBParseOptions} params.options - Parsing configuration options
 * @param {number} params.startTime - Parse start time timestamp for calculating processing metrics
 * @param {object} performanceInfo - Performance information from parsing
 * @param {number} performanceInfo.parseTimeMs - Time taken to parse in milliseconds
 * @param {number} performanceInfo.chapterCount - Number of chapters parsed
 * @returns {ProcessingMetrics} Processing metrics object containing timing and performance data
 */
function createStructureProcessingMetrics(
  params: {
    stats: DocumentStatistics;
    metadata: DocumentMetadata;
    options: EPUBParseOptions;
    startTime: number;
  },
  performanceInfo: { parseTimeMs: number; chapterCount: number }
): ProcessingMetrics {
  return createProcessingMetrics(params, performanceInfo);
}

/**
 * Creates document totals from chapters
 * @param {Chapter[]} chapters - Array of document chapters to calculate totals from
 * @param {DocumentStatistics} stats - Document statistics containing base metrics
 * @param {object} performanceInfo - Performance information from parsing
 * @param {number} performanceInfo.parseTimeMs - Time taken to parse in milliseconds
 * @param {number} performanceInfo.chapterCount - Number of chapters parsed
 * @returns {object} Document totals including paragraphs, sentences, words, and chapters
 */
function createDocumentTotals(
  chapters: Chapter[],
  stats: DocumentStatistics,
  performanceInfo: { parseTimeMs: number; chapterCount: number }
): {
  totalParagraphs: number;
  totalSentences: number;
  totalWordCount: number;
  totalChapters: number;
} {
  return calculateDocumentTotals(chapters, stats, performanceInfo);
}

/**
 * Calculates processing metrics for structure data
 * @param {object} params - Structure parameters for calculations
 * @param {DocumentStatistics} params.stats - Document statistics containing parsed content metrics
 * @param {DocumentMetadata} params.metadata - Document metadata information
 * @param {EPUBParseOptions} params.options - Parsing configuration options
 * @param {number} params.startTime - Parse start time timestamp for calculating processing metrics
 * @param {object} performanceInfo - Performance information from parsing
 * @param {number} performanceInfo.parseTimeMs - Time taken to parse in milliseconds
 * @param {number} performanceInfo.chapterCount - Number of chapters parsed
 * @returns {ProcessingMetrics} Processing metrics object containing timing and performance data
 */
function calculateProcessingMetrics(
  params: {
    stats: DocumentStatistics;
    metadata: DocumentMetadata;
    options: EPUBParseOptions;
    startTime: number;
  },
  performanceInfo: { parseTimeMs: number; chapterCount: number }
): ProcessingMetrics {
  return createStructureProcessingMetrics(params, performanceInfo);
}

/**
 * Calculates document totals from chapters
 * @param {Chapter[]} chapters - Array of document chapters to calculate totals from
 * @param {DocumentStatistics} stats - Document statistics containing base metrics
 * @param {object} performanceInfo - Performance information from parsing
 * @param {number} performanceInfo.parseTimeMs - Time taken to parse in milliseconds
 * @param {number} performanceInfo.chapterCount - Number of chapters parsed
 * @returns {object} Document totals including paragraphs, sentences, words, and chapters
 */
function calculateTotals(
  chapters: Chapter[],
  stats: DocumentStatistics,
  performanceInfo: { parseTimeMs: number; chapterCount: number }
): {
  totalParagraphs: number;
  totalSentences: number;
  totalWordCount: number;
  totalChapters: number;
} {
  return createDocumentTotals(chapters, stats, performanceInfo);
}

/**
 * Calculates and assembles structure data components
 * @param {object} baseStructure - Base structure components containing metadata and chapters
 * @param {Chapter[]} baseStructure.chapters - Array of document chapters
 * @param {object} params - Structure parameters for calculations
 * @param {DocumentStatistics} params.stats - Document statistics containing parsed content metrics
 * @param {DocumentMetadata} params.metadata - Document metadata information
 * @param {EPUBParseOptions} params.options - Parsing configuration options
 * @param {number} params.startTime - Parse start time timestamp for calculating processing metrics
 * @param {object} performanceInfo - Performance information from parsing
 * @param {number} performanceInfo.parseTimeMs - Time taken to parse in milliseconds
 * @param {number} performanceInfo.chapterCount - Number of chapters parsed
 * @returns {object} Prepared structure data containing processing metrics, document totals, and estimated duration
 */
function assembleStructureData(
  baseStructure: { chapters: Chapter[] },
  params: {
    stats: DocumentStatistics;
    metadata: DocumentMetadata;
    options: EPUBParseOptions;
    startTime: number;
  },
  performanceInfo: { parseTimeMs: number; chapterCount: number }
): {
  processingMetrics: ProcessingMetrics;
  documentTotals: {
    totalParagraphs: number;
    totalSentences: number;
    totalWordCount: number;
    totalChapters: number;
  };
  estimatedDuration: number;
} {
  const processingMetrics = calculateProcessingMetrics(params, performanceInfo);
  const documentTotals = calculateTotals(
    baseStructure.chapters,
    params.stats,
    performanceInfo
  );
  const estimatedDuration = calculateEstimatedDuration(baseStructure.chapters);

  return { processingMetrics, documentTotals, estimatedDuration };
}

/**
 * Prepares structure data by calculating metrics and totals
 * @param {object} baseStructure - Base structure components containing metadata and chapters
 * @param {DocumentMetadata} baseStructure.metadata - Document metadata information
 * @param {Chapter[]} baseStructure.chapters - Array of document chapters
 * @param {object} params - Structure parameters for calculations
 * @param {DocumentStatistics} params.stats - Document statistics containing parsed content metrics
 * @param {DocumentMetadata} params.metadata - Document metadata information
 * @param {EPUBParseOptions} params.options - Parsing configuration options
 * @param {number} params.startTime - Parse start time timestamp for calculating processing metrics
 * @param {object} performanceInfo - Performance information from parsing
 * @param {number} performanceInfo.parseTimeMs - Time taken to parse in milliseconds
 * @param {number} performanceInfo.chapterCount - Number of chapters parsed
 * @returns {object} Prepared structure data containing processing metrics, document totals, and estimated duration
 */
export function prepareStructureData(
  baseStructure: { metadata: DocumentMetadata; chapters: Chapter[] },
  params: {
    stats: DocumentStatistics;
    metadata: DocumentMetadata;
    options: EPUBParseOptions;
    startTime: number;
  },
  performanceInfo: { parseTimeMs: number; chapterCount: number }
): {
  processingMetrics: ProcessingMetrics;
  documentTotals: {
    totalParagraphs: number;
    totalSentences: number;
    totalWordCount: number;
    totalChapters: number;
  };
  estimatedDuration: number;
} {
  return assembleStructureData(baseStructure, params, performanceInfo);
}
