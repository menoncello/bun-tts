/**
 * Helper functions for PDF table quality validation.
 * These functions validate table content quality, structure complexity, and extraction quality.
 */

import type { DocumentStructure } from '../../../../src/core/document-processing/types';

/**
 * Validates complex table structures handling.
 * @returns {{hasChapters: boolean, validComplexTables: number, hasGoodBasicStructure: boolean, hasGoodContentQuality: boolean}} Object with validation results
 */
export function validateComplexTableStructures(
  documentStructure: DocumentStructure
): {
  hasChapters: boolean;
  validComplexTables: number;
  hasGoodBasicStructure: boolean;
  hasGoodContentQuality: boolean;
} {
  const hasChapters = documentStructure.chapters.length > 0;
  const allTableResults = processAllComplexTables(documentStructure.chapters);

  return {
    hasChapters,
    validComplexTables: allTableResults.validComplexTables,
    hasGoodBasicStructure: allTableResults.hasGoodBasicStructure,
    hasGoodContentQuality: allTableResults.hasGoodContentQuality,
  };
}

/**
 * Processes all tables across all chapters and aggregates results.
 */
function processAllComplexTables(chapters: DocumentStructure['chapters']): {
  validComplexTables: number;
  hasGoodBasicStructure: boolean;
  hasGoodContentQuality: boolean;
} {
  const tableResults = chapters.flatMap((chapter: any) =>
    processChapterComplexTables(chapter)
  );

  return {
    validComplexTables: tableResults.filter(
      (result: any) => result.isValidComplex
    ).length,
    hasGoodBasicStructure: tableResults.every(
      (result: any) => result.hasGoodBasicStructure
    ),
    hasGoodContentQuality: tableResults.every(
      (result: any) => result.hasGoodContentQuality
    ),
  };
}

/**
 * Processes all tables in a single chapter.
 */
function processChapterComplexTables(chapter: any): Array<{
  isValidComplex: boolean;
  hasGoodBasicStructure: boolean;
  hasGoodContentQuality: boolean;
}> {
  if (!chapter.tables) {
    return [];
  }

  return chapter.tables.map((table: any) => {
    const basicStructureResult = validateComplexTableBasicStructure(table);
    const contentQualityResult = validateComplexTableContentQuality(table);

    return {
      isValidComplex:
        basicStructureResult.isValid && contentQualityResult.hasGoodQuality,
      hasGoodBasicStructure: basicStructureResult.isValid,
      hasGoodContentQuality: contentQualityResult.hasGoodQuality,
    };
  });
}

/**
 * Validates basic structure of complex tables.
 */
function validateComplexTableBasicStructure(table: any): {
  isValid: boolean;
  totalContent: number;
} {
  const hasHeadersArray = Array.isArray(table.headers);
  const hasRowsArray = Array.isArray(table.rows);
  const hasValidPosition = table.position >= 0;

  const totalContent =
    table.headers.length +
    table.rows.reduce((sum: number, row: string[]) => sum + row.length, 0);

  const isValid =
    hasHeadersArray && hasRowsArray && hasValidPosition && totalContent > 0;

  return { isValid, totalContent };
}

/**
 * Validates content quality of complex tables.
 */
function validateComplexTableContentQuality(table: any): {
  hasGoodQuality: boolean;
  meaningfulContent: number;
} {
  let meaningfulContent = 0;
  for (const header of table.headers) {
    if (header.trim().length > 1) meaningfulContent++;
  }
  for (const row of table.rows) {
    for (const cell of row) {
      if (cell.trim().length > 1) meaningfulContent++;
    }
  }

  const hasGoodQuality = meaningfulContent > 0;

  return { hasGoodQuality, meaningfulContent };
}

/**
 * Validates table extraction quality and completeness.
 * @returns {{hasGoodOverallQuality: boolean, hasGoodTableContent: boolean, qualityScore: number, qualityIssues: string[]}} Object with validation results
 */
export function validateTableExtractionQuality(
  documentStructure: DocumentStructure
): {
  hasGoodOverallQuality: boolean;
  hasGoodTableContent: boolean;
  qualityScore: number;
  qualityIssues: string[];
} {
  const overallResult = validateOverallDocumentQuality(documentStructure);
  const contentResult = validateTableContentQuality(documentStructure);

  const qualityScore =
    (overallResult.confidenceScore + contentResult.contentQualityScore) / 2;
  const hasGoodOverallQuality = overallResult.hasGoodQuality;
  const hasGoodTableContent = contentResult.hasGoodQuality;

  const qualityIssues = [...overallResult.issues, ...contentResult.issues];

  return {
    hasGoodOverallQuality,
    hasGoodTableContent,
    qualityScore,
    qualityIssues,
  };
}

/**
 * Validates overall document quality metrics.
 */
function validateOverallDocumentQuality(documentStructure: DocumentStructure): {
  hasGoodQuality: boolean;
  confidenceScore: number;
  issues: string[];
} {
  const issues: string[] = [];
  let hasGoodQuality = true;

  if (documentStructure.confidence < 0.7) {
    hasGoodQuality = false;
    issues.push(
      `Document confidence ${documentStructure.confidence} is below threshold 0.7`
    );
  }

  if ((documentStructure.stats?.errorCount ?? 0) >= 5) {
    hasGoodQuality = false;
    issues.push(
      `Error count ${documentStructure.stats?.errorCount} is too high`
    );
  }

  const confidenceScore = documentStructure.confidence;

  return { hasGoodQuality, confidenceScore, issues };
}

/**
 * Validates table content quality across all tables.
 */
function validateTableContentQuality(documentStructure: DocumentStructure): {
  hasGoodQuality: boolean;
  contentQualityScore: number;
  issues: string[];
} {
  const allTableResults = getAllTableQualityResults(documentStructure.chapters);

  return {
    hasGoodQuality: allTableResults.every(
      (result) => result.qualityScore >= 0.7
    ),
    contentQualityScore: calculateAverageQualityScore(allTableResults),
    issues: collectQualityIssues(allTableResults),
  };
}

/**
 * Gets quality results for all tables across all chapters.
 */
function getAllTableQualityResults(
  chapters: DocumentStructure['chapters']
): Array<{
  qualityScore: number;
  issues: string[];
}> {
  return chapters.flatMap((chapter: any) =>
    getChapterTableQualityResults(chapter)
  );
}

/**
 * Gets quality results for all tables in a single chapter.
 */
function getChapterTableQualityResults(chapter: any): Array<{
  qualityScore: number;
  issues: string[];
}> {
  if (!chapter.tables) {
    return [];
  }

  return chapter.tables
    .filter((table: any) => table.headers.length > 0 || table.rows.length > 0)
    .map((table: any) => validateSingleTableContentQuality(table));
}

/**
 * Calculates the average quality score from 'all table results.
 */
function calculateAverageQualityScore(
  tableResults: Array<{ qualityScore: number }>
): number {
  if (tableResults.length === 0) {
    return 1.0;
  }

  const totalScore = tableResults.reduce(
    (sum, result) => sum + result.qualityScore,
    0
  );
  return totalScore / tableResults.length;
}

/**
 * Collects quality issues from 'all table results.
 */
function collectQualityIssues(
  tableResults: Array<{ qualityScore: number; issues: string[] }>
): string[] {
  return tableResults
    .filter((result) => result.qualityScore < 0.7)
    .flatMap((result) =>
      result.issues.map(
        () =>
          `Table quality score ${result.qualityScore} is below threshold 0.7`
      )
    );
}

/**
 * Validates content quality for a single table.
 */
function validateSingleTableContentQuality(table: any): {
  qualityScore: number;
  issues: string[];
} {
  const issues: string[] = [];

  // Tables should have either headers or rows (or both)
  if (table.headers.length + table.rows.length === 0) {
    return { qualityScore: 0, issues: ['Table has no headers or rows'] };
  }

  const headerQuality = assessHeaderQuality(table.headers);
  const rowQuality = assessRowQuality(table.rows);
  const qualityRatio = calculateOverallQualityRatio(headerQuality, rowQuality);

  if (qualityRatio < 0.7) {
    issues.push(`Table quality ratio ${qualityRatio} is below threshold 0.7`);
  }

  return { qualityScore: qualityRatio, issues };
}

/**
 * Assesses the quality of table headers.
 */
function assessHeaderQuality(headers: string[]): {
  qualityScore: number;
  totalCells: number;
} {
  return headers.reduce(
    (result, header) => {
      result.totalCells++;
      if (isQualityCell(header)) {
        result.qualityScore++;
      }
      return result;
    },
    { qualityScore: 0, totalCells: 0 }
  );
}

/**
 * Assesses the quality of table rows.
 */
function assessRowQuality(rows: string[][]): {
  qualityScore: number;
  totalCells: number;
} {
  return rows.reduce(
    (result, row) => {
      for (const cell of row) {
        result.totalCells++;
        if (isQualityCell(cell)) {
          result.qualityScore++;
        }
      }
      return result;
    },
    { qualityScore: 0, totalCells: 0 }
  );
}

/**
 * Determines if a cell has quality content.
 */
function isQualityCell(cell: string): boolean {
  return cell.trim().length > 2 && !cell.match(/^\s+$/);
}

/**
 * Calculates the overall quality ratio from 'header and row quality.
 */
function calculateOverallQualityRatio(
  headerQuality: { qualityScore: number; totalCells: number },
  rowQuality: { qualityScore: number; totalCells: number }
): number {
  const totalQualityScore =
    headerQuality.qualityScore + rowQuality.qualityScore;
  const totalCells = headerQuality.totalCells + rowQuality.totalCells;

  return totalCells > 0 ? totalQualityScore / totalCells : 0;
}
