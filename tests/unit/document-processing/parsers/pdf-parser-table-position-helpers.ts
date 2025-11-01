/**
 * Helper functions for PDF table position and context validation.
 * These functions validate table positions within documents and chapters.
 */

import type { DocumentStructure } from '../../../../src/core/document-processing/types';

/**
 * Validates table position and context information.
 * @returns {{hasValidDocumentPositions: boolean, hasValidChapterPositions: boolean, hasSequentialPositions: boolean, validPositionedTables: number}} Object with validation results
 */
export function validateTablePositionContext(
  documentStructure: DocumentStructure
): {
  hasValidDocumentPositions: boolean;
  hasValidChapterPositions: boolean;
  hasSequentialPositions: boolean;
  validPositionedTables: number;
} {
  const documentResult = validateDocumentLevelTablePositions(documentStructure);
  const chapterResult = validateChapterLevelTablePositions(documentStructure);

  return {
    hasValidDocumentPositions: documentResult.hasValidPositions,
    hasValidChapterPositions: chapterResult.hasValidPositions,
    hasSequentialPositions:
      documentResult.hasSequentialPositions &&
      chapterResult.hasSequentialPositions,
    validPositionedTables:
      documentResult.validTables + chapterResult.validTables,
  };
}

/**
 * Validates document-level table element positions.
 */
function validateDocumentLevelTablePositions(
  documentStructure: DocumentStructure
): {
  hasValidPositions: boolean;
  hasSequentialPositions: boolean;
  validTables: number;
} {
  const tableElements = getTableElements(documentStructure);

  return processTableElementsValidation(tableElements);
}

/**
 * Get all table elements from document structure
 * @param {DocumentStructure} documentStructure - Document structure to extract tables from
 * @returns {any[]} Array of table elements
 */
function getTableElements(documentStructure: DocumentStructure): any[] {
  return (
    documentStructure.elements?.filter((element) => element.type === 'table') ||
    []
  );
}

/**
 * Process validation for all table elements
 * @param {any[]} tableElements - Array of table elements to validate
 * @returns {{ hasValidPositions: boolean; hasSequentialPositions: boolean; validTables: number }} Validation results
 */
function processTableElementsValidation(tableElements: any[]): {
  hasValidPositions: boolean;
  hasSequentialPositions: boolean;
  validTables: number;
} {
  let validTables = 0;
  let hasValidPositions = true;
  let hasSequentialPositions = true;

  for (let i = 0; i < tableElements.length; i++) {
    const element = tableElements[i];
    if (!isValidElement(element)) continue;

    const positionValidation = validateElementPosition(element);
    const sequentialValidation = validateSequentialPosition(
      element,
      tableElements,
      i
    );

    validTables += positionValidation.isValid ? 1 : 0;
    hasValidPositions = hasValidPositions && positionValidation.isValid;
    hasSequentialPositions =
      hasSequentialPositions && sequentialValidation.isSequential;
  }

  return {
    hasValidPositions,
    hasSequentialPositions,
    validTables,
  };
}

/**
 * Check if element is valid (not undefined or null)
 * @param {any} element - Element to check
 * @returns {boolean} Whether element is valid
 */
function isValidElement(element: any): boolean {
  return element !== undefined && element !== null;
}

/**
 * Validate element position and return result
 * @param {any} element - Element to validate
 * @returns {{ isValid: boolean }} Position validation result
 */
function validateElementPosition(element: any): { isValid: boolean } {
  const positionResult = validateSingleTableElementPosition(element);
  return { isValid: positionResult.isValid };
}

/**
 * Validate sequential position between current and previous element
 * @param {any} element - Current element
 * @param {any[]} tableElements - All table elements
 * @param {number} currentIndex - Current element index
 * @returns {{ isSequential: boolean }} Sequential validation result
 */
function validateSequentialPosition(
  element: any,
  tableElements: any[],
  currentIndex: number
): { isSequential: boolean } {
  if (currentIndex === 0) {
    return { isSequential: true };
  }

  const prevElement = tableElements[currentIndex - 1];
  if (!isValidElement(prevElement)) {
    return { isSequential: true };
  }

  const sequentialResult = validateSequentialTablePositions(
    element,
    prevElement
  );
  return { isSequential: sequentialResult.isSequential };
}

/**
 * Validates a single table element's position.
 */
function validateSingleTableElementPosition(element: any): {
  isValid: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  let isValid = true;

  if (element.position < 0) {
    isValid = false;
    issues.push('Element position is negative');
  }

  if (element.charRange) {
    if (element.charRange.start < 0) {
      isValid = false;
      issues.push('Character range start is negative');
    }
    if (element.charRange.end <= element.charRange.start) {
      isValid = false;
      issues.push('Character range end is not greater than start');
    }
  } else {
    isValid = false;
    issues.push('Element has no character range');
  }

  return { isValid, issues };
}

/**
 * Validates sequential positioning of table elements.
 */
function validateSequentialTablePositions(
  element: any,
  prevElement: any
): { isSequential: boolean; issues: string[] } {
  const issues: string[] = [];
  let isSequential = true;

  if (element.position <= prevElement.position) {
    isSequential = false;
    issues.push('Element position is not greater than previous');
  }

  if (element.charRange?.start <= prevElement.charRange?.end) {
    isSequential = false;
    issues.push(
      'Element character range start is not greater than previous end'
    );
  }

  return { isSequential, issues };
}

/**
 * Validates chapter-level table positions.
 */
function validateChapterLevelTablePositions(
  documentStructure: DocumentStructure
): {
  hasValidPositions: boolean;
  hasSequentialPositions: boolean;
  validTables: number;
} {
  const chapterResults = documentStructure.chapters.map(processChapterTables);

  return {
    hasValidPositions: chapterResults.every(
      (result: any) => result.hasValidPositions
    ),
    hasSequentialPositions: chapterResults.every(
      (result: any) => result.hasSequentialPositions
    ),
    validTables: chapterResults.reduce(
      (sum: any, result: any) => sum + result.validTables,
      0
    ),
  };
}

/**
 * Processes all tables in a single chapter.
 */
function processChapterTables(chapter: any): {
  hasValidPositions: boolean;
  hasSequentialPositions: boolean;
  validTables: number;
} {
  if (!chapter.tables || chapter.tables.length === 0) {
    return {
      hasValidPositions: true,
      hasSequentialPositions: true,
      validTables: 0,
    };
  }

  const tableValidationResults = chapter.tables.map(
    (table: any, index: number) =>
      validateSingleChapterTableWithContext(
        table,
        chapter,
        index,
        chapter.tables
      )
  );

  return {
    hasValidPositions: tableValidationResults.every(
      (result: any) => result.isValidPosition
    ),
    hasSequentialPositions: tableValidationResults.every(
      (result: any) => result.isSequentialPosition
    ),
    validTables: tableValidationResults.filter(
      (result: any) => result.isValidPosition
    ).length,
  };
}

/**
 * Validates a single chapter table with position context.
 */
function validateSingleChapterTableWithContext(
  table: any,
  chapter: any,
  index: number,
  allTables: any[]
): {
  isValidPosition: boolean;
  isSequentialPosition: boolean;
} {
  const positionResult = validateSingleChapterTablePosition(table, chapter);
  const isSequentialPosition = checkSequentialTablePosition(
    table,
    index,
    allTables
  );

  return {
    isValidPosition: positionResult.isValid,
    isSequentialPosition,
  };
}

/**
 * Checks if table position is sequential relative to previous tables.
 */
function checkSequentialTablePosition(
  table: any,
  index: number,
  allTables: any[]
): boolean {
  if (index === 0) return true;

  const prevTable = allTables[index - 1];
  if (!prevTable) return true;

  return table.position > prevTable.position;
}

/**
 * Validates a single chapter table's position.
 */
function validateSingleChapterTablePosition(
  table: any,
  chapter: any
): { isValid: boolean; issues: string[] } {
  const issues: string[] = [];
  let isValid = true;

  if (table.position < 0) {
    isValid = false;
    issues.push('Table position is negative');
  }

  if (table.position >= chapter.paragraphs.length) {
    isValid = false;
    issues.push('Table position exceeds chapter paragraph count');
  }

  return { isValid, issues };
}
