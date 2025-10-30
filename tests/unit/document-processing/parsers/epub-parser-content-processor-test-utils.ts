import { expect } from 'bun:test';
import {
  processChapterContent,
  splitIntoParagraphs,
  calculateReadingTime,
} from '../../../../src/core/document-processing/parsers/epub-parser-content-processor.js';
import type { EPUBParseOptions } from '../../../../src/core/document-processing/parsers/epub-parser-types.js';

// ============================================================================
// CONTENT CREATION UTILITIES
// ============================================================================

/**
 * Create basic EPUB parse options
 */
export function createParseOptions(preserveHTML?: boolean): EPUBParseOptions {
  return preserveHTML === undefined ? {} : { preserveHTML };
}

/**
 * Create options for HTML preservation tests
 */
export function createHTMLOptions(preserve: boolean): EPUBParseOptions {
  return { preserveHTML: preserve };
}

/**
 * Create test content with basic HTML
 */
export function createBasicHTMLContent(): string {
  return '<p>This is <strong>HTML</strong> content</p>';
}

/**
 * Create test content with complex HTML
 */
export function createComplexHTMLContent(): string {
  return '<div><h1>Title</h1><p>Paragraph with <em>emphasis</em></p></div>';
}

/**
 * Create test content with script and style tags
 */
export function createScriptStyleContent(): string {
  return '<p>Content</p><script>alert("test")</script><style>body{color:red;}</style><p>More content</p>';
}

/**
 * Create test content with nested HTML
 */
export function createNestedHTMLContent(): string {
  return '<div><p>This is <strong>nested <em>HTML</em></strong> content</p></div>';
}

/**
 * Create test paragraph content
 */
export function createParagraphContent(): string {
  return 'This is a single paragraph with some text content.';
}

/**
 * Create multiple paragraphs for testing
 */
export function createMultipleParagraphs(): string {
  return `First paragraph with some text.

Second paragraph with different content.

Third paragraph completes the test.`;
}

/**
 * Create content with sentences
 */
export function createSentenceContent(): string {
  return 'First sentence. Second sentence! Third sentence? Final sentence.';
}

/**
 * Create malformed HTML content for edge case testing
 */
export function createMalformedHTMLContent(): string {
  return '<p>Unclosed paragraph<div>Nested div without closing';
}

/**
 * Create HTML with attributes for testing attribute stripping
 */
export function createHTMLWithAttributes(): string {
  return '<a href="https://example.com" class="link" target="_blank">Link text</a>';
}

/**
 * Create content with only HTML comments
 */
export function createHTMLCommentContent(): string {
  return '<!-- This is a comment -->';
}

/**
 * Create HTML with whitespace for testing whitespace handling
 */
export function createHTMLWithWhitespace(): string {
  return '  <p>Content with spaces</p>  ';
}

/**
 * Create HTML with self-closing tags
 */
export function createHTMLWithSelfClosingTags(): string {
  return '<p>Content with <br/> line break</p>';
}

/**
 * Create HTML with entities for testing entity decoding
 */
export function createHTMLWithEntities(): string {
  return '<p>Content with &amp; &lt; &gt; entities</p>';
}

// ============================================================================
// PROCESSING UTILITIES
// ============================================================================

/**
 * Process content and split into paragraphs in one step
 */
export function processAndSplitContent(
  content: string,
  options: EPUBParseOptions
) {
  const processed = processChapterContent(content, options);
  return splitIntoParagraphs(processed);
}

// ============================================================================
// ASSERTION HELPERS
// ============================================================================

/**
 * Assert that HTML has been stripped correctly
 */
export function assertHTMLStripped(
  result: string,
  expectedText: string,
  ...htmlTags: string[]
) {
  // expect is now imported at the top of the file
  expect(result).toBe(expectedText);
  for (const tag of htmlTags) {
    expect(result).not.toContain(tag);
  }
}

/**
 * Assert that HTML has been preserved
 */
export function assertHTMLPreserved(result: string, originalContent: string) {
  // expect is now imported at the top of the file
  expect(result).toBe(originalContent);
}

/**
 * Assert that content does not contain specific texts
 */
export function assertDoesNotContain(
  result: string,
  ...unwantedTexts: string[]
) {
  // expect is now imported at the top of the file
  for (const text of unwantedTexts) {
    expect(result).not.toContain(text);
  }
}

/**
 * Assert basic paragraph structure
 */
export function assertBasicParagraphStructure(
  paragraphs: any[],
  expectedLength: number
) {
  // expect is now imported at the top of the file
  expect(paragraphs).toHaveLength(expectedLength);
}

/**
 * Assert content contains specific texts
 */
export function assertContentContains(
  paragraphs: any[],
  ...expectedTexts: string[]
) {
  // expect is now imported at the top of the file
  for (const text of expectedTexts) {
    expect(paragraphs[0]?.rawText).toContain(text);
  }
}

/**
 * Assert word count and reading time
 */
export function assertWordCountAndReadingTime(
  paragraphs: any[],
  minWords: number,
  minReadingTime: number
) {
  // expect is now imported at the top of the file
  const totalWords = paragraphs.reduce((sum, p) => sum + p.wordCount, 0);
  expect(totalWords).toBeGreaterThan(minWords);

  const readingTime = calculateReadingTime(totalWords);
  expect(readingTime).toBeGreaterThan(minReadingTime);
}

/**
 * Assert single paragraph structure with detailed validation
 */
function assertBasicParagraphProperties(
  result: any[],
  _expectedWordCount: number,
  _expectedText: string
) {
  // expect is now imported at the top of the file
  expect(result).toHaveLength(1);
  expect(result[0]?.id).toBe('paragraph-1');
  expect(result[0]?.type).toBe('text');
  expect(result[0]?.position).toBe(0);
}

function assertContentProperties(
  result: any[],
  expectedWordCount: number,
  expectedText: string
) {
  // expect is now imported at the top of the file
  expect(result[0]?.wordCount).toBe(expectedWordCount);
  expect(result[0]?.rawText).toBe(expectedText);
  expect(result[0]?.text).toBe(expectedText);
}

function assertAudioProperties(result: any[]) {
  // expect is now imported at the top of the file
  expect(result[0]?.includeInAudio).toBe(true);
  expect(result[0]?.confidence).toBe(0.8);
}

function assertSentenceStructure(result: any[], expectedText: string) {
  // expect is now imported at the top of the file
  expect(result[0]?.sentences).toHaveLength(1);
  expect(result[0]?.sentences[0]?.text).toBe(expectedText);
}

export function assertSingleParagraphStructure(
  result: any[],
  expectedWordCount: number,
  expectedText: string
) {
  assertBasicParagraphProperties(result, expectedWordCount, expectedText);
  assertContentProperties(result, expectedWordCount, expectedText);
  assertAudioProperties(result);
  assertSentenceStructure(result, expectedText);
}

/**
 * Assert multiple paragraph structure
 */
export function assertMultipleParagraphStructure(
  result: any[],
  expectedLength: number
) {
  // expect is now imported at the top of the file
  expect(result).toHaveLength(expectedLength);

  for (let i = 0; i < expectedLength; i++) {
    expect(result[i]?.id).toBe(`paragraph-${i + 1}`);
    expect(result[i]?.position).toBe(i);
  }
}

/**
 * Assert paragraph text content
 */
export function assertParagraphTextContent(
  result: any[],
  index: number,
  expectedText: string
) {
  // expect is now imported at the top of the file
  expect(result[index]?.rawText).toBe(expectedText);
  expect(result[index]?.text).toBe(expectedText);
}

/**
 * Assert sentence count in paragraph
 */
export function assertSentenceCount(
  result: any[],
  paragraphIndex: number,
  expectedCount: number
) {
  // expect is now imported at the top of the file
  expect(result[paragraphIndex]?.sentences).toHaveLength(expectedCount);
}

/**
 * Assert sentence text content
 */
export function assertSentenceText(
  result: any[],
  paragraphIndex: number,
  sentenceIndex: number,
  expectedText: string
) {
  // expect is now imported at the top of the file
  expect(result[paragraphIndex]?.sentences[sentenceIndex]?.text).toBe(
    expectedText
  );
}

/**
 * Assert word count exact match
 */
export function assertWordCountExact(
  result: any[],
  paragraphIndex: number,
  expectedCount: number
) {
  // expect is now imported at the top of the file
  expect(result[paragraphIndex]?.wordCount).toBe(expectedCount);
}

/**
 * Assert word count greater than minimum
 */
export function assertWordCountGreaterThan(
  result: any[],
  paragraphIndex: number,
  minCount: number
) {
  // expect is now imported at the top of the file
  expect(result[paragraphIndex]?.wordCount).toBeGreaterThan(minCount);
}

/**
 * Assert content contains text
 */
export function assertContainsText(
  result: any[],
  paragraphIndex: number,
  expectedText: string
) {
  // expect is now imported at the top of the file
  expect(result[paragraphIndex]?.rawText).toContain(expectedText);
}

/**
 * Assert paragraph has sentences
 */
export function assertHasSentences(result: any[], paragraphIndex: number) {
  // expect is now imported at the top of the file
  expect(result[paragraphIndex]?.sentences?.length).toBeGreaterThan(0);
}

/**
 * Assert all paragraphs have content
 */
export function assertAllParagraphsHaveContent(result: any[]) {
  // expect is now imported at the top of the file
  expect(result.every((p) => p.rawText.trim().length > 0)).toBe(true);
}

// ============================================================================
// READING TIME TEST UTILITIES
// ============================================================================

/**
 * Assert reading time calculation
 */
export function assertReadingTime(wordCount: number, expectedMinutes: number) {
  // expect is now imported at the top of the file
  const result = calculateReadingTime(wordCount);
  expect(result).toBe(expectedMinutes);
}

/**
 * Assert reading time calculation using formula
 */
export function assertReadingTimeCalculation(
  wordCount: number,
  wordsPerMinute = 200
) {
  // expect is now imported at the top of the file
  const result = calculateReadingTime(wordCount);
  expect(result).toBe(Math.ceil(wordCount / wordsPerMinute));
}

/**
 * Assert positive reading time
 */
export function assertPositiveReadingTime(wordCount: number) {
  // expect is now imported at the top of the file
  const result = calculateReadingTime(wordCount);
  expect(result).toBeGreaterThan(0);
}

/**
 * Assert finite result
 */
export function assertFiniteResult(wordCount: number) {
  // expect is now imported at the top of the file
  const result = calculateReadingTime(wordCount);
  expect(Number.isFinite(result)).toBe(true);
}

/**
 * Assert NaN result
 */
export function assertNaNResult(wordCount: number) {
  // expect is now imported at the top of the file
  const result = calculateReadingTime(wordCount);
  expect(Number.isNaN(result)).toBe(true);
}

/**
 * Assert Infinity result
 */
export function assertInfinityResult(wordCount: number) {
  // expect is now imported at the top of the file
  const result = calculateReadingTime(wordCount);
  expect(result).toBe(Infinity);
}
