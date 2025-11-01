import { SimpleTable } from './pdf-parser-table-detector';
import {
  TABLE_CONFIG,
  splitByDelimiter,
  createSimpleTable,
} from './pdf-parser-table-helpers';

/**
 * Validates if a delimiter match exists and returns the delimiter
 * @param {string} line - Line to check for delimiter
 * @returns {string|null} Delimiter string if found, null otherwise
 */
function validateDelimiterMatch(line: string): string | null {
  const delimiterMatch = line.match(TABLE_CONFIG.delimiters);
  return delimiterMatch && delimiterMatch[0] ? delimiterMatch[0] : null;
}

/**
 * Validates if table meets minimum criteria
 * @param {string[]} cells - Table cells from first row
 * @param {string[][]} tableRows - All collected table rows
 * @param {SimpleTable} table - Created table object
 * @returns {boolean} True if table meets all criteria
 */
function validateTableCriteria(
  cells: string[],
  tableRows: string[][],
  table: SimpleTable
): boolean {
  return (
    cells.length >= TABLE_CONFIG.minColumnCount &&
    tableRows.length >= TABLE_CONFIG.minRowCount &&
    table.confidence >= TABLE_CONFIG.confidenceThreshold
  );
}

/**
 * Processes a single line to determine if it contains a delimited table.
 * Validates delimiter presence and attempts to build a complete table from consecutive rows.
 * @param {string[]} lines - Array of all text lines
 * @param {number} index - Current line index to process
 * @param {object} config - Configuration object containing page number and table counting
 * @param {number} config.pageNumber - The page number in the PDF document
 * @param {number} config.startId - Starting ID for table generation
 * @param {number} config.tableCount - Number of tables already found on this page
 * @returns {SimpleTable|null} Extracted table object if criteria are met, null otherwise
 */
export function processDelimitedLine(
  lines: string[],
  index: number,
  config: { pageNumber: number; startId: number; tableCount: number }
): SimpleTable | null {
  const line = lines[index];
  if (!line) {
    return null;
  }

  const delimiter = validateDelimiterMatch(line);
  if (!delimiter) {
    return null;
  }

  const cells = splitByDelimiter(line, delimiter);
  const tableRows = collectConsecutiveRows(
    lines,
    index,
    cells,
    TABLE_CONFIG.delimiters
  );
  const table = createSimpleTable(
    tableRows,
    config.pageNumber,
    config.startId + config.tableCount,
    'delimited'
  );

  return validateTableCriteria(cells, tableRows, table) ? table : null;
}

/**
 * Processes a single line to determine if it contains an aligned table.
 * Validates consistent spacing and attempts to build a complete table from consecutive rows.
 * @param {string[]} lines - Array of all text lines
 * @param {number} index - Current line index to process
 * @param {object} config - Configuration object containing page number and table counting
 * @param {number} config.pageNumber - The page number in the PDF document
 * @param {number} config.startId - Starting ID for table generation
 * @param {number} config.tableCount - Number of tables already found on this page
 * @returns {SimpleTable|null} Extracted table object if criteria are met, null otherwise
 */
export function processAlignedLine(
  lines: string[],
  index: number,
  config: { pageNumber: number; startId: number; tableCount: number }
): SimpleTable | null {
  const line = lines[index];
  const hasConsistentSpacing = line && TABLE_CONFIG.spacingPattern.test(line);
  if (!hasConsistentSpacing) {
    return null;
  }
  const cells = line.split(/\s{2,}/).map((cell) => cell.trim());
  const tableRows = collectAlignedTableRows(lines, index, cells);
  const table = createSimpleTable(
    tableRows,
    config.pageNumber,
    config.startId + config.tableCount,
    'aligned'
  );
  return cells.length >= TABLE_CONFIG.minColumnCount &&
    tableRows.length >= TABLE_CONFIG.minRowCount &&
    table.confidence >= TABLE_CONFIG.confidenceThreshold
    ? table
    : null;
}

/**
 * Validates if a row is consistent with the first row
 * @param {string[]} nextCells - Cells from the current row
 * @param {string[]} firstRowCells - Cells from the first row
 * @returns {boolean} True if row is consistent
 */
function validateRowConsistency(
  nextCells: string[],
  firstRowCells: string[]
): boolean {
  return (
    nextCells.length === firstRowCells.length ||
    Math.abs(nextCells.length - firstRowCells.length) <= 1
  );
}

/**
 * Processes a single line and returns its cells
 * @param {string} nextLine - Line to process
 * @param {RegExp} delimiterPattern - Pattern to match delimiters
 * @param {string[]} firstRowCells - Cells from first row for consistency check
 * @returns {string[]|null} Array of cells if valid row, null otherwise
 */
function processAndValidateNextRow(
  nextLine: string,
  delimiterPattern: RegExp,
  firstRowCells: string[]
): string[] | null {
  const nextDelimiterMatch = nextLine.match(delimiterPattern);
  if (!nextDelimiterMatch || !nextDelimiterMatch[0]) {
    return null;
  }

  const nextCells = splitByDelimiter(nextLine, nextDelimiterMatch[0]);
  if (!validateRowConsistency(nextCells, firstRowCells)) {
    return null;
  }

  return nextCells;
}

/**
 * Collects consecutive rows that match a specific delimiter pattern.
 * Continues collecting rows until a non-matching line is found or structure becomes inconsistent.
 * @param {string[]} lines - Array of text lines to scan
 * @param {number} index - Starting line index
 * @param {string[]} firstRowCells - Cell data from the first row to match against
 * @param {RegExp} delimiterPattern - Regular expression pattern to match delimiters
 * @returns {string[][]} Array of table rows, where each row is an array of cell strings
 */
export function collectConsecutiveRows(
  lines: string[],
  index: number,
  firstRowCells: string[],
  delimiterPattern: RegExp
): string[][] {
  const tableRows: string[][] = [firstRowCells];
  let j = index + 1;

  while (j < lines.length) {
    const nextLine = lines[j];
    if (!nextLine) {
      break;
    }

    const nextCells = processAndValidateNextRow(
      nextLine,
      delimiterPattern,
      firstRowCells
    );
    if (!nextCells) {
      break;
    }

    tableRows.push(nextCells);
    j += 1;
  }

  return tableRows;
}

/**
 * Collects consecutive rows that maintain consistent spacing alignment.
 * Continues collecting rows until spacing becomes inconsistent or structure breaks.
 * @param {string[]} lines - Array of text lines to scan
 * @param {number} startIndex - Starting line index
 * @param {string[]} firstRowCells - Cell data from the first row to match alignment against
 * @returns {string[][]} Array of table rows, where each row is an array of cell strings
 */
export function collectAlignedTableRows(
  lines: string[],
  startIndex: number,
  firstRowCells: string[]
): string[][] {
  const tableRows: string[][] = [firstRowCells];
  let j = startIndex + 1;
  while (j < lines.length) {
    const nextLine = lines[j];
    const nextHasSpacing =
      nextLine && TABLE_CONFIG.spacingPattern.test(nextLine);
    if (!nextHasSpacing) {
      break;
    }
    const nextCells = nextLine.split(/\s{2,}/).map((cell) => cell.trim());
    const isConsistentRow =
      Math.abs(nextCells.length - firstRowCells.length) <= 1;
    if (!isConsistentRow) {
      break;
    }
    tableRows.push(nextCells);
    j += 1;
  }
  return tableRows;
}
