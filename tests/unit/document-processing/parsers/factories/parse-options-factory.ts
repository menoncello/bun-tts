/**
 * Parse Options Factory for EPUB Parser Tests
 *
 * Provides factory functions for creating parse options
 * to reduce duplication and improve maintainability in tests.
 */

import type { EPUBParseOptions } from '../../../../../src/core/document-processing/parsers/epub-parser-types.js';

/**
 * Factory for creating parse options
 */
export class ParseOptionsFactory {
  /**
   * Creates default parse options with standard settings
   */
  static createDefault(): EPUBParseOptions {
    return {
      verbose: false,
      extractMedia: true,
      preserveHTML: false,
    };
  }

  /**
   * Creates strict parse options with validation enabled
   */
  static createStrict(): EPUBParseOptions {
    return {
      verbose: true,
      extractMedia: true,
      preserveHTML: false,
    };
  }

  /**
   * Creates parse options without media extraction
   */
  static createWithoutMedia(): EPUBParseOptions {
    return {
      verbose: false,
      extractMedia: false,
      preserveHTML: false,
    };
  }

  /**
   * Creates parse options with custom settings
   */
  static createWithCustomOptions(
    strictMode = false,
    extractMedia = true
  ): EPUBParseOptions {
    return {
      config: { strictMode },
      extractMedia,
      preserveHTML: false,
    };
  }

  /**
   * Creates parse options without media extraction - alias for createWithoutMedia
   * @deprecated Use createWithoutMedia instead
   */
  static createNoMedia(): EPUBParseOptions {
    return this.createWithoutMedia();
  }

  /**
   * Creates complex parse options - alias for createStrict
   * @deprecated Use createStrict instead
   */
  static createComplex(): EPUBParseOptions {
    return this.createStrict();
  }
}
