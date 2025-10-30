/**
 * Document Structure Factory
 * Factory functions for creating document structure components
 */

import type {
  DocumentMetadata,
  Chapter,
  DocumentStructure,
  PerformanceStats,
} from '../types.js';
import {
  calculateDocumentConfidence,
  createDefaultProcessingMetrics,
} from './epub-parser-structure-builder-utils.js';
import type {
  EPUBParseOptions,
  DocumentStatistics,
} from './epub-parser-types.js';

/**
 * Creates base document structure from metadata and chapters
 * @param {DocumentMetadata} metadata - Document metadata information containing title, author, and other metadata
 * @param {Chapter[]} chapters - Array of document chapters with their content and structure
 * @returns {DocumentStructure} Base document structure with calculated statistics and processing metrics
 */
function _createBaseDocumentStructure(
  metadata: DocumentMetadata,
  chapters: Chapter[]
): DocumentStructure {
  return {
    metadata,
    chapters,
    tableOfContents: [],
    totalParagraphs: chapters.reduce(
      (sum, ch) => sum + ch.paragraphs.length,
      0
    ),
    totalSentences: chapters.reduce(
      (sum, ch) =>
        sum + ch.paragraphs.reduce((pSum, p) => pSum + p.sentences.length, 0),
      0
    ),
    totalWordCount: chapters.reduce((sum, ch) => sum + ch.wordCount, 0),
    totalChapters: chapters.length,
    estimatedTotalDuration: chapters.reduce(
      (sum, ch) => sum + ch.estimatedDuration,
      0
    ),
    confidence: calculateDocumentConfidence(chapters),
    processingMetrics: createDefaultProcessingMetrics(),
  };
}

/**
 * Creates document structure parameters for building
 * @param {object} params - Document structure parameters
 * @param {object} params.documentData - Document components
 * @param {DocumentMetadata} params.documentData.metadata - Document metadata information
 * @param {Chapter[]} params.documentData.chapters - Array of document chapters
 * @param {DocumentStatistics} params.stats - Document statistics
 * @param {EPUBParseOptions} params.options - Parsing configuration options
 * @param {number} params.startTime - Parse start time
 * @param {PerformanceStats} params.performanceStats - Performance statistics
 * @returns {{metadata: DocumentMetadata, chapters: Chapter[], stats: DocumentStatistics, options: EPUBParseOptions, startTime: number, performanceStats: PerformanceStats}} Parameters for document structure building
 */
export function createDocumentStructureParams(params: {
  documentData: {
    metadata: DocumentMetadata;
    chapters: Chapter[];
  };
  stats: DocumentStatistics;
  options: EPUBParseOptions;
  startTime: number;
  performanceStats: PerformanceStats;
}): {
  metadata: DocumentMetadata;
  chapters: Chapter[];
  stats: DocumentStatistics;
  options: EPUBParseOptions;
  startTime: number;
  performanceStats: PerformanceStats;
} {
  return mergeDocumentDataWithStats(params);
}

/**
 * Merges document data with stats and options
 * @param {object} params - Document structure parameters
 * @param {object} params.documentData - Document data containing metadata, chapters, etc.
 * @param {DocumentMetadata} params.documentData.metadata - Document metadata information
 * @param {Chapter[]} params.documentData.chapters - Array of document chapters
 * @param {DocumentStatistics} params.stats - Document statistics
 * @param {EPUBParseOptions} params.options - Parsing configuration options
 * @param {number} params.startTime - Parse start time
 * @param {PerformanceStats} params.performanceStats - Performance statistics
 * @returns {{metadata: DocumentMetadata, chapters: Chapter[], stats: DocumentStatistics, options: EPUBParseOptions, startTime: number, performanceStats: PerformanceStats}} Merged parameters
 */
function mergeDocumentDataWithStats(params: {
  documentData: {
    metadata: DocumentMetadata;
    chapters: Chapter[];
  };
  stats: DocumentStatistics;
  options: EPUBParseOptions;
  startTime: number;
  performanceStats: PerformanceStats;
}): {
  metadata: DocumentMetadata;
  chapters: Chapter[];
  stats: DocumentStatistics;
  options: EPUBParseOptions;
  startTime: number;
  performanceStats: PerformanceStats;
} {
  const { documentData, ...rest } = params;
  return { ...documentData, ...rest };
}
