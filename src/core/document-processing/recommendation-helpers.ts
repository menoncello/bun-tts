/**
 * Helper functions for generating validation recommendations
 */

import type { DocumentStructure } from './types';
import type {
  ValidationError,
  ValidationWarning,
} from './types/validation-types';
import { VALIDATION_THRESHOLDS } from './validation-constants';

/**
 * Add error-based recommendations
 *
 * @param {Array<object>} errors - Array of validation errors
 * @param {Array<string>} recommendations - Array to push recommendations to
 */
export const addErrorBasedRecommendations = (
  errors: ValidationError[],
  recommendations: string[]
): void => {
  if (errors.some((e) => e.code === 'NO_CHAPTERS')) {
    recommendations.push(
      'Document appears to lack clear chapter structure. Consider adding headers or section breaks.'
    );
  }

  if (errors.some((e) => e.code === 'LOW_OVERALL_CONFIDENCE')) {
    recommendations.push(
      'Document structure detection has low confidence. Review and validate chapter boundaries.'
    );
  }
};

/**
 * Add warning-based recommendations
 *
 * @param {Array<object>} warnings - Array of validation warnings
 * @param {Array<string>} recommendations - Array to push recommendations to
 */
export const addWarningBasedRecommendations = (
  warnings: ValidationWarning[],
  recommendations: string[]
): void => {
  const emptyChapterCount = warnings.filter(
    (w) => w.code === 'EMPTY_CHAPTER'
  ).length;
  if (emptyChapterCount > 0) {
    recommendations.push(
      `${emptyChapterCount} chapter(s) are empty. Consider merging or removing them.`
    );
  }

  const shortChapterCount = warnings.filter(
    (w) => w.code === 'SHORT_CHAPTER'
  ).length;
  if (shortChapterCount > 0) {
    recommendations.push(
      `${shortChapterCount} chapter(s) are very short. Verify chapter boundaries are correct.`
    );
  }

  const mediumConfidenceWarnings = warnings.filter(
    (w) => w.code === 'MEDIUM_OVERALL_CONFIDENCE'
  );
  if (mediumConfidenceWarnings.length > 0) {
    recommendations.push(
      'Document confidence is moderate. Consider manual review for structure accuracy.'
    );
  }
};

/**
 * Add structure-based recommendations
 *
 * @param {DocumentStructure} structure - Document structure to check
 * @param {Array<string>} recommendations - Array to push recommendations to
 */
export const addStructureBasedRecommendations = (
  structure: DocumentStructure,
  recommendations: string[]
): void => {
  if (
    structure.chapters.length === 1 &&
    structure.totalWordCount >
      VALIDATION_THRESHOLDS.SINGLE_CHAPTER_WORD_THRESHOLD
  ) {
    recommendations.push(
      'Single chapter with many words. Consider splitting into multiple chapters for better organization.'
    );
  }

  if (
    structure.chapters.length > VALIDATION_THRESHOLDS.MAX_RECOMMENDED_CHAPTERS
  ) {
    recommendations.push(
      'Many chapters detected. Consider merging some sections for better readability.'
    );
  }
};
