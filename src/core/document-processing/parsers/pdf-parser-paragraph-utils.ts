/**
 * PDF parser paragraph utilities.
 * These utilities handle paragraph creation and management.
 */

import type { Paragraph } from '../types';
import {
  DEFAULT_SENTENCE_POSITION,
  DEFAULT_WORD_DURATION,
} from './pdf-parser-conversion-constants';
import { buildSentenceObject } from './pdf-parser-paragraph-sentence-helpers';
import { extractSentenceData } from './pdf-parser-parameter-helpers';

/**
 * Creates paragraphs from content text.
 *
 * @param {string} content - Text content
 * @param {string} chapterId - Chapter ID
 * @param {number} chapterStartChar - Starting character position for the chapter
 * @param {number} startDocumentPosition - Starting document position
 * @returns {Paragraph[]} Array of paragraphs
 */
export function createParagraphsFromContent(
  content: string,
  chapterId: string,
  chapterStartChar = 0,
  startDocumentPosition = 0
): Paragraph[] {
  if (!content || content.trim().length === 0) {
    return [];
  }

  const sentences = splitContentIntoSentences(content);
  const paragraphSentences = createParagraphSentences(
    sentences,
    chapterId,
    chapterStartChar,
    startDocumentPosition
  );

  return [
    createSingleParagraph({
      chapterId,
      sentences: paragraphSentences,
      content,
      chapterStartChar,
      startDocumentPosition,
    }),
  ];
}

/**
 * Creates a single paragraph containing all sentences.
 *
 * @param {{chapterId: string, sentences: Paragraph['sentences'], content: string, chapterStartChar: number, startDocumentPosition: number}} params - Parameters object containing paragraph details
 * @param {string} params.chapterId - Chapter ID
 * @param {Paragraph['sentences']} params.sentences - Array of sentences
 * @param {string} params.content - Original content text
 * @param {number} params.chapterStartChar - Starting character position
 * @param {number} params.startDocumentPosition - Starting document position
 * @returns {Paragraph} Paragraph object
 */
function createSingleParagraph(params: {
  chapterId: string;
  sentences: Paragraph['sentences'];
  content: string;
  chapterStartChar: number;
  startDocumentPosition: number;
}): Paragraph {
  const {
    chapterId,
    sentences,
    content,
    chapterStartChar,
    startDocumentPosition,
  } = params;

  const paragraphBase = createParagraphBase(chapterId, startDocumentPosition);
  const paragraph = createParagraphObject(
    paragraphBase,
    sentences,
    content,
    chapterStartChar
  );
  updateDocumentPositionForTTS(paragraph, startDocumentPosition);

  return paragraph;
}

/**
 * Creates a paragraph object with content and metadata.
 *
 * @param {Omit<Paragraph, 'sentences' | 'charRange' | 'rawText' | 'wordCount'>} paragraphBase - Base paragraph properties
 * @param {Paragraph['sentences']} sentences - Sentences in the paragraph
 * @param {string} content - Paragraph content
 * @param {number} chapterStartChar - Starting character position in chapter
 * @returns {Paragraph} Complete paragraph object
 */
function createParagraphObject(
  paragraphBase: Omit<
    Paragraph,
    'sentences' | 'charRange' | 'rawText' | 'wordCount'
  >,
  sentences: Paragraph['sentences'],
  content: string,
  chapterStartChar: number
): Paragraph {
  return {
    ...paragraphBase,
    sentences,
    text: content,
    charRange: createCharRange(chapterStartChar, content.length),
    rawText: content,
    wordCount: content.split(/\s+/).length,
  };
}

/**
 * Updates the document position for TTS compatibility.
 *
 * @param {Paragraph} paragraph - Paragraph to update
 * @param {number} startDocumentPosition - Starting document position
 */
function updateDocumentPositionForTTS(
  paragraph: Paragraph,
  startDocumentPosition: number
): void {
  paragraph.documentPosition = {
    chapter: paragraph.documentPosition?.chapter ?? 0,
    paragraph: paragraph.documentPosition?.paragraph ?? 0,
    startChar: startDocumentPosition,
    endChar: paragraph.documentPosition?.endChar ?? startDocumentPosition,
  };
}

/**
 * Creates the base properties for a paragraph.
 *
 * @param {string} chapterId - Chapter ID
 * @param {number} startDocumentPosition - Starting document position
 * @returns {Omit<Paragraph, 'sentences' | 'charRange' | 'rawText' | 'wordCount'>} Base paragraph properties
 */
function createParagraphBase(
  chapterId: string,
  startDocumentPosition: number
): Omit<Paragraph, 'sentences' | 'charRange' | 'rawText' | 'wordCount'> {
  return {
    id: `paragraph-${chapterId}-0`,
    position: 0,
    text: '', // Will be set after sentences are created
    documentPosition: {
      chapter: 0,
      paragraph: 0,
      startChar: startDocumentPosition,
      endChar: startDocumentPosition,
    },
    contentType: 'text',
    type: 'text',
    includeInAudio: true,
    confidence: 0.8,
  };
}

/**
 * Creates a character range object.
 *
 * @param {number} start - Starting character position
 * @param {number} length - Length of the content
 * @returns {{start: number, end: number}} Character range object
 */
function createCharRange(
  start: number,
  length: number
): { start: number; end: number } {
  return {
    start,
    end: start + length,
  };
}

/**
 * Creates a paragraph from content text.
 *
 * @param {string} content - Text content
 * @param {string} chapterId - Chapter ID
 * @param {number} index - Paragraph index
 * @returns {Paragraph} Paragraph object
 */
export function createParagraphFromContent(
  content: string,
  chapterId: string,
  index: number
): Paragraph {
  const wordCount = calculateWordCount(content);
  const sentence = createSentence(content, chapterId, index, wordCount);
  const charRange = createCharacterRange(content.length);

  return {
    id: `paragraph-${chapterId}-${index}`,
    sentences: [sentence],
    position: index,
    text: content,
    documentPosition: {
      chapter: 0,
      paragraph: index,
      startChar: charRange?.start ?? 0,
      endChar: charRange?.end ?? 0,
    },
    charRange,
    contentType: 'text',
    type: 'text',
    rawText: content,
    includeInAudio: true,
    confidence: 0.8,
    wordCount,
  };
}

/**
 * Calculates word count from content.
 *
 * @param {string} content - Text content
 * @returns {number} Word count
 */
function calculateWordCount(content: string): number {
  return content.split(/\s+/).length;
}

/**
 * Creates a sentence object.
 *
 * @param {string} content - Text content
 * @param {string} chapterId - Chapter ID
 * @param {number} index - Paragraph index
 * @param {number} wordCount - Word count
 * @returns {Paragraph['sentences'][0]} Sentence object
 */
function createSentence(
  content: string,
  chapterId: string,
  index: number,
  wordCount: number
): Paragraph['sentences'][0] {
  return {
    id: `sentence-${chapterId}-${index}`,
    text: content,
    position: DEFAULT_SENTENCE_POSITION,
    documentPosition: {
      chapter: 0,
      paragraph: 0,
      sentence: index,
      startChar: 0,
      endChar: content.length,
    },
    charRange: { start: 0, end: content.length },
    wordCount,
    estimatedDuration: wordCount * DEFAULT_WORD_DURATION,
    hasFormatting: false,
  };
}

/**
 * Creates character range for content.
 *
 * @param {number} length - Content length
 * @returns {Paragraph['charRange']} Character range
 */
function createCharacterRange(length: number): Paragraph['charRange'] {
  return { start: 0, end: length };
}

/**
 * Splits content into sentences for TTS processing.
 *
 * @param {string} content - Text content to split
 * @returns {string[]} Array of sentence strings
 */
function splitContentIntoSentences(content: string): string[] {
  return content.split(/[!.?]+/).filter((s) => s.trim().length > 0);
}

/**
 * Creates paragraph sentences from content sentences.
 *
 * @param {string[]} sentences - Array of sentence strings
 * @param {string} chapterId - Chapter ID
 * @param {number} chapterStartChar - Starting character position
 * @param {number} _startDocumentPosition - Starting document position
 * @returns {Paragraph['sentences']} Array of paragraph sentences
 */
function createParagraphSentences(
  sentences: string[],
  chapterId: string,
  chapterStartChar: number,
  _startDocumentPosition: number
): Paragraph['sentences'] {
  const currentCharPosition = chapterStartChar;

  return sentences.map((sentenceText, index) =>
    createSentenceFromText(sentenceText, chapterId, index, currentCharPosition)
  );
}

/**
 * Creates a sentence from text with proper positioning.
 *
 * @param {string} sentenceText - The sentence text
 * @param {string} chapterId - Chapter ID
 * @param {number} index - Sentence index
 * @param {number} currentCharPosition - Current character position
 * @returns {Paragraph['sentences'][0]} Paragraph sentence object
 */
function createSentenceFromText(
  sentenceText: string,
  chapterId: string,
  index: number,
  currentCharPosition: number
): Paragraph['sentences'][0] {
  const cleanText = sentenceText.trim();
  const wordCount = cleanText.split(/\s+/).length;
  const sentenceTextWithPunctuation = addPunctuationIfMissing(cleanText);

  const startChar = currentCharPosition;
  const endChar = startChar + sentenceTextWithPunctuation.length;

  return createParagraphSentence({
    chapterId,
    index,
    text: sentenceTextWithPunctuation,
    documentPosition: {
      chapter: 0,
      paragraph: 0,
      sentence: index,
      startChar,
      endChar,
    },
    startChar,
    endChar,
    wordCount,
  });
}

/**
 * Adds punctuation to sentence if missing.
 *
 * @param {string} text - Text to check for punctuation
 * @returns {string} Text with punctuation added if missing
 */
function addPunctuationIfMissing(text: string): string {
  const hasPunctuation = /[!.?]$/.exec(text);
  return hasPunctuation ? text : `${text}.`;
}

/**
 * Creates a paragraph sentence object.
 *
 * @param {{chapterId: string, index: number, text: string, documentPosition: {chapter: number, paragraph: number, sentence: number, startChar: number, endChar: number}, startChar: number, endChar: number, wordCount: number}} params - Parameters object containing sentence details
 * @param {string} params.chapterId - Chapter ID
 * @param {number} params.index - Sentence index
 * @param {string} params.text - Sentence text
 * @param {{chapter: number, paragraph: number, sentence: number, startChar: number, endChar: number}} params.documentPosition - Document position
 * @param {number} params.startChar - Starting character position
 * @param {number} params.endChar - Ending character position
 * @param {number} params.wordCount - Word count
 * @returns {Paragraph['sentences'][0]} Paragraph sentence object
 */
function createParagraphSentence(params: {
  chapterId: string;
  index: number;
  text: string;
  documentPosition: {
    chapter: number;
    paragraph: number;
    sentence: number;
    startChar: number;
    endChar: number;
  };
  startChar: number;
  endChar: number;
  wordCount: number;
}): Paragraph['sentences'][0] {
  const sentenceData = extractSentenceData(params);
  return buildSentenceObject(sentenceData);
}
