/**
 * Helper functions for structure validation
 */

import type { DocumentStructure, Chapter } from './types';
import type {
  ValidationError,
  ValidationWarning,
} from './types/validation-types';
import { VALIDATION_THRESHOLDS } from './validation-constants';

const WARNING_REVIEW_THRESHOLD_OFFSET = 5;

/**
 * Helper function to check if a chapter is empty
 *
 * @param {object} chapter - Chapter to check
 * @param {unknown[]} chapter.paragraphs - Chapter paragraphs
 * @param {string} chapter.title - Chapter title
 * @param {number} index - Chapter index
 * @param {Array<ValidationWarning>} warnings - Array to push warnings to
 */
export const checkEmptyChapter = (
  chapter: { paragraphs: unknown[]; title: string },
  index: number,
  warnings: ValidationWarning[]
): void => {
  if (chapter.paragraphs.length === 0) {
    warnings.push({
      code: 'EMPTY_CHAPTER',
      message: `Chapter "${chapter.title}" has no content`,
      location: { chapter: index },
      severity: 'medium',
    });
  }
};

/**
 * Helper function to check if a chapter is too short
 *
 * @param {object} chapter - Chapter to check
 * @param {number} chapter.wordCount - Chapter word count
 * @param {string} chapter.title - Chapter title
 * @param {number} index - Chapter index
 * @param {Array<ValidationWarning>} warnings - Array to push warnings to
 */
export const checkShortChapter = (
  chapter: { wordCount: number; title: string },
  index: number,
  warnings: ValidationWarning[]
): void => {
  if (
    chapter.wordCount > 0 &&
    chapter.wordCount < VALIDATION_THRESHOLDS.MIN_CHAPTER_WORDS
  ) {
    warnings.push({
      code: 'SHORT_CHAPTER',
      message: `Chapter "${chapter.title}" is very short (${chapter.wordCount} words)`,
      location: { chapter: index },
      severity: 'low',
    });
  }
};

/**
 * Helper function to check for very short sentences
 *
 * @param {object} sentence - Sentence to check
 * @param {number} sentence.wordCount - Sentence word count
 * @param {object} location - Location information
 * @param {number} location.chapterIndex - Chapter index
 * @param {number} location.paragraphIndex - Paragraph index
 * @param {number} location.sentenceIndex - Sentence index
 * @param {Array<ValidationWarning>} warnings - Array to push warnings to
 */
export const checkShortSentence = (
  sentence: { wordCount: number },
  location: {
    chapterIndex: number;
    paragraphIndex: number;
    sentenceIndex: number;
  },
  warnings: ValidationWarning[]
): void => {
  if (
    sentence.wordCount > 0 &&
    sentence.wordCount < VALIDATION_THRESHOLDS.MIN_SENTENCE_WORDS
  ) {
    warnings.push({
      code: 'VERY_SHORT_SENTENCE',
      message: `Sentence has very few words (${sentence.wordCount})`,
      location: {
        chapter: location.chapterIndex,
        paragraph: location.paragraphIndex,
        sentence: location.sentenceIndex,
      },
      severity: 'low',
    });
  }
};

/**
 * Helper function to check for very long sentences
 *
 * @param {object} sentence - Sentence to check
 * @param {number} sentence.wordCount - Sentence word count
 * @param {object} location - Location information
 * @param {number} location.chapterIndex - Chapter index
 * @param {number} location.paragraphIndex - Paragraph index
 * @param {number} location.sentenceIndex - Sentence index
 * @param {Array<ValidationWarning>} warnings - Array to push warnings to
 */
export const checkLongSentence = (
  sentence: { wordCount: number },
  location: {
    chapterIndex: number;
    paragraphIndex: number;
    sentenceIndex: number;
  },
  warnings: ValidationWarning[]
): void => {
  if (sentence.wordCount > VALIDATION_THRESHOLDS.MAX_SENTENCE_WORDS) {
    warnings.push({
      code: 'VERY_LONG_SENTENCE',
      message: `Sentence has many words (${sentence.wordCount})`,
      location: {
        chapter: location.chapterIndex,
        paragraph: location.paragraphIndex,
        sentence: location.sentenceIndex,
      },
      severity: 'low',
    });
  }
};

/**
 * Helper function to validate sentence length
 *
 * @param {object} sentence - Sentence to validate
 * @param {number} sentence.wordCount - Sentence word count
 * @param {object} location - Location information
 * @param {number} location.chapterIndex - Chapter index
 * @param {number} location.paragraphIndex - Paragraph index
 * @param {number} location.sentenceIndex - Sentence index
 * @param {Array<ValidationWarning>} warnings - Array to push warnings to
 */
export function validateSentenceLength(
  sentence: { wordCount: number },
  location: {
    chapterIndex: number;
    paragraphIndex: number;
    sentenceIndex: number;
  },
  warnings: ValidationWarning[]
): void {
  checkShortSentence(sentence, location, warnings);
  checkLongSentence(sentence, location, warnings);
}

/**
 * Check confidence thresholds for coherence validation
 *
 * @param {number} overallConfidence - Overall document confidence
 * @param {Array<ValidationError>} errors - Errors array to push to
 * @param {Array<ValidationWarning>} warnings - Warnings array to push to
 */
export const checkConfidenceThresholds = (
  overallConfidence: number,
  errors: ValidationError[],
  warnings: ValidationWarning[]
): void => {
  if (overallConfidence < VALIDATION_THRESHOLDS.LOW_CONFIDENCE_THRESHOLD) {
    errors.push({
      code: 'LOW_OVERALL_CONFIDENCE',
      message: `Document has low overall confidence (${overallConfidence.toFixed(VALIDATION_THRESHOLDS.CONFIDENCE_DECIMAL_PLACES)})`,
      location: {},
      severity: 'high',
    });
  } else if (
    overallConfidence < VALIDATION_THRESHOLDS.MEDIUM_CONFIDENCE_THRESHOLD
  ) {
    warnings.push({
      code: 'MEDIUM_OVERALL_CONFIDENCE',
      message: `Document has medium confidence (${overallConfidence.toFixed(VALIDATION_THRESHOLDS.CONFIDENCE_DECIMAL_PLACES)})`,
      location: {},
      severity: 'medium',
    });
  }
};

/**
 * Check for inconsistent chapter lengths
 *
 * @param {Array<object>} chapters - Array of chapters
 * @param {Array<ValidationWarning>} warnings - Warnings array to push to
 */
export const checkChapterLengthConsistency = (
  chapters: Array<{ wordCount: number }>,
  warnings: ValidationWarning[]
): void => {
  if (chapters.length > 1) {
    const avgChapterLength =
      chapters.reduce((sum, ch) => sum + ch.wordCount, 0) / chapters.length;

    const inconsistentChapters = chapters.filter(
      (ch) =>
        ch.wordCount <
          avgChapterLength *
            VALIDATION_THRESHOLDS.MIN_CHAPTER_LENGTH_MULTIPLIER ||
        ch.wordCount >
          avgChapterLength * VALIDATION_THRESHOLDS.MAX_CHAPTER_LENGTH_MULTIPLIER
    );

    if (inconsistentChapters.length > 0) {
      warnings.push({
        code: 'INCONSISTENT_CHAPTER_LENGTHS',
        message: `${inconsistentChapters.length} chapters have unusual lengths`,
        location: {},
        severity: 'low',
      });
    }
  }
};

/**
 * Validates basic document structure requirements
 * @param {DocumentStructure} structure - The document structure to validate
 * @returns {ValidationError[]} Array of validation errors
 */
export function validateBasicStructure(
  structure: DocumentStructure
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!structure.metadata?.title) {
    errors.push({
      code: 'MISSING_TITLE',
      message: 'Document must have a title',
      severity: 'critical',
      location: { chapter: 0, paragraph: 0, sentence: 0 },
    });
  }

  if (structure.chapters.length === 0) {
    errors.push({
      code: 'NO_CHAPTERS',
      message: 'Document must have at least one chapter',
      severity: 'critical',
      location: { chapter: 0, paragraph: 0, sentence: 0 },
    });
  }

  return errors;
}

/**
 * Validates individual chapters and generates warnings
 * @param {Chapter[]} chapters - Array of chapters to validate
 * @returns {ValidationWarning[]} Array of validation warnings
 */
export function validateChapters(chapters: Chapter[]): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];

  for (const [index, chapter] of chapters.entries()) {
    validateChapterTitle(chapter, index, warnings);
    validateChapterLength(chapter, index, warnings);
    validateChapterConfidence(chapter, index, warnings);
  }

  return warnings;
}

/**
 * Validates chapter title and adds warnings if needed
 * @param {Chapter} chapter - The chapter to validate
 * @param {number} index - The chapter index
 * @param {ValidationWarning[]} warnings - Array to add warnings to
 */
function validateChapterTitle(
  chapter: Chapter,
  index: number,
  warnings: ValidationWarning[]
): void {
  if (!chapter.title || chapter.title.trim() === '') {
    warnings.push({
      code: 'EMPTY_CHAPTER_TITLE',
      message: `Chapter ${index + 1} has no title`,
      severity: 'low',
      location: { chapter: index, paragraph: 0, sentence: 0 },
    });
  }
}

/**
 * Validates chapter length and adds warnings if needed
 * @param {Chapter} chapter - The chapter to validate
 * @param {number} index - The chapter index
 * @param {ValidationWarning[]} warnings - Array to add warnings to
 */
function validateChapterLength(
  chapter: Chapter,
  index: number,
  warnings: ValidationWarning[]
): void {
  if (chapter.wordCount < VALIDATION_THRESHOLDS.MIN_CHAPTER_WORDS) {
    warnings.push({
      code: 'SHORT_CHAPTER',
      message: `Chapter ${index + 1} is very short (${chapter.wordCount} words)`,
      severity: 'medium',
      location: { chapter: index, paragraph: 0, sentence: 0 },
    });
  }
}

/**
 * Validates chapter confidence and adds warnings if needed
 * @param {Chapter} chapter - The chapter to validate
 * @param {number} index - The chapter index
 * @param {ValidationWarning[]} warnings - Array to add warnings to
 */
function validateChapterConfidence(
  chapter: Chapter,
  index: number,
  warnings: ValidationWarning[]
): void {
  if (
    chapter.confidence &&
    chapter.confidence < VALIDATION_THRESHOLDS.MIN_PARAGRAPH_CONFIDENCE
  ) {
    warnings.push({
      code: 'LOW_CHAPTER_CONFIDENCE',
      message: `Chapter ${index + 1} has low confidence (${chapter.confidence})`,
      severity: 'high',
      location: { chapter: index, paragraph: 0, sentence: 0 },
    });
  }
}

/**
 * Calculates overall validation score based on errors and warnings
 * @param {number} errorCount - Number of validation errors
 * @param {number} warningCount - Number of validation warnings
 * @returns {number} Overall validation score (0-1)
 */
export function calculateOverallScore(
  errorCount: number,
  warningCount: number
): number {
  let overallScore = 1.0;
  overallScore -= errorCount * VALIDATION_THRESHOLDS.CHAPTER_SCORE_ERROR_WEIGHT;
  overallScore -=
    warningCount * VALIDATION_THRESHOLDS.CHAPTER_SCORE_WARNING_WEIGHT;
  overallScore = Math.max(
    VALIDATION_THRESHOLDS.VALIDATION_PASS_THRESHOLD,
    Math.min(1, overallScore)
  );

  return overallScore;
}

/**
 * Generates recommendations based on validation results
 * @param {number} errorCount - Number of validation errors
 * @param {number} warningCount - Number of validation warnings
 * @param {DocumentStructure} structure - The document structure
 * @returns {string[]} Array of recommendations
 */
export function generateRecommendations(
  errorCount: number,
  warningCount: number,
  structure: DocumentStructure
): string[] {
  const recommendations: string[] = [];

  if (errorCount > 0) {
    recommendations.push('Fix structural errors before processing');
  }

  const WARNING_THRESHOLD_FOR_REVIEW =
    VALIDATION_THRESHOLDS.DEFAULT_MAX_WARNINGS -
    WARNING_REVIEW_THRESHOLD_OFFSET;
  if (warningCount > WARNING_THRESHOLD_FOR_REVIEW) {
    recommendations.push('Consider reviewing chapter structure and content');
  }

  if (
    structure.chapters.length === 1 &&
    structure.totalWordCount >
      VALIDATION_THRESHOLDS.SINGLE_CHAPTER_WORD_THRESHOLD
  ) {
    recommendations.push(
      'Consider splitting large document into multiple chapters'
    );
  }

  return recommendations;
}

/**
 * Determines if manual review is needed
 * @param {number} overallScore - Overall validation score
 * @param {number} warningCount - Number of validation warnings
 * @returns {boolean} True if manual review is needed
 */
export function needsManualReview(
  overallScore: number,
  warningCount: number
): boolean {
  const hasTooManyWarnings =
    warningCount > VALIDATION_THRESHOLDS.DEFAULT_MAX_WARNINGS;
  const scoreBelowThreshold =
    overallScore < VALIDATION_THRESHOLDS.DEFAULT_REQUIRE_MANUAL_REVIEW_BELOW;

  return scoreBelowThreshold || hasTooManyWarnings;
}
