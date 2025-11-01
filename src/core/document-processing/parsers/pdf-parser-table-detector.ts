export type TableFormatType = 'delimited' | 'aligned' | 'box' | 'spanner';

// Import constants and processor functions
import { TABLE_CONFIG } from './pdf-parser-table-helpers';
import {
  processDelimitedLine,
  processAlignedLine,
} from './pdf-parser-table-processors';

export interface TableCell {
  text: string;
  position?: {
    row: number;
    column: number;
  };
  metadata?: {
    isHeader?: boolean;
    hasHeaderRow?: boolean;
  };
}

export interface TableRow {
  cells: TableCell[];
  metadata?: {
    isHeader?: boolean;
  };
}

export interface SimpleTable {
  id: string;
  pageNumber: number;
  rowCount: number;
  columnCount: number;
  confidence: number;
  formatType: TableFormatType;
  rows: TableRow[];
  metadata?: {
    hasHeaderRow?: boolean;
  };
}

/**
 * Extract tables from PDF text content by detecting delimited and aligned table structures.
 * Processes text lines to identify and extract tables with confidence scoring.
 * @param {string} text - The raw text content from a PDF page
 * @param {number} pageNumber - The page number in the PDF document
 * @returns {SimpleTable[]} Array of extracted tables with metadata and confidence scores
 */
export function extractTablesFromText(
  text: string,
  pageNumber: number
): SimpleTable[] {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  const tables: SimpleTable[] = [];
  const delimitedTables = detectDelimitedTables(lines, pageNumber, 0);
  tables.push(...delimitedTables);
  const alignedTables = detectAlignedTables(
    lines,
    pageNumber,
    delimitedTables.length
  );
  tables.push(...alignedTables);
  return tables.slice(0, TABLE_CONFIG.maxTablesPerPage);
}

/**
 * Detects and extracts tables using delimiter-based parsing (tabs, commas, semicolons, pipes).
 * Scans through lines to find patterns that match delimited table structures.
 * @param {string[]} lines - Array of text lines to analyze for tables
 * @param {number} pageNumber - The page number in the PDF document
 * @param {number} startId - Starting ID number for table identification
 * @returns {SimpleTable[]} Array of detected delimited tables
 */
export function detectDelimitedTables(
  lines: string[],
  pageNumber: number,
  startId: number
): SimpleTable[] {
  const tables: SimpleTable[] = [];
  for (let i = 0; i < lines.length; i += 1) {
    const tableCandidate = processDelimitedLine(lines, i, {
      pageNumber,
      startId,
      tableCount: tables.length,
    });
    if (tableCandidate) {
      tables.push(tableCandidate);
    }
  }
  return tables;
}

/**
 * Detects and extracts tables using alignment-based parsing (consistent spacing).
 * Scans through lines to find patterns that match aligned table structures based on spacing.
 * @param {string[]} lines - Array of text lines to analyze for tables
 * @param {number} pageNumber - The page number in the PDF document
 * @param {number} startId - Starting ID number for table identification
 * @returns {SimpleTable[]} Array of detected aligned tables
 */
export function detectAlignedTables(
  lines: string[],
  pageNumber: number,
  startId: number
): SimpleTable[] {
  const tables: SimpleTable[] = [];
  for (let i = 0; i < lines.length; i += 1) {
    const tableCandidate = processAlignedLine(lines, i, {
      pageNumber,
      startId,
      tableCount: tables.length,
    });
    if (tableCandidate) {
      tables.push(tableCandidate);
    }
  }
  return tables;
}
