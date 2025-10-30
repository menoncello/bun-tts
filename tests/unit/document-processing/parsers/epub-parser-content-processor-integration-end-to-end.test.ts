import { describe, test, expect } from 'bun:test';
import {
  processChapterContent,
  splitIntoParagraphs,
  calculateReadingTime,
} from '../../../../src/core/document-processing/parsers/epub-parser-content-processor.js';
import type { EPUBParseOptions } from '../../../../src/core/document-processing/parsers/epub-parser-types.js';

describe('EPUB Parser Content Processor - Integration End-to-End', () => {
  test('should process complex chapter content end-to-end', () => {
    const rawContent = `
      <h1>Chapter Title</h1>
      <p>This is the first paragraph with <strong>bold text</strong>.</p>
      <p>Second paragraph has multiple sentences. It also has a question? And an exclamation!</p>
      <p>Third paragraph is simple.</p>
    `;

    const options: EPUBParseOptions = { preserveHTML: false };
    const processedContent = processChapterContent(rawContent, options);
    const paragraphs = splitIntoParagraphs(processedContent);

    expect(processedContent).not.toContain('<h1>');
    expect(processedContent).not.toContain('<strong>');
    expect(paragraphs).toHaveLength(1);

    // Check first paragraph
    expect(paragraphs[0]?.rawText).toContain('Chapter Title');
    expect(paragraphs[0]?.rawText).toContain('bold text');
    expect(paragraphs[0]?.wordCount).toBeGreaterThan(0);

    // Check paragraph with multiple sentences
    expect(paragraphs[0]?.sentences?.length).toBeGreaterThanOrEqual(4);
    expect(paragraphs[0]?.sentences[1]?.text).toContain('multiple sentences');

    // Calculate total reading time
    const totalWords = paragraphs.reduce((sum, p) => sum + p.wordCount, 0);
    const readingTime = calculateReadingTime(totalWords);
    expect(readingTime).toBeGreaterThan(0);
  });

  test('should handle content with special characters and formatting', () => {
    const content = `<p>Café résumé naïve — special chars!</p>
      <p>Numbers: 1,234.56 and dates: 12/31/2023.</p>
      <p>Quotes: "Hello" and 'world'.</p>`;

    const options: EPUBParseOptions = { preserveHTML: false };
    const processed = processChapterContent(content, options);
    const paragraphs = splitIntoParagraphs(processed);

    expect(paragraphs).toHaveLength(1);
    expect(paragraphs[0]?.rawText).toContain('Café résumé naïve');
    expect(paragraphs[0]?.rawText).toContain('1,234.56');
    expect(paragraphs[0]?.rawText).toContain('"Hello"');
    expect(paragraphs[0]?.wordCount).toBeGreaterThan(0);
  });

  test('should preserve HTML when requested', () => {
    const content =
      '<div><h1>Title</h1><p>Content with <em>emphasis</em></p></div>';
    const options: EPUBParseOptions = { preserveHTML: true };

    const processed = processChapterContent(content, options);
    const paragraphs = splitIntoParagraphs(processed);

    expect(processed).toBe(content);
    expect(paragraphs[0]?.rawText).toContain('<div>');
    expect(paragraphs[0]?.rawText).toContain('<em>');
  });
});
