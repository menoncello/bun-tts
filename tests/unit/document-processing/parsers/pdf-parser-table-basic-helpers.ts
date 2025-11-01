/**
 * Helper functions and test patterns for PDF table extraction tests.
 * Basic table extraction and structure validation functions.
 */

import type { DocumentStructure } from '../../../../src/core/document-processing/types';

/**
 * Validates basic table extraction from document structure.
 * @param {DocumentStructure} documentStructure - The document structure to validate tables from
 * @returns {number} Total number of tables found
 */
export function validateTableExtraction(
  documentStructure: DocumentStructure
): number {
  let totalTables = 0;

  for (const chapter of documentStructure.chapters) {
    if (chapter.tables) {
      totalTables += chapter.tables.length;
    }
  }

  return totalTables;
}

/**
 * Validates basic table extraction structure and returns detailed results.
 * @param {DocumentStructure} documentStructure - The document structure to validate
 * @returns {{
 *   hasElementsArray: boolean;
 *   totalTables: number;
 *   validTables: number;
 *   hasValidTableStructure: boolean;
 * }} Object with validation results
 */
export function validateTableExtractionStructure(
  documentStructure: DocumentStructure
): {
  hasElementsArray: boolean;
  totalTables: number;
  validTables: number;
  hasValidTableStructure: boolean;
} {
  const hasElementsArray = Array.isArray(documentStructure.elements);

  const tableValidation = validateTablesInChapters(documentStructure);
  const hasValidTableStructure =
    tableValidation.validTables > 0 || tableValidation.totalTables === 0;

  return {
    hasElementsArray,
    totalTables: tableValidation.totalTables,
    validTables: tableValidation.validTables,
    hasValidTableStructure,
  };
}

/**
 * Validates tables within chapters.
 */
function validateTablesInChapters(documentStructure: DocumentStructure): {
  totalTables: number;
  validTables: number;
} {
  let totalTables = 0;
  let validTables = 0;

  for (const chapter of documentStructure.chapters) {
    if (chapter.tables) {
      totalTables += chapter.tables.length;

      for (const table of chapter.tables) {
        if (isValidTableStructure(table)) {
          validTables++;
        }
      }
    }
  }

  return { totalTables, validTables };
}

/**
 * Validates if a single table has a valid structure.
 */
function isValidTableStructure(table: any): boolean {
  const hasHeadersArray = Array.isArray(table.headers);
  const hasRowsArray = Array.isArray(table.rows);
  const hasValidPosition = table.position >= 0;
  const hasValidHeaders = validateTableHeaders(table.headers);
  const hasValidRows = validateTableRows(table.rows);

  return (
    hasHeadersArray &&
    hasRowsArray &&
    hasValidPosition &&
    hasValidHeaders &&
    hasValidRows
  );
}

/**
 * Validates table headers.
 */
function validateTableHeaders(headers: any[]): boolean {
  if (headers.length === 0) return true;

  for (const header of headers) {
    const isString = typeof header === 'string';
    const hasValidHeaderText = header.trim().length > 0;
    if (!isString || !hasValidHeaderText) {
      return false;
    }
  }

  return true;
}

/**
 * Validates table rows and cells.
 */
function validateTableRows(rows: any[][]): boolean {
  if (rows.length === 0) return true;

  for (const row of rows) {
    const isRowArray = Array.isArray(row);
    if (!isRowArray) {
      return false;
    }

    for (const cell of row) {
      const isString = typeof cell === 'string';
      const hasValidCellText = cell.trim().length > 0;
      if (!isString || !hasValidCellText) {
        return false;
      }
    }
  }

  return true;
}
