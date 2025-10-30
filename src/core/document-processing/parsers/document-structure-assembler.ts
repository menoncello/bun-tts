/**
 * Document Structure Assembler
 * Functions for assembling document structure from components
 */

import type {
  DocumentMetadata,
  Chapter,
  DocumentStructure,
  PerformanceStats,
  DocumentStatistics,
} from '../types.js';
import { calculateStatistics } from './epub-parser-statistics.js';
import {
  createDocumentStatistics,
  createDefaultPerformanceStats,
} from './epub-parser-structure-builder-utils.js';
import type { EPUBParseOptions } from './epub-parser-types.js';
import { prepareStructureData } from './structure-data-preparator.js';

// ProcessingMetrics type definition
interface ProcessingMetrics {
  parseStartTime: Date;
  parseEndTime: Date;
  parseDurationMs: number;
  sourceLength: number;
  processingErrors: string[];
}

/**
 * Builds complete document structure with all components
 * @param {any} documentData - Document components including metadata, chapters, etc.
 * @param {DocumentMetadata} documentData.metadata - Document metadata information
 * @param {Chapter[]} documentData.chapters - Array of document chapters
 * @param {any} options - Parsing configuration options
 * @param {Date} startTime - Parse start time for performance calculation
 * @param {any} performanceStats - Performance statistics object to update
 * @returns {object} Complete document structure with all components
 */
function _buildCompleteStructure(
  documentData: {
    metadata: DocumentMetadata;
    chapters: Chapter[];
  },
  options: EPUBParseOptions,
  startTime: number,
  performanceStats: PerformanceStats
): {
  chapters: Chapter[];
  stats: DocumentStatistics;
  documentStructure: DocumentStructure;
} {
  const completeStats = _calculateEnhancedStatistics(documentData.chapters);
  const documentStructure = _buildDocumentStructureWithStats({
    documentData,
    completeStats,
    options,
    startTime,
    performanceStats,
  });

  return _createStructureResult(
    documentData.chapters,
    completeStats,
    documentStructure
  );
}

/**
 * Enhances document statistics with required properties
 * @param {any} stats - Basic statistics
 * @param {number} [stats.totalParagraphs] - Total paragraph count
 * @param {number} [stats.totalSentences] - Total sentence count
 * @param {number} [stats.totalWords] - Total word count
 * @param {number} [stats.estimatedReadingTime] - Estimated reading time
 * @param {number} chapterCount - Number of chapters
 * @returns {DocumentStatistics} Enhanced statistics with all required properties
 */
function enhanceDocumentStatistics(
  stats: {
    totalParagraphs?: number;
    totalSentences?: number;
    totalWords?: number;
    estimatedReadingTime?: number;
  },
  chapterCount: number
): DocumentStatistics {
  return {
    totalParagraphs: stats.totalParagraphs || 0,
    totalSentences: stats.totalSentences || 0,
    totalWords: stats.totalWords || 0,
    estimatedReadingTime: stats.estimatedReadingTime || 0,
    chapterCount,
    imageCount: 0,
    tableCount: 0,
  };
}

/**
 * Creates complete document structure by combining all components
 * @param {any} params - Structure parameters object
 * @param {DocumentMetadata} params.metadata - Document metadata information
 * @param {Chapter[]} params.chapters - Array of document chapters
 * @param {DocumentStatistics} params.stats - Document statistics
 * @param {EPUBParseOptions} params.options - Parsing configuration options
 * @param {number} params.startTime - Parse start time for performance calculation
 * @param {PerformanceStats} params.performanceStats - Performance statistics object to update
 * @returns {DocumentStructure} Complete document structure with all required fields
 */
function buildDocumentStructure(params: {
  metadata: DocumentMetadata;
  chapters: Chapter[];
  stats: DocumentStatistics;
  options: EPUBParseOptions;
  startTime: number;
  performanceStats: PerformanceStats;
}): DocumentStructure;

function buildDocumentStructure(
  metadata: DocumentMetadata,
  chapters: Chapter[],
  options: EPUBParseOptions
): DocumentStructure;

function buildDocumentStructure(
  paramsOrMetadata:
    | {
        metadata: DocumentMetadata;
        chapters: Chapter[];
        stats: DocumentStatistics;
        options: EPUBParseOptions;
        startTime: number;
        performanceStats: PerformanceStats;
      }
    | DocumentMetadata,
  chapters?: Chapter[],
  options?: EPUBParseOptions
): DocumentStructure {
  // Check if first parameter is the params object (full signature)
  if (isFullSignatureParams(paramsOrMetadata)) {
    return mergeAllStructureComponents(paramsOrMetadata);
  }

  // Otherwise use simplified signature
  return buildStructureFromSimplifiedParams(
    paramsOrMetadata,
    chapters,
    options
  );
}

/**
 * Checks if the parameter is full signature params object
 * @param {any} paramsOrMetadata - Parameter to check
 * @returns {boolean} True if full signature params object
 */
function isFullSignatureParams(
  paramsOrMetadata:
    | {
        metadata: DocumentMetadata;
        chapters: Chapter[];
        stats: DocumentStatistics;
        options: EPUBParseOptions;
        startTime: number;
        performanceStats: PerformanceStats;
      }
    | DocumentMetadata
): paramsOrMetadata is {
  metadata: DocumentMetadata;
  chapters: Chapter[];
  stats: DocumentStatistics;
  options: EPUBParseOptions;
  startTime: number;
  performanceStats: PerformanceStats;
} {
  return (
    typeof paramsOrMetadata === 'object' &&
    'metadata' in paramsOrMetadata &&
    'stats' in paramsOrMetadata
  );
}

/**
 * Builds structure from simplified signature parameters
 * @param {any} metadata - Document metadata
 * @param {Chapter[]} chapters - Array of document chapters
 * @param {any} options - Parsing configuration options
 * @returns {DocumentStructure} Document structure
 */
function buildStructureFromSimplifiedParams(
  metadata: DocumentMetadata,
  chapters?: Chapter[],
  options?: EPUBParseOptions
): DocumentStructure {
  const chaptersArray = chapters || [];
  const stats = createDocumentStatistics(chaptersArray);
  const startTime = Date.now();
  const performanceStats = createDefaultPerformanceStats(chaptersArray, stats);

  // Create complete stats with required properties
  const completeStats: DocumentStatistics = {
    totalParagraphs: stats.totalParagraphs,
    totalSentences: stats.totalSentences,
    totalWords: stats.totalWords,
    estimatedReadingTime: stats.estimatedReadingTime,
    chapterCount: chaptersArray.length,
    imageCount: 0,
    tableCount: 0,
  };

  return mergeAllStructureComponents({
    metadata,
    chapters: chaptersArray,
    stats: completeStats,
    options: options || {},
    startTime,
    performanceStats,
  });
}

/**
 * Merges all structure components into final document structure
 * @param {any} params - All structure parameters
 * @param {DocumentMetadata} params.metadata - Document metadata information
 * @param {Chapter[]} params.chapters - Array of document chapters
 * @param {DocumentStatistics} params.stats - Document statistics
 * @param {EPUBParseOptions} params.options - Parsing configuration options
 * @param {number} params.startTime - Parse start time for performance calculation
 * @param {PerformanceStats} params.performanceStats - Performance statistics object to update
 * @returns {DocumentStructure} Complete document structure
 */
function mergeAllStructureComponents(params: {
  metadata: DocumentMetadata;
  chapters: Chapter[];
  stats: DocumentStatistics;
  options: EPUBParseOptions;
  startTime: number;
  performanceStats: PerformanceStats;
}): DocumentStructure {
  const baseStructure = createBaseComponents(params);
  const performanceInfo = createPerformanceComponents(params);

  return combineAllComponents(baseStructure, performanceInfo, params);
}

/**
 * Creates base structure components
 * @param {any} params - Structure parameters
 * @param {DocumentMetadata} params.metadata - Document metadata information
 * @param {Chapter[]} params.chapters - Array of document chapters
 * @returns {object} Base structure components
 */
function createBaseComponents(params: {
  metadata: DocumentMetadata;
  chapters: Chapter[];
}): {
  metadata: DocumentMetadata;
  chapters: Chapter[];
} {
  return {
    metadata: params.metadata,
    chapters: params.chapters,
  };
}

/**
 * Creates performance components
 * @param {any} params - Structure parameters
 * @param {Chapter[]} params.chapters - Array of document chapters
 * @param {number} params.startTime - Parse start time
 * @returns {object} Performance components
 */
function createPerformanceComponents(params: {
  chapters: Chapter[];
  startTime: number;
}): {
  parseTimeMs: number;
  chapterCount: number;
} {
  return {
    parseTimeMs: Date.now() - params.startTime,
    chapterCount: params.chapters?.length || 0,
  };
}

/**
 * Combines all structure components
 * @param {any} baseStructure - Base structure components
 * @param {DocumentMetadata} baseStructure.metadata - Document metadata information
 * @param {Chapter[]} baseStructure.chapters - Array of document chapters
 * @param {any} performanceInfo - Performance information
 * @param {number} performanceInfo.parseTimeMs - Time taken to parse in milliseconds
 * @param {number} performanceInfo.chapterCount - Number of chapters
 * @param {any} params - Structure parameters
 * @param {DocumentStatistics} params.stats - Document statistics
 * @param {DocumentMetadata} params.metadata - Document metadata information
 * @param {EPUBParseOptions} params.options - Parsing configuration options
 * @param {number} params.startTime - Parse start time timestamp for calculating processing metrics
 * @returns {DocumentStructure} Combined document structure
 */
function combineAllComponents(
  baseStructure: {
    metadata: DocumentMetadata;
    chapters: Chapter[];
  },
  performanceInfo: {
    parseTimeMs: number;
    chapterCount: number;
  },
  params: {
    stats: DocumentStatistics;
    metadata: DocumentMetadata;
    options: EPUBParseOptions;
    startTime: number;
  }
): DocumentStructure {
  const structureData = prepareStructureData(
    baseStructure,
    params,
    performanceInfo
  );
  return buildFinalStructure(baseStructure, structureData);
}

/**
 * Builds the final document structure
 * @param {any} baseStructure - Base structure components
 * @param {DocumentMetadata} baseStructure.metadata - Document metadata information
 * @param {Chapter[]} baseStructure.chapters - Array of document chapters
 * @param {any} structureData - Prepared structure data
 * @param {ProcessingMetrics} structureData.processingMetrics - Processing metrics information
 * @param {object} structureData.documentTotals - Document totals information
 * @param {number} structureData.estimatedDuration - Estimated duration information
 * @param {number} structureData.documentTotals.totalParagraphs - Total number of paragraphs across all chapters
 * @param {number} structureData.documentTotals.totalSentences - Total number of sentences across all chapters
 * @param {number} structureData.documentTotals.totalWordCount - Total word count across all chapters
 * @param {number} structureData.documentTotals.totalChapters - Total number of chapters in the document
 * @returns {DocumentStructure} Final document structure
 */
function buildFinalStructure(
  baseStructure: {
    metadata: DocumentMetadata;
    chapters: Chapter[];
  },
  structureData: {
    processingMetrics: ProcessingMetrics;
    documentTotals: {
      totalParagraphs: number;
      totalSentences: number;
      totalWordCount: number;
      totalChapters: number;
    };
    estimatedDuration: number;
  }
): DocumentStructure {
  return {
    metadata: baseStructure.metadata,
    chapters: baseStructure.chapters,
    tableOfContents: [],
    ...structureData.documentTotals,
    estimatedTotalDuration: structureData.estimatedDuration,
    confidence: 0.9,
    processingMetrics: structureData.processingMetrics,
  };
}

/**
 * Calculates enhanced statistics for chapters
 * @param {Chapter[]} chapters - Array of chapters
 * @returns {DocumentStatistics} Enhanced statistics
 */
function _calculateEnhancedStatistics(chapters: Chapter[]): DocumentStatistics {
  const stats = calculateStatistics(chapters);
  return enhanceDocumentStatistics(stats, chapters.length);
}

/**
 * Builds document structure with enhanced statistics
 * @param {object} params - Function parameters
 * @param {object} params.documentData - Document data including metadata and chapters
 * @param {DocumentMetadata} params.documentData.metadata - Document metadata
 * @param {Chapter[]} params.documentData.chapters - Array of chapters
 * @param {DocumentStatistics} params.completeStats - Enhanced statistics
 * @param {EPUBParseOptions} params.options - Parsing options
 * @param {number} params.startTime - Start time for performance tracking
 * @param {PerformanceStats} params.performanceStats - Performance statistics
 * @returns {DocumentStructure} Complete document structure
 */
function _buildDocumentStructureWithStats(params: {
  documentData: {
    metadata: DocumentMetadata;
    chapters: Chapter[];
  };
  completeStats: DocumentStatistics;
  options: EPUBParseOptions;
  startTime: number;
  performanceStats: PerformanceStats;
}): DocumentStructure {
  const { documentData, completeStats, options, startTime, performanceStats } =
    params;

  return buildDocumentStructure({
    metadata: documentData.metadata,
    chapters: documentData.chapters,
    stats: completeStats,
    options,
    startTime,
    performanceStats,
  });
}

/**
 * Creates structure result object
 * @param {Chapter[]} chapters - Array of chapters
 * @param {any} stats - Document statistics
 * @param {any} documentStructure - Document structure
 * @returns {object} Structure result object
 */
function _createStructureResult(
  chapters: Chapter[],
  stats: DocumentStatistics,
  documentStructure: DocumentStructure
): {
  chapters: Chapter[];
  stats: DocumentStatistics;
  documentStructure: DocumentStructure;
} {
  return {
    chapters,
    stats,
    documentStructure,
  };
}

export { buildDocumentStructure };
