/**
 * Document processing parsers module barrel export
 *
 * This file provides exports for all parser implementations.
 */

// Main parsers - these are the primary classes
export { MarkdownParser } from './markdown-parser';
export { PDFParser } from './pdf-parser';

// Export commonly used functions
export { extractElements, extractChapterElements } from './element-extractor';
export { extractChaptersFromTokens } from './chapter-extraction';
export { extractBasicMetadata } from './structure-extractor';
export { buildDocument } from './document-structure-creator';
export { validateAndPrepareInput } from './document-validator';

// Export all utilities
export * from './token-processors';
export * from './element-processors';
export * from './text-processing-utils';
export * from './validation-utils';
export * from './pdf-parser-utils';
export * from './pdf-parser-validation';
export {
  detectEncoding as detectPdfEncoding,
  analyzeTextEncoding,
  convertTextEncoding,
  validateEncodingConversion,
} from './pdf-parser-encoding-utils';
