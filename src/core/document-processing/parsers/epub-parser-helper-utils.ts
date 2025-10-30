/**
 * EPUB Parser Helper Utilities
 * Additional utility functions for EPUB document parsing operations.
 */

import type {
  DocumentMetadata,
  TableOfContentsItem,
  Chapter,
  EmbeddedAssets,
} from '../types.js';
import {
  applyCompatibilityFixes,
  applyCompatibilityFixesToTOC,
  type CompatibilityConfig,
} from './epub-parser-compatibility.js';
import { updatePerformanceStats } from './epub-parser-statistics.js';
import type { DocumentStatistics } from './epub-parser-types.js';
import {
  EPUB_LIBRARY_VERSION,
  EPUB_LIBRARY_FEATURES,
} from './epub-parser-utils.js';

/**
 * Creates compatibility configuration from parsing options
 * @param {{strictMode?: boolean}} options - Parsing options containing strict mode setting
 * @param {boolean} options.strictMode - Whether to enable strict parsing mode
 * @returns {CompatibilityConfig} CompatibilityConfig for EPUB version handling
 */
export function createCompatibilityConfig(options: {
  strictMode?: boolean;
}): CompatibilityConfig {
  return {
    strictMode: options.strictMode || false,
    enableFallbacks: true,
    logCompatibilityWarnings: true,
  };
}

/**
 * Applies compatibility fixes to metadata and table of contents
 * @param {any} metadata - Original document metadata
 * @param {any} tableOfContents - Original table of contents
 * @param {any} compatibilityAnalysis - Analysis of EPUB version compatibility issues
 * @param {any} compatibilityConfig - Configuration for compatibility handling
 * @returns {unknown} unknown Fixed metadata and table of contents
 */
export function applyFixesToMetadataAndTOC(
  metadata: DocumentMetadata,
  tableOfContents: TableOfContentsItem[],
  compatibilityAnalysis: import('./epub-parser-compatibility').CompatibilityAnalysis,
  compatibilityConfig: CompatibilityConfig
): {
  fixedMetadata: DocumentMetadata;
  fixedTableOfContents: TableOfContentsItem[];
} {
  const fixedMetadata = applyCompatibilityFixes(
    metadata,
    compatibilityAnalysis,
    compatibilityConfig
  );
  const fixedTableOfContents = applyCompatibilityFixesToTOC(
    tableOfContents,
    compatibilityAnalysis,
    compatibilityConfig
  );
  return { fixedMetadata, fixedTableOfContents };
}

/**
 * Merges document and content information into complete parse result
 * @param {{metadata: DocumentMetadata, tableOfContents: TableOfContentsItem[], embeddedAssets: EmbeddedAssets}} documentInfo - Document metadata, TOC, and assets
 * @param {DocumentMetadata} documentInfo.metadata - Document metadata information
 * @param {TableOfContentsItem[]} documentInfo.tableOfContents - Table of contents structure
 * @param {EmbeddedAssets} documentInfo.embeddedAssets - Embedded media and assets
 * @param {{chapters: Chapter[], stats: DocumentStatistics, documentStructure: DocumentStructure}} contentInfo - Chapters, stats, and document structure
 * @param {Chapter[]} contentInfo.chapters - Array of document chapters
 * @param {DocumentStatistics} contentInfo.stats - Document statistics
 * @param {DocumentStructure} contentInfo.documentStructure - Complete document structure
 * @returns {{metadata: DocumentMetadata, tableOfContents: TableOfContentsItem[], chapters: Chapter[], embeddedAssets: EmbeddedAssets, stats: DocumentStatistics, documentStructure: DocumentStructure}} Merged result object with all components
 */
export function createParseResult(
  documentInfo: {
    metadata: DocumentMetadata;
    tableOfContents: TableOfContentsItem[];
    embeddedAssets: EmbeddedAssets;
  },
  contentInfo: {
    chapters: Chapter[];
    stats: DocumentStatistics;
    documentStructure: import('../types').DocumentStructure;
  }
): {
  metadata: DocumentMetadata;
  tableOfContents: TableOfContentsItem[];
  chapters: Chapter[];
  embeddedAssets: EmbeddedAssets;
  stats: DocumentStatistics;
  documentStructure: import('../types').DocumentStructure;
} {
  return {
    ...documentInfo,
    ...contentInfo,
  };
}

/**
 * Creates library information object for document structure
 * @returns {unknown} unknown Library information with version and features
 */
export function createLibraryInfo(): {
  name: string;
  version: string;
  features: string[];
} {
  return {
    name: '@smoores/epub',
    version: EPUB_LIBRARY_VERSION,
    features: EPUB_LIBRARY_FEATURES,
  };
}

/**
 * Updates performance statistics and returns updated stats
 * @param {Date} startTime - Start time for parsing
 * @param {number} chapterCount - Number of chapters processed
 * @param {any} performanceStats - Current performance statistics
 * @returns {unknown} unknown Updated performance statistics
 */
export function createUpdatedPerformanceStats(
  startTime: number,
  chapterCount: number,
  performanceStats: import('../types').PerformanceStats
): import('../types').PerformanceStats {
  return updatePerformanceStats(startTime, chapterCount, performanceStats);
}

/**
 * Creates base document structure with core content
 * @param {any} metadata - Document metadata
 * @param {Chapter[]} chapters - Array of document chapters
 * @param {any} tableOfContents - Table of contents structure
 * @param {any} embeddedAssets - Embedded media and assets
 * @returns {object} object Base structure object
 */
export function createBaseStructure(
  metadata: import('../types').DocumentMetadata,
  chapters: Array<import('../types').Chapter>,
  tableOfContents: Array<import('../types').TableOfContentsItem>,
  embeddedAssets: import('../types').EmbeddedAssets
): {
  metadata: import('../types').DocumentMetadata;
  chapters: Array<import('../types').Chapter>;
  tableOfContents: Array<import('../types').TableOfContentsItem>;
  embeddedAssets: import('../types').EmbeddedAssets;
} {
  return {
    metadata,
    chapters,
    tableOfContents,
    embeddedAssets,
  };
}

/**
 * Creates statistics structure for document
 * @param {any} stats - Document statistics
 * @returns {object} object Statistics structure object
 */
export function createStatsStructure(
  stats: import('./epub-parser-types').DocumentStatistics
): {
  totalParagraphs: number;
  totalSentences: number;
  totalWords: number;
  estimatedReadingTime: number;
} {
  return {
    totalParagraphs: stats.totalParagraphs,
    totalSentences: stats.totalSentences,
    totalWords: stats.totalWords,
    estimatedReadingTime: stats.estimatedReadingTime,
  };
}

/**
 * Creates metadata structure for document
 * @param {any} metadata - Document metadata
 * @param {any} options - Parsing configuration options
 * @returns {object} object Metadata structure object
 */
export function createMetaStructure(
  metadata: import('../types').DocumentMetadata,
  options: import('./epub-parser-types').EPUBParseOptions
): {
  version: string;
  warnings: string[];
  configApplied: Record<string, unknown>;
} {
  return {
    version: metadata.version || 'unknown',
    warnings: [],
    configApplied: options.config || {},
  };
}

// Re-export CompatibilityConfig for use in other modules
export type { CompatibilityConfig } from './epub-parser-compatibility.js';
