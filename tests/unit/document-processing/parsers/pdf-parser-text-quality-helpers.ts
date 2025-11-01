/**
 * Helper functions for PDF parser content quality validation tests.
 * These functions handle content quality and readability validation.
 */

import type { DocumentStructure } from '../../../../src/core/document-processing/types';

/**
 * Validates content quality and readability.
 * @param {DocumentStructure} documentStructure - Document structure to validate for content quality
 * @returns {{hasGoodConfidence: boolean, hasValidStats: boolean, hasValidProcessingTime: boolean}} Object with validation results
 */
export function validateContentQuality(documentStructure: DocumentStructure): {
  hasGoodConfidence: boolean;
  hasValidStats: boolean;
  hasValidProcessingTime: boolean;
  hasValidErrorCount: boolean;
  validChapters: number;
  validParagraphs: number;
  validSentences: number;
  qualityIssues: string[];
} {
  const documentStats = validateDocumentStats(documentStructure);
  const contentValidation = validateDocumentContent(documentStructure);

  return {
    ...documentStats,
    ...contentValidation,
  };
}

/**
 * Validates document-level statistics and metadata.
 */
function validateDocumentStats(documentStructure: DocumentStructure): {
  hasGoodConfidence: boolean;
  hasValidStats: boolean;
  hasValidProcessingTime: boolean;
  hasValidErrorCount: boolean;
} {
  const hasGoodConfidence = documentStructure.confidence > 0;
  const hasValidStats =
    documentStructure.stats !== undefined && documentStructure.stats !== null;
  const hasValidProcessingTime =
    (documentStructure.stats?.processingTimeMs ?? 0) > 0;
  const hasValidErrorCount =
    (documentStructure.stats?.errorCount ?? 0) >= 0 &&
    (documentStructure.stats?.errorCount ?? 0) < 5;

  return {
    hasGoodConfidence,
    hasValidStats,
    hasValidProcessingTime,
    hasValidErrorCount,
  };
}

/**
 * Validates the content quality of chapters, paragraphs, and sentences.
 */
function validateDocumentContent(documentStructure: DocumentStructure): {
  validChapters: number;
  validParagraphs: number;
  validSentences: number;
  qualityIssues: string[];
} {
  let validChapters = 0;
  let validParagraphs = 0;
  let validSentences = 0;
  const qualityIssues: string[] = [];

  for (const chapter of documentStructure.chapters) {
    const chapterValidation = validateChapterContent(chapter);
    validChapters += chapterValidation.validChapters;
    validParagraphs += chapterValidation.validParagraphs;
    validSentences += chapterValidation.validSentences;
    qualityIssues.push(...chapterValidation.qualityIssues);
  }

  return {
    validChapters,
    validParagraphs,
    validSentences,
    qualityIssues,
  };
}

/**
 * Validates the content quality of a single chapter.
 */
function validateChapterContent(chapter: any): {
  validChapters: number;
  validParagraphs: number;
  validSentences: number;
  qualityIssues: string[];
} {
  let validChapters = 0;
  let validParagraphs = 0;
  let validSentences = 0;
  const qualityIssues: string[] = [];

  const hasTitle = chapter.title !== undefined && chapter.title !== null;
  const hasValidTitle = chapter.title?.trim().length > 0;

  if (hasTitle && hasValidTitle) {
    validChapters++;
  } else {
    qualityIssues.push(
      `Chapter at position ${chapter.position} has invalid or missing title`
    );
  }

  for (const paragraph of chapter.paragraphs) {
    const paragraphValidation = validateParagraphContent(paragraph, chapter);
    validParagraphs += paragraphValidation.validParagraphs;
    validSentences += paragraphValidation.validSentences;
    qualityIssues.push(...paragraphValidation.qualityIssues);
  }

  return {
    validChapters,
    validParagraphs,
    validSentences,
    qualityIssues,
  };
}

/**
 * Validates the content quality of a single paragraph.
 */
function validateParagraphContent(
  paragraph: any,
  chapter: any
): {
  validParagraphs: number;
  validSentences: number;
  qualityIssues: string[];
} {
  let validParagraphs = 0;
  let validSentences = 0;
  const qualityIssues: string[] = [];

  const hasNonEmptyText = paragraph.rawText?.trim().length > 0;
  const hasMinimumWords = paragraph.rawText?.split(/\s+/).length >= 3;

  if (hasNonEmptyText && hasMinimumWords) {
    validParagraphs++;
  } else {
    qualityIssues.push(
      `Paragraph at chapter ${chapter.position}, position ${paragraph.position} has insufficient content`
    );
  }

  for (const sentence of paragraph.sentences) {
    const sentenceValidation = validateSentenceContent(
      sentence,
      chapter,
      paragraph
    );
    validSentences += sentenceValidation.validSentences;
    qualityIssues.push(...sentenceValidation.qualityIssues);
  }

  return {
    validParagraphs,
    validSentences,
    qualityIssues,
  };
}

/**
 * Validates the content quality of a single sentence.
 */
function validateSentenceContent(
  sentence: any,
  chapter: any,
  paragraph: any
): {
  validSentences: number;
  qualityIssues: string[];
} {
  let validSentences = 0;
  const qualityIssues: string[] = [];

  const hasNonEmptySentence = sentence.text?.trim().length > 0;
  const hasWordCount = sentence.wordCount >= 1;

  if (hasNonEmptySentence && hasWordCount) {
    validSentences++;
  } else {
    qualityIssues.push(
      `Sentence at chapter ${chapter.position}, paragraph ${paragraph.position}, position ${sentence.position} is invalid`
    );
  }

  return {
    validSentences,
    qualityIssues,
  };
}
