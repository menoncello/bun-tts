/**
 * EPUB Parser Process Extractor
 * Contains methods for extracting and processing EPUB content components
 */

import { Epub } from '@smoores/epub';
import type {
  DocumentMetadata,
  Chapter,
  TableOfContentsItem,
  EmbeddedAssets,
  DocumentStructure,
} from '../types.js';
import { extractEmbeddedAssets } from './epub-parser-asset-extractor.js';
import {
  extractChapters,
  parseTableOfContents,
} from './epub-parser-chapter-extractor.js';
import { analyzeCompatibility } from './epub-parser-compatibility.js';
import {
  createCompatibilityConfig,
  applyFixesToMetadataAndTOC,
} from './epub-parser-helper-utils.js';
import { extractMetadata as extractEPUBMetadata } from './epub-parser-metadata-extractor.js';
import type {
  EPUBParseOptions,
  DocumentStatistics,
} from './epub-parser-types.js';

/**
 * Creates document data for structure building
 * @param {object} fixedMetadataTOC - Fixed metadata and table of contents
 * @param {DocumentMetadata} fixedMetadataTOC.fixedMetadata - Fixed metadata information
 * @param {TableOfContentsItem[]} fixedMetadataTOC.fixedTableOfContents - Fixed table of contents structure
 * @param {object} contentData - Extracted content data
 * @param {Chapter[]} contentData.chapters - Array of document chapters
 * @param {EmbeddedAssets} contentData.embeddedAssets - Embedded media and assets
 * @returns {object} Complete document data
 */
function createDocumentData(
  fixedMetadataTOC: {
    fixedMetadata: DocumentMetadata;
    fixedTableOfContents: TableOfContentsItem[];
  },
  contentData: { chapters: Chapter[]; embeddedAssets: EmbeddedAssets }
): {
  metadata: DocumentMetadata;
  tableOfContents: TableOfContentsItem[];
  chapters: Chapter[];
  embeddedAssets: EmbeddedAssets;
} {
  return {
    metadata: fixedMetadataTOC.fixedMetadata,
    tableOfContents: fixedMetadataTOC.fixedTableOfContents,
    chapters: contentData.chapters,
    embeddedAssets: contentData.embeddedAssets,
  };
}

/**
 * Extracts all components from EPUB file
 * @param {Epub} epub - The EPUB instance to extract data from
 * @param {EPUBParseOptions} options - Parsing configuration options
 * @param {Function} buildStructureCallback - Callback function to build the complete structure
 * @returns {Promise<object>} Complete document structure with all extracted components
 */
export async function extractAllComponents(
  epub: Epub,
  options: EPUBParseOptions,
  buildStructureCallback: (
    documentData: {
      metadata: DocumentMetadata;
      tableOfContents: TableOfContentsItem[];
      chapters: Chapter[];
      embeddedAssets: EmbeddedAssets;
    },
    options: EPUBParseOptions
  ) => {
    chapters: Chapter[];
    stats: DocumentStatistics;
    documentStructure: DocumentStructure;
  }
): Promise<{
  chapters: Chapter[];
  stats: DocumentStatistics;
  documentStructure: DocumentStructure;
}> {
  const extractionData = await prepareExtractionData(epub, options);
  return buildStructureCallback(
    createDocumentData(
      extractionData.fixedMetadataTOC,
      extractionData.contentData
    ),
    options
  );
}

/**
 * Prepare extraction data from EPUB
 * @param {Epub} epub - The EPUB instance to extract data from
 * @param {EPUBParseOptions} options - Parsing configuration options
 * @returns {Promise<object>} Extraction data with metadata, TOC, and content
 */
async function prepareExtractionData(
  epub: Epub,
  options: EPUBParseOptions
): Promise<{
  fixedMetadataTOC: {
    fixedMetadata: DocumentMetadata;
    fixedTableOfContents: TableOfContentsItem[];
  };
  contentData: {
    chapters: Chapter[];
    embeddedAssets: EmbeddedAssets;
  };
}> {
  const compatibilityData = await analyzeCompatibilityData(epub, options);
  const fixedMetadataTOC = await extractAndFixMetadataTOC(
    epub,
    compatibilityData
  );
  const contentData = await extractContentData(
    epub,
    fixedMetadataTOC.fixedTableOfContents,
    options
  );

  return { fixedMetadataTOC, contentData };
}

/**
 * Analyzes EPUB compatibility and returns compatibility data
 * @param {Epub} epub - The EPUB instance to analyze
 * @param {EPUBParseOptions} _options - Parsing configuration options (currently unused)
 * @returns {Promise<object>} Compatibility analysis and configuration data
 */
export async function analyzeCompatibilityData(
  epub: Epub,
  _options: EPUBParseOptions
): Promise<{
  compatibilityAnalysis: import('./epub-parser-compatibility').CompatibilityAnalysis;
  compatibilityConfig: import('./epub-parser-helper-utils').CompatibilityConfig;
}> {
  const compatibilityConfig = createCompatibilityConfig({ strictMode: false }); // Default strictMode since it's not in EPUBParseOptions
  const compatibilityAnalysis = await analyzeCompatibility(
    epub,
    compatibilityConfig
  );
  return { compatibilityAnalysis, compatibilityConfig };
}

/**
 * Extracts metadata and table of contents, then applies compatibility fixes
 * @param {Epub} epub - The EPUB instance to extract data from
 * @param {object} compatibilityData - Compatibility analysis and configuration data
 * @param {import('./epub-parser-compatibility').CompatibilityAnalysis} compatibilityData.compatibilityAnalysis - The compatibility analysis results
 * @param {import('./epub-parser-helper-utils').CompatibilityConfig} compatibilityData.compatibilityConfig - The compatibility configuration
 * @returns {Promise<object>} Fixed metadata and table of contents
 */
export async function extractAndFixMetadataTOC(
  epub: Epub,
  compatibilityData: {
    compatibilityAnalysis: import('./epub-parser-compatibility').CompatibilityAnalysis;
    compatibilityConfig: import('./epub-parser-helper-utils').CompatibilityConfig;
  }
): Promise<{
  fixedMetadata: DocumentMetadata;
  fixedTableOfContents: TableOfContentsItem[];
}> {
  const [metadata, tableOfContents] = await extractMetadataAndTOC(epub);
  return applyFixesToMetadataAndTOC(
    metadata,
    tableOfContents,
    compatibilityData.compatibilityAnalysis,
    compatibilityData.compatibilityConfig
  );
}

/**
 * Extracts content chapters and embedded assets
 * @param {Epub} epub - The EPUB instance to extract data from
 * @param {TableOfContentsItem[]} tableOfContents - Table of contents structure for chapter extraction
 * @param {EPUBParseOptions} options - Parsing configuration options
 * @returns {Promise<object>} Extracted chapters and embedded assets
 */
export async function extractContentData(
  epub: Epub,
  tableOfContents: TableOfContentsItem[],
  options: EPUBParseOptions
): Promise<{
  chapters: Chapter[];
  embeddedAssets: EmbeddedAssets;
}> {
  const [chapters, embeddedAssets] = await extractContentAndAssets(
    epub,
    tableOfContents,
    options
  );
  return { chapters, embeddedAssets };
}

/**
 * Extracts metadata and table of contents in parallel
 * @param {Epub} epub - The EPUB instance to extract data from
 * @returns {Promise<[DocumentMetadata, TableOfContentsItem[]]>} Tuple containing metadata and table of contents
 */
export async function extractMetadataAndTOC(
  epub: Epub
): Promise<[DocumentMetadata, TableOfContentsItem[]]> {
  return Promise.all([extractEPUBMetadata(epub), parseTableOfContents(epub)]);
}

/**
 * Extracts content chapters and embedded assets in parallel
 * @param {Epub} epub - The EPUB instance to extract data from
 * @param {TableOfContentsItem[]} tableOfContents - Table of contents structure for chapter extraction
 * @param {EPUBParseOptions} options - Parsing configuration options
 * @returns {Promise<[Chapter[], EmbeddedAssets]>} Tuple containing chapters and embedded assets
 */
export async function extractContentAndAssets(
  epub: Epub,
  tableOfContents: TableOfContentsItem[],
  options: EPUBParseOptions
): Promise<[Chapter[], EmbeddedAssets]> {
  return Promise.all([
    extractChapters(epub, tableOfContents, options),
    extractEmbeddedAssets(epub, options),
  ]);
}
