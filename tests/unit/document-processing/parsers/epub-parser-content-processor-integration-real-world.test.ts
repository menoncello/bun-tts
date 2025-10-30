import { describe, test, expect } from 'bun:test';
import {
  processChapterContent,
  splitIntoParagraphs,
  calculateReadingTime,
} from '../../../../src/core/document-processing/parsers/epub-parser-content-processor.js';
import type { EPUBParseOptions } from '../../../../src/core/document-processing/parsers/epub-parser-types.js';

// Test data creation functions
function createBookChapterContent(): string {
  return `
    <h2>Chapter 1: The Beginning</h2>
    <p>It was a dark and stormy night. The rain fell in torrents — except at occasional intervals,
    when it was checked by a violent gust of wind which swept up the streets.</p>
    <p>Inside the old library, Sarah discovered something remarkable. Could it be the key she had been searching for?</p>
    <p>"I can't believe it," she whispered to herself.</p>
  `;
}

function createPoetryContent(): string {
  return `
    <h2>Poem</h2>
    <p>Roses are red,<br>Violets are blue,<br>Sugar is sweet,<br>And so are you!</p>
    <p>— Anonymous</p>
  `;
}

function createListContent(): string {
  return `
    <h2>Shopping List</h2>
    <ul>
      <li>First item with description</li>
      <li>Second item!</li>
      <li>Third item?</li>
    </ul>
    <p>Remember to buy everything.</p>
  `;
}

function createDefaultOptions(): EPUBParseOptions {
  return { preserveHTML: false };
}

// Helper assertion functions
function assertBasicParagraphStructure(
  paragraphs: any[],
  expectedLength: number
) {
  expect(paragraphs).toHaveLength(expectedLength);
}

function assertContentContains(paragraphs: any[], ...expectedTexts: string[]) {
  for (const text of expectedTexts) {
    expect(paragraphs[0]?.rawText).toContain(text);
  }
}

function assertWordCountAndReadingTime(
  paragraphs: any[],
  minWords: number,
  minReadingTime: number
) {
  const totalWords = paragraphs.reduce((sum, p) => sum + p.wordCount, 0);
  expect(totalWords).toBeGreaterThan(minWords);

  const readingTime = calculateReadingTime(totalWords);
  expect(readingTime).toBeGreaterThan(minReadingTime);
}

function processAndSplitContent(content: string, options: EPUBParseOptions) {
  const processed = processChapterContent(content, options);
  return splitIntoParagraphs(processed);
}

describe('EPUB Parser Content Processor - Integration Real World', () => {
  describe('Book chapter processing', () => {
    test('should handle real-world book content structure', () => {
      const content = createBookChapterContent();
      const options = createDefaultOptions();

      const paragraphs = processAndSplitContent(content, options);

      assertBasicParagraphStructure(paragraphs, 1);
      expect(paragraphs[0]?.sentences.length).toBeGreaterThan(3);
      assertWordCountAndReadingTime(paragraphs, 50, 0);
    });
  });

  describe('Poetry and verse formatting', () => {
    test('should handle poetry and verse formatting', () => {
      const content = createPoetryContent();
      const options = createDefaultOptions();

      const paragraphs = processAndSplitContent(content, options);

      assertBasicParagraphStructure(paragraphs, 1);
      assertContentContains(paragraphs, 'Roses are red', 'Violets are blue');
      expect(paragraphs[0]?.sentences.length).toBeGreaterThan(0);
    });
  });

  describe('Lists and structured content', () => {
    test('should handle lists and structured content', () => {
      const content = createListContent();
      const options = createDefaultOptions();

      const paragraphs = processAndSplitContent(content, options);

      assertBasicParagraphStructure(paragraphs, 1);
      assertContentContains(
        paragraphs,
        'First item',
        'Second item',
        'Third item',
        'Remember to buy'
      );
    });
  });
});
