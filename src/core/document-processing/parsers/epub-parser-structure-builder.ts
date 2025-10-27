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
} from '../types';
import {
  createParseResult,
  createLibraryInfo,
  createUpdatedPerformanceStats,
  createBaseStructure,
  createStatsStructure,
  createMetaStructure,
} from './epub-parser-helper-utils';
import { calculateStatistics } from './epub-parser-statistics';
import type { EPUBParseOptions, DocumentStatistics } from './epub-parser-types';

/**
 * Creates document structure parameters for building
 * @param params - Document structure parameters
 * @param params.documentData - Document components
 * @param params.documentData.metadata - Document metadata information
 * @param params.documentData.tableOfContents - Table of contents structure
 * @param params.documentData.chapters - Array of document chapters
 * @param params.documentData.embeddedAssets - Embedded media and assets
 * @param params.stats - Document statistics
 * @param params.options - Parsing configuration options
 * @param params.startTime - Parse start time
 * @param params.performanceStats - Performance statistics
 * @returns Parameters for document structure building
 */
function createDocumentStructureParams(params: {
  documentData: {
    metadata: DocumentMetadata;
    tableOfContents: TableOfContentsItem[];
    chapters: Chapter[];
    embeddedAssets: EmbeddedAssets;
  };
  stats: DocumentStatistics;
  options: EPUBParseOptions;
  startTime: number;
  performanceStats: PerformanceStats;
}): {
  metadata: DocumentMetadata;
  chapters: Chapter[];
  tableOfContents: TableOfContentsItem[];
  embeddedAssets: EmbeddedAssets;
  stats: DocumentStatistics;
  options: EPUBParseOptions;
  startTime: number;
  performanceStats: PerformanceStats;
} {
  return mergeDocumentDataWithStats(params);
}

/**
 * Merges document data with stats and options
 * @param params - Document structure parameters
 * @param params.documentData - Document data containing metadata, chapters, etc.
 * @param params.documentData.metadata - Document metadata information
 * @param params.documentData.tableOfContents - Table of contents structure
 * @param params.documentData.chapters - Array of document chapters
 * @param params.documentData.embeddedAssets - Embedded media and assets
 * @param params.stats - Document statistics
 * @param params.options - Parsing configuration options
 * @param params.startTime - Parse start time
 * @param params.performanceStats - Performance statistics
 * @returns Merged parameters
 */
function mergeDocumentDataWithStats(params: {
  documentData: {
    metadata: DocumentMetadata;
    tableOfContents: TableOfContentsItem[];
    chapters: Chapter[];
    embeddedAssets: EmbeddedAssets;
  };
  stats: DocumentStatistics;
  options: EPUBParseOptions;
  startTime: number;
  performanceStats: PerformanceStats;
}): {
  metadata: DocumentMetadata;
  chapters: Chapter[];
  tableOfContents: TableOfContentsItem[];
  embeddedAssets: EmbeddedAssets;
  stats: DocumentStatistics;
  options: EPUBParseOptions;
  startTime: number;
  performanceStats: PerformanceStats;
} {
  const { documentData, ...rest } = params;
  return { ...documentData, ...rest };
}

/**
 * Builds complete document structure with all components
 * @param documentData - Document components including metadata, chapters, etc.
 * @param documentData.metadata - Document metadata information
 * @param documentData.tableOfContents - Table of contents structure
 * @param documentData.chapters - Array of document chapters
 * @param documentData.embeddedAssets - Embedded media and assets
 * @param options - Parsing configuration options
 * @param startTime - Parse start time for performance calculation
 * @param performanceStats - Performance statistics object to update
 * @returns Complete document structure with all components
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
 * @param documentInfo - Document metadata, TOC, and assets
 * @param documentInfo.metadata - Document metadata information
 * @param documentInfo.tableOfContents - Table of contents structure
 * @param documentInfo.embeddedAssets - Embedded media and assets
 * @param contentInfo - Chapters, stats, and document structure
 * @param contentInfo.chapters - Array of document chapters
 * @param contentInfo.stats - Document statistics
 * @param contentInfo.documentStructure - Complete document structure
 * @returns Merged parse result with all components
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
 * @param params - Structure parameters object
 * @param params.metadata - Document metadata information
 * @param params.chapters - Array of document chapters
 * @param params.tableOfContents - Table of contents structure
 * @param params.embeddedAssets - Embedded media and assets
 * @param params.stats - Document statistics
 * @param params.options - Parsing configuration options
 * @param params.startTime - Parse start time for performance calculation
 * @param params.performanceStats - Performance statistics object to update
 * @returns Complete document structure with all required fields
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
 * @param params - All structure parameters
 * @param params.metadata - Document metadata information
 * @param params.chapters - Array of document chapters
 * @param params.tableOfContents - Table of contents structure
 * @param params.embeddedAssets - Embedded media and assets
 * @param params.stats - Document statistics
 * @param params.options - Parsing configuration options
 * @param params.startTime - Parse start time for performance calculation
 * @param params.performanceStats - Performance statistics object to update
 * @returns Complete document structure
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
  const baseStructure = createBaseComponents(params);
  const performanceInfo = createPerformanceComponents(params);

  return combineAllComponents(baseStructure, performanceInfo, params);
}

/**
 * Creates base structure components
 * @param params - Structure parameters
 * @param params.metadata - Document metadata information
 * @param params.chapters - Array of document chapters
 * @param params.tableOfContents - Table of contents structure
 * @param params.embeddedAssets - Embedded media and assets
 * @returns Base structure components
 */
function createBaseComponents(params: {
  metadata: DocumentMetadata;
  chapters: Chapter[];
  tableOfContents: TableOfContentsItem[];
  embeddedAssets: EmbeddedAssets;
}): {
  metadata: DocumentMetadata;
  chapters: Chapter[];
  tableOfContents: TableOfContentsItem[];
  embeddedAssets: EmbeddedAssets;
} {
  return createBaseStructure(
    params.metadata,
    params.chapters,
    params.tableOfContents,
    params.embeddedAssets
  );
}

/**
 * Creates performance components
 * @param params - Structure parameters
 * @param params.chapters - Array of document chapters
 * @param params.startTime - Parse start time
 * @param params.performanceStats - Performance statistics
 * @returns Performance components
 */
function createPerformanceComponents(params: {
  chapters: Chapter[];
  startTime: number;
  performanceStats: PerformanceStats;
}): {
  parseTime: number;
  chapterCount: number;
  performanceStats: PerformanceStats;
} {
  return {
    parseTime: Date.now() - params.startTime,
    chapterCount: params.chapters.length,
    performanceStats: createUpdatedPerformanceStats(
      params.startTime,
      params.chapters.length,
      params.performanceStats
    ),
  };
}

/**
 * Combines all structure components
 * @param baseStructure - Base structure components
 * @param baseStructure.metadata - Document metadata information
 * @param baseStructure.chapters - Array of document chapters
 * @param baseStructure.tableOfContents - Table of contents structure
 * @param baseStructure.embeddedAssets - Embedded media and assets
 * @param performanceInfo - Performance information
 * @param performanceInfo.parseTime - Time taken to parse
 * @param performanceInfo.chapterCount - Number of chapters
 * @param performanceInfo.performanceStats - Performance statistics
 * @param params - Structure parameters
 * @param params.stats - Document statistics
 * @param params.metadata - Document metadata information
 * @param params.options - Parsing configuration options
 * @returns Combined document structure
 */
function combineAllComponents(
  baseStructure: {
    metadata: DocumentMetadata;
    chapters: Chapter[];
    tableOfContents: TableOfContentsItem[];
    embeddedAssets: EmbeddedAssets;
  },
  performanceInfo: {
    parseTime: number;
    chapterCount: number;
    performanceStats: PerformanceStats;
  },
  params: {
    stats: DocumentStatistics;
    metadata: DocumentMetadata;
    options: EPUBParseOptions;
  }
): DocumentStructure {
  return {
    ...baseStructure,
    ...createStatsStructure(params.stats),
    ...createMetaStructure(params.metadata, params.options),
    ...performanceInfo,
  };
}

/**
 * Creates base document structure components
 * @param metadata - Document metadata information
 * @param chapters - Array of document chapters
 * @param tableOfContents - Table of contents structure
 * @param embeddedAssets - Embedded media and assets
 * @returns Base structure with library and performance info
 */
export function createBaseDocumentStructure(
  metadata: DocumentMetadata,
  chapters: Chapter[],
  tableOfContents: TableOfContentsItem[],
  embeddedAssets: EmbeddedAssets
): Pick<
  DocumentStructure,
  'metadata' | 'chapters' | 'tableOfContents' | 'embeddedAssets'
> {
  return createBaseStructure(
    metadata,
    chapters,
    tableOfContents,
    embeddedAssets
  );
}

/**
 * Creates library and performance information
 * @param chapterCount - Number of chapters processed
 * @param startTime - Parse start time for performance calculation
 * @param performanceStats - Performance statistics object to update
 * @returns Library and performance information
 */
export function createPerformanceInfo(
  chapterCount: number,
  startTime: number,
  performanceStats: PerformanceStats
): Pick<DocumentStructure, 'libraryInfo' | 'performanceStats'> {
  return {
    libraryInfo: createLibraryInfo(),
    performanceStats: createUpdatedPerformanceStats(
      startTime,
      chapterCount,
      performanceStats
    ),
  };
}
