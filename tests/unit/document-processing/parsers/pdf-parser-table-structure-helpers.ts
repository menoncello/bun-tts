/**
 * Helper functions for PDF table structure integrity validation.
 * These functions validate table consistency, formatting, and structure quality.
 */

import type { DocumentStructure } from '../../../../src/core/document-processing/types';

/**
 * Validates table structure integrity including consistency and content quality.
 * @returns {{hasConsistentTables: boolean, hasUniqueHeaders: boolean, hasGoodCellContent: boolean, validTablesCount: number}} Object with validation results
 */
export function validateTableStructureIntegrity(
  documentStructure: DocumentStructure
): {
  hasConsistentTables: boolean;
  hasUniqueHeaders: boolean;
  hasGoodCellContent: boolean;
  validTablesCount: number;
} {
  const allTableResults = getAllTableStructureResults(
    documentStructure.chapters
  );

  return {
    hasConsistentTables: allTableResults.every(
      (result) => result.hasConsistency
    ),
    hasUniqueHeaders: allTableResults.every(
      (result) => result.hasUniqueHeaders
    ),
    hasGoodCellContent: allTableResults.every(
      (result) => result.hasGoodCellContent
    ),
    validTablesCount: allTableResults.filter((result) => result.hasConsistency)
      .length,
  };
}

/**
 * Gets structure validation results for all tables across all chapters.
 */
function getAllTableStructureResults(
  chapters: DocumentStructure['chapters']
): Array<{
  hasConsistency: boolean;
  hasUniqueHeaders: boolean;
  hasGoodCellContent: boolean;
}> {
  return chapters.flatMap((chapter: any) =>
    getChapterTableStructureResults(chapter)
  );
}

/**
 * Gets structure validation results for all tables in a single chapter.
 */
function getChapterTableStructureResults(chapter: any): Array<{
  hasConsistency: boolean;
  hasUniqueHeaders: boolean;
  hasGoodCellContent: boolean;
}> {
  if (!chapter.tables || chapter.tables.length === 0) {
    return [];
  }

  return chapter.tables.map((table: any) => {
    const consistencyResult = validateTableConsistency(table, chapter);
    const uniquenessResult = validateHeaderUniqueness(table);
    const contentResult = validateTableCellContent(table);

    return {
      hasConsistency: consistencyResult.isValid,
      hasUniqueHeaders: uniquenessResult.hasGoodUniqueness,
      hasGoodCellContent: contentResult.hasGoodContent,
    };
  });
}

/**
 * Validates table consistency including header-row alignment and position bounds.
 */
function validateTableConsistency(
  table: any,
  chapter: any
): { isValid: boolean; issues: string[] } {
  const issues: string[] = [];
  let isValid = true;

  if (table.headers.length > 0 && table.rows.length > 0) {
    const headerCount = table.headers.length;

    // All rows should have the same number of columns as headers
    for (const row of table.rows) {
      if (row.length !== headerCount) {
        isValid = false;
        issues.push(
          `Row length ${row.length} doesn't match header count ${headerCount}`
        );
      }
    }

    // Validate table position is within chapter bounds
    if (table.position < 0) {
      isValid = false;
      issues.push('Table position is negative');
    }
    if (table.position >= chapter.paragraphs.length) {
      isValid = false;
      issues.push('Table position exceeds chapter paragraph count');
    }
  }

  return { isValid, issues };
}

/**
 * Validates header uniqueness to ensure meaningful table structure.
 */
function validateHeaderUniqueness(table: any): {
  hasGoodUniqueness: boolean;
  uniquenessRatio: number;
} {
  if (table.headers.length <= 1) {
    return { hasGoodUniqueness: true, uniquenessRatio: 1.0 };
  }

  const uniqueHeaders = [...new Set(table.headers)];
  const uniquenessRatio = uniqueHeaders.length / table.headers.length;
  const hasGoodUniqueness = uniquenessRatio > 0.5; // At least 50% unique

  return { hasGoodUniqueness, uniquenessRatio };
}

/**
 * Validates table cell content quality and non-empty cell ratio.
 */
function validateTableCellContent(table: any): {
  hasGoodContent: boolean;
  nonEmptyRatio: number;
} {
  let nonEmptyCells = 0;
  for (const row of table.rows) {
    for (const cell of row) {
      if (cell.trim().length > 0) {
        nonEmptyCells++;
      }
    }
  }

  if (table.rows.length === 0) {
    return { hasGoodContent: true, nonEmptyRatio: 1.0 };
  }

  const totalCells = table.rows.length * Math.max(table.headers.length, 1);
  const nonEmptyRatio = totalCells > 0 ? nonEmptyCells / totalCells : 0;
  const hasGoodContent = nonEmptyRatio > 0.3; // At least 30% non-empty

  return { hasGoodContent, nonEmptyRatio };
}
