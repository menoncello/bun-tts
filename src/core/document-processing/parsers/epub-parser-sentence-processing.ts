/**
 * EPUB Parser Sentence Processing Utilities
 * Sentence boundary detection and processing utilities
 */

// No imports needed for this module

// Constants for ellipsis detection
const ELLIPSIS_LENGTH = 3;
const ELLIPSIS_OFFSET = 2;

/**
 * Finds the last sentence boundary index
 * @param {RegExpExecArray[]} sentences - Array of sentence matches
 * @returns {number} Last boundary index or -1 if no sentences
 */
function findLastSentenceBoundary(sentences: RegExpExecArray[]): number {
  let lastBoundary = -1;
  for (const sentence of sentences) {
    if (sentence.index !== undefined) {
      lastBoundary = Math.max(
        lastBoundary,
        sentence.index + sentence[0].length
      );
    }
  }
  return lastBoundary;
}

/**
 * Creates a RegExpExecArray interface for proper typing
 */
interface RegExpExecArrayWithIndex extends RegExpExecArray {
  index: number;
  input: string;
}

/**
 * Creates a mock RegExpExecArray for the end sentence
 * @param {string} remainingText - Remaining text to create match for
 * @param {number} matchIndex - Index where the match starts
 * @param {string} input - Original input text
 * @returns {RegExpExecArray} Mock RegExpExecArray
 */
function createEndSentenceMatch(
  remainingText: string,
  matchIndex: number,
  input: string
): RegExpExecArray {
  const mockMatch = [remainingText] as string[] & RegExpExecArrayWithIndex;
  mockMatch.index = matchIndex;
  mockMatch.input = input;
  return mockMatch;
}

/**
 * Checks if text ends with sentence punctuation
 * @param {string} text - Text to check
 * @returns {boolean} True if text ends with sentence punctuation
 */
function endsWithSentencePunctuation(text: string): boolean {
  // Safe punctuation check without backtracking vulnerabilities
  // Use direct character access instead of regex to prevent ReDoS completely
  const trimmedText = text.trim();
  if (trimmedText.length === 0) {
    return false;
  }

  const lastChar = trimmedText[trimmedText.length - 1];
  return lastChar === '.' || lastChar === '!' || lastChar === '?';
}

/**
 * Checks if a character is a sentence-ending punctuation mark
 * @param {string} char - Character to check
 * @returns {boolean} True if character is sentence-ending punctuation
 */
function isSentencePunctuation(char: string): boolean {
  return char === '.' || char === '!' || char === '?';
}

/**
 * Checks if text at the given position starts with an ellipsis
 * @param {string} text - Text to check
 * @param {number} index - Starting index to check for ellipsis
 * @returns {number} Length of ellipsis if found, 0 otherwise
 */
function getEllipsisLength(text: string, index: number): number {
  if (
    index + ELLIPSIS_OFFSET < text.length &&
    text.charAt(index) === '.' &&
    text.charAt(index + 1) === '.' &&
    text.charAt(index + ELLIPSIS_OFFSET) === '.'
  ) {
    return ELLIPSIS_LENGTH; // Found "..."
  }
  return 0; // No ellipsis found
}

/**
 * Checks if a character is whitespace
 * @param {string} char - Character to check
 * @returns {boolean} True if character is whitespace
 */
function isWhitespace(char: string): boolean {
  return char === ' ' || char === '\t' || char === '\n' || char === '\r';
}

/**
 * Finds the end index of whitespace sequence starting from a given index
 * @param {string} text - Text to search in
 * @param {number} startIndex - Starting index for whitespace search
 * @returns {number} End index of whitespace sequence
 */
function findWhitespaceEnd(text: string, startIndex: number): number {
  let endIndex = startIndex;
  while (endIndex < text.length && isWhitespace(text.charAt(endIndex))) {
    endIndex++;
  }
  return endIndex;
}

/**
 * Processes ellipsis at current position and adds sentence match if found
 * @param {string} text - Text to process
 * @param {number} currentIndex - Current position in text
 * @param {RegExpExecArray[]} sentences - Array to add matches to
 * @returns {number} New index position, or -1 if no ellipsis found
 */
function processEllipsisMatch(
  text: string,
  currentIndex: number,
  sentences: RegExpExecArray[]
): number {
  const ellipsisLength = getEllipsisLength(text, currentIndex);
  if (ellipsisLength > 0) {
    const punctuationEnd = currentIndex + ellipsisLength;
    const whitespaceEnd = findWhitespaceEnd(text, punctuationEnd);

    // Check if we found ellipsis followed by whitespace
    if (whitespaceEnd > punctuationEnd) {
      const matchText = text.substring(currentIndex, whitespaceEnd);
      const match = createRegExpExecArray(matchText, currentIndex, text);
      sentences.push(match);
      return whitespaceEnd; // Continue from after the whitespace
    }
  }
  return -1; // No ellipsis found
}

/**
 * Processes punctuation at current position and adds sentence match if found
 * @param {string} text - Text to process
 * @param {number} currentIndex - Current position in text
 * @param {RegExpExecArray[]} sentences - Array to add matches to
 * @returns {number} New index position, or -1 if no punctuation found
 */
function processPunctuationMatch(
  text: string,
  currentIndex: number,
  sentences: RegExpExecArray[]
): number {
  if (isSentencePunctuation(text.charAt(currentIndex))) {
    const whitespaceEnd = findWhitespaceEnd(text, currentIndex + 1);

    // Check if we found punctuation followed by whitespace
    if (whitespaceEnd > currentIndex + 1) {
      const matchText = text.substring(currentIndex, whitespaceEnd);
      const match = createRegExpExecArray(matchText, currentIndex, text);
      sentences.push(match);
      return whitespaceEnd; // Continue from after the whitespace
    }
  }
  return -1; // No punctuation found
}

/**
 * Creates sentence boundary matches from text using safe character scanning
 * @param {string} text - Text to scan for sentence boundaries
 * @returns {RegExpExecArray[]} Array of RegExpExecArray containing sentence boundary matches
 */
function createSentenceBoundaryMatches(text: string): RegExpExecArray[] {
  const sentences: RegExpExecArray[] = [];
  let currentIndex = 0;

  while (currentIndex < text.length) {
    // Check for ellipsis first
    const ellipsisResult = processEllipsisMatch(text, currentIndex, sentences);
    if (ellipsisResult !== -1) {
      currentIndex = ellipsisResult;
      continue;
    }

    // Check for punctuation
    const punctuationResult = processPunctuationMatch(
      text,
      currentIndex,
      sentences
    );
    if (punctuationResult !== -1) {
      currentIndex = punctuationResult;
      continue;
    }

    currentIndex++;
  }

  return sentences;
}

/**
 * Extracts sentence matches from text
 * @param {string} text - Text to extract sentences from
 * @returns {RegExpExecArray[]} Array of RegExpExecArray containing sentence matches
 */
export function extractSentenceMatches(text: string): RegExpExecArray[] {
  const sentences = createSentenceBoundaryMatches(text);

  // Return all sentence boundary matches if any exist
  if (sentences.length > 0) {
    return sentences;
  }

  // Add end sentence match if text ends with punctuation
  if (endsWithSentencePunctuation(text)) {
    const lastBoundary = findLastSentenceBoundary(sentences);
    const remainingText = text.substring(lastBoundary + 1);

    if (remainingText.trim().length > 0) {
      const matchIndex = lastBoundary + 1;
      const endSentenceMatch = createEndSentenceMatch(
        remainingText,
        matchIndex,
        text
      );
      return [endSentenceMatch];
    }
  }

  return [];
}

/**
 * Extracts sentence text from match
 * @param {string} text - Original text
 * @param {RegExpExecArray} match - RegExp match object
 * @param {number} previousEnd - End position of previous sentence
 * @returns {string} Sentence text
 */
export function extractSentenceText(
  text: string,
  match: RegExpExecArray,
  previousEnd: number
): string {
  return text.substring(previousEnd, match.index + match[0].length).trim();
}

/**
 * Creates a RegExpExecArray mock for testing
 * @param {string} text - Match text
 * @param {number} index - Match index
 * @param {string} input - Input string
 * @returns {RegExpExecArray} RegExpExecArray mock
 */
function createRegExpExecArray(
  text: string,
  index: number,
  input: string
): RegExpExecArray {
  const match = [text] as string[] & RegExpExecArrayWithIndex;
  match.index = index;
  match.input = input;
  return match;
}
