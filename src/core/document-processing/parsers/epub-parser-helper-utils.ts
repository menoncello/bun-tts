/**
 * EPUB Parser Helper Utilities
 * Additional utility functions for EPUB document parsing operations.
 */

import type {
  DocumentMetadata,
  TableOfContentsItem,
  Chapter,
  EmbeddedAssets,
} from '../types';
import {
  applyCompatibilityFixes,
  applyCompatibilityFixesToTOC,
  type CompatibilityConfig,
} from './epub-parser-compatibility';
import { updatePerformanceStats } from './epub-parser-statistics';
import type { DocumentStatistics } from './epub-parser-types';
import {
  EPUB_LIBRARY_VERSION,
  EPUB_LIBRARY_FEATURES,
} from './epub-parser-utils';

/**
 * Creates compatibility configuration from parsing options
 * @param options - Parsing options containing strict mode setting
 * @param options.strictMode - Whether to enable strict parsing mode
 * @returns CompatibilityConfig for EPUB version handling
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
 * @param metadata - Original document metadata
 * @param tableOfContents - Original table of contents
 * @param compatibilityAnalysis - Analysis of EPUB version compatibility issues
 * @param compatibilityConfig - Configuration for compatibility handling
 * @returns Fixed metadata and table of contents
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
 * @param documentInfo - Document metadata, TOC, and assets
 * @param documentInfo.metadata - Document metadata information
 * @param documentInfo.tableOfContents - Table of contents structure
 * @param documentInfo.embeddedAssets - Embedded media and assets
 * @param contentInfo - Chapters, stats, and document structure
 * @param contentInfo.chapters - Array of document chapters
 * @param contentInfo.stats - Document statistics
 * @param contentInfo.documentStructure - Complete document structure
 * @returns Merged result object with all components
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
 * @returns Library information with version and features
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
 * @param startTime - Start time for parsing
 * @param chapterCount - Number of chapters processed
 * @param performanceStats - Current performance statistics
 * @returns Updated performance statistics
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
 * @param metadata - Document metadata
 * @param chapters - Array of document chapters
 * @param tableOfContents - Table of contents structure
 * @param embeddedAssets - Embedded media and assets
 * @returns Base structure object
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
 * @param stats - Document statistics
 * @returns Statistics structure object
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
 * @param metadata - Document metadata
 * @param options - Parsing configuration options
 * @returns Metadata structure object
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
export type { CompatibilityConfig } from './epub-parser-compatibility';
