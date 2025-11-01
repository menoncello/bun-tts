/**
 * PDF parser sentence helpers.
 * These utilities handle sentence creation and data processing.
 */

import type { Paragraph } from '../types';
import {
  DEFAULT_SENTENCE_POSITION,
  DEFAULT_WORD_DURATION,
} from './pdf-parser-conversion-constants';

/**
 * Creates sentence ID from chapter ID and index
 * @param {string} chapterId - Chapter identifier
 * @param {number} index - Sentence index
 * @returns {string} Sentence ID
 */
export function createSentenceId(chapterId: string, index: number): string {
  return `sentence-${chapterId}-${index}`;
}

/**
 * Creates character range from start and end positions
 * @param {number} startChar - Starting character position
 * @param {number} endChar - Ending character position
 * @returns {{start: number, end: number}} Character range
 */
export function createSentenceCharRange(
  startChar: number,
  endChar: number
): { start: number; end: number } {
  return { start: startChar, end: endChar };
}

/**
 * Calculates estimated duration from word count
 * @param {number} wordCount - Number of words
 * @returns {number} Estimated duration in seconds
 */
export function calculateSentenceDuration(wordCount: number): number {
  return wordCount * DEFAULT_WORD_DURATION;
}

/**
 * Validates parameter structure for sentence processing
 * @param {object} params - Parameters object
 * @param {string} params.chapterId - Chapter identifier
 * @param {number} params.index - Sentence index
 * @param {string} params.text - Sentence text content
 * @param {object} params.documentPosition - Document position information
 * @param {number} params.documentPosition.chapter - Chapter position
 * @param {number} params.documentPosition.paragraph - Paragraph position
 * @param {number} params.documentPosition.sentence - Sentence position
 * @param {number} params.documentPosition.startChar - Starting character position in document
 * @param {number} params.documentPosition.endChar - Ending character position in document
 * @param {number} params.startChar - Starting character position
 * @param {number} params.endChar - Ending character position
 * @param {number} params.wordCount - Number of words in the sentence
 * @returns {boolean} True if parameters are valid
 */
export function validateSentenceParams(params: {
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
}): boolean {
  return !!(params.chapterId && params.text && params.documentPosition);
}

/**
 * Destructures all parameters from object
 * @param {T} params - Parameters object
 * @returns {T} Destructured parameters
 */
export const destructureAllParams = <
  T extends {
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
  },
>(
  params: T
): T => params;

// Type aliases for buildSentenceData function
interface BuildSentenceParams {
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
}

interface BuildSentenceResult {
  id: string;
  text: string;
  position: number;
  documentPosition: {
    chapter: number;
    paragraph: number;
    sentence: number;
    startChar: number;
    endChar: number;
  };
  charRange: { start: number; end: number };
  wordCount: number;
  estimatedDuration: number;
}

/** Data object for building sentence objects */
export interface BuildSentenceObjectData {
  id: string;
  text: string;
  position: number;
  documentPosition: {
    chapter: number;
    paragraph: number;
    sentence: number;
    startChar: number;
    endChar: number;
  };
  charRange: { start: number; end: number };
  wordCount: number;
  estimatedDuration: number;
}

/**
 * Builds sentence data from destructured parameters
 * @param {BuildSentenceParams} params - Destructured parameters
 * @returns {BuildSentenceResult} Sentence data
 */
export const buildSentenceData = (
  params: BuildSentenceParams
): BuildSentenceResult => ({
  id: createSentenceId(params.chapterId, params.index),
  text: params.text,
  position: DEFAULT_SENTENCE_POSITION,
  documentPosition: params.documentPosition,
  charRange: createSentenceCharRange(params.startChar, params.endChar),
  wordCount: params.wordCount,
  estimatedDuration: calculateSentenceDuration(params.wordCount),
});

/**
 * Builds a complete sentence object from extracted data
 * @param {BuildSentenceObjectData} data - Sentence data object
 * @returns {Paragraph['sentences'][0]} Complete paragraph sentence object
 */
export function buildSentenceObject(
  data: BuildSentenceObjectData
): Paragraph['sentences'][0] {
  const sentenceObject = {
    ...data,
    hasFormatting: false,
    // Keep the original documentPosition object structure
    documentPosition: data.documentPosition,
  };

  // Add a numeric documentPosition property for TTS compatibility using Object.defineProperty
  // This avoids TypeScript type conflicts while maintaining runtime functionality
  Object.defineProperty(sentenceObject, 'documentPosition', {
    value: data.documentPosition.sentence,
    writable: true,
    enumerable: true,
    configurable: true,
  });

  return sentenceObject;
}
