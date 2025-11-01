/**
 * Validation utilities for Markdown parser
 */

import type { MarkdownParserConfig } from '../config/markdown-parser-config.js';
import type {
  Chapter,
  DocumentStructure,
  Paragraph,
  Sentence,
  ValidationError,
  ValidationWarning,
} from '../types.js';
import { PARSER_CONSTANTS } from './constants.js';

/**
 * Interface for sentence validation parameters
 */
interface SentenceValidationParams {
  /** Sentence to validate */
  sentence: Sentence;
  /** Index of chapter in document */
  chapterIndex: number;
  /** Index of paragraph in chapter */
  paragraphIndex: number;
  /** Index of sentence in paragraph */
  sentenceIndex: number;
  /** Parser configuration */
  config: MarkdownParserConfig;
}

/**
 * Error messages for validation
 */
const VALIDATION_MESSAGES = {
  NO_CHAPTERS: 'Document contains no chapters',
  NO_PARAGRAPHS: 'Document contains no paragraphs',
} as const;

/**
 * Validate basic document structure
 *
 * @param {DocumentStructure} structure - Document structure to validate containing chapters and metadata
 * @returns {ValidationError[]} Array of validation errors found in the document structure
 */
export function validateBasicStructure(
  structure: DocumentStructure
): ValidationError[] {
  const errors: ValidationError[] = [];

  // Handle null/undefined or malformed structure
  if (!structure) {
    addNoChaptersError(errors);
    addNoParagraphsError(errors);
    return errors;
  }

  // Handle chapters validation
  validateChapters(structure, errors);

  // Handle paragraphs validation
  validateParagraphs(structure, errors);

  return errors;
}

/**
 * Add no chapters error to errors array
 *
 * @param {ValidationError[]} errors - Array to add error to
 */
function addNoChaptersError(errors: ValidationError[]): void {
  errors.push({
    code: 'NO_CHAPTERS',
    message: VALIDATION_MESSAGES.NO_CHAPTERS,
    location: {},
    severity: 'high',
  });
}

/**
 * Add no paragraphs error to errors array
 *
 * @param {ValidationError[]} errors - Array to add error to
 */
function addNoParagraphsError(errors: ValidationError[]): void {
  errors.push({
    code: 'NO_PARAGRAPHS',
    message: VALIDATION_MESSAGES.NO_PARAGRAPHS,
    location: {},
    severity: 'high',
  });
}

/**
 * Validate chapters in structure
 *
 * @param {DocumentStructure} structure - Document structure to validate
 * @param {ValidationError[]} errors - Array to add errors to
 */
function validateChapters(
  structure: DocumentStructure,
  errors: ValidationError[]
): void {
  if (!structure.chapters || structure.chapters.length === 0) {
    addNoChaptersError(errors);
  }
}

/**
 * Validate paragraphs in structure
 *
 * @param {DocumentStructure} structure - Document structure to validate
 * @param {ValidationError[]} errors - Array to add errors to
 */
function validateParagraphs(
  structure: DocumentStructure,
  errors: ValidationError[]
): void {
  if (
    structure.totalParagraphs === undefined ||
    structure.totalParagraphs === 0
  ) {
    addNoParagraphsError(errors);
  }
}

/**
 * Validate individual chapter
 *
 * @param {Chapter} chapter - Chapter to validate containing title and paragraphs
 * @param {number} chapterIndex - Index of chapter in document (0-based)
 * @param {MarkdownParserConfig} _config - Parser configuration (currently unused but kept for future extensibility)
 * @returns {{errors: ValidationError[], warnings: ValidationWarning[]}} Object containing validation errors and warnings found in the chapter
 */
export function validateChapter(
  chapter: Chapter,
  chapterIndex: number,
  _config: MarkdownParserConfig
): { errors: ValidationError[]; warnings: ValidationWarning[] } {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  if (!chapter.title || chapter.title.trim().length === 0) {
    warnings.push({
      code: 'EMPTY_CHAPTER_TITLE',
      message: `Chapter ${chapterIndex + 1} has empty title`,
      location: { chapter: chapterIndex },
      suggestion: 'Consider adding a meaningful title',
    });
  }

  if (chapter.paragraphs.length === 0) {
    warnings.push({
      code: 'EMPTY_CHAPTER',
      message: `Chapter ${chapterIndex + 1} has no paragraphs`,
      location: { chapter: chapterIndex },
      suggestion: 'Add content to chapter or consider removing it',
    });
  }

  return { errors, warnings };
}

/**
 * Validate paragraph
 *
 * @param {Paragraph} paragraph - Paragraph to validate containing sentences and type information
 * @param {number} chapterIndex - Index of chapter in document (0-based)
 * @param {number} paragraphIndex - Index of paragraph in chapter (0-based)
 * @param {MarkdownParserConfig} _config - Parser configuration (currently unused but kept for future extensibility)
 * @returns {ValidationWarning[]} Array of validation warnings found in the paragraph
 */
export function validateParagraph(
  paragraph: Paragraph,
  chapterIndex: number,
  paragraphIndex: number,
  _config: MarkdownParserConfig
): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];

  if (paragraph.sentences.length === 0 && paragraph.type === 'text') {
    warnings.push({
      code: 'EMPTY_PARAGRAPH',
      message: `Empty text paragraph found in chapter ${chapterIndex + 1}`,
      location: { chapter: chapterIndex, paragraph: paragraphIndex },
      suggestion: 'Remove empty paragraphs or add content',
    });
  }

  return warnings;
}

/**
 * Validate sentence
 *
 * @param {SentenceValidationParams} params - Object containing all validation parameters
 * @param {Sentence} params.sentence - Sentence to validate containing text and metadata
 * @param {number} params.chapterIndex - Index of chapter in document (0-based)
 * @param {number} params.paragraphIndex - Index of paragraph in chapter (0-based)
 * @param {number} params.sentenceIndex - Index of sentence in paragraph (0-based)
 * @param {MarkdownParserConfig} params.config - Parser configuration containing validation rules
 * @returns {{errors: ValidationError[], warnings: ValidationWarning[]}} Object containing validation errors and warnings found in the sentence
 */
export function validateSentence(params: SentenceValidationParams): {
  errors: ValidationError[];
  warnings: ValidationWarning[];
} {
  const location = {
    chapter: params.chapterIndex,
    paragraph: params.paragraphIndex,
    sentence: params.sentenceIndex,
  };

  const warnings = validateSentenceLength(
    params.sentence,
    params.config,
    location
  );
  const errors = validateSentenceMaxLength(
    params.sentence,
    params.config,
    location
  );

  return { errors, warnings };
}

/**
 * Validate minimum sentence length
 *
 * @param {Sentence} sentence - Sentence to validate containing text content
 * @param {MarkdownParserConfig} config - Parser configuration containing minimum length rules
 * @param {{chapter: number, paragraph: number, sentence: number}} location - Object containing the position of the sentence in the document
 * @param {number} location.chapter - Index of chapter in document (0-based)
 * @param {number} location.paragraph - Index of paragraph in chapter (0-based)
 * @param {number} location.sentence - Index of sentence in paragraph (0-based)
 * @returns {ValidationWarning[]} Array of validation warnings for sentences that are too short
 */
function validateSentenceLength(
  sentence: Sentence,
  config: MarkdownParserConfig,
  location: { chapter: number; paragraph: number; sentence: number }
): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];

  if (sentence.text.length < config.minSentenceLength) {
    warnings.push({
      code: 'SHORT_SENTENCE',
      message: `Very short sentence: "${sentence.text}"`,
      location,
      suggestion: 'Consider combining with adjacent sentences',
    });
  }

  return warnings;
}

/**
 * Validate maximum sentence length
 *
 * @param {Sentence} sentence - Sentence to validate containing text content
 * @param {MarkdownParserConfig} config - Parser configuration containing maximum length rules
 * @param {{chapter: number, paragraph: number, sentence: number}} location - Object containing the position of the sentence in the document
 * @param {number} location.chapter - Index of chapter in document (0-based)
 * @param {number} location.paragraph - Index of paragraph in chapter (0-based)
 * @param {number} location.sentence - Index of sentence in paragraph (0-based)
 * @returns {ValidationError[]} Array of validation errors for sentences that exceed maximum length
 */
function validateSentenceMaxLength(
  sentence: Sentence,
  config: MarkdownParserConfig,
  location: { chapter: number; paragraph: number; sentence: number }
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (sentence.text.length > config.maxSentenceLength) {
    errors.push({
      code: 'LONG_SENTENCE',
      message: `Sentence too long: ${sentence.text.length} characters`,
      location,
      severity: 'medium',
    });
  }

  return errors;
}

/**
 * Calculate validation score
 *
 * @param {DocumentStructure} structure - Document structure containing chapters and metadata
 * @param {number} errorCount - Number of errors found during validation
 * @param {number} warningCount - Number of warnings found during validation
 * @returns {number} Validation score between 0 and 1, where 1 indicates perfect validation
 */
export function calculateValidationScore(
  structure: DocumentStructure,
  errorCount: number,
  warningCount: number
): number {
  const totalChecks =
    structure.chapters.length * PARSER_CONSTANTS.CHAPTER_WEIGHT +
    structure.totalParagraphs * PARSER_CONSTANTS.PARAGRAPH_WEIGHT +
    structure.totalSentences;

  return Math.max(
    0,
    1 -
      (errorCount * PARSER_CONSTANTS.ERROR_WEIGHT_MULTIPLIER +
        warningCount * PARSER_CONSTANTS.WARNING_WEIGHT_MULTIPLIER) /
        Math.max(totalChecks, 1)
  );
}
