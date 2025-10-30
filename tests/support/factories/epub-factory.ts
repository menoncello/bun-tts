// Main EPUB factory file - re-exports all factory functions

// EPUB Buffer factories
export {
  createValidEPUBBuffer,
  createCorruptedEPUBBuffer,
  createLargeEPUBBuffer,
} from './epub-buffer-factory';

// EPUB File factories
export {
  createValidEPUBFile,
  createComplexEPUBFile,
} from './epub-file-factory';

// Document Structure factories
export {
  createDocumentStructure,
  createChapter,
  createDocumentMetadata,
} from './document-structure-factory';

// Types
export type { EPUBFactoryOptions } from './epub-factory-types';
