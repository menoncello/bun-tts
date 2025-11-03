/**
 * Validation rules for structure validation
 */

import type { DocumentStructure, Chapter } from './types';
import type {
  ValidationError,
  ValidationWarning,
  ValidationResult,
} from './types/validation-types';
import { VALIDATION_THRESHOLDS } from './validation-constants';
import {
  checkEmptyChapter,
  checkShortChapter,
  validateSentenceLength,
  checkConfidenceThresholds,
  checkChapterLengthConsistency,
} from './validation-helpers';

/**
 * Check chapter structure validation
 *
 * @param {DocumentStructure} structure - Document structure to validate
 * @returns {ValidationResult} Validation result with errors, warnings, and score
 */
export const checkChapterStructure = (
  structure: DocumentStructure
): ValidationResult => {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Check for minimum chapter count
  if (structure.chapters.length === 0) {
    errors.push({
      code: 'NO_CHAPTERS',
      message: 'Document has no chapters',
      location: {},
      severity: 'high',
    });
  }

  // Check for empty and short chapters
  for (const [index, chapter] of structure.chapters.entries()) {
    checkEmptyChapter(chapter, index, warnings);
    checkShortChapter(chapter, index, warnings);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    score: Math.max(
      0,
      1 -
        (errors.length * VALIDATION_THRESHOLDS.CHAPTER_SCORE_ERROR_WEIGHT +
          warnings.length * VALIDATION_THRESHOLDS.CHAPTER_SCORE_WARNING_WEIGHT)
    ),
  };
};

/**
 * Check paragraph structure validation
 *
 * @param {DocumentStructure} structure - Document structure to validate
 * @returns {ValidationResult} Validation result with errors, warnings, and score
 */
export const checkParagraphStructure = (
  structure: DocumentStructure
): ValidationResult => {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  validateParagraphs(structure.chapters, warnings);

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    score: calculateScore(
      errors,
      warnings,
      VALIDATION_THRESHOLDS.PARAGRAPH_SCORE_ERROR_WEIGHT,
      VALIDATION_THRESHOLDS.PARAGRAPH_SCORE_WARNING_WEIGHT
    ),
  };
};

/**
 * Validate paragraphs in all chapters
 *
 * @param {Chapter[]} chapters - Chapters to validate
 * @param {ValidationWarning[]} warnings - Array to push warnings to
 */
const validateParagraphs = (
  chapters: Chapter[],
  warnings: ValidationWarning[]
): void => {
  for (const [chapterIndex, chapter] of chapters.entries()) {
    for (const [paragraphIndex, paragraph] of chapter.paragraphs.entries()) {
      // Check for empty paragraphs
      if (paragraph.sentences.length === 0) {
        warnings.push({
          code: 'EMPTY_PARAGRAPH',
          message: 'Paragraph has no sentences',
          location: { chapter: chapterIndex, paragraph: paragraphIndex },
          severity: 'low',
        });
      }

      // Check paragraph confidence
      if (
        paragraph.confidence < VALIDATION_THRESHOLDS.MIN_PARAGRAPH_CONFIDENCE
      ) {
        warnings.push({
          code: 'LOW_PARAGRAPH_CONFIDENCE',
          message: `Paragraph has low confidence score (${paragraph.confidence.toFixed(VALIDATION_THRESHOLDS.CONFIDENCE_DECIMAL_PLACES)})`,
          location: { chapter: chapterIndex, paragraph: paragraphIndex },
          severity: 'medium',
        });
      }
    }
  }
};

/**
 * Calculate validation score
 *
 * @param {Array} errors - Array of errors
 * @param {Array} warnings - Array of warnings
 * @param {number} errorWeight - Error weight
 * @param {number} warningWeight - Warning weight
 * @returns {number} Calculated score
 */
const calculateScore = (
  errors: ValidationError[],
  warnings: ValidationWarning[],
  errorWeight: number,
  warningWeight: number
): number => {
  return Math.max(
    0,
    1 - (errors.length * errorWeight + warnings.length * warningWeight)
  );
};

/**
 * Check sentence structure validation
 *
 * @param {DocumentStructure} structure - Document structure to validate
 * @returns {ValidationResult} Validation result with errors, warnings, and score
 */
export const checkSentenceStructure = (
  structure: DocumentStructure
): ValidationResult => {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  for (const [chapterIndex, chapter] of structure.chapters.entries()) {
    for (const [paragraphIndex, paragraph] of chapter.paragraphs.entries()) {
      for (const [sentenceIndex, sentence] of paragraph.sentences.entries()) {
        validateSentenceLength(
          sentence,
          { chapterIndex, paragraphIndex, sentenceIndex },
          warnings
        );
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    score: Math.max(
      0,
      1 -
        (errors.length * VALIDATION_THRESHOLDS.SENTENCE_SCORE_ERROR_WEIGHT +
          warnings.length * VALIDATION_THRESHOLDS.SENTENCE_SCORE_WARNING_WEIGHT)
    ),
  };
};

/**
 * Check structure coherence validation
 *
 * @param {DocumentStructure} structure - Document structure to validate
 * @returns {ValidationResult} Validation result with errors, warnings, and score
 */
export const checkStructureCoherence = (
  structure: DocumentStructure
): ValidationResult => {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Check confidence threshold
  checkConfidenceThresholds(structure.confidence, errors, warnings);

  // Check for structure consistency
  checkChapterLengthConsistency(structure.chapters, warnings);

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    score: Math.max(
      0,
      1 -
        (errors.length * VALIDATION_THRESHOLDS.COHERENCE_SCORE_ERROR_WEIGHT +
          warnings.length *
            VALIDATION_THRESHOLDS.COHERENCE_SCORE_WARNING_WEIGHT)
    ),
  };
};

/**
 * Default validation rules
 */
export const VALIDATION_RULES = {
  checkChapterStructure,
  checkParagraphStructure,
  checkSentenceStructure,
  checkStructureCoherence,
};
