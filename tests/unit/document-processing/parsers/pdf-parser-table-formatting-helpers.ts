/**
 * Helper functions for PDF table formatting validation.
 * These functions validate table formatting, positions, and text quality.
 */

import type { DocumentStructure } from '../../../../src/core/document-processing/types';

/**
 * Validates table formatting including whitespace handling and text quality.
 * @param {DocumentStructure} documentStructure - The document structure to validate table formatting from
 * @returns {{
 *   hasWellFormattedHeaders: boolean;
 *   hasWellFormattedCells: boolean;
 *   hasValidPositions: boolean;
 *   validFormattedTables: number;
 * }} Object with validation results
 */
export function validateTableFormatting(documentStructure: DocumentStructure): {
  hasWellFormattedHeaders: boolean;
  hasWellFormattedCells: boolean;
  hasValidPositions: boolean;
  validFormattedTables: number;
} {
  const formattingResults = initializeFormattingResults();
  const allTables = extractAllTables(documentStructure);

  for (const table of allTables) {
    const tableValidation = validateSingleTableFormatting(table);

    if (isTableFullyValid(tableValidation)) {
      formattingResults.validFormattedTables++;
    }

    updateOverallFormattingResults(formattingResults, tableValidation);
  }

  return formattingResults;
}

/**
 * Initializes formatting results object.
 */
function initializeFormattingResults(): {
  hasWellFormattedHeaders: boolean;
  hasWellFormattedCells: boolean;
  hasValidPositions: boolean;
  validFormattedTables: number;
} {
  return {
    hasWellFormattedHeaders: true,
    hasWellFormattedCells: true,
    hasValidPositions: true,
    validFormattedTables: 0,
  };
}

/**
 * Extracts all tables from document chapters.
 */
function extractAllTables(documentStructure: DocumentStructure): any[] {
  const tables: any[] = [];

  for (const chapter of documentStructure.chapters) {
    if (chapter.tables && chapter.tables.length > 0) {
      tables.push(...chapter.tables);
    }
  }

  return tables;
}

/**
 * Validates formatting for a single table.
 */
function validateSingleTableFormatting(table: any): {
  headerFormatting: { isWellFormatted: boolean; issues: string[] };
  cellFormatting: { isWellFormatted: boolean; issues: string[] };
  positionFormatting: { isValid: boolean; issues: string[] };
} {
  const headerFormatting = validateTableHeadersFormatting(table);
  const cellFormatting = validateTableCellFormatting(table);
  const positionFormatting = validateTablePositionFormatting(table);

  return {
    headerFormatting,
    cellFormatting,
    positionFormatting,
  };
}

/**
 * Checks if a table passes all formatting validations.
 */
function isTableFullyValid(tableValidation: {
  headerFormatting: { isWellFormatted: boolean; issues: string[] };
  cellFormatting: { isWellFormatted: boolean; issues: string[] };
  positionFormatting: { isValid: boolean; issues: string[] };
}): boolean {
  return (
    tableValidation.headerFormatting.isWellFormatted &&
    tableValidation.cellFormatting.isWellFormatted &&
    tableValidation.positionFormatting.isValid
  );
}

/**
 * Updates overall formatting results based on single table validation.
 */
function updateOverallFormattingResults(
  formattingResults: {
    hasWellFormattedHeaders: boolean;
    hasWellFormattedCells: boolean;
    hasValidPositions: boolean;
    validFormattedTables: number;
  },
  tableValidation: {
    headerFormatting: { isWellFormatted: boolean; issues: string[] };
    cellFormatting: { isWellFormatted: boolean; issues: string[] };
    positionFormatting: { isValid: boolean; issues: string[] };
  }
): void {
  if (!tableValidation.headerFormatting.isWellFormatted) {
    formattingResults.hasWellFormattedHeaders = false;
  }
  if (!tableValidation.cellFormatting.isWellFormatted) {
    formattingResults.hasWellFormattedCells = false;
  }
  if (!tableValidation.positionFormatting.isValid) {
    formattingResults.hasValidPositions = false;
  }
}

/**
 * Validates table header formatting.
 */
function validateTableHeadersFormatting(table: any): {
  isWellFormatted: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  let isWellFormatted = true;

  if (table.headers.length === 0) {
    return { isWellFormatted, issues };
  }

  for (const header of table.headers) {
    const headerValidation = validateSingleHeader(header);
    if (!headerValidation.isValid) {
      isWellFormatted = false;
      issues.push(...headerValidation.issues);
    }
  }

  return { isWellFormatted, issues };
}

/**
 * Validates a single table header.
 */
function validateSingleHeader(header: any): {
  isValid: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  let isValid = true;

  if (!validateHeaderType(header)) {
    isValid = false;
    issues.push('Header is not a string');
  }

  if (!validateHeaderText(header)) {
    isValid = false;
    issues.push('Header is empty');
  }

  if (hasHeaderWhitespaceIssues(header)) {
    isValid = false;
    issues.push('Header has excessive whitespace');
  }

  if (hasHeaderLeadingTrailingWhitespace(header)) {
    isValid = false;
    issues.push('Header has leading or trailing whitespace');
  }

  return { isValid, issues };
}

/**
 * Validates header type is string.
 */
function validateHeaderType(header: any): boolean {
  return typeof header === 'string';
}

/**
 * Validates header has valid text content.
 */
function validateHeaderText(header: string): boolean {
  return header.trim().length > 0;
}

/**
 * Checks if header has excessive whitespace.
 */
function hasHeaderWhitespaceIssues(header: string): boolean {
  return /\s{3}/.test(header);
}

/**
 * Checks if header has leading or trailing whitespace.
 */
function hasHeaderLeadingTrailingWhitespace(header: string): boolean {
  return /^\s/.test(header) || /\s$/.test(header);
}

/**
 * Validates table cell formatting.
 */
function validateTableCellFormatting(table: any): {
  isWellFormatted: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  let isWellFormatted = true;

  if (table.rows.length === 0) {
    return { isWellFormatted, issues };
  }

  for (const row of table.rows) {
    const rowValidation = validateTableRow(row);
    if (!rowValidation.isWellFormatted) {
      isWellFormatted = false;
      issues.push(...rowValidation.issues);
    }
  }

  return { isWellFormatted, issues };
}

/**
 * Validates a single table row.
 */
function validateTableRow(row: any[]): {
  isWellFormatted: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  let isWellFormatted = true;

  for (const cell of row) {
    const cellValidation = validateSingleCell(cell);
    if (!cellValidation.isValid) {
      isWellFormatted = false;
      issues.push(...cellValidation.issues);
    }
  }

  return { isWellFormatted, issues };
}

/**
 * Validates a single table cell.
 */
function validateSingleCell(cell: any): {
  isValid: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  let isValid = true;

  if (!validateCellType(cell)) {
    isValid = false;
    issues.push('Cell is not a string');
  }

  if (hasCellWhitespaceIssues(cell)) {
    isValid = false;
    issues.push('Cell has excessive whitespace');
  }

  if (hasCellLeadingTrailingWhitespace(cell)) {
    isValid = false;
    issues.push('Cell has leading or trailing whitespace');
  }

  return { isValid, issues };
}

/**
 * Validates cell type is string.
 */
function validateCellType(cell: any): boolean {
  return typeof cell === 'string';
}

/**
 * Checks if cell has excessive whitespace.
 */
function hasCellWhitespaceIssues(cell: string): boolean {
  return /\s{3}/.test(cell);
}

/**
 * Checks if cell has leading or trailing whitespace.
 */
function hasCellLeadingTrailingWhitespace(cell: string): boolean {
  return /^\s/.test(cell) || /\s$/.test(cell);
}

/**
 * Validates table position formatting.
 */
function validateTablePositionFormatting(table: any): {
  isValid: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  let isValid = true;

  if (table.position < 0) {
    isValid = false;
    issues.push('Table position is negative');
  }

  if (typeof table.position !== 'number') {
    isValid = false;
    issues.push('Table position is not a number');
  }

  if (!Number.isInteger(table.position)) {
    isValid = false;
    issues.push('Table position is not an integer');
  }

  return { isValid, issues };
}
