/**
 * Helper functions for PDF parser basic text extraction tests.
 * These functions reduce code duplication and nesting complexity.
 */

import type { DocumentStructure } from '../../../../src/core/document-processing/types';

/**
 * Validates basic document structure properties.
 * @param {DocumentStructure} documentStructure - Document structure to validate
 * @returns {{hasWords: boolean, hasSentences: boolean, hasParagraphs: boolean, hasChapters: boolean}} Object with validation results
 */
export function validateBasicDocumentStructure(
  documentStructure: DocumentStructure
): {
  hasWords: boolean;
  hasSentences: boolean;
  hasParagraphs: boolean;
  hasChapters: boolean;
} {
  const hasWords = documentStructure.totalWordCount > 0;
  const hasSentences = documentStructure.totalSentences >= 0;
  const hasParagraphs = documentStructure.totalParagraphs >= 0;
  const hasChapters = documentStructure.chapters.length > 0;

  return {
    hasWords,
    hasSentences,
    hasParagraphs,
    hasChapters,
  };
}

/**
 * Validates chapter structure and content.
 * @param {DocumentStructure['chapters']} chapters - Array of chapters to validate
 * @returns {{totalChapters: number, validChapters: number, totalWordCount: number, totalParagraphs: number}} Object with validation results
 */
export function validateChapterStructure(
  chapters: DocumentStructure['chapters']
): {
  totalChapters: number;
  validChapters: number;
  totalWordCount: number;
  totalParagraphs: number;
} {
  let totalWordCount = 0;
  let totalParagraphs = 0;
  let validChapters = 0;

  for (const chapter of chapters) {
    const hasValidWordCount = chapter.wordCount >= 0;
    const hasValidParagraphsArray = Array.isArray(chapter.paragraphs);
    const hasValidParagraphs =
      hasValidParagraphsArray && chapter.paragraphs.length > 0;

    if (hasValidWordCount && hasValidParagraphsArray && hasValidParagraphs) {
      validChapters++;
    }

    totalWordCount += chapter.wordCount;
    totalParagraphs += chapter.paragraphs.length;

    // Validate paragraphs within this chapter
    validateParagraphsInChapter(chapter.paragraphs);
  }

  return {
    totalChapters: chapters.length,
    validChapters,
    totalWordCount,
    totalParagraphs,
  };
}

/**
 * Validates paragraphs within a chapter.
 * @param {DocumentStructure['chapters'][0]['paragraphs']} paragraphs - Array of paragraphs to validate
 * @returns {{totalParagraphs: number, validParagraphs: number, totalSentences: number, validSentences: number}} Object with validation results
 */
export function validateParagraphsInChapter(
  paragraphs: DocumentStructure['chapters'][0]['paragraphs']
): {
  totalParagraphs: number;
  validParagraphs: number;
  totalSentences: number;
  validSentences: number;
} {
  let totalSentences = 0;
  let validParagraphs = 0;
  let validSentences = 0;

  for (const paragraph of paragraphs) {
    const hasSentencesArray = Array.isArray(paragraph.sentences);
    const hasValidSentencesCount = paragraph.sentences.length > 0;
    const hasRawText =
      paragraph.rawText !== undefined && paragraph.rawText !== null;
    const hasNonEmptyText = paragraph.rawText.trim().length > 0;

    if (
      hasSentencesArray &&
      hasValidSentencesCount &&
      hasRawText &&
      hasNonEmptyText
    ) {
      validParagraphs++;
    }

    totalSentences += paragraph.sentences.length;

    // Validate sentences within this paragraph
    const sentenceValidation = validateSentencesInParagraph(
      paragraph.sentences
    );
    validSentences += sentenceValidation.validSentences;
  }

  return {
    totalParagraphs: paragraphs.length,
    validParagraphs,
    totalSentences,
    validSentences,
  };
}

/**
 * Validates sentences within a paragraph.
 * @param {DocumentStructure['chapters'][0]['paragraphs'][0]['sentences']} sentences - Array of sentences to validate
 * @returns {{totalSentences: number, validSentences: number, totalWords: number}} Object with validation results
 */
export function validateSentencesInParagraph(
  sentences: DocumentStructure['chapters'][0]['paragraphs'][0]['sentences']
): {
  totalSentences: number;
  validSentences: number;
  totalWords: number;
} {
  let totalWords = 0;
  let validSentences = 0;

  for (const sentence of sentences) {
    const hasText = sentence.text !== undefined && sentence.text !== null;
    const hasNonEmptyText = sentence.text.trim().length > 0;
    const hasWordCount = sentence.wordCount > 0;

    if (hasText && hasNonEmptyText && hasWordCount) {
      validSentences++;
    }

    totalWords += sentence.wordCount;
  }

  return {
    totalSentences: sentences.length,
    validSentences,
    totalWords,
  };
}

/**
 * Validates text accuracy and completeness.
 * @param {DocumentStructure} documentStructure - Document structure to validate for accuracy
 * @returns {{hasValidConfidence: boolean, hasValidSentenceStructure: boolean, validSentences: number, totalSentences: number, formattingIssues: string[]}} Object with validation results
 */
export function validateTextAccuracy(documentStructure: DocumentStructure): {
  hasValidConfidence: boolean;
  hasValidSentenceStructure: boolean;
  validSentences: number;
  totalSentences: number;
  formattingIssues: string[];
} {
  const hasValidConfidence =
    documentStructure.confidence >= 0 && documentStructure.confidence <= 1;
  const formattingIssues: string[] = [];
  let validSentences = 0;
  let hasValidSentenceStructure = true;

  // Validate sentence structure
  for (const chapter of documentStructure.chapters) {
    const chapterResult = validateChapterSentenceStructure(chapter);
    validSentences += chapterResult.validSentences;

    if (!chapterResult.hasValidStructure) {
      hasValidSentenceStructure = false;
      formattingIssues.push(...chapterResult.formattingIssues);
    }
  }

  return {
    hasValidConfidence,
    hasValidSentenceStructure,
    validSentences,
    totalSentences: documentStructure.totalSentences,
    formattingIssues,
  };
}

/**
 * Validates sentence structure within a chapter.
 * @param {DocumentStructure['chapters'][0]} chapter - Chapter to validate
 * @returns {{validSentences: number, hasValidStructure: boolean, formattingIssues: string[]}} Validation result
 */
function validateChapterSentenceStructure(
  chapter: DocumentStructure['chapters'][0]
): {
  validSentences: number;
  hasValidStructure: boolean;
  formattingIssues: string[];
} {
  let validSentences = 0;
  let hasValidStructure = true;
  const formattingIssues: string[] = [];

  for (const paragraph of chapter.paragraphs) {
    const paragraphResult = validateParagraphSentenceStructure(paragraph);
    validSentences += paragraphResult.validSentences;

    if (!paragraphResult.hasValidStructure) {
      hasValidStructure = false;
      formattingIssues.push(...paragraphResult.formattingIssues);
    }
  }

  return { validSentences, hasValidStructure, formattingIssues };
}

/**
 * Validates sentence structure within a paragraph.
 * @param {DocumentStructure['chapters'][0]['paragraphs'][0]} paragraph - Paragraph to validate
 * @returns {{validSentences: number, hasValidStructure: boolean, formattingIssues: string[]}} Validation result
 */
function validateParagraphSentenceStructure(
  paragraph: DocumentStructure['chapters'][0]['paragraphs'][0]
): {
  validSentences: number;
  hasValidStructure: boolean;
  formattingIssues: string[];
} {
  let validSentences = 0;
  let hasValidStructure = true;
  const formattingIssues: string[] = [];

  for (const sentence of paragraph.sentences) {
    const sentenceResult = validateSentenceStructure(sentence);

    if (sentenceResult.isValid) {
      validSentences++;
    }

    if (!sentenceResult.hasValidStructure) {
      hasValidStructure = false;
      formattingIssues.push(...sentenceResult.formattingIssues);
    }
  }

  return { validSentences, hasValidStructure, formattingIssues };
}

/**
 * Validates individual sentence structure.
 * @param {DocumentStructure['chapters'][0]['paragraphs'][0]['sentences'][0]} sentence - Sentence to validate
 * @returns {{isValid: boolean, hasValidStructure: boolean, formattingIssues: string[]}} Validation result
 */
function validateSentenceStructure(
  sentence: DocumentStructure['chapters'][0]['paragraphs'][0]['sentences'][0]
): {
  isValid: boolean;
  hasValidStructure: boolean;
  formattingIssues: string[];
} {
  const hasNonEmptyText = sentence.text.trim().length > 0;
  const hasCapitalStart = sentence.text.match(/^[A-Z]/) !== null;
  const hasEndPunctuation = sentence.text.match(/[!.?]$/) !== null;
  const isValid = hasNonEmptyText && hasCapitalStart && hasEndPunctuation;

  const formattingIssues: string[] = [];
  let hasValidStructure = true;

  if (!hasCapitalStart) {
    hasValidStructure = false;
    formattingIssues.push(
      `Sentence does not start with capital letter: ${sentence.text.substring(0, 20)}...'`
    );
  }

  if (!hasEndPunctuation) {
    hasValidStructure = false;
    formattingIssues.push(
      `Sentence does not end with punctuation: '${sentence.text.substring(0, 20)}..."`
    );
  }

  return { isValid, hasValidStructure, formattingIssues };
}

/**
 * Validates word count consistency.
 * @param {DocumentStructure} documentStructure - Document structure to validate for word count consistency
 * @returns {{totalWordCountFromChapters: number, documentTotalWords: number, difference: number, isConsistent: boolean, tolerance: number}} Object with validation results
 */
export function validateWordCountConsistency(
  documentStructure: DocumentStructure
): {
  totalWordCountFromChapters: number;
  documentTotalWords: number;
  difference: number;
  isConsistent: boolean;
  tolerance: number;
} {
  const totalWordCountFromChapters = documentStructure.chapters.reduce(
    (sum: number, chapter: DocumentStructure['chapters'][0]) =>
      sum + chapter.wordCount,
    0
  );

  const difference = Math.abs(
    totalWordCountFromChapters - documentStructure.totalWordCount
  );
  const tolerance = 20;
  const isConsistent = difference < tolerance;

  return {
    totalWordCountFromChapters,
    documentTotalWords: documentStructure.totalWordCount,
    difference,
    isConsistent,
    tolerance,
  };
}

/**
 * Validates sentence count consistency.
 * @param {DocumentStructure} documentStructure - Document structure to validate for sentence count consistency
 * @returns {{totalSentenceCountFromChapters: number, documentTotalSentences: number, isConsistent: boolean}} Object with validation results
 */
export function validateSentenceCountConsistency(
  documentStructure: DocumentStructure
): {
  totalSentenceCountFromChapters: number;
  documentTotalSentences: number;
  isConsistent: boolean;
} {
  const totalSentenceCountFromChapters = documentStructure.chapters.reduce(
    (sum: number, chapter: DocumentStructure['chapters'][0]) =>
      sum +
      chapter.paragraphs.reduce(
        (
          paraSum: number,
          paragraph: DocumentStructure['chapters'][0]['paragraphs'][0]
        ) => paraSum + paragraph.sentences.length,
        0
      ),
    0
  );

  const isConsistent =
    totalSentenceCountFromChapters === documentStructure.totalSentences;

  return {
    totalSentenceCountFromChapters,
    documentTotalSentences: documentStructure.totalSentences,
    isConsistent,
  };
}

/**
 * Validates Unicode encoding for text content.
 * @param {DocumentStructure['chapters']} chapters - Array of chapters to validate for Unicode encoding
 * @returns {{hasValidEncoding: boolean, totalCharacters: number, invalidCharacters: number, encodingErrors: string[]}} Object with validation results
 */
export function validateUnicodeEncoding(
  chapters: DocumentStructure['chapters']
): {
  hasValidEncoding: boolean;
  totalCharacters: number;
  invalidCharacters: number;
  encodingErrors: string[];
} {
  let totalCharacters = 0;
  let invalidCharacters = 0;
  let hasValidEncoding = true;
  const encodingErrors: string[] = [];

  for (const chapter of chapters) {
    const chapterResult = validateChapterEncoding(chapter);
    totalCharacters += chapterResult.totalCharacters;
    invalidCharacters += chapterResult.invalidCharacters;

    if (!chapterResult.hasValidEncoding) {
      hasValidEncoding = false;
      encodingErrors.push(...chapterResult.encodingErrors);
    }
  }

  return {
    hasValidEncoding,
    totalCharacters,
    invalidCharacters,
    encodingErrors,
  };
}

/**
 * Validates Unicode encoding within a chapter.
 * @param {DocumentStructure['chapters'][0]} chapter - Chapter to validate
 * @returns {{hasValidEncoding: boolean, totalCharacters: number, invalidCharacters: number, encodingErrors: string[]}} Validation result
 */
function validateChapterEncoding(chapter: DocumentStructure['chapters'][0]): {
  hasValidEncoding: boolean;
  totalCharacters: number;
  invalidCharacters: number;
  encodingErrors: string[];
} {
  let totalCharacters = 0;
  let invalidCharacters = 0;
  let hasValidEncoding = true;
  const encodingErrors: string[] = [];

  for (const paragraph of chapter.paragraphs) {
    const paragraphResult = validateParagraphEncoding(paragraph, chapter);
    totalCharacters += paragraphResult.totalCharacters;
    invalidCharacters += paragraphResult.invalidCharacters;

    if (!paragraphResult.hasValidEncoding) {
      hasValidEncoding = false;
      encodingErrors.push(...paragraphResult.encodingErrors);
    }
  }

  return {
    hasValidEncoding,
    totalCharacters,
    invalidCharacters,
    encodingErrors,
  };
}

/**
 * Validates Unicode encoding within a paragraph.
 * @param {DocumentStructure['chapters'][0]['paragraphs'][0]} paragraph - Paragraph to validate
 * @param {DocumentStructure['chapters'][0]} chapter - Parent chapter for context
 * @returns {{hasValidEncoding: boolean, totalCharacters: number, invalidCharacters: number, encodingErrors: string[]}} Validation result
 */
function validateParagraphEncoding(
  paragraph: DocumentStructure['chapters'][0]['paragraphs'][0],
  chapter: DocumentStructure['chapters'][0]
): {
  hasValidEncoding: boolean;
  totalCharacters: number;
  invalidCharacters: number;
  encodingErrors: string[];
} {
  let totalCharacters = 0;
  let invalidCharacters = 0;
  let hasValidEncoding = true;
  const encodingErrors: string[] = [];

  // Validate paragraph text encoding
  const paragraphEncodingResult = validateTextEncoding(paragraph.rawText);
  totalCharacters += paragraphEncodingResult.totalCharacters;
  invalidCharacters += paragraphEncodingResult.invalidCharacters;

  if (!paragraphEncodingResult.hasValidEncoding) {
    hasValidEncoding = false;
    encodingErrors.push(
      `Invalid character in paragraph at chapter ${chapter.position}, paragraph ${paragraph.position}`
    );
  }

  // Validate sentence encoding
  for (const sentence of paragraph.sentences) {
    const sentenceEncodingResult = validateTextEncoding(sentence.text);
    totalCharacters += sentenceEncodingResult.totalCharacters;
    invalidCharacters += sentenceEncodingResult.invalidCharacters;

    if (!sentenceEncodingResult.hasValidEncoding) {
      hasValidEncoding = false;
      encodingErrors.push(
        `Invalid character in sentence at chapter ${chapter.position}, paragraph ${paragraph.position}, sentence ${sentence.position}`
      );
    }
  }

  return {
    hasValidEncoding,
    totalCharacters,
    invalidCharacters,
    encodingErrors,
  };
}

/**
 * Validates Unicode encoding for a text string.
 * @param {string} text - Text to validate
 * @returns {{hasValidEncoding: boolean, totalCharacters: number, invalidCharacters: number}} Validation result
 */
function validateTextEncoding(text: string): {
  hasValidEncoding: boolean;
  totalCharacters: number;
  invalidCharacters: number;
} {
  let totalCharacters = 0;
  let invalidCharacters = 0;
  let hasValidEncoding = true;

  try {
    for (const char of text) {
      char.codePointAt(0);
      totalCharacters++;
    }
  } catch {
    hasValidEncoding = false;
    invalidCharacters++;
  }

  return {
    hasValidEncoding,
    totalCharacters,
    invalidCharacters,
  };
}
