/**
 * PDF parser parameter helpers.
 * These utilities handle parameter validation and processing.
 */

import { buildSentenceData } from './pdf-parser-sentence-helpers';

/**
 * Validates sentence parameters before processing
 * @param {{chapterId: string, index: number, text: string, documentPosition: {chapter: number, paragraph: number, sentence: number, startChar: number, endChar: number}, startChar: number, endChar: number, wordCount: number}} params - Parameters object containing sentence details
 * @param {string} params.chapterId - Chapter identifier
 * @param {number} params.index - Sentence index
 * @param {string} params.text - Sentence text content
 * @param {{chapter: number, paragraph: number, sentence: number, startChar: number, endChar: number}} params.documentPosition - Document position information
 * @param {number} params.documentPosition.chapter - Chapter position
 * @param {number} params.documentPosition.paragraph - Paragraph position
 * @param {number} params.documentPosition.sentence - Sentence position
 * @param {number} params.documentPosition.startChar - Starting character position in document
 * @param {number} params.documentPosition.endChar - Ending character position in document
 * @param {number} params.startChar - Starting character position
 * @param {number} params.endChar - Ending character position
 * @param {number} params.wordCount - Number of words in the sentence
 * @returns {boolean} True if parameters are valid for processing
 */
export function validateAndPrepareParams(params: {
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
  return validateSentenceParams(params) && params.wordCount >= 0;
}

/**
 * Validates parameter structure for sentence processing
 * @param {{chapterId: string, index: number, text: string, documentPosition: {chapter: number, paragraph: number, sentence: number, startChar: number, endChar: number}, startChar: number, endChar: number, wordCount: number}} params - Parameters object
 * @param {string} params.chapterId - Chapter identifier
 * @param {number} params.index - Sentence index
 * @param {string} params.text - Sentence text content
 * @param {{chapter: number, paragraph: number, sentence: number, startChar: number, endChar: number}} params.documentPosition - Document position information
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
  return !!(
    params.chapterId &&
    typeof params.index === 'number' &&
    params.text !== null &&
    params.text !== undefined &&
    params.documentPosition &&
    typeof params.startChar === 'number' &&
    typeof params.endChar === 'number' &&
    typeof params.wordCount === 'number'
  );
}

/**
 * Validates basic parameter structure
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
 * @returns {boolean} True if basic structure is valid
 */
function validateBasicStructure(params: {
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
  return !!(
    params.chapterId &&
    typeof params.index === 'number' &&
    params.text &&
    params.documentPosition
  );
}

interface SentenceParams {
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

/**
 * Creates destructured parameter object
 * @param {SentenceParams} params - The parameters to destructure
 * @returns {SentenceParams} Destructured parameter object
 */
function createDestructuredParams(params: SentenceParams): SentenceParams {
  return { ...params };
}

/**
 * Destructures all parameters from object
 * @param {SentenceParams} params - The parameters to destructure and validate
 * @returns {SentenceParams} Validated destructured parameters
 * @throws {Error} If basic parameter structure is invalid
 */
export function destructureAllParams(params: SentenceParams): SentenceParams {
  if (!validateBasicStructure(params)) {
    throw new Error('Invalid basic parameter structure');
  }
  return createDestructuredParams(params);
}

/**
 * Validates parameters for extraction
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
 * @throws {Error} If parameters are invalid
 */
function validateParamsForExtraction(params: {
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
}): void {
  if (!validateSentenceParams(params)) {
    throw new Error('Invalid sentence parameters provided');
  }
}

/**
 * Validates and extracts parameters with error handling
 * @param {SentenceParams} params - The parameters to validate and extract
 * @returns {SentenceParams} Validated and extracted parameters
 * @throws {Error} If parameters are invalid for extraction
 */
export function extractParamsFromObject(
  params: SentenceParams
): SentenceParams {
  validateParamsForExtraction(params);
  return destructureAllParams(params);
}

/**
 * Validates and prepares sentence data extraction
 * @param {object} params - Parameters object containing sentence details
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
 * @throws {Error} If parameters are invalid for sentence data extraction
 */
function validateForSentenceDataExtraction(params: {
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
}): void {
  if (!validateAndPrepareParams(params)) {
    throw new Error('Invalid sentence parameters provided');
  }
}

/**
 * Performs sentence data extraction from validated parameters
 * @param {SentenceParams} params - The validated parameters for sentence data extraction
 * @returns {ReturnType<typeof buildSentenceData>} Built sentence data
 */
function performSentenceDataExtraction(
  params: SentenceParams
): ReturnType<typeof buildSentenceData> {
  const extractedParams = extractParamsFromObject(params);
  return buildSentenceData(extractedParams);
}

/**
 * Extracts and organizes sentence data from parameters
 * @param {SentenceParams} params - The parameters to extract sentence data from
 * @returns {ReturnType<typeof buildSentenceData>} Extracted and organized sentence data
 * @throws {Error} If parameters are invalid for sentence data extraction
 */
export function extractSentenceData(
  params: SentenceParams
): ReturnType<typeof buildSentenceData> {
  validateForSentenceDataExtraction(params);
  return performSentenceDataExtraction(params);
}
