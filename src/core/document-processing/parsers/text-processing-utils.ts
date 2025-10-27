/**
 * Text processing utilities for Markdown parsing
 */

import type { Sentence } from '../types.js';
import { PARSER_CONSTANTS, REGEX_PATTERNS } from './constants.js';

/**
 * Count words in text
 * @param text - The text string to count words in
 * @returns The number of words in the text
 */
export function countWords(text: string): number {
  return text
    .trim()
    .split(REGEX_PATTERNS.WORD_SEPARATOR)
    .filter((word) => word.length > 0).length;
}

/**
 * Estimate sentence duration for TTS
 * @param text - The text to estimate duration for
 * @returns Estimated duration in seconds for text-to-speech processing
 */
export function estimateSentenceDuration(text: string): number {
  const wordCount = countWords(text);
  return wordCount / PARSER_CONSTANTS.WORDS_PER_SECOND;
}

/**
 * Check if text has formatting
 * @param text - The text to check for formatting patterns
 * @returns True if the text contains markdown formatting, false otherwise
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
 * @param text - The text string to extract sentences from
 * @param minSentenceLength - Minimum length a sentence must have to be included
 * @param sentenceBoundaryPatterns - Array of regex patterns to match sentence boundaries
 * @returns Array of sentences with calculated metadata
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
 * @param text - The text to search for sentence boundaries
 * @param sentenceBoundaryPatterns - Array of regex patterns to match sentence boundaries
 * @returns Array of RegExpMatchArray containing all sentence boundary matches
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
 * @param text - The text to create a sentence from
 * @returns A sentence object with the provided text
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
 * @param text - The original text to extract sentences from
 * @param matches - Array of RegExpMatchArray containing sentence boundary matches
 * @param minSentenceLength - Minimum length a sentence must have to be included
 * @param sentences - Array to populate with created sentence objects
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
 * @param text - The original text to extract remaining content from
 * @param matches - Array of RegExpMatchArray containing sentence boundary matches
 * @param minSentenceLength - Minimum length remaining text must have to be included
 * @param sentences - Array to populate with created sentence objects
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
 * @param text - The text content for the sentence
 * @param position - The position index of the sentence
 * @returns A complete sentence object with calculated metadata
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
 * @param sentences - Array of sentences to calculate confidence for
 * @returns Confidence score between 0.0 and 1.0 indicating parsing quality
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
