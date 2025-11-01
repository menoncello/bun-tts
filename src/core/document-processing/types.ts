/**
 * Document processing types - Main entry point.
 *
 * This file has been refactored into smaller, logical modules for better maintainability
 * and to comply with the max-lines requirement. All types are re-exported from the
 * types/index.ts file to maintain backward compatibility.
 *
 * File structure:
 * - types/index.ts - Main re-export file
 * - types/core-parser-types.ts - DocumentParser, ParseResult, ParseOptions, PerformanceStats
 * - types/epub-types.ts - EmbeddedAssets, TableOfContentsItem, DocumentStatistics, ParagraphMatch
 * - types/markdown-types.ts - MarkdownElement, ParsedToken
 * - types/document-structure-types.ts - DocumentMetadata, Sentence, Paragraph, Chapter, DocumentStructure
 * - types/streaming-types.ts - DocumentStream, DocumentChunk
 * - types/validation-types.ts - ValidationResult, ValidationError, ValidationWarning
 * - types/pdf-types.ts - PDFAnalysisMetadata, PDFStructure, PDFStructureAlias
 */

// Re-export all types from the organized modules
export * from './types/index';
