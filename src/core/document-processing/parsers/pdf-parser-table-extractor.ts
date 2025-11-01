/**
 * @file Re-exports from modularized table extractor components.
 *
 * This file maintains backward compatibility by re-exporting all functionality
 * from the newly modularized table extractor files:
 * - pdf-parser-table-detector.ts: Main detection functions
 * - pdf-parser-table-processors.ts: Processing logic for delimited/aligned tables
 * - pdf-parser-table-helpers.ts: Helper functions and utilities
 *
 * The original monolithic file has been refactored to improve maintainability
 * and reduce file size while preserving all functionality.
 */

// Re-export from detector module
export {
  extractTablesFromText,
  detectDelimitedTables,
  detectAlignedTables,
  type SimpleTable,
  type TableCell,
  type TableRow,
  type TableFormatType,
} from './pdf-parser-table-detector';

// Re-export from processors module
export {
  processDelimitedLine,
  processAlignedLine,
  collectConsecutiveRows,
  collectAlignedTableRows,
} from './pdf-parser-table-processors';

// Re-export from helpers module
export {
  splitByDelimiter,
  createSimpleTable,
  createStructuredRows,
  createTableCells,
  detectHeaderRow,
  calculateTableConfidence,
} from './pdf-parser-table-helpers';

// Export TABLE_CONFIG for backward compatibility
export { TABLE_CONFIG } from './pdf-parser-table-helpers';
