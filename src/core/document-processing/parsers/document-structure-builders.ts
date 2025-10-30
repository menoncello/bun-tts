/**
 * Document Structure Builders
 * Contains utilities for building document structure components
 */

import type {
  DocumentMetadata,
  Chapter,
  TableOfContentsItem,
  EmbeddedAssets,
  DocumentStructure,
  DocumentStatistics,
  PerformanceStats,
} from '../types.js';
import {
  createBaseStructure,
  createStatsStructure,
  createMetaStructure,
} from './epub-parser-helper-utils.js';
import type { EPUBParseOptions } from './epub-parser-types.js';

/**
 * Base structure components interface
 */
interface BaseStructureComponents {
  metadata: DocumentMetadata;
  chapters: Chapter[];
  tableOfContents: TableOfContentsItem[];
  embeddedAssets: EmbeddedAssets;
}

/**
 * Document build parameters interface
 */
interface DocumentBuildParams {
  stats: DocumentStatistics;
  metadata: DocumentMetadata;
  options: EPUBParseOptions;
}

/**
 * Calculated metrics interface
 */
interface CalculatedMetrics {
  totalWordCount: number;
  totalChapters: number;
  estimatedTotalDuration: number;
}

/**
 * Processing metrics interface
 */
interface ProcessingMetrics {
  parseStartTime: Date;
  parseEndTime: Date;
  parseDurationMs: number;
  sourceLength: number;
  processingErrors: never[];
}

/**
 * Creates document structure parameters for building
 * @param {object} params - Document structure parameters
 * @param {object} params.documentData - Document components
 * @param {DocumentMetadata} params.documentData.metadata - Document metadata information
 * @param {TableOfContentsItem[]} params.documentData.tableOfContents - Table of contents structure
 * @param {Chapter[]} params.documentData.chapters - Array of document chapters
 * @param {EmbeddedAssets} params.documentData.embeddedAssets - Embedded media and assets
 * @param {DocumentStatistics} params.stats - Document statistics
 * @param {EPUBParseOptions} params.options - Parsing configuration options
 * @param {number} params.startTime - Parse start time
 * @param {PerformanceStats} params.performanceStats - Performance statistics
 * @returns {object} Parameters for document structure building
 */
export function createDocumentStructureParams(params: {
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
 * @param {object} params - Document structure parameters
 * @param {object} params.documentData - Document data containing metadata, chapters, etc.
 * @param {DocumentMetadata} params.documentData.metadata - Document metadata information
 * @param {TableOfContentsItem[]} params.documentData.tableOfContents - Table of contents structure
 * @param {Chapter[]} params.documentData.chapters - Array of document chapters
 * @param {EmbeddedAssets} params.documentData.embeddedAssets - Embedded media and assets
 * @param {DocumentStatistics} params.stats - Document statistics
 * @param {EPUBParseOptions} params.options - Parsing configuration options
 * @param {number} params.startTime - Parse start time
 * @param {PerformanceStats} params.performanceStats - Performance statistics
 * @returns {object} Merged parameters
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
 * Creates base structure components
 * @param {object} params - Structure parameters
 * @param {DocumentMetadata} params.metadata - Document metadata information
 * @param {Chapter[]} params.chapters - Array of document chapters
 * @param {TableOfContentsItem[]} params.tableOfContents - Table of contents structure
 * @param {EmbeddedAssets} params.embeddedAssets - Embedded media and assets
 * @returns {object} Base structure components
 */
export function createBaseComponents(params: {
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
 * Builds the final document structure by combining all components
 * @param {BaseStructureComponents} baseStructure - Base structure components
 * @param {DocumentBuildParams} params - Structure parameters
 * @param {CalculatedMetrics} calculatedMetrics - Calculated document metrics
 * @param {ProcessingMetrics} processingMetrics - Processing metrics
 * @returns {DocumentStructure} Complete document structure
 */
export function buildDocumentStructure(
  baseStructure: BaseStructureComponents,
  params: DocumentBuildParams,
  calculatedMetrics: CalculatedMetrics,
  processingMetrics: ProcessingMetrics
): DocumentStructure {
  return assembleDocumentStructure(
    baseStructure,
    params,
    calculatedMetrics,
    processingMetrics
  );
}

/**
 * Assembles document structure from all components
 * @param {BaseStructureComponents} baseStructure - Base structure components
 * @param {DocumentBuildParams} params - Structure parameters
 * @param {CalculatedMetrics} calculatedMetrics - Calculated document metrics
 * @param {ProcessingMetrics} processingMetrics - Processing metrics
 * @returns {DocumentStructure} Complete document structure
 */
function assembleDocumentStructure(
  baseStructure: BaseStructureComponents,
  params: DocumentBuildParams,
  calculatedMetrics: CalculatedMetrics,
  processingMetrics: ProcessingMetrics
): DocumentStructure {
  return createCompleteStructure(
    baseStructure,
    params,
    calculatedMetrics,
    processingMetrics
  );
}

/**
 * Creates complete document structure by combining all components
 * @param {BaseStructureComponents} baseStructure - Base structure components
 * @param {DocumentBuildParams} params - Structure parameters
 * @param {CalculatedMetrics} calculatedMetrics - Calculated document metrics
 * @param {ProcessingMetrics} processingMetrics - Processing metrics
 * @returns {DocumentStructure} Complete document structure
 */
function createCompleteStructure(
  baseStructure: BaseStructureComponents,
  params: DocumentBuildParams,
  calculatedMetrics: CalculatedMetrics,
  processingMetrics: ProcessingMetrics
): DocumentStructure {
  return assembleFinalStructure(
    baseStructure,
    params,
    calculatedMetrics,
    processingMetrics
  );
}

/**
 * Assembles final document structure from all components
 * @param {BaseStructureComponents} baseStructure - Base structure components
 * @param {DocumentBuildParams} params - Structure parameters
 * @param {CalculatedMetrics} calculatedMetrics - Calculated document metrics
 * @param {ProcessingMetrics} processingMetrics - Processing metrics
 * @returns {DocumentStructure} Complete document structure
 */
function assembleFinalStructure(
  baseStructure: BaseStructureComponents,
  params: DocumentBuildParams,
  calculatedMetrics: CalculatedMetrics,
  processingMetrics: ProcessingMetrics
): DocumentStructure {
  const coreData = buildCoreStructure(baseStructure, params, calculatedMetrics);
  return finalizeStructure(coreData, processingMetrics);
}

/**
 * Builds the core structure by combining base data with metrics
 * @param {BaseStructureComponents} baseStructure - Base structure components
 * @param {DocumentBuildParams} params - Structure parameters
 * @param {CalculatedMetrics} calculatedMetrics - Calculated document metrics
 * @returns {object} Core structure data
 */
function buildCoreStructure(
  baseStructure: BaseStructureComponents,
  params: DocumentBuildParams,
  calculatedMetrics: CalculatedMetrics
): Omit<DocumentStructure, 'processingMetrics'> {
  return combineStructureData(baseStructure, params, calculatedMetrics);
}

/**
 * Finalizes structure by adding processing information
 * @param {object} coreData - Core structure data
 * @param {ProcessingMetrics} processingMetrics - Processing metrics
 * @returns {DocumentStructure} Final document structure
 */
function finalizeStructure(
  coreData: Omit<DocumentStructure, 'processingMetrics'>,
  processingMetrics: ProcessingMetrics
): DocumentStructure {
  return addProcessingInfo(coreData, processingMetrics);
}

/**
 * Combines base structure, stats, metadata, and metrics
 * @param {BaseStructureComponents} baseStructure - Base structure components
 * @param {DocumentBuildParams} params - Structure parameters
 * @param {CalculatedMetrics} calculatedMetrics - Calculated document metrics
 * @returns {object} Combined structure data
 */
function combineStructureData(
  baseStructure: BaseStructureComponents,
  params: DocumentBuildParams,
  calculatedMetrics: CalculatedMetrics
): Omit<DocumentStructure, 'processingMetrics'> {
  return {
    ...baseStructure,
    ...createStatsStructure(params.stats),
    ...createMetaStructure(params.metadata, params.options),
    ...calculatedMetrics,
    confidence: 1.0, // Default confidence
  };
}

/**
 * Adds processing information to structure data
 * @param {object} structureData - Combined structure data
 * @param {ProcessingMetrics} processingMetrics - Processing metrics
 * @returns {DocumentStructure} Complete document structure with processing info
 */
function addProcessingInfo(
  structureData: Omit<DocumentStructure, 'processingMetrics'>,
  processingMetrics: ProcessingMetrics
): DocumentStructure {
  return {
    ...structureData,
    processingMetrics,
  };
}

/**
 * Creates base document structure components
 * @param {DocumentMetadata} metadata - Document metadata information
 * @param {Chapter[]} chapters - Array of document chapters
 * @param {TableOfContentsItem[]} tableOfContents - Table of contents structure
 * @param {EmbeddedAssets} embeddedAssets - Embedded media and assets
 * @returns {object} Base structure with library and performance info
 */
export function createBaseDocumentStructure(
  metadata: DocumentMetadata,
  chapters: Chapter[],
  tableOfContents: TableOfContentsItem[],
  embeddedAssets: EmbeddedAssets
): {
  metadata: DocumentMetadata;
  chapters: Chapter[];
  tableOfContents: TableOfContentsItem[];
  embeddedAssets: EmbeddedAssets;
} {
  return createBaseStructure(
    metadata,
    chapters,
    tableOfContents,
    embeddedAssets
  );
}
