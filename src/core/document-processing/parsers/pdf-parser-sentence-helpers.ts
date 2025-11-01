/**
 * PDF parser sentence helper utilities.
 * These utilities handle sentence creation and management.
 */

import { DEFAULT_WORD_DURATION } from './pdf-parser-conversion-constants';

/** Document position information */
export interface DocumentPosition {
  chapter: number;
  paragraph: number;
  sentence: number;
  startChar: number;
  endChar: number;
}

/** Parameters for destructuring */
export interface DestructureAllParams {
  chapterId: string;
  index: number;
  text: string;
  documentPosition: DocumentPosition;
  startChar: number;
  endChar: number;
  wordCount: number;
}

/** Built sentence data */
export interface SentenceData {
  id: string;
  text: string;
  position: number;
  documentPosition: DocumentPosition;
  wordCount: number;
  charRange: { start: number; end: number };
  estimatedDuration: number;
}

/** Base parameters for sentence data */
export interface BaseSentenceParams {
  id: string;
  text: string;
  position: number;
  documentPosition: DocumentPosition;
  wordCount: number;
}

/**
 * Creates character range from parameters
 * @param {object} params - Parameters containing character positions
 * @param {number} params.startChar - Starting character position
 * @param {number} params.endChar - Ending character position
 * @returns {object} Character range
 */
export function createCharacterRangeFromParams(params: {
  startChar: number;
  endChar: number;
}): { start: number; end: number } {
  return { start: params.startChar, end: params.endChar };
}

/**
 * Calculates estimated duration for TTS processing
 * @param {number} wordCount - Number of words
 * @returns {number} Estimated duration
 */
export function calculateEstimatedDuration(wordCount: number): number {
  return wordCount * DEFAULT_WORD_DURATION;
}

/**
 * Destructures all parameters from the input object
 * @param {DestructureAllParams} params - Parameters object
 * @returns {DestructureAllParams} Destructured parameters
 */
export function destructureAllParams(
  params: DestructureAllParams
): DestructureAllParams {
  const {
    chapterId,
    index,
    text,
    documentPosition,
    startChar,
    endChar,
    wordCount,
  } = params;
  return {
    chapterId,
    index,
    text,
    documentPosition,
    startChar,
    endChar,
    wordCount,
  };
}

/**
 * Builds sentence data object from parameters
 * @param {DestructureAllParams} extractedParams - Destructured parameters
 * @returns {SentenceData} Built sentence data
 */
export function buildSentenceData(
  extractedParams: DestructureAllParams
): SentenceData {
  const baseParams = extractBaseParams(extractedParams);
  const charRange = createCharacterRangeFromParams(extractedParams);
  const duration = calculateEstimatedDuration(extractedParams.wordCount);

  return { ...baseParams, charRange, estimatedDuration: duration };
}

/**
 * Extracts base parameters for sentence data
 * @param {DestructureAllParams} extractedParams - Destructured parameters
 * @returns {BaseSentenceParams} Base parameters for sentence data
 */
function extractBaseParams(
  extractedParams: DestructureAllParams
): BaseSentenceParams {
  const { chapterId, index, text, documentPosition, wordCount } =
    extractedParams;
  return {
    id: `sentence-${chapterId}-0-${index}`,
    text,
    position: index,
    documentPosition,
    wordCount,
  };
}
