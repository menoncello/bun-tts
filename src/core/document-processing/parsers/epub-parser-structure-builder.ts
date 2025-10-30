/**
 * EPUB Parser Structure Builder
 * Contains methods for building complete document structures from extracted components
 */

import type {
  DocumentMetadata,
  Chapter,
  TableOfContentsItem,
  EmbeddedAssets,
  DocumentStructure,
  PerformanceStats,
} from '../types.js';
import { prepareAllMetrics } from './document-metrics-calculator.js';
import {
  createDocumentStructureParams,
  buildDocumentStructure as buildDocumentStructureFromComponents,
  createBaseDocumentStructure,
  createBaseComponents,
} from './document-structure-builders.js';
import { createParseResult } from './epub-parser-helper-utils.js';
import { calculateStatistics } from './epub-parser-statistics.js';
import type {
  EPUBParseOptions,
  DocumentStatistics,
} from './epub-parser-types.js';

/**
 * Builds complete document structure with all components
 * @param {any} documentData - Document components including metadata, chapters, etc.
 * @param {any} documentData.metadata - Document metadata information
 * @param {any} documentData.tableOfContents - Table of contents structure
 * @param {any} documentData.chapters - Array of document chapters
 * @param {any} documentData.embeddedAssets - Embedded media and assets
 * @param {any} options - Parsing configuration options
 * @param {Date} startTime - Parse start time for performance calculation
 * @param {any} performanceStats - Performance statistics object to update
 * @returns {object} object Complete document structure with all components
 */
export function buildCompleteStructure(
  documentData: {
    metadata: DocumentMetadata;
    tableOfContents: TableOfContentsItem[];
    chapters: Chapter[];
    embeddedAssets: EmbeddedAssets;
  },
  options: EPUBParseOptions,
  startTime: number,
  performanceStats: PerformanceStats
): {
  chapters: Chapter[];
  stats: DocumentStatistics;
  documentStructure: DocumentStructure;
} {
  const stats = calculateStatistics(documentData.chapters);
  const structureParams = createDocumentStructureParams({
    documentData,
    stats,
    options,
    startTime,
    performanceStats,
  });
  const documentStructure = buildDocumentStructure(structureParams);

  return {
    chapters: documentData.chapters,
    stats,
    documentStructure,
  };
}

/**
 * Creates final parse result by merging document and content info
 * @param {any} documentInfo - Document metadata, TOC, and assets
 * @param {any} documentInfo.metadata - Document metadata information
 * @param {any} documentInfo.tableOfContents - Table of contents structure
 * @param {any} documentInfo.embeddedAssets - Embedded media and assets
 * @param {any} contentInfo - Chapters, stats, and document structure
 * @param {any} contentInfo.chapters - Array of document chapters
 * @param {any} contentInfo.stats - Document statistics
 * @param {any} contentInfo.documentStructure - Complete document structure
 * @returns {unknown} unknown Merged parse result with all components
 */
export function createParseResultData(
  documentInfo: {
    metadata: DocumentMetadata;
    tableOfContents: TableOfContentsItem[];
    embeddedAssets: EmbeddedAssets;
  },
  contentInfo: {
    chapters: Chapter[];
    stats: DocumentStatistics;
    documentStructure: DocumentStructure;
  }
): {
  metadata: DocumentMetadata;
  tableOfContents: TableOfContentsItem[];
  chapters: Chapter[];
  embeddedAssets: EmbeddedAssets;
  stats: DocumentStatistics;
  documentStructure: DocumentStructure;
} {
  return createParseResult(documentInfo, contentInfo);
}

/**
 * Creates complete document structure by combining all components
 * @param {any} params - Structure parameters object
 * @param {any} params.metadata - Document metadata information
 * @param {any} params.chapters - Array of document chapters
 * @param {any} params.tableOfContents - Table of contents structure
 * @param {any} params.embeddedAssets - Embedded media and assets
 * @param {any} params.stats - Document statistics
 * @param {any} params.options - Parsing configuration options
 * @param {any} params.startTime - Parse start time for performance calculation
 * @param {any} params.performanceStats - Performance statistics object to update
 * @returns {object} object Complete document structure with all required fields
 */
export function buildDocumentStructure(params: {
  metadata: DocumentMetadata;
  chapters: Chapter[];
  tableOfContents: TableOfContentsItem[];
  embeddedAssets: EmbeddedAssets;
  stats: DocumentStatistics;
  options: EPUBParseOptions;
  startTime: number;
  performanceStats: PerformanceStats;
}): DocumentStructure {
  return mergeAllStructureComponents(params);
}

/**
 * Merges all structure components into final document structure
 * @param {any} params - All structure parameters
 * @param {any} params.metadata - Document metadata information
 * @param {any} params.chapters - Array of document chapters
 * @param {any} params.tableOfContents - Table of contents structure
 * @param {any} params.embeddedAssets - Embedded media and assets
 * @param {any} params.stats - Document statistics
 * @param {any} params.options - Parsing configuration options
 * @param {any} params.startTime - Parse start time for performance calculation
 * @param {any} params.performanceStats - Performance statistics object to update
 * @returns {object} object Complete document structure
 */
function mergeAllStructureComponents(params: {
  metadata: DocumentMetadata;
  chapters: Chapter[];
  tableOfContents: TableOfContentsItem[];
  embeddedAssets: EmbeddedAssets;
  stats: DocumentStatistics;
  options: EPUBParseOptions;
  startTime: number;
  performanceStats: PerformanceStats;
}): DocumentStructure {
  const baseStructure = createBaseComponents({
    metadata: params.metadata,
    chapters: params.chapters,
    tableOfContents: params.tableOfContents,
    embeddedAssets: params.embeddedAssets,
  });
  const parseTime = Date.now() - params.startTime;
  const metrics = prepareAllMetrics(params.chapters, params.stats, parseTime);
  return buildDocumentStructureFromComponents(
    baseStructure,
    params,
    metrics.calculated,
    metrics.processing
  );
}

// Re-export the createBaseDocumentStructure function for backward compatibility
export { createBaseDocumentStructure };
