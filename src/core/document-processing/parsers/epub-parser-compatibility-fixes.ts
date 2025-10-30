/**
 * Compatibility fixes for EPUB parser
 */

import type { DocumentMetadata, TableOfContentsItem } from '../types.js';
import {
  EPUBVersion,
  type CompatibilityAnalysis as AnalysisType,
  type CompatibilityConfig as ConfigType,
} from './epub-parser-compatibility.js';

// Re-export types for external use
export type {
  CompatibilityAnalysis,
  CompatibilityConfig,
} from './epub-parser-compatibility.js';

/**
 * Default compatibility configuration
 */
const DEFAULT_COMPATIBILITY_CONFIG: ConfigType = {
  strictMode: false,
  enableFallbacks: true,
  logCompatibilityWarnings: true,
};

/**
 * Add version information to metadata if missing
 * @param {any} metadata - Metadata to update
 * @param {any} detectedVersion - Detected EPUB version
 */
function addVersionInfo(
  metadata: DocumentMetadata,
  detectedVersion: EPUBVersion
): void {
  if (!metadata.version || metadata.version === 'unknown') {
    metadata.version = detectedVersion;
  }
}

/**
 * Add compatibility notes to metadata description
 * @param {any} metadata - Metadata to update
 * @param {any} warnings - Compatibility warnings
 */
function addCompatibilityNotes(
  metadata: DocumentMetadata,
  warnings: string[]
): void {
  const compatibilityNotes = warnings.join('; ');
  if (compatibilityNotes && !metadata.description?.includes('Compatibility:')) {
    const separator = metadata.description ? ' ' : '';
    metadata.description = `${metadata.description || ''}${separator}Compatibility: ${compatibilityNotes}`;
  }
}

/**
 * Apply compatibility fixes to metadata
 * @param {any} metadata - Original metadata
 * @param {any} analysis - Compatibility analysis
 * @param {object} config - Compatibility configuration
 * @returns {unknown} unknown Compatibility-fixed metadata
 */
export function applyCompatibilityFixes(
  metadata: DocumentMetadata,
  analysis: AnalysisType,
  config: ConfigType = DEFAULT_COMPATIBILITY_CONFIG
): DocumentMetadata {
  if (!config.enableFallbacks) {
    return metadata;
  }

  const fixedMetadata = { ...metadata };

  addVersionInfo(fixedMetadata, analysis.detectedVersion);
  addCompatibilityNotes(fixedMetadata, analysis.warnings);

  return fixedMetadata;
}

/**
 * Fix table of contents item for EPUB 2.0 compatibility
 * @param {any} item - TOC item to fix
 * @param {any} index - Item index
 * @returns {unknown} unknown Fixed TOC item
 */
function fixTOCItemForEPUB2(
  item: TableOfContentsItem,
  index: number
): TableOfContentsItem {
  return {
    ...item,
    // Ensure proper level for EPUB 2.0 (flat structure)
    level: 0,
    // Generate title if missing
    title: item.title || `Chapter ${index + 1}`,
  };
}

/**
 * Apply compatibility fixes to table of contents
 * @param {any} toc - Original table of contents
 * @param {any} analysis - Compatibility analysis
 * @param {object} config - Compatibility configuration
 * @returns {unknown} unknown Compatibility-fixed table of contents
 */
export function applyCompatibilityFixesToTOC(
  toc: TableOfContentsItem[],
  analysis: AnalysisType,
  config: ConfigType = DEFAULT_COMPATIBILITY_CONFIG
): TableOfContentsItem[] {
  if (!config.enableFallbacks || !toc || toc.length === 0) {
    return toc;
  }

  // EPUB 2.0 compatibility: ensure proper structure
  if (analysis.detectedVersion === EPUBVersion.EPUB_2_0) {
    return toc.map((item, index) => fixTOCItemForEPUB2(item, index));
  }

  return toc;
}
