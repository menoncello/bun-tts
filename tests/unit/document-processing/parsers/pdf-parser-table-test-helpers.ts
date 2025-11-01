/**
 * Helper functions and test patterns for PDF table extraction tests.
 * This file serves as the main export point for all table helper functions.
 */

// Re-export all table helper functions from specialized modules
export * from './pdf-parser-table-basic-helpers';
export * from './pdf-parser-table-structure-helpers';
export * from './pdf-parser-table-formatting-helpers';
export * from './pdf-parser-table-position-helpers';
export * from './pdf-parser-table-quality-helpers';

/**
 * Common test configuration factory functions.
 */
export const TableTestConfigFactory = {
  /**
   * Creates a basic table extraction configuration.
   */
  createBasicTableConfig(extraConfig = {}): any {
    return {
      maxFileSize: 50 * 1024 * 1024,
      confidenceThreshold: 0.7,
      extractImages: true,
      extractTables: true,
      ...extraConfig,
    };
  },

  /**
   * Creates a high-quality table extraction configuration.
   */
  createHighQualityConfig(): any {
    return {
      maxFileSize: 50 * 1024 * 1024,
      confidenceThreshold: 0.9,
      extractImages: true,
      extractTables: true,
    };
  },

  /**
   * Creates a complex table handling configuration.
   */
  createComplexTableConfig(): any {
    return {
      maxFileSize: 50 * 1024 * 1024,
      confidenceThreshold: 0.6, // Lower threshold for complex structures
      extractImages: true,
      extractTables: true,
    };
  },

  /**
   * Creates a structure-aware table configuration.
   */
  createStructureAwareConfig(): any {
    return {
      maxFileSize: 50 * 1024 * 1024,
      confidenceThreshold: 0.8,
      extractImages: true,
      extractTables: true,
    };
  },
};
