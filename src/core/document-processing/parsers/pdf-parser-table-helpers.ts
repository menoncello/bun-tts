import {
  SimpleTable,
  TableCell,
  TableRow,
  TableFormatType,
} from './pdf-parser-table-detector';

export const TABLE_CONFIG = {
  minRowCount: 2,
  minColumnCount: 2,
  maxTablesPerPage: 10,
  confidenceThreshold: 0.6,
  delimiters: /[\t,;|]/,
  spacingPattern: /\s{2,}/,
};

const CONFIDENCE_CONSTANTS = {
  BASE_SCORE: 0.5,
  LOW_VARIANCE_THRESHOLD: 0.5,
  HIGH_VARIANCE_THRESHOLD: 2,
  LOW_VARIANCE_BONUS: 0.2,
  HIGH_VARIANCE_PENALTY: -0.2,
  LENGTH_RATIO_THRESHOLD: 0.7,
  POW_EXPONENT: 2,
};

const COMMON_HEADER_WORDS = [
  'product',
  'name',
  'title',
  'price',
  'cost',
  'date',
  'id',
  'status',
  'category',
  'type',
  'description',
  'quantity',
  'amount',
  'value',
  'address',
  'city',
  'country',
  'email',
  'phone',
  'number',
  'code',
];

/**
 * Splits a text line into cells based on the specified delimiter type.
 * Handles different delimiter types (tab, pipe, comma, semicolon) with appropriate trimming.
 * @param {string} line - The text line to split into cells
 * @param {string} delimiter - The delimiter character to split by
 * @returns {string[]} Array of cell strings with whitespace trimmed
 */
export function splitByDelimiter(line: string, delimiter: string): string[] {
  if (delimiter === '\t') {
    return line.split('\t').map((cell) => cell.trim());
  }
  if (delimiter === '|') {
    return line
      .split('|')
      .map((cell) => cell.trim())
      .filter((cell) => cell);
  }
  return line.split(delimiter).map((cell) => cell.trim());
}

/**
 * Creates a structured SimpleTable object from raw row data.
 * Analyzes the table structure, detects headers, calculates confidence, and generates metadata.
 * @param {string[][]} rows - Array of table rows, where each row is an array of cell strings
 * @param {number} pageNumber - The page number in the PDF document
 * @param {number} tableId - Unique identifier for this table
 * @param {TableFormatType} formatType - The format type of the table (delimited, aligned, box, or spanner)
 * @returns {SimpleTable} Complete table object with structure, metadata, and confidence score
 */
export function createSimpleTable(
  rows: string[][],
  pageNumber: number,
  tableId: number,
  formatType: TableFormatType
): SimpleTable {
  const rowCount = rows.length;
  const columnCount = Math.max(...rows.map((row) => row.length));
  const hasHeaderRow =
    rowCount > 1 && rows[0] && rows[1] && detectHeaderRow(rows[0], rows[1]);
  const structuredRows = createStructuredRows(
    rows,
    columnCount,
    !!hasHeaderRow
  );
  return {
    id: `table-${pageNumber}-${tableId}`,
    pageNumber,
    rowCount,
    columnCount,
    confidence: calculateTableConfidence(rows, formatType),
    formatType,
    rows: structuredRows,
    metadata: {
      hasHeaderRow,
    },
  };
}

/**
 * Converts raw string rows into structured TableRow objects with metadata.
 * Adds position information and header status to each row.
 * @param {string[][]} rows - Array of raw table rows
 * @param {number} columnCount - Total number of columns in the table
 * @param {boolean} hasHeaderRow - Whether the table has a header row
 * @returns {TableRow[]} Array of structured table rows with metadata
 */
export function createStructuredRows(
  rows: string[][],
  columnCount: number,
  hasHeaderRow: boolean
): TableRow[] {
  return rows.map((row, rowIndex) => {
    const cells = createTableCells(row, rowIndex, columnCount, hasHeaderRow);
    return {
      cells,
      metadata: {
        isHeader: hasHeaderRow && rowIndex === 0,
      },
    };
  });
}

/**
 * Creates an array of TableCell objects from a raw row with position and metadata.
 * Fills in missing cells for ragged rows to maintain consistent column structure.
 * @param {string[]} row - Array of cell text strings
 * @param {number} rowIndex - The index of this row in the table
 * @param {number} columnCount - Total number of columns in the table
 * @param {boolean} hasHeaderRow - Whether this row is part of a table with a header
 * @returns {TableCell[]} Array of structured table cells with position and metadata
 */
export function createTableCells(
  row: string[],
  rowIndex: number,
  columnCount: number,
  hasHeaderRow: boolean
): TableCell[] {
  const cells = row.map((cellText, cellIndex) => ({
    text: cellText,
    position: { row: rowIndex, column: cellIndex },
    metadata: { isHeader: hasHeaderRow && rowIndex === 0 },
  }));
  while (cells.length < columnCount) {
    const cellIndex = cells.length;
    cells.push({
      text: '',
      position: { row: rowIndex, column: cellIndex },
      metadata: { isHeader: hasHeaderRow && rowIndex === 0 },
    });
  }
  return cells;
}

/**
 * Calculates average length of strings in an array.
 * @param {string[]} row - Array of strings to calculate average length for
 * @returns {number} Average length of strings in the array
 */
function calculateAverageLength(row: string[]): number {
  return row.reduce((sum, cell) => sum + cell.length, 0) / row.length;
}

/**
 * Detects whether the first row is a header row using multiple heuristics.
 * Analyzes numeric content, common header words, and text length patterns.
 * Optimized version to reduce line count.
 * @param {string[]} firstRow - The first row of the table to evaluate
 * @param {string[]} secondRow - The second row of the table for comparison
 * @returns {boolean} True if the first row is determined to be a header row
 */
export function detectHeaderRow(
  firstRow: string[],
  secondRow: string[]
): boolean {
  if (
    !firstRow ||
    !secondRow ||
    firstRow.length === 0 ||
    secondRow.length === 0
  ) {
    return false;
  }

  const firstRowHasNumbers = firstRow.some((cell) => /\d/.test(cell));
  const secondRowHasNumbers = secondRow.some((cell) => /\d/.test(cell));
  const hasHeaderWords = firstRow.some((cell) =>
    COMMON_HEADER_WORDS.some((word) => cell.trim().toLowerCase().includes(word))
  );
  const firstRowAvgLength = calculateAverageLength(firstRow);
  const secondRowAvgLength = calculateAverageLength(secondRow);

  return (
    (!firstRowHasNumbers && secondRowHasNumbers) ||
    hasHeaderWords ||
    firstRowAvgLength <
      secondRowAvgLength * CONFIDENCE_CONSTANTS.LENGTH_RATIO_THRESHOLD
  );
}

/**
 * Calculates a confidence score for a detected table based on structure and format.
 * Considers format type bonuses and structural consistency (variance in column counts).
 * @param {string[][]} rows - Array of table rows to analyze
 * @param {TableFormatType} formatType - The format type of the table
 * @returns {number} Confidence score between 0 and 1, where 1 is highest confidence
 */
export function calculateTableConfidence(
  rows: string[][],
  formatType: TableFormatType
): number {
  let confidence = CONFIDENCE_CONSTANTS.BASE_SCORE;
  const formatBonuses: Record<TableFormatType, number> = {
    delimited: 0.3,
    aligned: 0.2,
    box: 0.4,
    spanner: 0.15,
  };
  confidence += formatBonuses[formatType];

  const rowCounts = rows.map((row) => row.length);
  const avgCols = rowCounts.reduce((a, b) => a + b, 0) / rowCounts.length;
  const variance =
    rowCounts.reduce(
      (sum, count) =>
        sum + Math.pow(count - avgCols, CONFIDENCE_CONSTANTS.POW_EXPONENT),
      0
    ) / rowCounts.length;

  if (variance < CONFIDENCE_CONSTANTS.LOW_VARIANCE_THRESHOLD) {
    confidence += CONFIDENCE_CONSTANTS.LOW_VARIANCE_BONUS;
  } else if (variance > CONFIDENCE_CONSTANTS.HIGH_VARIANCE_THRESHOLD) {
    confidence += CONFIDENCE_CONSTANTS.HIGH_VARIANCE_PENALTY;
  }

  return Math.max(0, Math.min(1, confidence));
}
