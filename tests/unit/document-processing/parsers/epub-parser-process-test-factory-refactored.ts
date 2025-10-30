/**
 * Test Data Factory for EPUB Parser Process Extractor Tests (Refactored)
 *
 * Centralizes factory functions for creating mock data and callback functions
 * to reduce duplication and improve maintainability in process extractor tests.
 */

import { expect } from 'bun:test';
import { ChapterFactory } from './factories/chapter-factory.js';
import { MockEpubFactory } from './factories/epub-factory.js';
import {
  MetadataFactory,
  TableOfContentsFactory,
  EmbeddedAssetsFactory,
} from './factories/metadata-factory';
import { ParseOptionsFactory } from './factories/parse-options-factory.js';
import {
  CompatibilityDataFactory,
  BuildStructureCallbackFactory,
  ExpectationFactory,
} from './factories/process-support-factories';

// Re-export all factory classes for convenience
export {
  MockEpubFactory,
  ParseOptionsFactory,
  ChapterFactory,
  MetadataFactory,
  TableOfContentsFactory,
  EmbeddedAssetsFactory,
  CompatibilityDataFactory,
  BuildStructureCallbackFactory,
  ExpectationFactory,
};

// Helper functions for callback creation
const basicSuccessCallback = (error: Error | null, data: any) => {
  expect(error).toBeNull();
  expect(data).toBeDefined();
};

const basicErrorCallback = (error: Error | null, data: any) => {
  expect(error).toBeInstanceOf(Error);
  expect(data).toBeNull();
};

/**
 * Factory for creating callback functions
 */
export class CallbackFactory {
  static createBasicSuccessCallback() {
    return basicSuccessCallback;
  }

  static createBasicErrorCallback() {
    return basicErrorCallback;
  }

  static createCustomCallback(
    expectation: (error: Error | null, data: any) => void
  ) {
    return expectation;
  }
}

/**
 * Factory for creating mock process data
 */
export class ProcessDataFactory {
  static createBasicProcessData() {
    return {
      epub: MockEpubFactory.createBasic(),
      options: ParseOptionsFactory.createDefault(),
      metadata: MetadataFactory.createBasic(),
      chapters: ChapterFactory.createMultiple(),
      tableOfContents: TableOfContentsFactory.createMultiple(),
      assets: EmbeddedAssetsFactory.createBasic(),
    };
  }

  static createMinimalProcessData() {
    return {
      epub: MockEpubFactory.createMinimal(),
      options: ParseOptionsFactory.createDefault(),
      metadata: MetadataFactory.createMinimal(),
      chapters: [ChapterFactory.createBasic()],
      tableOfContents: [TableOfContentsFactory.createBasic()],
      assets: EmbeddedAssetsFactory.createBasic(),
    };
  }

  static createWithAssets() {
    return {
      epub: MockEpubFactory.createBasic(),
      options: ParseOptionsFactory.createDefault(),
      metadata: MetadataFactory.createBasic(),
      chapters: ChapterFactory.createMultiple(),
      tableOfContents: TableOfContentsFactory.createMultiple(),
      assets: EmbeddedAssetsFactory.createWithMixedAssets(),
    };
  }
}
