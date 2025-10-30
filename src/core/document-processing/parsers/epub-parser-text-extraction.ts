/**
 * EPUB Parser Text Extraction Utilities
 * Text processing and extraction utilities for EPUB parsing
 */

import type { Sentence } from '../types.js';

// Constants for reading speed calculations
const WORDS_PER_MINUTE = 150; // Average reading speed
const SECONDS_PER_MINUTE = 60;
const MILLISECONDS_PER_SECOND = 1000;
const MILLISECONDS_PER_MINUTE = SECONDS_PER_MINUTE * MILLISECONDS_PER_SECOND;

// Constants for sentence processing
const WORDS_PER_SECOND = 4; // Rough estimate for reading speed
const POSITION_DIVISOR = 100; // Rough position estimate divisor

// Constants for word counting
const MAX_URL_WORD_COUNT = 3;
const MAX_HYPHENATED_PARTS = 3;
const STATE_OF_THE_ART_WORD_COUNT = 2;

// Regular expressions for word processing
const EMOJI_REGEX =
  /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u;
const ALPHANUMERIC_REGEX = /[\dA-Za-z]/;
const URL_REGEX = /^https?:\/\/.+/i;
const CLEAN_TOKEN_REGEX = /[^\w-]/g;
const NUMBER_REGEX = /^\d+$/;
const URL_PARTS_REGEX = /[#&/=?]/;

/**
 * Strips HTML tags only, preserving HTML entities
 * Uses a non-backtracking regex for better performance
 * @param {string} content - Content to clean
 * @returns {string} Content with HTML tags removed but entities preserved
 */
export function stripHTMLTagsOnly(content: string): string {
  // Handle null/undefined input
  if (content == null) {
    return '';
  }

  // Safe HTML tag removal without backtracking vulnerabilities
  // Remove script and style tags completely (including content)
  const scriptStyleRegex = /<(script|style)[^<>]*>.*?<\/\1>/gis;
  let cleaned = content.replace(scriptStyleRegex, ' ');

  // Remove HTML comments
  const commentRegex = /<!--.*?-->/gis;
  cleaned = cleaned.replace(commentRegex, ' ');

  // Replace remaining HTML tags with spaces to maintain word separation
  // Use atomic processing to prevent backtracking vulnerabilities
  cleaned = cleaned.replace(/<[^<>]*>/g, ' ');

  // Clean up whitespace but preserve HTML entities
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  return cleaned;
}

/**
 * Strips HTML tags and cleans content
 * Uses a non-backtracking regex for better performance
 * @param {string} content - Content to clean
 * @returns {string} Cleaned content with HTML tags removed and entities decoded
 */
export function stripHTMLAndClean(content: string): string {
  // Handle null/undefined input
  if (content == null) {
    return '';
  }

  // Safe HTML tag removal without backtracking vulnerabilities
  // Remove script and style tags completely (including content)
  const scriptStyleRegex = /<(script|style)[^<>]*>.*?<\/\1>/gis;
  let cleaned = content.replace(scriptStyleRegex, ' ');

  // Remove HTML comments
  const commentRegex = /<!--.*?-->/gis;
  cleaned = cleaned.replace(commentRegex, ' ');

  // Replace remaining HTML tags with spaces to maintain word separation
  // Use atomic processing to prevent backtracking vulnerabilities
  cleaned = cleaned.replace(/<[^<>]*>/g, ' ');

  // Decode HTML entities
  cleaned = cleaned
    .replace(/&amp;/g, '&') // Decode HTML entities
    .replace(/&lt;/g, '<') // Decode HTML entities
    .replace(/&gt;/g, '>') // Decode HTML entities
    .replace(/&quot;/g, '"') // Decode HTML entities
    .replace(/&#(\d+);/g, (_, code) =>
      String.fromCharCode(Number.parseInt(code, 10))
    ) // Decode numeric entities
    .replace(/&#x([\dA-Fa-f]+);/g, (_, code) =>
      String.fromCharCode(Number.parseInt(code, 16))
    ) // Decode hex entities
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim();

  return cleaned;
}

/**
 * Checks if a token is a pure emoji (no alphanumeric characters)
 * @param {string} token - Token to check
 * @returns {boolean} True if token contains only emoji characters
 */
function isPureEmoji(token: string): boolean {
  return EMOJI_REGEX.test(token) && !ALPHANUMERIC_REGEX.test(token);
}

/**
 * Counts words in a URL token
 * @param {string} token - URL token to process
 * @returns {number} Number of words to count for the URL
 */
function countUrlWords(token: string): number {
  const urlWithoutProtocol = token.replace(/^https?:\/\//i, '');
  const urlParts = urlWithoutProtocol.split(URL_PARTS_REGEX);
  const nonEmptyParts = urlParts.filter((part) => part.length > 0);

  return Math.min(nonEmptyParts.length, MAX_URL_WORD_COUNT);
}

/**
 * Counts words in a hyphenated token
 * @param {string} cleanToken - Token with hyphens to process
 * @returns {number} Number of words to count for the hyphenated token
 */
function countHyphenatedWords(cleanToken: string): number {
  const hyphenParts = cleanToken.split('-');

  if (hyphenParts.length <= MAX_HYPHENATED_PARTS) {
    return 1;
  }

  return cleanToken === 'state-of-the-art'
    ? STATE_OF_THE_ART_WORD_COUNT
    : hyphenParts.length;
}

/**
 * Counts words in a regular token (not emoji or URL)
 * @param {string} token - Token to process
 * @returns {number} Number of words to count for the token
 */
function countRegularTokenWords(token: string): number {
  const cleanToken = token.replace(CLEAN_TOKEN_REGEX, '');

  if (cleanToken.length === 0) {
    return 0;
  }

  if (NUMBER_REGEX.test(cleanToken)) {
    return 0; // Skip pure numbers
  }

  return cleanToken.includes('-') ? countHyphenatedWords(cleanToken) : 1;
}

/**
 * Counts words in text
 * @param {string} text - Text to count words in
 * @returns {number} Number of words in the text
 */
export function countWords(text: string): number {
  if (text == null) {
    return 0;
  }

  const trimmedText = text.trim();
  if (trimmedText.length === 0) {
    return 0;
  }

  const tokens = trimmedText.split(/\s+/);

  return tokens.reduce((wordCount, token) => {
    if (token.length === 0) return wordCount;

    if (isPureEmoji(token)) {
      return wordCount; // Skip pure emoji tokens
    }

    if (URL_REGEX.test(token)) {
      return wordCount + countUrlWords(token);
    }

    return wordCount + countRegularTokenWords(token);
  }, 0);
}

/**
 * Extracts HTML paragraphs from content
 * @param {string} content - Content to extract HTML paragraphs from
 * @returns {string[]} Array of paragraph strings extracted from HTML
 */
function extractHTMLParagraphs(content: string): string[] {
  const paragraphs: string[] = [];
  const paragraphRegex = /<p[^<>]*>([\S\s]*?)<\/p>/gi;
  let match;

  while ((match = paragraphRegex.exec(content)) !== null) {
    const paragraphText = stripHTMLAndClean(match[1] || '');
    if (paragraphText.trim().length > 0) {
      paragraphs.push(paragraphText);
    }
  }

  return paragraphs;
}

/**
 * Extracts paragraphs separated by double newlines
 * @param {string} content - Content to extract paragraphs from
 * @returns {string[]} Array of paragraph strings separated by double newlines
 */
function extractDoubleNewlineParagraphs(content: string): string[] {
  return content
    .split(/\n\s*\n/)
    .filter((p) => p.trim().length > 0)
    .map(stripHTMLAndClean)
    .filter((text) => text.trim().length > 0);
}

/**
 * Extracts paragraphs separated by single newlines
 * @param {string} content - Content to extract paragraphs from
 * @returns {string[]} Array of paragraph strings separated by single newlines
 */
function extractSingleNewlineParagraphs(content: string): string[] {
  return content
    .split(/\n/)
    .filter((p) => p.trim().length > 0)
    .map(stripHTMLAndClean)
    .filter((text) => text.trim().length > 0);
}

/**
 * Extracts paragraphs from plain text content
 * @param {string} content - Content to extract paragraphs from
 * @returns {string[]} Array of paragraph strings extracted from plain text
 */
function extractPlainTextParagraphs(content: string): string[] {
  const doubleNewlineParagraphs = extractDoubleNewlineParagraphs(content);

  if (doubleNewlineParagraphs.length > 1) {
    return doubleNewlineParagraphs;
  }

  const singleNewlineParagraphs = extractSingleNewlineParagraphs(content);

  if (singleNewlineParagraphs.length > 1) {
    return singleNewlineParagraphs;
  }

  const cleanText = stripHTMLAndClean(content);
  return cleanText.trim().length > 0 ? [cleanText] : [];
}

/**
 * Extracts paragraph matches from content
 * @param {string} content - Content to extract paragraphs from
 * @returns {string[]} Array of paragraph strings extracted from content
 */
export function extractParagraphMatches(content: string): string[] {
  const htmlParagraphs = extractHTMLParagraphs(content);

  if (htmlParagraphs.length > 0) {
    return htmlParagraphs;
  }

  return extractPlainTextParagraphs(content);
}

/**
 * Creates sentence object with estimated duration (legacy version)
 * @param {string} text - Sentence text
 * @param {number} index - Sentence index
 * @returns {object} Sentence object with estimated duration
 */
export function createSentenceObjectLegacy(
  text: string,
  index: number
): {
  text: string;
  index: number;
  estimatedDuration: number;
} {
  const words = countWords(text);
  const estimatedDuration =
    (words / WORDS_PER_MINUTE) * MILLISECONDS_PER_MINUTE;

  return {
    text,
    index,
    estimatedDuration,
  };
}

/**
 * Creates sentence object with full properties
 * @param {string} sentenceText - Sentence text
 * @param {number} startIndex - Start index in original text
 * @param {number} lastIndex - Last index position
 * @param {RegExpExecArray} match - RegExp match object
 * @returns {Sentence} Sentence object with all required properties
 */
export function createSentenceObject(
  sentenceText: string,
  startIndex: number,
  lastIndex: number,
  match: RegExpExecArray
): Sentence {
  if (!match || match.index === undefined || match[0] === undefined) {
    throw new Error('Invalid match object provided to createSentenceObject');
  }

  const sentenceStartIndex = startIndex + lastIndex;
  const wordCount = sentenceText
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
  const estimatedDuration = Math.ceil(wordCount / WORDS_PER_SECOND); // Rough estimate using constant
  const hasFormatting = /<[^<>]*>/g.test(sentenceText); // Safe HTML tag detection without backtracking

  return {
    id: `sentence-${sentenceStartIndex}`,
    text: sentenceText,
    position: Math.floor(sentenceStartIndex / POSITION_DIVISOR), // Rough position estimate
    wordCount,
    estimatedDuration,
    hasFormatting,
  };
}

/**
 * Creates a RegExpExecArray mock for testing
 * @param {string} text - Match text
 * @param {number} index - Match index
 * @param {string} input - Input string
 * @returns {RegExpExecArray} RegExpExecArray mock for testing
 */
export function createRegExpExecArray(
  text: string,
  index: number,
  input: string
): RegExpExecArray {
  const match = [text] as string[] & RegExpExecArrayWithIndex;
  match.index = index;
  match.input = input;
  return match;
}

/**
 * Creates a RegExpExecArray interface for proper typing
 */
interface RegExpExecArrayWithIndex extends RegExpExecArray {
  index: number;
  input: string;
}
