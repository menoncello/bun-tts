/**
 * Document processing types - Main index file.
 * Re-exports all document processing types from split modules.
 *
 * This file serves as the main entry point for all document processing types,
 * maintaining backward compatibility with existing imports.
 */

// Core parser interfaces
export type {
  DocumentParser,
  ParseResult,
  ParseOptions,
  PerformanceStats,
} from './core-parser-types';

// EPUB and asset types
export type {
  EmbeddedAssets,
  TableOfContentsItem,
  DocumentStatistics,
  ParagraphMatch,
} from './epub-types';

// Markdown content types
export type { MarkdownElement, ParsedToken } from './markdown-types';

// Document structure types
export type {
  DocumentMetadata,
  Sentence,
  Paragraph,
  Chapter,
  DocumentStructure,
} from './document-structure-types';

// Streaming types
export type { DocumentStream, DocumentChunk } from './streaming-types';

// Validation types
export type {
  ValidationResult,
  ValidationError,
  ValidationWarning,
} from './validation-types';

// PDF-specific types
export type {
  PDFAnalysisMetadata,
  PDFStructure,
  PDFStructureAlias,
} from './pdf-types';
