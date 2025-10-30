/**
 * Test Data Factory for EPUB Parser Process Extractor Tests
 *
 * Centralizes factory functions for creating mock data and callback functions
 * to reduce duplication and improve maintainability in process extractor tests.
 *
 * This file now re-exports from the modular factory structure to maintain
 * backward compatibility while reducing file size.
 */

// Re-export from modular factories
export {
  MockEpubFactory,
  ParseOptionsFactory,
  ChapterFactory,
  MetadataFactory,
  TableOfContentsFactory,
  EmbeddedAssetsFactory,
  CallbackFactory,
  ProcessDataFactory,
  CompatibilityDataFactory,
  BuildStructureCallbackFactory,
  ExpectationFactory,
} from './epub-parser-process-test-factory-refactored';
