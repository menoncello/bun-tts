/**
 * Helper functions for PDF parser complex structure validation tests.
 * These functions handle complex document structure elements.
 */

import type { DocumentStructure } from '../../../../src/core/document-processing/types';

/**
 * Validates complex document structure elements.
 * @param {DocumentStructure} documentStructure - Document structure to validate for complex elements
 * @returns {{hasElementsArray: boolean}} Object with validation results
 */
export function validateComplexStructure(
  documentStructure: DocumentStructure
): {
  hasElementsArray: boolean;
  foundHeadings: number;
  foundCodeBlocks: number;
  foundQuotes: number;
  foundLists: number;
  validElements: number;
  hasValidContent: boolean;
} {
  const hasElementsArray = Array.isArray(documentStructure.elements);
  const structureCounts = countStructureElements(documentStructure);

  return {
    hasElementsArray,
    ...structureCounts,
  };
}

/**
 * Counts different types of structure elements in the document.
 */
function countStructureElements(documentStructure: DocumentStructure): {
  foundHeadings: number;
  foundCodeBlocks: number;
  foundQuotes: number;
  foundLists: number;
  validElements: number;
  hasValidContent: boolean;
} {
  let foundHeadings = 0;
  let foundCodeBlocks = 0;
  let foundQuotes = 0;
  let foundLists = 0;
  let validElements = 0;

  for (const chapter of documentStructure.chapters) {
    const chapterCounts = countChapterStructureElements(chapter);
    foundHeadings += chapterCounts.foundHeadings;
    foundCodeBlocks += chapterCounts.foundCodeBlocks;
    foundQuotes += chapterCounts.foundQuotes;
    foundLists += chapterCounts.foundLists;
    validElements += chapterCounts.validElements;
  }

  const totalFoundElements =
    foundHeadings + foundCodeBlocks + foundQuotes + foundLists;
  const hasValidContent = totalFoundElements >= 0 && validElements > 0;

  return {
    foundHeadings,
    foundCodeBlocks,
    foundQuotes,
    foundLists,
    validElements,
    hasValidContent,
  };
}

/**
 * Counts structure elements within a single chapter.
 */
function countChapterStructureElements(chapter: any): {
  foundHeadings: number;
  foundCodeBlocks: number;
  foundQuotes: number;
  foundLists: number;
  validElements: number;
} {
  let foundHeadings = 0;
  let foundCodeBlocks = 0;
  let foundQuotes = 0;
  let foundLists = 0;
  let validElements = 0;

  for (const paragraph of chapter.paragraphs) {
    const hasNonEmptyText =
      paragraph.rawText !== undefined && paragraph.rawText !== null;
    const hasValidContent = paragraph.rawText.trim().length > 0;

    if (hasNonEmptyText && hasValidContent) {
      validElements++;
    }

    const elementTypeCounts = countElementType(paragraph.type);
    foundHeadings += elementTypeCounts.foundHeadings;
    foundCodeBlocks += elementTypeCounts.foundCodeBlocks;
    foundQuotes += elementTypeCounts.foundQuotes;
    foundLists += elementTypeCounts.foundLists;
  }

  return {
    foundHeadings,
    foundCodeBlocks,
    foundQuotes,
    foundLists,
    validElements,
  };
}

/**
 * Counts a specific element type.
 */
function countElementType(type: string): {
  foundHeadings: number;
  foundCodeBlocks: number;
  foundQuotes: number;
  foundLists: number;
} {
  let foundHeadings = 0;
  let foundCodeBlocks = 0;
  let foundQuotes = 0;
  let foundLists = 0;

  switch (type) {
    case 'heading':
      foundHeadings++;
      break;
    case 'code':
      foundCodeBlocks++;
      break;
    case 'quote':
      foundQuotes++;
      break;
    case 'list-item':
      foundLists++;
      break;
  }

  return {
    foundHeadings,
    foundCodeBlocks,
    foundQuotes,
    foundLists,
  };
}
