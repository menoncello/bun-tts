/**
 * Helper functions for PDF parser position validation tests.
 * These functions handle character positions and position validation.
 */

import type { DocumentStructure } from '../../../../src/core/document-processing/types';

/**
 * Validates character ranges and positions.
 * @param {DocumentStructure} documentStructure - Document structure to validate for character positions
 * @returns {{hasValidChapterPositions: boolean}} Object with validation results
 */
export function validateCharacterPositions(
  documentStructure: DocumentStructure
): {
  hasValidChapterPositions: boolean;
  hasValidParagraphPositions: boolean;
  hasValidSentencePositions: boolean;
  hasValidCharacterRanges: boolean;
  totalValidationErrors: number;
} {
  let documentPosition = 0;
  let hasValidChapterPositions = true;
  let hasValidParagraphPositions = true;
  let hasValidSentencePositions = true;
  let hasValidCharacterRanges = true;
  let totalValidationErrors = 0;

  for (const chapter of documentStructure.chapters) {
    const chapterValidation = validateChapterPosition(chapter);
    if (!chapterValidation.isValid) {
      hasValidChapterPositions = false;
      totalValidationErrors++;
    }

    const paragraphValidation = validateParagraphsPositions(chapter.paragraphs);
    if (!paragraphValidation.hasValidPositions) {
      hasValidParagraphPositions = false;
      totalValidationErrors += paragraphValidation.validationErrors;
    }

    if (!paragraphValidation.hasValidSentencePositions) {
      hasValidSentencePositions = false;
    }

    if ((chapter.charRange?.start ?? 0) < documentPosition) {
      hasValidCharacterRanges = false;
      totalValidationErrors++;
    }
    documentPosition = chapter.charRange?.end ?? documentPosition;
  }

  return {
    hasValidChapterPositions,
    hasValidParagraphPositions,
    hasValidSentencePositions,
    hasValidCharacterRanges,
    totalValidationErrors,
  };
}

/**
 * Validates a single chapter's position and character range.
 */
function validateChapterPosition(chapter: any): { isValid: boolean } {
  const hasValidChapterPosition = chapter.position >= 0;
  const hasValidChapterCharRange =
    chapter.charRange !== undefined && chapter.charRange !== null;
  const hasValidCharRangeStart = chapter.charRange?.start >= 0;
  const hasValidCharRangeEnd =
    chapter.charRange?.end > chapter.charRange?.start;

  const isValid =
    hasValidChapterPosition &&
    hasValidChapterCharRange &&
    hasValidCharRangeStart &&
    hasValidCharRangeEnd;

  return { isValid };
}

/**
 * Validates positions of paragraphs within a chapter.
 */
function validateParagraphsPositions(paragraphs: any[]): {
  hasValidPositions: boolean;
  hasValidSentencePositions: boolean;
  validationErrors: number;
} {
  let hasValidPositions = true;
  let hasValidSentencePositions = true;
  let validationErrors = 0;

  for (const paragraph of paragraphs) {
    const paragraphValidation = validateSingleParagraphPosition(paragraph);
    if (!paragraphValidation.isValid) {
      hasValidPositions = false;
      validationErrors++;
    }

    const sentenceValidation = validateSentencePositions(paragraph.sentences);
    if (!sentenceValidation.hasValidPositions) {
      hasValidSentencePositions = false;
      validationErrors += sentenceValidation.validationErrors;
    }
  }

  return {
    hasValidPositions,
    hasValidSentencePositions,
    validationErrors,
  };
}

/**
 * Validates a single paragraph's position and character range.
 */
function validateSingleParagraphPosition(paragraph: any): { isValid: boolean } {
  const hasValidParagraphPosition = paragraph.position >= 0;
  const hasValidDocumentPosition = paragraph.documentPosition >= 0;
  const hasValidParagraphCharRange =
    paragraph.charRange !== undefined && paragraph.charRange !== null;
  const hasValidParagraphCharRangeStart = paragraph.charRange?.start >= 0;
  const hasValidParagraphCharRangeEnd =
    paragraph.charRange?.end > paragraph.charRange?.start;

  const isValid =
    hasValidParagraphPosition &&
    hasValidDocumentPosition &&
    hasValidParagraphCharRange &&
    hasValidParagraphCharRangeStart &&
    hasValidParagraphCharRangeEnd;

  return { isValid };
}

/**
 * Validates sentence positions and character ranges.
 * @param {DocumentStructure['chapters'][0]['paragraphs'][0]['sentences']} sentences - Array of sentences to validate
 * @returns {{hasValidPositions: boolean, totalSentences: number, validSentences: number, validationErrors: number}} Object with validation results
 */
export function validateSentencePositions(
  sentences: DocumentStructure['chapters'][0]['paragraphs'][0]['sentences']
): {
  hasValidPositions: boolean;
  totalSentences: number;
  validSentences: number;
  validationErrors: number;
} {
  const sentenceResults = sentences.map((sentence: any, index: any) =>
    validateSingleSentencePosition(sentence, index)
  );

  const validSentences = sentenceResults.filter(
    (result: any) => result.isValid
  ).length;
  const validationErrors = sentenceResults.filter(
    (result: any) => !result.isValid
  ).length;

  return {
    hasValidPositions: validationErrors === 0,
    totalSentences: sentences.length,
    validSentences,
    validationErrors,
  };
}

/**
 * Validates a single sentence's position and character range.
 */
function validateSingleSentencePosition(
  sentence: DocumentStructure['chapters'][0]['paragraphs'][0]['sentences'][0],
  _index: number
): { isValid: boolean } {
  const positionValidation = validateSentencePositionFields(sentence);
  const charRangeValidation = validateSentenceCharacterRange(sentence);
  const lengthValidation = validateSentenceTextLength(sentence);

  const isValid =
    positionValidation.isValid &&
    charRangeValidation.isValid &&
    lengthValidation.isValid;

  return { isValid };
}

/**
 * Validates sentence position fields.
 */
function validateSentencePositionFields(sentence: any): { isValid: boolean } {
  const hasValidPosition = sentence.position >= 0;
  const hasValidDocumentPosition = sentence.documentPosition >= 0;

  return { isValid: hasValidPosition && hasValidDocumentPosition };
}

/**
 * Validates sentence character range.
 */
function validateSentenceCharacterRange(sentence: any): { isValid: boolean } {
  const hasValidCharRange =
    sentence.charRange !== undefined && sentence.charRange !== null;
  const hasValidCharRangeStart = sentence.charRange?.start >= 0;
  const hasValidCharRangeEnd =
    sentence.charRange?.end > sentence.charRange?.start;

  return {
    isValid:
      hasValidCharRange && hasValidCharRangeStart && hasValidCharRangeEnd,
  };
}

/**
 * Validates sentence text length against character range.
 */
function validateSentenceTextLength(sentence: any): { isValid: boolean } {
  const actualLength = sentence.text.length;
  const rangeLength = sentence.charRange?.end - sentence.charRange?.start;
  const hasValidLength = actualLength <= (rangeLength ?? 0);

  return { isValid: hasValidLength };
}
