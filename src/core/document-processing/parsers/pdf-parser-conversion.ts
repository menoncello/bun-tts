/**
 * PDF Parser conversion utilities.
 * These utilities handle conversion between different structure formats.
 */

import type { EnhancedChapter } from '../document-structure';
import type { DocumentStructure, PDFStructure, Chapter } from '../types';
import {
  DEFAULT_WORD_DURATION,
  DEFAULT_CONFIDENCE_THRESHOLD,
} from './pdf-parser-conversion-constants';
import {
  calculateTotalParagraphs,
  calculateTotalSentences,
  calculateWordCount,
  extractContentText,
  createDocumentStats,
  createProcessingMetrics,
} from './pdf-parser-conversion-helpers';
import { createParagraphsFromContent } from './pdf-parser-paragraph-utils';
import type { PDFMetadata } from './pdf-parser-structure';

/**
 * Creates the document structure return object.
 *
 * @param {DocumentStructure['metadata']} metadata - Document metadata
 * @param {Chapter[]} chapters - Converted chapters
 * @param {PDFMetadata} pdfMetadata - PDF metadata
 * @param {PDFStructure} pdfStructure - Original PDF structure
 * @returns {DocumentStructure} Complete document structure
 */
function createDocumentStructure(
  metadata: DocumentStructure['metadata'],
  chapters: Chapter[],
  pdfMetadata: PDFMetadata,
  pdfStructure: PDFStructure
): DocumentStructure {
  const stats = createDocumentStats();
  const processingMetrics = createProcessingMetrics(pdfMetadata.wordCount);

  return {
    metadata,
    chapters,
    elements: [],
    totalParagraphs: calculateTotalParagraphs(chapters),
    totalSentences: calculateTotalSentences(chapters),
    totalWordCount: pdfMetadata.wordCount,
    totalChapters: chapters.length,
    confidence:
      pdfStructure.analysisMetadata?.confidence ?? DEFAULT_CONFIDENCE_THRESHOLD,
    estimatedTotalDuration: pdfMetadata.wordCount * DEFAULT_WORD_DURATION,
    stats,
    processingMetrics,
  };
}

/**
 * Converts PDF structure to document structure.
 *
 * @param {PDFStructure} pdfStructure - PDF structure to convert
 * @param {PDFMetadata} pdfMetadata - PDF metadata
 * @param {string} filePath - File path
 * @returns {DocumentStructure} Document structure
 */
export function convertPDFStructureToDocumentStructure(
  pdfStructure: PDFStructure,
  pdfMetadata: PDFMetadata,
  filePath: string
): DocumentStructure {
  const chapters = convertChapters(pdfStructure);
  const metadata = createDocumentMetadata(pdfStructure, pdfMetadata, filePath);

  return createDocumentStructure(metadata, chapters, pdfMetadata, pdfStructure);
}

/**
 * Converts PDF chapters to document chapters.
 *
 * @param {PDFStructure} pdfStructure - PDF structure containing chapters
 * @returns {Chapter[]} Array of converted chapters
 */
function convertChapters(pdfStructure: PDFStructure): Chapter[] {
  let currentCharPosition = 0;
  let currentDocumentPosition = 0;

  return pdfStructure.chapters.map((chapter: unknown, index: number) => {
    const enhancedChapter = chapter as unknown as EnhancedChapter;
    const convertedChapter = convertChapterToDocumentChapter(
      enhancedChapter,
      currentCharPosition,
      currentDocumentPosition,
      index
    );

    // Update character position for next chapter
    currentCharPosition = (convertedChapter.charRange?.end ?? 0) + 1;

    // Update document position for next chapter by counting all sentences
    currentDocumentPosition += convertedChapter.paragraphs.reduce(
      (sum, para) => sum + para.sentences.length,
      0
    );

    return convertedChapter;
  });
}

/**
 * Creates document metadata from PDF structure and metadata.
 *
 * @param {PDFStructure} pdfStructure - PDF structure
 * @param {PDFMetadata} pdfMetadata - PDF metadata
 * @param {string} _filePath - File path
 * @returns {DocumentStructure['metadata']} Document metadata
 */
function createDocumentMetadata(
  pdfStructure: PDFStructure,
  pdfMetadata: PDFMetadata,
  _filePath: string
): DocumentStructure['metadata'] {
  return {
    title: pdfStructure.title || pdfMetadata.title,
    author: pdfStructure.author || pdfMetadata.author,
    wordCount: pdfMetadata.wordCount,
    characterCount: pdfMetadata.characterCount,
    language: pdfMetadata.language || 'en',
    created: pdfMetadata.createdDate,
    modified: pdfMetadata.modifiedDate,
    customMetadata: pdfMetadata as unknown as Record<string, unknown>,
    format: 'pdf', // Ensure format property is set
    filePath: _filePath,
    layoutInfo: pdfMetadata.layoutInfo,
    encodingInfo: pdfMetadata.encodingInfo,
    securityInfo: pdfMetadata.securityInfo,
  };
}

/**
 * Converts a PDF chapter to a document chapter.
 *
 * @param {EnhancedChapter} chapter - PDF chapter to convert
 * @param {number} startCharPosition - Starting character position for this chapter
 * @param {number} startDocumentPosition - Starting document position for this chapter
 * @param {number} chapterIndex - Index of the chapter in the document
 * @returns {Chapter} Document chapter
 */
export function convertChapterToDocumentChapter(
  chapter: EnhancedChapter,
  startCharPosition = 0,
  startDocumentPosition = 0,
  chapterIndex = 0
): Chapter {
  const contentText = extractContentText(chapter);
  const paragraphs = createParagraphsFromContent(
    contentText,
    chapter.id,
    startCharPosition,
    startDocumentPosition
  );
  const endCharPosition = startCharPosition + contentText.length;
  const wordCount = calculateWordCount(contentText);

  return {
    id: chapter.id,
    title: chapter.title,
    level: chapter.level,
    paragraphs,
    position: chapterIndex,
    charRange: { start: startCharPosition, end: endCharPosition },
    depth: chapter.depth ?? chapter.level ?? 1,
    wordCount,
    estimatedDuration: wordCount * DEFAULT_WORD_DURATION,
    startPosition: startCharPosition,
    endPosition: endCharPosition,
    startIndex: startCharPosition,
  };
}

// Re-export paragraph utility for external use
export { calculateWordCount } from './pdf-parser-conversion-helpers';
