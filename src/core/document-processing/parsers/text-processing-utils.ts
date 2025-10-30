/**
 * Text processing utilities for Markdown parsing
 */

import type { Sentence } from '../types.js';
import { PARSER_CONSTANTS, REGEX_PATTERNS } from './constants.js';

/**
 * Count words in text
 * @param {string} text - The text string to count words in
 * @returns {number} The number of words in the text
 */
export function countWords(text: string): number {
  if (!text || text.trim() === '') return 0;

  // Enhanced word counting that handles hyphenated words, contractions, and special cases
  const words = text
    .trim()
    // Replace URLs and emails with single word placeholders
    .replace(/https?:\/\/\S+/g, 'URL')
    // Safer email regex that avoids ReDoS vulnerabilities
    // Prevents backtracking by using simple, non-overlapping character classes
    // Pattern: [local-part]@[domain].[tld] where:
    // - local-part: starts with alphanumeric, then allowed chars
    // - domain: starts and ends with alphanumeric, dots and hyphens in middle
    // - tld: 2-63 alphabetic characters
    .replace(
      /\b[\dA-Za-z][\w%+.-]*[\dA-Za-z]@[\dA-Za-z][\d.A-Za-z-]*[\dA-Za-z]\.[A-Za-z]{2,63}\b/g,
      'EMAIL'
    )
    // Split by whitespace but keep hyphenated words together
    .split(/\s+/)
    .filter((word) => word.length > 0);

  return words.length;
}

/**
 * Estimate sentence duration for TTS
 * @param {string} text - The text to estimate duration for
 * @returns {number} Estimated duration in seconds for text-to-speech processing
 */
export function estimateSentenceDuration(text: string): number {
  const wordCount = countWords(text);
  return wordCount / PARSER_CONSTANTS.WORDS_PER_SECOND;
}

/**
 * Check if text has formatting
 * @param {string} text - The text to check for formatting patterns
 * @returns {boolean} True if the text contains markdown formatting, false otherwise
 */
export function hasFormatting(text: string): boolean {
  const formattingPatterns = [
    REGEX_PATTERNS.BOLD,
    REGEX_PATTERNS.ITALIC,
    REGEX_PATTERNS.CODE,
    REGEX_PATTERNS.LINKS,
  ];

  return formattingPatterns.some((pattern) => pattern.test(text));
}

/**
 * Extract sentences from text with optimized regex
 * @param {string} text - The text string to extract sentences from
 * @param {number} minSentenceLength - Minimum length a sentence must have to be included
 * @param {string[]} sentenceBoundaryPatterns - Array of regex patterns to match sentence boundaries
 * @returns {Sentence[]} Array of sentences with calculated metadata
 */
export function extractSentences(
  text: string,
  minSentenceLength: number,
  sentenceBoundaryPatterns: string[]
): Sentence[] {
  const sentences: Sentence[] = [];
  const sentenceMatches = findSentenceMatches(text, sentenceBoundaryPatterns);

  if (sentenceMatches.length === 0) {
    return [createSingleSentence(text)];
  }

  processSentenceMatches(text, sentenceMatches, minSentenceLength, sentences);
  handleRemainingText(text, sentenceMatches, minSentenceLength, sentences);

  return sentences;
}

/**
 * Find sentence boundary matches in text
 * @param {string} text - The text to search for sentence boundaries
 * @param {string[]} sentenceBoundaryPatterns - Array of regex patterns to match sentence boundaries
 * @returns {RegExpMatchArray[]} Array of RegExpMatchArray containing all sentence boundary matches
 */
function findSentenceMatches(
  text: string,
  sentenceBoundaryPatterns: string[]
): RegExpMatchArray[] {
  const combinedPattern = new RegExp(sentenceBoundaryPatterns.join('|'), 'g');
  return Array.from(text.matchAll(combinedPattern));
}

/**
 * Create a single sentence when no boundaries found
 * @param {string} text - The text to create a sentence from
 * @returns {Sentence} A sentence object with the provided text
 */
function createSingleSentence(text: string): Sentence {
  return {
    id: 'sentence-1',
    text: text.trim(),
    position: 0,
    wordCount: countWords(text),
    estimatedDuration: estimateSentenceDuration(text),
    hasFormatting: hasFormatting(text),
  };
}

/**
 * Process sentence matches and create sentence objects
 * @param {string} text - The original text to extract sentences from
 * @param {RegExpMatchArray[]} matches - Array of RegExpMatchArray containing sentence boundary matches
 * @param {number} minSentenceLength - Minimum length a sentence must have to be included
 * @param {Sentence[]} sentences - Array to populate with created sentence objects
 */
function processSentenceMatches(
  text: string,
  matches: RegExpMatchArray[],
  minSentenceLength: number,
  sentences: Sentence[]
): void {
  let lastIndex = 0;
  let sentenceIndex = 0;

  for (const match of matches) {
    const matchIndex = match.index || 0;
    const sentenceText = text
      .slice(lastIndex, matchIndex + match[0].length)
      .trim();

    if (sentenceText.length > minSentenceLength) {
      sentences.push(createSentenceObject(sentenceText, sentenceIndex));
      sentenceIndex++;
    }

    lastIndex = matchIndex + match[0].length;
  }
}

/**
 * Handle remaining text after last match
 * @param {string} text - The original text to extract remaining content from
 * @param {RegExpMatchArray[]} matches - Array of RegExpMatchArray containing sentence boundary matches
 * @param {number} minSentenceLength - Minimum length remaining text must have to be included
 * @param {Sentence[]} sentences - Array to populate with created sentence objects
 */
function handleRemainingText(
  text: string,
  matches: RegExpMatchArray[],
  minSentenceLength: number,
  sentences: Sentence[]
): void {
  if (matches.length === 0) return;

  const lastMatch = matches[matches.length - 1];
  const lastIndex = (lastMatch?.index || 0) + (lastMatch?.[0]?.length || 0);

  if (lastIndex < text.length) {
    const remainingText = text.slice(lastIndex).trim();
    if (remainingText.length > minSentenceLength) {
      sentences.push(createSentenceObject(remainingText, sentences.length));
    }
  }
}

/**
 * Create sentence object with metadata
 * @param {string} text - The text content for the sentence
 * @param {number} position - The position index of the sentence
 * @returns {Sentence} A complete sentence object with calculated metadata
 */
function createSentenceObject(text: string, position: number): Sentence {
  return {
    id: `sentence-${position + 1}`,
    text,
    position,
    wordCount: countWords(text),
    estimatedDuration: estimateSentenceDuration(text),
    hasFormatting: hasFormatting(text),
  };
}

/**
 * Calculate paragraph confidence score
 * @param {Sentence[]} sentences - Array of sentences to calculate confidence for
 * @returns {number} Confidence score between 0.0 and 1.0 indicating parsing quality
 */
export function calculateParagraphConfidence(sentences: Sentence[]): number {
  if (sentences.length === 0) return PARSER_CONSTANTS.BASE_CONFIDENCE;

  // Factors: sentence length distribution, punctuation, etc.
  const avgSentenceLength =
    sentences.reduce((sum, s) => sum + s.text.length, 0) / sentences.length;
  const hasProperPunctuation = sentences.some((s) =>
    /[!.?]$/.test(s.text.trim())
  );

  let confidence = PARSER_CONSTANTS.BASE_CONFIDENCE;

  // Boost for good sentence length
  if (
    avgSentenceLength >= PARSER_CONSTANTS.GOOD_SENTENCE_LENGTH_MIN &&
    avgSentenceLength <= PARSER_CONSTANTS.GOOD_SENTENCE_LENGTH_MAX
  ) {
    confidence += PARSER_CONSTANTS.SENTENCE_LENGTH_CONFIDENCE_BOOST;
  }

  // Boost for proper punctuation
  if (hasProperPunctuation) {
    confidence += PARSER_CONSTANTS.PUNCTUATION_CONFIDENCE_BOOST;
  }

  // Boost for multiple sentences
  if (sentences.length > 1) {
    confidence += PARSER_CONSTANTS.MULTIPLE_SENTENCE_CONFIDENCE_BOOST;
  }

  return Math.min(PARSER_CONSTANTS.MAX_CONFIDENCE, confidence);
}
