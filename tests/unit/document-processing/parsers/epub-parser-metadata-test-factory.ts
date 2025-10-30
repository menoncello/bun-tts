/**
 * Consolidated EPUB Parser Metadata Test Factory
 *
 * This file re-exports all the specialized factory classes to maintain
 * backward compatibility with existing test files.
 *
 * The original large factory has been split into multiple focused files:
 * - epub-basic.factory.ts: Basic EPUB instances
 * - epub-complex.factory.ts: Complex EPUB configurations
 * - epub-creators.factory.ts: Creator and author data
 * - epub-metadata.factory.ts: Metadata test data
 * - epub-edge-cases.factory.ts: Edge cases and special scenarios
 * - epub-expected-results.factory.ts: Expected result objects
 */

// Re-export all factory classes
export { BasicEpubFactory as MockEpubFactory } from './factories/epub-basic.factory';
export { ComplexEpubFactory } from './factories/epub-complex.factory';
export {
  EpubCreatorsFactory,
  AuthorFactory as CreatorTestDataFactory,
} from './factories/epub-creators.factory';
export { MetadataTestDataFactory } from './factories/epub-metadata.factory';
export { EdgeCasesEpubFactory } from './factories/epub-edge-cases.factory';
export { ExpectedResultFactory } from './factories/epub-expected-results.factory';

// Re-export types for backward compatibility
export type { Epub } from '@smoores/epub';
export type { EpubMetadata } from '../../../../src/core/document-processing/parsers/epub-parser-types.js';
