/**
 * EPUB Parser Metadata Extractor
 *
 * Handles extraction and processing of EPUB metadata
 *
 * This module has been refactored into smaller, focused modules:
 * - epub-parser-metadata-extractor-core.ts: Core extraction logic
 * - epub-parser-metadata-extractor-authors.ts: Author and role processing
 * - epub-parser-metadata-extractor-custom.ts: Custom field processing
 * - epub-parser-metadata-extractor-fields.ts: Specific field extraction
 */

// Re-export all functions from the core module for backward compatibility
export {
  extractMetadata,
  extractAuthors,
  extractCustomFields,
  formatSubjects,
} from './epub-parser-metadata-extractor-core.js';
