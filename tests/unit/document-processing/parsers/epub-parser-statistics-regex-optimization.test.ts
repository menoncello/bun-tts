/**
 * EPUB Parser Statistics Regex Optimization Tests
 *
 * Tests for the optimized media element counting functionality with pre-compiled regex patterns
 */

import { describe, test, expect, beforeEach } from 'bun:test';
import { calculateStatistics } from '../../../../src/core/document-processing/parsers/epub-parser-statistics.js';
import type { Chapter } from '../../../../src/core/document-processing/types.js';

describe('EPUB Parser Statistics - Regex Optimization', () => {
  let mockChapters: Chapter[];

  beforeEach(() => {
    // Create mock chapters with various media content
    mockChapters = [
      {
        id: 'chapter-1',
        title: 'Chapter 1',
        level: 1,
        paragraphs: [
          {
            id: 'para-1',
            type: 'text',
            sentences: [
              {
                id: 'sent-1',
                text: 'This is a paragraph with an image.',
                position: 0,
                wordCount: 6,
                estimatedDuration: 2,
                hasFormatting: false,
              },
            ],
            position: 0,
            wordCount: 6,
            rawText:
              '<p>This is a paragraph with an <img src="image1.jpg" alt="test"> image.</p>',
            includeInAudio: true,
            confidence: 1,
            text: 'This is a paragraph with an image.',
          },
          {
            id: 'para-2',
            type: 'text',
            sentences: [
              {
                id: 'sent-2',
                text: 'This paragraph has a table.',
                position: 0,
                wordCount: 5,
                estimatedDuration: 1.5,
                hasFormatting: false,
              },
            ],
            position: 1,
            wordCount: 5,
            rawText:
              '<p>This paragraph has a <table border="1"><tr><td>content</td></tr></table>.</p>',
            includeInAudio: true,
            confidence: 1,
            text: 'This paragraph has a table.',
          },
        ],
        position: 0,
        wordCount: 13,
        estimatedDuration: 3.5,
        startPosition: 0,
        endPosition: 62,
        startIndex: 0,
      },
      {
        id: 'chapter-2',
        title: 'Chapter 2',
        level: 1,
        paragraphs: [
          {
            id: 'para-3',
            type: 'text',
            sentences: [
              {
                id: 'sent-3',
                text: 'Multiple images here.',
                position: 0,
                wordCount: 3,
                estimatedDuration: 1,
                hasFormatting: false,
              },
            ],
            position: 0,
            wordCount: 3,
            rawText:
              '<p>Multiple <img src="img1.png"> images <img src="img2.jpg"> here.</p>',
            includeInAudio: true,
            confidence: 1,
            text: 'Multiple images here.',
          },
          {
            id: 'para-4',
            type: 'text',
            sentences: [
              {
                id: 'sent-4',
                text: 'Nested tables.',
                position: 0,
                wordCount: 2,
                estimatedDuration: 0.8,
                hasFormatting: false,
              },
            ],
            position: 1,
            wordCount: 2,
            rawText:
              '<p>Nested <table><tr><td><table><tr><td>inner</td></tr></table></td></tr></table>.</p>',
            includeInAudio: true,
            confidence: 1,
            text: 'Nested tables.',
          },
        ],
        position: 1,
        wordCount: 5,
        estimatedDuration: 1.8,
        startPosition: 63,
        endPosition: 100,
        startIndex: 63,
      },
    ];
  });

  test('should correctly count images using optimized regex', () => {
    const stats = calculateStatistics(mockChapters);

    // Expected images: 1 in chapter 1, 2 in chapter 2 = 3 total
    expect(stats.imageCount).toBe(3);
  });

  test('should correctly count tables using optimized regex', () => {
    const stats = calculateStatistics(mockChapters);

    // Expected tables: 1 in chapter 1, 2 nested tables in chapter 2 = 3 total
    expect(stats.tableCount).toBe(3);
  });

  test('should handle chapters with no media content', () => {
    const chaptersWithoutMedia: Chapter[] = [
      {
        id: 'chapter-1',
        title: 'Chapter 1',
        level: 1,
        paragraphs: [
          {
            id: 'para-1',
            type: 'text',
            sentences: [
              {
                id: 'sent-1',
                text: 'Just plain text.',
                position: 0,
                wordCount: 3,
                estimatedDuration: 1,
                hasFormatting: false,
              },
            ],
            position: 0,
            wordCount: 3,
            rawText: '<p>Just plain text.</p>',
            includeInAudio: true,
            confidence: 1,
            text: 'Just plain text.',
          },
        ],
        position: 0,
        wordCount: 3,
        estimatedDuration: 1,
        startPosition: 0,
        endPosition: 16,
        startIndex: 0,
      },
    ];

    const stats = calculateStatistics(chaptersWithoutMedia);

    expect(stats.imageCount).toBe(0);
    expect(stats.tableCount).toBe(0);
  });

  test('should handle empty rawText gracefully', () => {
    const chaptersWithEmptyRawText: Chapter[] = [
      {
        id: 'chapter-1',
        title: 'Chapter 1',
        level: 1,
        paragraphs: [
          {
            id: 'para-1',
            type: 'text',
            sentences: [
              {
                id: 'sent-1',
                text: 'Empty raw text.',
                position: 0,
                wordCount: 3,
                estimatedDuration: 1,
                hasFormatting: false,
              },
            ],
            position: 0,
            wordCount: 3,
            rawText: '', // Empty rawText
            includeInAudio: true,
            confidence: 1,
            text: 'Empty raw text.',
          },
          {
            id: 'para-2',
            type: 'text',
            sentences: [
              {
                id: 'sent-2',
                text: 'Null raw text.',
                position: 0,
                wordCount: 3,
                estimatedDuration: 1,
                hasFormatting: false,
              },
            ],
            position: 1,
            wordCount: 3,
            rawText: null as any, // Null rawText
            includeInAudio: true,
            confidence: 1,
            text: 'Null raw text.',
          },
        ],
        position: 0,
        wordCount: 6,
        estimatedDuration: 2,
        startPosition: 0,
        endPosition: 32,
        startIndex: 0,
      },
    ];

    const stats = calculateStatistics(chaptersWithEmptyRawText);

    expect(stats.imageCount).toBe(0);
    expect(stats.tableCount).toBe(0);
  });

  test('should handle large content efficiently', () => {
    // Create a large chapter with many images and tables
    const largeChapter: Chapter = {
      id: 'large-chapter',
      title: 'Large Chapter',
      level: 1,
      paragraphs: [],
      position: 0,
      wordCount: 0,
      estimatedDuration: 0,
      startPosition: 0,
      endPosition: 0,
      startIndex: 0,
    };

    // Add 100 paragraphs with images and tables
    for (let i = 0; i < 100; i++) {
      largeChapter.paragraphs.push({
        id: `para-${i}`,
        type: 'text',
        sentences: [
          {
            id: `sent-${i}`,
            text: `Paragraph ${i} with media.`,
            position: 0,
            wordCount: 5,
            estimatedDuration: 1.5,
            hasFormatting: false,
          },
        ],
        position: i,
        wordCount: 5,
        rawText: `<p>Paragraph ${i} with <img src="img${i}.jpg"> and <table><tr><td>data${i}</td></tr></table>.</p>`,
        includeInAudio: true,
        confidence: 1,
        text: `Paragraph ${i} with media.`,
      });
    }

    // Update total word count and estimated duration
    largeChapter.wordCount = largeChapter.paragraphs.reduce(
      (sum, p) => sum + p.wordCount,
      0
    );
    largeChapter.estimatedDuration = largeChapter.paragraphs.reduce(
      (sum, p) => sum + (p.sentences[0]?.estimatedDuration || 0),
      0
    );
    largeChapter.endPosition = largeChapter.paragraphs.length * 30;

    const startTime = Date.now();
    const stats = calculateStatistics([largeChapter]);
    const endTime = Date.now();

    // Should process 100 images and 100 tables efficiently
    expect(stats.imageCount).toBe(100);
    expect(stats.tableCount).toBe(100);

    // Performance check: should complete within reasonable time (100ms for 100 paragraphs)
    expect(endTime - startTime).toBeLessThan(100);
  });

  test('should handle case-insensitive media tags', () => {
    const chaptersWithMixedCase: Chapter[] = [
      {
        id: 'chapter-1',
        title: 'Chapter 1',
        level: 1,
        paragraphs: [
          {
            id: 'para-1',
            type: 'text',
            sentences: [
              {
                id: 'sent-1',
                text: 'Mixed case tags.',
                position: 0,
                wordCount: 3,
                estimatedDuration: 1,
                hasFormatting: false,
              },
            ],
            position: 0,
            wordCount: 3,
            rawText:
              '<p>Mixed case <IMG src="img1.jpg"> and <Table border="1"><tr><td>content</td></tr></Table>.</p>',
            includeInAudio: true,
            confidence: 1,
            text: 'Mixed case tags.',
          },
        ],
        position: 0,
        wordCount: 3,
        estimatedDuration: 1,
        startPosition: 0,
        endPosition: 17,
        startIndex: 0,
      },
    ];

    const stats = calculateStatistics(chaptersWithMixedCase);

    expect(stats.imageCount).toBe(1);
    expect(stats.tableCount).toBe(1);
  });

  test('should handle malformed media tags gracefully', () => {
    const chaptersWithMalformedTags: Chapter[] = [
      {
        id: 'chapter-1',
        title: 'Chapter 1',
        level: 1,
        paragraphs: [
          {
            id: 'para-1',
            type: 'text',
            sentences: [
              {
                id: 'sent-1',
                text: 'Malformed tags.',
                position: 0,
                wordCount: 2,
                estimatedDuration: 0.8,
                hasFormatting: false,
              },
            ],
            position: 0,
            wordCount: 2,
            rawText:
              '<p>Malformed <img src="img1.jpg" and <table><tr><td>incomplete table</td></tr>.',
            includeInAudio: true,
            confidence: 1,
            text: 'Malformed tags.',
          },
        ],
        position: 0,
        wordCount: 2,
        estimatedDuration: 0.8,
        startPosition: 0,
        endPosition: 15,
        startIndex: 0,
      },
    ];

    const stats = calculateStatistics(chaptersWithMalformedTags);

    // Should count malformed tags that match the basic pattern
    expect(stats.imageCount).toBe(1);
    expect(stats.tableCount).toBe(1);
  });

  test('should correctly calculate other statistics alongside media counts', () => {
    const stats = calculateStatistics(mockChapters);

    // Verify other statistics are still calculated correctly
    expect(stats.totalParagraphs).toBe(4);
    expect(stats.totalSentences).toBe(4);
    expect(stats.totalWords).toBe(18);
    expect(stats.chapterCount).toBe(2);
    expect(stats.estimatedReadingTime).toBeGreaterThan(0);
  });

  test('should handle regex lastIndex reset correctly across multiple calls', () => {
    // Test that the pre-compiled regex patterns work correctly across multiple function calls
    const stats1 = calculateStatistics(mockChapters);
    const stats2 = calculateStatistics(mockChapters);

    // Both calls should return the same results
    expect(stats1.imageCount).toBe(stats2.imageCount);
    expect(stats1.tableCount).toBe(stats2.tableCount);
    expect(stats1.imageCount).toBe(3);
    expect(stats1.tableCount).toBe(3);
  });
});
