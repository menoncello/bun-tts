/**
 * EPUB Parser Content Processor
 *
 * Handles processing of EPUB content including text cleaning,
 * paragraph splitting, and sentence extraction
 */

import type { Paragraph } from '../types.js';
import { stripHTMLTagsOnly } from './epub-parser-text-extraction.js';
import type { EPUBParseOptions } from './epub-parser-types.js';
import {
  DEFAULT_READING_SPEED,
  extractParagraphMatches,
  extractSentenceMatches,
  extractSentenceText,
  addRemainingTextAsSentence,
} from './epub-parser-utils.js';
import { extractSentences, countWords } from './text-processing-utils.js';

/**
 * Process chapter content based on options
 * @param {string} content - Raw chapter content
 * @param {EPUBParseOptions} options - Parse options
 * @returns {string} Processed content string
 */
export function processChapterContent(
  content: string,
  options: EPUBParseOptions
): string {
  if (options.preserveHTML) {
    return content;
  }

  // Strip HTML tags but preserve HTML entities (as expected by tests)
  return stripHTMLTagsOnly(content);
}

/**
 * Split content into paragraphs with sentence structure
 * @param {string} content - Text content to split
 * @returns {Paragraph[]} Array of paragraph objects
 */
export function splitIntoParagraphs(content: string): Paragraph[] {
  const paragraphs: Paragraph[] = [];

  // Check if content contains HTML tags (excluding script/style which are stripped by processChapterContent)
  // Use optimized regex to prevent ReDoS attacks - limit tag length and avoid backtracking
  const hasHTMLTags = /<[^>]{1,256}>/gi.test(content);

  if (hasHTMLTags) {
    // For HTML content, treat the entire content as a single paragraph when preserveHTML is used
    // This preserves the HTML structure as expected by the integration tests
    const paragraph = processParagraph(content, 0);
    if (paragraph) {
      paragraphs.push(paragraph);
    }
  } else {
    // For plain text content, use the normal paragraph extraction
    const paragraphMatches = extractParagraphMatches(content);
    let paragraphCounter = 0;

    for (const match of paragraphMatches) {
      const paragraph = processParagraph(match, paragraphCounter);
      if (paragraph) {
        paragraphs.push(paragraph);
        paragraphCounter++;
      }
    }
  }

  return paragraphs;
}

/**
 * Process a single paragraph
 * @param {string} paragraphText - Text content of the paragraph
 * @param {number} paragraphIndex - Paragraph index for numbering
 * @returns {Paragraph | null} Processed paragraph object or null if empty
 */
function processParagraph(
  paragraphText: string,
  paragraphIndex: number
): Paragraph | null {
  const trimmedText = paragraphText.trim();
  if (trimmedText.length === 0) {
    return null;
  }

  // Extract sentences using the proper text processing utilities
  const sentences = extractSentences(trimmedText, 1, ['\\.', '!', '\\?']);
  const wordCount = countWords(trimmedText);

  return {
    id: `paragraph-${paragraphIndex + 1}`,
    type: 'text',
    sentences,
    position: paragraphIndex,
    wordCount,
    rawText: trimmedText,
    includeInAudio: true,
    confidence: 0.8,
    text: trimmedText,
  };
}

/**
 * Split text into sentences with position tracking
 * @param {string} text - Text to split into sentences
 * @param {number} startIndex - Global starting position
 * @returns {any} Array<{text: string, startIndex: number, endIndex: number>} Array of sentence objects
 */
export function splitIntoSentences(
  text: string,
  startIndex: number
): Array<{ text: string; startIndex: number; endIndex: number }> {
  const sentences: Array<{
    text: string;
    startIndex: number;
    endIndex: number;
  }> = [];

  const sentenceMatches = extractSentenceMatches(text);
  let lastIndex = 0;

  for (const match of sentenceMatches) {
    const sentence = processSentence(text, lastIndex, match, startIndex);
    if (sentence) {
      sentences.push(sentence);
    }
    lastIndex = match.index + match.match.length;
  }

  addRemainingTextAsSentence(text, startIndex, lastIndex, sentences);

  return sentences;
}

/**
 * Process a single sentence from match
 * @param {string} text - Full text
 * @param {number} lastIndex - Last match end position
 * @param {{index: number, match: string}} match - Current match object
 * @param {number} match.index - Index of the match in the text
 * @param {string} match.match - The matched string
 * @param {number} startIndex - Global start index
 * @returns {{text: string, startIndex: number, endIndex: number} | null} Sentence object or null if empty
 */
function processSentence(
  text: string,
  lastIndex: number,
  match: { index: number; match: string },
  startIndex: number
): { text: string; startIndex: number; endIndex: number } | null {
  const sentenceText = extractSentenceText(text, match, lastIndex);
  if (sentenceText.length === 0) {
    return null;
  }

  return createSentenceObject(sentenceText, startIndex, lastIndex, match);
}

/**
 * Create sentence object with position information
 * @param {string} sentenceText - The sentence text
 * @param {number} startIndex - Global start index
 * @param {number} lastIndex - Last match end position
 * @param {{index: number, match: string}} match - Current match object
 * @param {number} match.index - Index of the match in the text
 * @param {string} match.match - The matched string
 * @returns {{ text: string; startIndex: number; endIndex: number }} Sentence object
 */
function createSentenceObject(
  sentenceText: string,
  startIndex: number,
  lastIndex: number,
  match: { index: number; match: string }
): { text: string; startIndex: number; endIndex: number } {
  return {
    text: sentenceText,
    startIndex: startIndex + lastIndex,
    endIndex: startIndex + match.index + match.match.length,
  };
}

/**
 * Calculate reading time from word count
 * @param {number} wordCount - Number of words
 * @returns {number} Estimated reading time in minutes
 */
export function calculateReadingTime(wordCount: number): number {
  return Math.ceil(wordCount / DEFAULT_READING_SPEED);
}
