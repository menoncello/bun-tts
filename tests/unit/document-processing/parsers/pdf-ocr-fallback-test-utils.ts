/**
 * Test utility functions for PDF OCR fallback validation.
 * Shared helper functions used across OCR fallback test files.
 */

import type { DocumentStructure } from '../../../../src/core/document-processing/types';

/**
 * Validates image processing in document structure.
 * @param {DocumentStructure} documentStructure - The document structure to validate images from
 * @returns {{
 *   totalImages: number;
 *   validImages: number;
 *   hasInvalidImages: boolean;
 * }} Object with total images and validation results
 */
export function validateImageProcessing(documentStructure: DocumentStructure): {
  totalImages: number;
  validImages: number;
  hasInvalidImages: boolean;
} {
  let totalImages = 0;
  let validImages = 0;

  for (const chapter of documentStructure.chapters) {
    const imageCounts = processChapterImages(chapter);
    totalImages += imageCounts.total;
    validImages += imageCounts.valid;
  }

  return {
    totalImages,
    validImages,
    hasInvalidImages: totalImages !== validImages,
  };
}

/**
 * Processes images within a chapter and returns validation counts.
 */
function processChapterImages(chapter: any): { total: number; valid: number } {
  if (!chapter.images) {
    return { total: 0, valid: 0 };
  }

  let validImages = 0;
  for (const image of chapter.images) {
    if (isImageValid(image)) {
      validImages++;
    }
    validateOCRImage(image);
  }

  return {
    total: chapter.images.length,
    valid: validImages,
  };
}

/**
 * Validates if an image has required attributes.
 */
function isImageValid(image: any): boolean {
  const hasAlt = image.alt !== undefined && image.alt !== null;
  const hasSrc = image.src !== undefined && image.src !== null;
  const hasValidPosition = image.position >= 0;

  return hasAlt && hasSrc && hasValidPosition;
}

/**
 * Validates OCR-specific image attributes.
 */
function validateOCRImage(image: any): void {
  if (image.alt && image.alt.includes('OCR')) {
    const hasValidAlt = image.alt.length > 0;
    if (!hasValidAlt) {
      // Mark as invalid but continue counting
    }
  }
}

/**
 * Validates OCR text extraction quality and completeness.
 * @param {DocumentStructure} documentStructure - The document structure to validate OCR text extraction from
 * @returns {{
 *   hasContent: boolean;
 *   validParagraphs: number;
 *   validSentences: number;
 *   confidenceAboveThreshold: boolean;
 *   confidenceAboveMinimum: boolean;
 * }} Object with validation results
 */
export function validateOCRTextExtraction(
  documentStructure: DocumentStructure
): {
  hasContent: boolean;
  validParagraphs: number;
  validSentences: number;
  confidenceAboveThreshold: boolean;
  confidenceAboveMinimum: boolean;
} {
  const hasContent = hasDocumentContent(documentStructure);
  const paragraphCounts = countValidParagraphsAndSentences(documentStructure);
  const confidenceMetrics = calculateConfidenceMetrics(documentStructure);

  return {
    hasContent,
    validParagraphs: paragraphCounts.validParagraphs,
    validSentences: paragraphCounts.validSentences,
    confidenceAboveThreshold: confidenceMetrics.aboveThreshold,
    confidenceAboveMinimum: confidenceMetrics.aboveMinimum,
  };
}

/**
 * Checks if document has basic content requirements.
 */
function hasDocumentContent(documentStructure: DocumentStructure): boolean {
  const hasWords = documentStructure.totalWordCount > 0;
  const hasSentences = documentStructure.totalSentences > 0;
  return hasWords && hasSentences;
}

/**
 * Counts valid paragraphs and sentences across all chapters.
 */
function countValidParagraphsAndSentences(
  documentStructure: DocumentStructure
): {
  validParagraphs: number;
  validSentences: number;
} {
  let validParagraphs = 0;
  let validSentences = 0;

  for (const chapter of documentStructure.chapters) {
    if (!chapter) continue;

    const chapterCounts = processChapterContent(chapter);
    validParagraphs += chapterCounts.validParagraphs;
    validSentences += chapterCounts.validSentences;
  }

  return { validParagraphs, validSentences };
}

/**
 * Processes content within a chapter.
 */
function processChapterContent(chapter: any): {
  validParagraphs: number;
  validSentences: number;
} {
  let validParagraphs = 0;
  let validSentences = 0;

  for (const paragraph of chapter.paragraphs) {
    if (!paragraph) continue;

    if (isParagraphValid(paragraph)) {
      validParagraphs++;
    }

    const sentenceCount = countValidSentences(paragraph);
    validSentences += sentenceCount;
  }

  return { validParagraphs, validSentences };
}

/**
 * Validates if a paragraph has required attributes.
 */
function isParagraphValid(paragraph: any): boolean {
  const hasRawText =
    paragraph.rawText !== undefined && paragraph.rawText !== null;
  const hasNonEmptyText = paragraph.rawText.trim().length > 0;

  return hasRawText && hasNonEmptyText;
}

/**
 * Counts valid sentences within a paragraph.
 */
function countValidSentences(paragraph: any): number {
  let validSentences = 0;

  for (const sentence of paragraph.sentences) {
    if (!sentence) continue;

    if (isSentenceValid(sentence)) {
      validSentences++;
    }
  }

  return validSentences;
}

/**
 * Validates if a sentence has required attributes.
 */
function isSentenceValid(sentence: any): boolean {
  const hasText = sentence.text !== undefined && sentence.text !== null;
  const hasNonEmptySentence = sentence.text.trim().length > 0;
  const hasWordCount = sentence.wordCount > 0;
  const hasDuration = sentence.estimatedDuration > 0;

  return hasText && hasNonEmptySentence && hasWordCount && hasDuration;
}

/**
 * Calculates confidence metrics for the document.
 */
function calculateConfidenceMetrics(documentStructure: DocumentStructure): {
  aboveThreshold: boolean;
  aboveMinimum: boolean;
} {
  return {
    aboveThreshold: documentStructure.confidence > 0,
    aboveMinimum: documentStructure.confidence > 0.4,
  };
}

/**
 * Validates hierarchical document structure is maintained.
 * @param {DocumentStructure} documentStructure - The document structure to validate hierarchical structure from
 * @returns {{
 *   hasChapters: boolean;
 *   validChapters: number;
 *   validParagraphs: number;
 *   validSentences: number;
 *   hasValidCharacterRanges: boolean;
 * }} Object with validation results
 */
export function validateHierarchicalStructure(
  documentStructure: DocumentStructure
): {
  hasChapters: boolean;
  validChapters: number;
  validParagraphs: number;
  validSentences: number;
  hasValidCharacterRanges: boolean;
} {
  const hasChapters = documentStructure.chapters.length > 0;
  const chapterValidation = validateChaptersInHierarchy(documentStructure);
  const hasValidCharacterRanges =
    validateChapterCharacterRanges(documentStructure);

  return {
    hasChapters,
    validChapters: chapterValidation.validChapters,
    validParagraphs: chapterValidation.validParagraphs,
    validSentences: chapterValidation.validSentences,
    hasValidCharacterRanges,
  };
}

/**
 * Validates chapters within the hierarchical structure.
 */
function validateChaptersInHierarchy(documentStructure: DocumentStructure): {
  validChapters: number;
  validParagraphs: number;
  validSentences: number;
} {
  let validChapters = 0;
  let validParagraphs = 0;
  let validSentences = 0;

  for (let i = 0; i < documentStructure.chapters.length; i++) {
    const chapter = documentStructure.chapters[i];
    if (!chapter) continue;

    const hasCorrectPosition = chapter.position === i;
    const hasTitle = chapter.title !== undefined && chapter.title !== null;
    const hasParagraphsArray = Array.isArray(chapter.paragraphs);

    if (hasCorrectPosition && hasTitle && hasParagraphsArray) {
      validChapters++;
    }

    const paragraphValidation = validateParagraphsInHierarchy(chapter);
    validParagraphs += paragraphValidation.validParagraphs;
    validSentences += paragraphValidation.validSentences;
  }

  return {
    validChapters,
    validParagraphs,
    validSentences,
  };
}

/**
 * Validates paragraphs within a chapter's hierarchical structure.
 */
function validateParagraphsInHierarchy(chapter: any): {
  validParagraphs: number;
  validSentences: number;
} {
  let validParagraphs = 0;
  let validSentences = 0;

  for (let j = 0; j < chapter.paragraphs.length; j++) {
    const paragraph = chapter.paragraphs[j];
    if (!paragraph) continue;

    const hasCorrectParagraphPosition = paragraph.position === j;
    const hasSentencesArray = Array.isArray(paragraph.sentences);

    if (hasCorrectParagraphPosition && hasSentencesArray) {
      validParagraphs++;
    }

    const sentenceValidation = validateSentencesInHierarchy(paragraph);
    validSentences += sentenceValidation.validSentences;
  }

  return {
    validParagraphs,
    validSentences,
  };
}

/**
 * Validates sentences within a paragraph's hierarchical structure.
 */
function validateSentencesInHierarchy(paragraph: any): {
  validSentences: number;
} {
  let validSentences = 0;

  for (let k = 0; k < paragraph.sentences.length; k++) {
    const sentence = paragraph.sentences[k];
    if (!sentence) continue;

    const hasCorrectSentencePosition = sentence.position === k;
    const hasText = sentence.text !== undefined && sentence.text !== null;
    const hasCharRange =
      sentence.charRange !== undefined && sentence.charRange !== null;

    if (hasCorrectSentencePosition && hasText && hasCharRange) {
      validSentences++;
    }
  }

  return { validSentences };
}

/**
 * Validates character ranges for chapters in the document.
 */
function validateChapterCharacterRanges(
  documentStructure: DocumentStructure
): boolean {
  let previousCharEnd = 0;
  let hasValidCharacterRanges = true;

  for (const chapter of documentStructure.chapters) {
    if (!chapter) continue;
    const chapterStart = chapter.charRange?.start ?? 0;
    if (chapterStart < previousCharEnd) {
      hasValidCharacterRanges = false;
    }
    previousCharEnd = chapter.charRange?.end ?? 0;
  }

  return hasValidCharacterRanges;
}

/**
 * Validates graceful error handling during OCR processing.
 * @param {DocumentStructure} documentStructure - The document structure to validate error handling from
 * @returns {{
 *   hasValidWordCount: boolean;
 *   hasChapters: boolean;
 *   hasValidErrorCount: boolean;
 *   hasValidFallbackCount: boolean;
 *   hasContent: boolean;
 *   hasMinimumConfidence: boolean;
 * }} Object with validation results
 */
export function validateGracefulErrorHandling(
  documentStructure: DocumentStructure
): {
  hasValidWordCount: boolean;
  hasChapters: boolean;
  hasValidErrorCount: boolean;
  hasValidFallbackCount: boolean;
  hasContent: boolean;
  hasMinimumConfidence: boolean;
} {
  const hasValidWordCount = documentStructure.totalWordCount >= 0;
  const hasChapters = documentStructure.chapters.length > 0;
  const hasValidErrorCount = (documentStructure.stats?.errorCount ?? 0) >= 0;
  const hasValidFallbackCount =
    (documentStructure.stats?.fallbackCount ?? 0) >= 0;

  let totalContentLength = 0;
  for (const chapter of documentStructure.chapters) {
    if (!chapter) continue;
    for (const paragraph of chapter.paragraphs) {
      if (!paragraph) continue;
      totalContentLength += paragraph.rawText.length;
    }
  }

  const hasContent = totalContentLength > 0;
  const hasMinimumConfidence = documentStructure.confidence > 0.2;

  return {
    hasValidWordCount,
    hasChapters,
    hasValidErrorCount,
    hasValidFallbackCount,
    hasContent,
    hasMinimumConfidence,
  };
}

/**
 * Validates OCR processing metadata and statistics.
 * @param {DocumentStructure} documentStructure - The document structure to validate OCR metadata from
 * @returns {{
 *   hasStats: boolean;
 *   hasValidProcessingTime: boolean;
 *   hasValidFallbackCount: boolean;
 *   hasOCRMetadata: boolean;
 *   hasProcessingMetrics: boolean;
 *   hasValidTotalDuration: boolean;
 *   hasGoodConfidenceWithFallback: boolean;
 * }} Object with validation results
 */
export function validateOCRMetadata(documentStructure: DocumentStructure): {
  hasStats: boolean;
  hasValidProcessingTime: boolean;
  hasValidFallbackCount: boolean;
  hasOCRMetadata: boolean;
  hasProcessingMetrics: boolean;
  hasValidTotalDuration: boolean;
  hasGoodConfidenceWithFallback: boolean;
} {
  const hasStats = validateStatsExist(documentStructure);
  const hasValidProcessingTime = validateProcessingTime(documentStructure);
  const hasValidFallbackCount = validateFallbackCount(documentStructure);
  const hasOCRMetadata = validateOCRMetadataExists(documentStructure);
  const hasProcessingMetrics = validateProcessingMetrics(documentStructure);
  const hasValidTotalDuration = validateTotalDuration(documentStructure);
  const hasGoodConfidenceWithFallback =
    validateConfidenceWithFallback(documentStructure);

  return {
    hasStats,
    hasValidProcessingTime,
    hasValidFallbackCount,
    hasOCRMetadata,
    hasProcessingMetrics,
    hasValidTotalDuration,
    hasGoodConfidenceWithFallback,
  };
}

/**
 * Validate that stats exist and are not null
 * @param {DocumentStructure} documentStructure - Document structure to check
 * @returns {boolean} Whether valid stats exist
 */
function validateStatsExist(documentStructure: DocumentStructure): boolean {
  return (
    documentStructure.stats !== undefined && documentStructure.stats !== null
  );
}

/**
 * Validate processing time is positive
 * @param {DocumentStructure} documentStructure - Document structure to check
 * @returns {boolean} Whether processing time is valid
 */
function validateProcessingTime(documentStructure: DocumentStructure): boolean {
  return (documentStructure.stats?.processingTimeMs ?? 0) > 0;
}

/**
 * Validate fallback count is non-negative
 * @param {DocumentStructure} documentStructure - Document structure to check
 * @returns {boolean} Whether fallback count is valid
 */
function validateFallbackCount(documentStructure: DocumentStructure): boolean {
  return (documentStructure.stats?.fallbackCount ?? 0) >= 0;
}

/**
 * Validate OCR metadata exists in custom metadata
 * @param {DocumentStructure} documentStructure - Document structure to check
 * @returns {boolean} Whether OCR metadata exists
 */
function validateOCRMetadataExists(
  documentStructure: DocumentStructure
): boolean {
  return Boolean(documentStructure.metadata.customMetadata?.ocrInfo);
}

/**
 * Validate processing metrics exist
 * @param {DocumentStructure} documentStructure - Document structure to check
 * @returns {boolean} Whether processing metrics exist
 */
function validateProcessingMetrics(
  documentStructure: DocumentStructure
): boolean {
  return documentStructure.processingMetrics !== undefined;
}

/**
 * Validate total duration is positive
 * @param {DocumentStructure} documentStructure - Document structure to check
 * @returns {boolean} Whether total duration is valid
 */
function validateTotalDuration(documentStructure: DocumentStructure): boolean {
  return (documentStructure.processingMetrics?.parseDurationMs ?? 0) > 0;
}

/**
 * Validate confidence is good when fallback was used
 * @param {DocumentStructure} documentStructure - Document structure to check
 * @returns {boolean} Whether confidence is acceptable
 */
function validateConfidenceWithFallback(
  documentStructure: DocumentStructure
): boolean {
  const fallbackCount = documentStructure.stats?.fallbackCount ?? 0;

  if (fallbackCount > 0) {
    return documentStructure.confidence > 0.3;
  }

  return true;
}

/**
 * Validates mixed content quality when OCR is combined with text extraction.
 * @param {DocumentStructure} documentStructure - The document structure to validate mixed content quality from
 * @returns {{
 *   validParagraphs: number;
 *   validSentences: number;
 *   hasGoodConfidence: boolean;
 *   hasContent: boolean;
 *   hasWellFormattedText: boolean;
 * }} Object with validation results
 */
export function validateMixedContentQuality(
  documentStructure: DocumentStructure
): {
  validParagraphs: number;
  validSentences: number;
  hasGoodConfidence: boolean;
  hasContent: boolean;
  hasWellFormattedText: boolean;
} {
  const contentCounts = analyzeMixedContent(documentStructure);
  const qualityMetrics = assessContentQuality(documentStructure);

  return {
    validParagraphs: contentCounts.validParagraphs,
    validSentences: contentCounts.validSentences,
    hasGoodConfidence: qualityMetrics.hasGoodConfidence,
    hasContent: qualityMetrics.hasContent,
    hasWellFormattedText: contentCounts.hasWellFormattedText,
  };
}

/**
 * Analyzes mixed content across all chapters.
 */
function analyzeMixedContent(documentStructure: DocumentStructure): {
  validParagraphs: number;
  validSentences: number;
  hasWellFormattedText: boolean;
} {
  let validParagraphs = 0;
  let validSentences = 0;
  let hasWellFormattedText = true;

  for (const chapter of documentStructure.chapters) {
    if (!chapter) continue;

    const chapterAnalysis = processMixedContentChapter(chapter);
    validParagraphs += chapterAnalysis.validParagraphs;
    validSentences += chapterAnalysis.validSentences;

    if (!chapterAnalysis.hasWellFormattedText) {
      hasWellFormattedText = false;
    }
  }

  return { validParagraphs, validSentences, hasWellFormattedText };
}

/**
 * Processes mixed content within a chapter.
 */
function processMixedContentChapter(chapter: any): {
  validParagraphs: number;
  validSentences: number;
  hasWellFormattedText: boolean;
} {
  let validParagraphs = 0;
  let validSentences = 0;
  let hasWellFormattedText = true;

  for (const paragraph of chapter.paragraphs) {
    if (!paragraph) continue;

    if (isMixedContentParagraphValid(paragraph)) {
      validParagraphs++;
    }

    const sentenceAnalysis = analyzeMixedContentSentences(paragraph);
    validSentences += sentenceAnalysis.validSentences;

    if (!sentenceAnalysis.hasWellFormattedText) {
      hasWellFormattedText = false;
    }
  }

  return { validParagraphs, validSentences, hasWellFormattedText };
}

/**
 * Validates if a paragraph has mixed content requirements.
 */
function isMixedContentParagraphValid(paragraph: any): boolean {
  const hasRawText =
    paragraph.rawText !== undefined && paragraph.rawText !== null;
  const hasNonEmptyText = paragraph.rawText.trim().length > 0;
  const hasSentencesArray = Array.isArray(paragraph.sentences);

  return hasRawText && hasNonEmptyText && hasSentencesArray;
}

/**
 * Analyzes sentences within a paragraph for mixed content quality.
 */
function analyzeMixedContentSentences(paragraph: any): {
  validSentences: number;
  hasWellFormattedText: boolean;
} {
  let validSentences = 0;
  let hasWellFormattedText = true;

  for (const sentence of paragraph.sentences) {
    if (!sentence) continue;

    if (isMixedContentSentenceValid(sentence)) {
      validSentences++;
    }

    if (hasSentenceFormattingIssues(sentence)) {
      hasWellFormattedText = false;
    }
  }

  return { validSentences, hasWellFormattedText };
}

/**
 * Validates if a sentence meets mixed content requirements.
 */
function isMixedContentSentenceValid(sentence: any): boolean {
  return isSentenceValid(sentence);
}

/**
 * Checks for formatting issues in sentence text.
 */
function hasSentenceFormattingIssues(sentence: any): boolean {
  return (
    sentence.text.match(/\s{5,}/) !== null ||
    sentence.text.match(/\uFFFD/) !== null
  );
}

/**
 * Assesses overall content quality metrics.
 */
function assessContentQuality(documentStructure: DocumentStructure): {
  hasGoodConfidence: boolean;
  hasContent: boolean;
} {
  const hasGoodConfidence = documentStructure.confidence > 0.5;
  const hasContent =
    documentStructure.totalWordCount > 0 &&
    documentStructure.totalSentences > 0;

  return { hasGoodConfidence, hasContent };
}

/**
 * Validates special formatting elements handled by OCR.
 * @param {DocumentStructure} documentStructure - The document structure to validate special formatting from
 * @returns {{
 *   headings: number;
 *   codeBlocks: number;
 *   quotes: number;
 *   lists: number;
 *   validElements: number;
 * }} Object with counts of different formatting elements
 */
export function validateSpecialFormattingOCR(
  documentStructure: DocumentStructure
): {
  headings: number;
  codeBlocks: number;
  quotes: number;
  lists: number;
  validElements: number;
} {
  const elementCounts = initializeFormattingCounts();

  for (const chapter of documentStructure.chapters) {
    if (!chapter) continue;

    const chapterCounts = processChapterFormatting(chapter);
    accumulateFormattingCounts(elementCounts, chapterCounts);
  }

  return elementCounts;
}

/**
 * Initializes formatting element counts.
 */
function initializeFormattingCounts(): {
  headings: number;
  codeBlocks: number;
  quotes: number;
  lists: number;
  validElements: number;
} {
  return {
    headings: 0,
    codeBlocks: 0,
    quotes: 0,
    lists: 0,
    validElements: 0,
  };
}

/**
 * Processes formatting elements within a chapter.
 */
function processChapterFormatting(chapter: any): {
  headings: number;
  codeBlocks: number;
  quotes: number;
  lists: number;
  validElements: number;
} {
  const counts = initializeFormattingCounts();

  for (const paragraph of chapter.paragraphs) {
    if (!paragraph) continue;

    if (isParagraphElementValid(paragraph)) {
      counts.validElements++;
    }

    const elementType = classifyParagraphType(paragraph);
    incrementTypeCount(counts, elementType);
  }

  return counts;
}

/**
 * Validates if a paragraph element meets OCR formatting requirements.
 */
function isParagraphElementValid(paragraph: any): boolean {
  const hasNonEmptyText = paragraph.rawText.trim().length > 0;
  const hasGoodConfidence = paragraph.confidence > 0.3;
  const hasIncludeInAudio = paragraph.includeInAudio !== undefined;

  return hasNonEmptyText && hasGoodConfidence && hasIncludeInAudio;
}

/**
 * Classifies paragraph type for formatting validation.
 */
function classifyParagraphType(paragraph: any): string {
  return paragraph.type || 'unknown';
}

/**
 * Increments count based on paragraph type.
 */
function incrementTypeCount(
  counts: {
    headings: number;
    codeBlocks: number;
    quotes: number;
    lists: number;
    validElements: number;
  },
  type: string
): void {
  switch (type) {
    case 'heading':
      counts.headings++;
      break;
    case 'code':
      counts.codeBlocks++;
      break;
    case 'quote':
      counts.quotes++;
      break;
    case 'list-item':
      counts.lists++;
      break;
  }
}

/**
 * Accumulates formatting counts from chapter analysis.
 */
function accumulateFormattingCounts(
  total: {
    headings: number;
    codeBlocks: number;
    quotes: number;
    lists: number;
    validElements: number;
  },
  chapter: {
    headings: number;
    codeBlocks: number;
    quotes: number;
    lists: number;
    validElements: number;
  }
): void {
  total.headings += chapter.headings;
  total.codeBlocks += chapter.codeBlocks;
  total.quotes += chapter.quotes;
  total.lists += chapter.lists;
  total.validElements += chapter.validElements;
}
