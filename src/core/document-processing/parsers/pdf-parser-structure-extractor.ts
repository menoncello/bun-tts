/**
 * PDF structure extraction utilities.
 * Handles extraction of document structure from PDF text content.
 */

import type { DocumentStructure, Chapter, DocumentMetadata } from '../types.js';
import { WORD_DURATION_FACTOR } from './confidence-constants.js';
import { PARSER_CONSTANTS } from './constants.js';
import {
  isChapterHeader,
  _cleanChapterTitle as cleanChapterTitle,
  extractTitleFromText,
} from './pdf-parser-metadata-extractor.js';
import { countWords } from './text-processing-utils.js';

// Constants for structure extraction
const MIN_HEADER_CONFIDENCE = 0.05;

/**
 * Tracking state for chapter extraction process
 */
interface ChapterTrackingState {
  currentChapter: Partial<Chapter> | null;
  chapterContent: string[];
  chapterIndex: number;
}

// Constants for magic numbers moved to pdf-parser-metadata-extractor.ts

/**
 * Save a completed chapter to the chapters array
 * @param {Chapter | null} currentChapter - The current chapter being processed
 * @param {string[]} chapterContent - Array of content lines for the chapter
 * @param {Chapter[]} chapters - Array to store completed chapters
 */
function saveChapter(
  currentChapter: Partial<Chapter> | null,
  chapterContent: string[],
  chapters: Chapter[]
): void {
  if (currentChapter) {
    const content = chapterContent.join('\n').trim();
    const wordCount = countWords(content);

    // Create a complete chapter with all required fields
    const completeChapter: Chapter = {
      id: currentChapter.id || `chapter-${chapters.length + 1}`,
      title: currentChapter.title || 'Untitled Chapter',
      level: 1,
      paragraphs: [], // Will be populated later during conversion
      position: chapters.length,
      wordCount,
      estimatedDuration: wordCount * WORD_DURATION_FACTOR, // 5 words per second estimate
      startPosition: 0,
      endPosition: content.length,
      startIndex: 0,
      content,
      index: currentChapter.index || chapters.length + 1,
    };

    chapters.push(completeChapter);
  }
}

/**
 * Create a new chapter with given title and index
 * @param {string} title - The chapter title
 * @param {number} index - The chapter index
 * @returns {Partial<Chapter>} A new partial chapter object
 */
function createNewChapter(title: string, index: number): Partial<Chapter> {
  return {
    id: `chapter-${index}`,
    title,
    index,
    content: '',
    wordCount: 0,
  };
}

/**
 * Create default chapter when no chapter headers are found
 * @param {string[]} lines - Array of text lines to create default chapter from
 * @returns {Chapter} Default chapter containing all content
 */
function createDefaultChapter(lines: string[]): Chapter {
  return {
    id: 'chapter-1',
    title: 'Main Content',
    level: 1,
    paragraphs: [],
    position: 0,
    wordCount: countWords(lines.join('\n')),
    estimatedDuration: countWords(lines.join('\n')) * MIN_HEADER_CONFIDENCE, // 3 words per second estimate
    startPosition: 0,
    endPosition: lines.join('\n').length,
    startIndex: 0,
    content: lines.join('\n').trim(),
    index: 1,
  };
}

/**
 * Process a single line and update chapter tracking
 * @param {string} line - The text line to process
 * @param {Chapter[]} chapters - Array of completed chapters
 * @param {ChapterTrackingState} state - Current tracking state
 * @returns {ChapterTrackingState} Updated tracking state after processing line
 */
function processLine(
  line: string,
  chapters: Chapter[],
  state: ChapterTrackingState
): ChapterTrackingState {
  if (isChapterHeader(line)) {
    saveChapter(state.currentChapter, state.chapterContent, chapters);
    const title = cleanChapterTitle(line);
    return {
      currentChapter: createNewChapter(title, state.chapterIndex),
      chapterContent: [],
      chapterIndex: state.chapterIndex + 1,
    };
  } else if (line.length > 0) {
    state.chapterContent.push(line);
  }

  return {
    currentChapter: state.currentChapter,
    chapterContent: state.chapterContent,
    chapterIndex: state.chapterIndex,
  };
}

/**
 * Prepare text lines for processing
 * @param {string} text - Raw text extracted from PDF
 * @returns {string[]} Array of non-empty, trimmed lines
 */
function prepareTextLines(text: string): string[] {
  return text.split('\n').filter((line) => line.trim().length > 0);
}

/**
 * Calculate document metrics from text and chapters
 * @param {string} text - Raw text content
 * @returns {{totalWords: number, estimatedDuration: number}} Object containing totalWords and estimatedDuration
 */
function calculateDocumentMetrics(text: string): {
  totalWords: number;
  estimatedDuration: number;
} {
  const totalWords = countWords(text);
  const estimatedDuration = Math.ceil(
    totalWords / PARSER_CONSTANTS.WORDS_PER_MINUTE
  );

  return { totalWords, estimatedDuration };
}

/**
 * Extract document title from available sources
 * @param {string[]} lines - Text lines for title extraction
 * @param {Partial<DocumentMetadata>} [metadata] - Optional PDF metadata
 * @returns {string} Extracted or default title
 */
function extractDocumentTitle(
  lines: string[],
  metadata?: Partial<DocumentMetadata>
): string {
  return metadata?.title || extractTitleFromText(lines) || 'PDF Document';
}

/**
 * Create base document metadata
 * @param {string} title - Document title
 * @param {number} totalWords - Total word count
 * @param {number} estimatedDuration - Estimated reading duration
 * @param {number} chapterCount - Number of chapters
 * @returns {Partial<DocumentMetadata>} Base metadata object
 */
function createBaseDocumentMetadata(
  title: string,
  totalWords: number,
  estimatedDuration: number,
  chapterCount: number
): Partial<DocumentMetadata> {
  return {
    title,
    wordCount: totalWords,
    totalWords,
    estimatedReadingTime: estimatedDuration,
    chapterCount,
    customMetadata: {},
  };
}

/**
 * Extract custom metadata fields
 * @param {Partial<DocumentMetadata>} [metadata] - Optional PDF metadata
 * @returns {Partial<DocumentMetadata>} Custom metadata fields
 */
function extractCustomFields(
  metadata?: Partial<DocumentMetadata>
): Partial<DocumentMetadata> {
  return {
    customMetadata: metadata?.customMetadata || {},
  };
}

/**
 * Extract author-related metadata fields
 * @param {Partial<DocumentMetadata>} [metadata] - Optional PDF metadata
 * @returns {Partial<DocumentMetadata>} Author-related fields
 */
function extractAuthorFields(
  metadata?: Partial<DocumentMetadata>
): Partial<DocumentMetadata> {
  return {
    author: metadata?.author,
    publisher: metadata?.publisher,
    identifier: metadata?.identifier,
  };
}

/**
 * Extract date-related metadata fields
 * @param {Partial<DocumentMetadata>} [metadata] - Optional PDF metadata
 * @returns {Partial<DocumentMetadata>} Date-related fields
 */
function extractDateFields(
  metadata?: Partial<DocumentMetadata>
): Partial<DocumentMetadata> {
  return {
    created: metadata?.created,
    modified: metadata?.modified,
    createdDate: metadata?.createdDate,
    modifiedDate: metadata?.modifiedDate,
    date: metadata?.date,
  };
}

/**
 * Extract content-related metadata fields
 * @param {Partial<DocumentMetadata>} [metadata] - Optional PDF metadata
 * @returns {Partial<DocumentMetadata>} Content-related fields
 */
function extractContentFields(
  metadata?: Partial<DocumentMetadata>
): Partial<DocumentMetadata> {
  return {
    language: metadata?.language,
    characterCount: metadata?.characterCount,
    version: metadata?.version,
    description: metadata?.description,
    layoutInfo: metadata?.layoutInfo,
  };
}

/**
 * Extract optional metadata fields
 * @param {Partial<DocumentMetadata>} [metadata] - Optional PDF metadata
 * @returns {Partial<DocumentMetadata>} Extracted optional fields
 */
function extractOptionalFields(
  metadata?: Partial<DocumentMetadata>
): Partial<DocumentMetadata> {
  const customFields = extractCustomFields(metadata);
  const authorFields = extractAuthorFields(metadata);
  const dateFields = extractDateFields(metadata);
  const contentFields = extractContentFields(metadata);

  return {
    ...customFields,
    ...authorFields,
    ...dateFields,
    ...contentFields,
  };
}

/**
 * Merge optional metadata with base metadata
 * @param {Partial<DocumentMetadata>} baseMetadata - Base metadata object
 * @param {Partial<DocumentMetadata>} [metadata] - Optional PDF metadata
 * @returns {DocumentMetadata} Complete document metadata
 */
function mergeDocumentMetadata(
  baseMetadata: Partial<DocumentMetadata>,
  metadata?: Partial<DocumentMetadata>
): DocumentMetadata {
  const optionalFields = extractOptionalFields(metadata);
  return {
    ...baseMetadata,
    ...optionalFields,
  } as DocumentMetadata;
}

/**
 * Parameters for document metadata creation
 */
interface DocumentMetadataParams {
  lines: string[];
  totalWords: number;
  estimatedDuration: number;
  chapters: Chapter[];
  metadata?: Partial<DocumentMetadata>;
}

/**
 * Create document metadata from components
 * @param {DocumentMetadataParams} params - Parameters for metadata creation
 * @returns {DocumentMetadata} Complete document metadata
 */
function createDocumentMetadata(
  params: DocumentMetadataParams
): DocumentMetadata {
  const title = extractDocumentTitle(params.lines, params.metadata);
  const baseMetadata = createBaseDocumentMetadata(
    title,
    params.totalWords,
    params.estimatedDuration,
    params.chapters.length
  );
  return mergeDocumentMetadata(baseMetadata, params.metadata);
}

/**
 * Create processing metrics for document structure
 * @param {number} sourceLength - Length of the source text
 * @returns {{parseStartTime: Date, parseEndTime: Date, parseDurationMs: number, sourceLength: number, processingErrors: never[]}} Processing metrics object
 */
function createProcessingMetrics(sourceLength: number): {
  parseStartTime: Date;
  parseEndTime: Date;
  parseDurationMs: number;
  sourceLength: number;
  processingErrors: never[];
} {
  const now = new Date();
  return {
    parseStartTime: now,
    parseEndTime: now,
    parseDurationMs: 0,
    sourceLength,
    processingErrors: [],
  };
}

/**
 * Create document statistics
 * @param {number} totalWords - Total word count
 * @returns {{totalWords: number, processingTime: number, confidenceScore: number, extractionMethod: string}} Document statistics object
 */
function createDocumentStats(totalWords: number): {
  totalWords: number;
  processingTime: number;
  confidenceScore: number;
  extractionMethod: string;
} {
  return {
    totalWords,
    processingTime: 0,
    confidenceScore: 0.8,
    extractionMethod: 'pdf-parser',
  };
}

/**
 * Extract document structure from PDF text content
 * @param {string} text - Raw text extracted from PDF
 * @param {Partial<DocumentMetadata>} [metadata] - Optional PDF metadata
 * @returns {DocumentStructure} DocumentStructure with chapters and metadata
 */
export function extractStructureFromText(
  text: string,
  metadata?: Partial<DocumentMetadata>
): DocumentStructure {
  const lines = prepareTextLines(text);
  const chapters = extractChaptersFromLines(lines);
  const { totalWords, estimatedDuration } = calculateDocumentMetrics(text);
  const documentMetadata = createDocumentMetadata({
    lines,
    totalWords,
    estimatedDuration,
    chapters,
    metadata,
  });

  return {
    metadata: documentMetadata,
    chapters,
    totalParagraphs: 0, // Will be calculated when paragraphs are processed
    totalSentences: 0, // Will be calculated when sentences are processed
    totalWordCount: totalWords,
    totalChapters: chapters.length,
    confidence: 0.8, // Default confidence for basic extraction
    estimatedTotalDuration: estimatedDuration,
    processingMetrics: createProcessingMetrics(lines.join('\n').length),
    stats: createDocumentStats(totalWords),
  };
}

/**
 * Extract chapters from text lines using common PDF patterns
 * @param {string[]} lines - Array of text lines
 * @returns {Chapter[]} Array of chapters
 */
function extractChaptersFromLines(lines: string[]): Chapter[] {
  const chapters: Chapter[] = [];
  let state: ChapterTrackingState = {
    currentChapter: null,
    chapterContent: [],
    chapterIndex: 1,
  };

  for (const line_ of lines) {
    const line = line_.trim();
    state = processLine(line, chapters, state);
  }

  saveChapter(state.currentChapter, state.chapterContent, chapters);

  if (chapters.length === 0 && lines.length > 0) {
    chapters.push(createDefaultChapter(lines));
  }

  return chapters;
}

// Metadata extraction functions moved to pdf-parser-metadata-extractor.ts
// Re-export for backward compatibility
export { extractBasicMetadataFromPDF } from './pdf-parser-metadata-extractor.js';
