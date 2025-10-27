/**
 * EPUB Parser Content Processor
 *
 * Handles processing of EPUB content including text cleaning,
 * paragraph splitting, and sentence extraction
 */

import type { EPUBParseOptions } from './epub-parser-types';
import {
  DEFAULT_READING_SPEED,
  stripHTMLAndClean,
  extractParagraphMatches,
  extractSentenceMatches,
  extractSentenceText,
  createSentenceObject,
  addRemainingTextAsSentence,
} from './epub-parser-utils';

/**
 * Process chapter content based on options
 * @param content - Raw chapter content
 * @param options - Parse options
 * @returns Processed content string
 */
export function processChapterContent(
  content: string,
  options: EPUBParseOptions
): string {
  if (options.preserveHTML) {
    return content;
  }

  return stripHTMLAndClean(content);
}

/**
 * Split content into paragraphs with sentence structure
 * @param content - Text content to split
 * @returns Array of paragraph objects
 */
export function splitIntoParagraphs(content: string): Array<{
  text: string;
  startIndex: number;
  endIndex: number;
  sentences: Array<{ text: string; startIndex: number; endIndex: number }>;
}> {
  const paragraphs: Array<{
    text: string;
    startIndex: number;
    endIndex: number;
    sentences: Array<{ text: string; startIndex: number; endIndex: number }>;
  }> = [];

  const paragraphMatches = extractParagraphMatches(content);
  let globalIndex = 0;

  for (const match of paragraphMatches) {
    const paragraph = processParagraph(match, globalIndex);
    if (paragraph) {
      paragraphs.push(paragraph);
      globalIndex = paragraph.endIndex + 1;
    }
  }

  return paragraphs;
}

/**
 * Process a single paragraph
 * @param paragraphText - Text content of the paragraph
 * @param globalIndex - Global character index
 * @returns Processed paragraph object or null if empty
 */
function processParagraph(
  paragraphText: string,
  globalIndex: number
): {
  text: string;
  startIndex: number;
  endIndex: number;
  sentences: Array<{ text: string; startIndex: number; endIndex: number }>;
} | null {
  const trimmedText = paragraphText.trim();
  if (trimmedText.length === 0) {
    return null;
  }

  const startIndex = globalIndex;
  const endIndex = globalIndex + trimmedText.length;
  const sentences = splitIntoSentences(trimmedText, startIndex);

  return {
    text: trimmedText,
    startIndex,
    endIndex,
    sentences,
  };
}

/**
 * Split text into sentences with position tracking
 * @param text - Text to split into sentences
 * @param startIndex - Global starting position
 * @returns Array of sentence objects
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
    lastIndex = match.index + match[0].length;
  }

  addRemainingTextAsSentence(text, startIndex, lastIndex, sentences);

  return sentences;
}

/**
 * Process a single sentence from match
 * @param text - Full text
 * @param lastIndex - Last match end position
 * @param match - Current match
 * @param startIndex - Global start index
 * @returns Sentence object or null if empty
 */
function processSentence(
  text: string,
  lastIndex: number,
  match: RegExpExecArray,
  startIndex: number
): { text: string; startIndex: number; endIndex: number } | null {
  const sentenceText = extractSentenceText(text, lastIndex, match);
  if (sentenceText.length === 0) {
    return null;
  }

  return createSentenceObject(sentenceText, startIndex, lastIndex, match);
}

/**
 * Calculate reading time from word count
 * @param wordCount - Number of words
 * @returns Estimated reading time in minutes
 */
export function calculateReadingTime(wordCount: number): number {
  return Math.ceil(wordCount / DEFAULT_READING_SPEED);
}
