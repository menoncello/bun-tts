/**
 * Validation logic for Markdown parser
 */

import type { MarkdownParserConfig } from '../config/markdown-parser-config.js';
import type {
  Chapter,
  DocumentStructure,
  Paragraph,
  ValidationError,
  ValidationWarning,
} from '../types.js';
import {
  validateBasicStructure,
  validateChapter,
  validateParagraph,
  validateSentence,
} from './validation-utils.js';

/**
 * Validate chapters and their contents
 *
 * @param structure - Document structure to validate
 * @param config - Parser configuration
 * @returns Validation errors and warnings
 */
export function validateChapters(
  structure: DocumentStructure,
  config: MarkdownParserConfig
): { errors: ValidationError[]; warnings: ValidationWarning[] } {
  const errors = validateBasicStructure(structure);
  const warnings: ValidationWarning[] = [];

  for (const [chapterIndex, chapter] of structure.chapters.entries()) {
    const chapterValidation = validateChapter(chapter, chapterIndex, config);
    errors.push(...chapterValidation.errors);
    warnings.push(...chapterValidation.warnings);

    validateChapterContent({
      chapter,
      chapterIndex,
      config,
      errors,
      warnings,
    });
  }

  return { errors, warnings };
}

/**
 * Validate chapter content (paragraphs and sentences)
 *
 * @param validationContext - Context for chapter content validation
 * @param validationContext.chapter - Chapter to validate
 * @param validationContext.chapterIndex - Index of chapter
 * @param validationContext.config - Parser configuration
 * @param validationContext.errors - Array to collect validation errors
 * @param validationContext.warnings - Array to collect validation warnings
 */
export function validateChapterContent(validationContext: {
  chapter: Chapter;
  chapterIndex: number;
  config: MarkdownParserConfig;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}): void {
  const { chapter, chapterIndex, config, errors, warnings } = validationContext;

  for (const [paragraphIndex, paragraph] of chapter.paragraphs.entries()) {
    const paragraphWarnings = validateParagraph(
      paragraph,
      chapterIndex,
      paragraphIndex,
      config
    );
    warnings.push(...paragraphWarnings);

    validateSentences(
      {
        paragraph,
        chapterIndex,
        paragraphIndex,
        errors,
        warnings,
      },
      config
    );
  }
}

/**
 * Validate sentences within a paragraph
 *
 * @param validationContext - Context for sentence validation
 * @param validationContext.paragraph - Paragraph containing sentences to validate
 * @param validationContext.chapterIndex - Index of the chapter containing the paragraph
 * @param validationContext.paragraphIndex - Index of the paragraph within the chapter
 * @param validationContext.errors - Array to collect validation errors
 * @param validationContext.warnings - Array to collect validation warnings
 * @param config - Parser configuration
 */
export function validateSentences(
  validationContext: {
    paragraph: Paragraph;
    chapterIndex: number;
    paragraphIndex: number;
    errors: ValidationError[];
    warnings: ValidationWarning[];
  },
  config: MarkdownParserConfig
): void {
  const { paragraph, chapterIndex, paragraphIndex, errors, warnings } =
    validationContext;

  for (const [sentenceIndex, sentence] of paragraph.sentences.entries()) {
    const sentenceValidation = validateSentence({
      sentence,
      chapterIndex,
      paragraphIndex,
      sentenceIndex,
      config,
    });
    errors.push(...sentenceValidation.errors);
    warnings.push(...sentenceValidation.warnings);
  }
}
