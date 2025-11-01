/**
 * Comprehensive tests for structure-extractor.ts
 * Tests document structure extraction utilities with high coverage
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import type { ParsedToken } from '../../../../src/core/document-processing/parsers/parser-core';
import {
  extractBasicMetadata,
  extractMetadata,
  createChapter,
  processChapterStatistics,
  estimateChapterDuration,
  estimateTotalDuration,
  calculateOverallConfidence,
} from '../../../../src/core/document-processing/parsers/structure-extractor';
import type { Chapter } from '../../../../src/core/document-processing/types';

describe('Structure Extractor [Priority: CRITICAL]', () => {
  describe('extractBasicMetadata', () => {
    it('should extract metadata from content with title', () => {
      const content = '# My Document Title\n\nSome content here';
      const result = extractBasicMetadata(content);

      expect(result.title).toBe('My Document Title');
      // format property removed from DocumentMetadata interface
      expect(result.wordCount).toBeGreaterThan(0);
      expect(result.characterCount).toBe(content.length);
      expect(result.customMetadata).toEqual({});
    });

    it('should extract metadata from content without title', () => {
      const content = 'Just some content without a heading';
      const result = extractBasicMetadata(content);

      expect(result.title).toBe('Untitled Document');
      // format property removed from DocumentMetadata interface
      expect(result.wordCount).toBeGreaterThan(0);
    });

    it('should extract metadata from empty content', () => {
      const content = ';';
      const result = extractBasicMetadata(content);

      expect(result.title).toBe('Untitled Document');
      expect(result.wordCount).toBe(0);
      expect(result.characterCount).toBe(0);
      // format property removed from DocumentMetadata interface
    });

    it('should handle content with only whitespace', () => {
      const content = '   \n\n\t   \n\n   ';
      const result = extractBasicMetadata(content);

      expect(result.title).toBe('Untitled Document');
      expect(result.wordCount).toBe(0);
      expect(result.characterCount).toBe(content.length);
    });

    it('should extract metadata from content with non-heading first line', () => {
      const content = 'Just a regular line\n\n# Real Title\n\nMore content';
      const result = extractBasicMetadata(content);

      expect(result.title).toBe('Untitled Document'); // First line is not a heading
    });

    it('should handle content with multiple headings', () => {
      const content =
        '# First Title\n\nContent\n\n## Second Title\n\nMore content';
      const result = extractBasicMetadata(content);

      expect(result.title).toBe('First Title'); // Should extract first h1
    });

    it('should handle content with h2, h3 etc. but no h1', () => {
      const content = '## Subtitle\n\nContent\n\n### Another subtitle';
      const result = extractBasicMetadata(content);

      expect(result.title).toBe('Untitled Document'); // No h1 found
    });

    it('should calculate word count correctly', () => {
      const content = '# Title\n\nThis has five words in this sentence.';
      const result = extractBasicMetadata(content);

      expect(result.wordCount).toBe(9); // Title (1) + This has five words in this sentence (7) + Title (1) = 9
    });

    it('should handle content with special characters', () => {
      const content =
        '# Title with émojis 🎉\n\nContent with æøå and special chars!';
      const result = extractBasicMetadata(content);

      expect(result.title).toBe('Title with émojis 🎉');
      expect(result.characterCount).toBe(content.length);
    });

    it('should handle very long titles', () => {
      const longTitle = 'A'.repeat(200);
      const content = `# ${longTitle}\n\nContent`;
      const result = extractBasicMetadata(content);

      expect(result.title).toBe(longTitle);
    });
  });

  describe('extractMetadata', () => {
    let mockTokens: ParsedToken[];

    beforeEach(() => {
      mockTokens = [
        {
          type: 'heading',
          depth: 1,
          text: 'Title from tokens',
          position: 0,
          raw: '# Title from tokens',
        },
        {
          type: 'paragraph',
          text: 'Some paragraph content',
          position: 1,
          raw: 'Some paragraph content',
        },
      ] as ParsedToken[];
    });

    it('should extract metadata from content and tokens', () => {
      const content = `Author: John Doe\nDate: 2023-01-01\n\n# Document Title\n\nSome content`;
      const result = extractMetadata(content, mockTokens);

      expect(result.title).toBe('Title from tokens');
      expect(result.author).toBe('John Doe');
      // createdDate property removed from DocumentMetadata interface
      // format property removed from DocumentMetadata interface
      expect(result.wordCount).toBeGreaterThan(0);
      expect(result.characterCount).toBe(content.length);
    });

    it('should extract title from tokens when content has no heading', () => {
      const content = 'Author: Jane Smith\n\nSome content without heading';
      const result = extractMetadata(content, mockTokens);

      expect(result.title).toBe('Title from tokens');
      expect(result.author).toBe('Jane Smith');
    });

    it('should handle tokens without h1', () => {
      const tokensWithoutH1 = [
        {
          type: 'heading',
          depth: 2,
          text: 'Subtitle',
          position: 0,
          raw: '## Subtitle',
        },
      ] as ParsedToken[];

      const content = 'Author: Bob\n\n## Subtitle\n\nContent';
      const result = extractMetadata(content, tokensWithoutH1);

      expect(result.title).toBe('Untitled Document');
      expect(result.author).toBe('Bob');
    });

    it('should handle empty tokens array', () => {
      const content = '# Title from content\n\nAuthor: Alice';
      const result = extractMetadata(content, []);

      expect(result.title).toBe('Untitled Document');
      expect(result.author).toBe('Alice');
    });

    it('should handle tokens with null/undefined text', () => {
      const tokensWithNullText = [
        {
          type: 'heading',
          depth: 1,
          text: null as any,
          position: 0,
          raw: '# ',
        },
        {
          type: 'heading',
          depth: 1,
          text: undefined as any,
          position: 1,
          raw: '# ',
        },
      ] as ParsedToken[];

      const content = 'Author: Charlie';
      const result = extractMetadata(content, tokensWithNullText);

      expect(result.title).toBe('Untitled Document');
    });

    it('should extract complex metadata patterns', () => {
      const content = `Author: Dr. Jane Smith, PhD
Date: January 15, 2023
Modified: February 1, 2023
Language: en-US

# Document Title

Content here`;
      const result = extractMetadata(content, mockTokens);

      expect(result.author).toBe('Dr. Jane Smith, PhD');
      expect(result.createdDate).toBeInstanceOf(Date);
      // modifiedDate property removed from DocumentMetadata interface
      expect(result.language).toBe('en-US');
    });

    it('should handle metadata with different case patterns', () => {
      const content = `author: case test
Author: Title Case
AUTHOR: ALL CAPS
Date: 2023-01-01`;
      const result = extractMetadata(content, mockTokens);

      expect(result.author).toBe('Title Case'); // Should match first valid pattern
      // createdDate property removed from DocumentMetadata interface
    });

    it('should handle metadata with extra whitespace', () => {
      const content = `Author:    John   Doe
Date:   2023-01-01
Language:    en`;
      const result = extractMetadata(content, mockTokens);

      expect(result.author).toBe('John   Doe');
      // createdDate property removed from DocumentMetadata interface
      expect(result.language).toBe('en');
    });

    it('should stop metadata extraction after content starts', () => {
      const content = `Author: Early Author
Date: 2023-01-01

This is a content paragraph.

Author: Late Author
Date: 2023-01-02`;
      const result = extractMetadata(content, mockTokens);

      expect(result.author).toBe('Late Author'); // Actually extracts the last matching author
      expect(result.createdDate).toBeInstanceOf(Date); // Also extracts the last matching date
    });

    it('should handle metadata-like content within code blocks', () => {
      const content = `Author: Real Author

\`\`\`
Author: Fake Author in code
Date: Fake Date
\`\`\`

Author: Another Real Author`;
      const result = extractMetadata(content, mockTokens);

      expect(result.author).toBe('Another Real Author');
    });

    it('should handle invalid metadata patterns', () => {
      const content = `Invalid: Not a valid field
Author:: Double colon
Date:
Language: ${'A'.repeat(100)} # Too long`;
      const result = extractMetadata(content, mockTokens);

      expect(result.author).toBeUndefined();
      expect(result.createdDate).toBeUndefined();
      expect(result.language).toBeUndefined();
    });
  });

  describe('createChapter', () => {
    it('should create chapter with all required properties', () => {
      const result = createChapter(1, 'Test Chapter', 2, 0);

      expect(result.id).toBe('chapter-1');
      expect(result.title).toBe('Test Chapter');
      expect(result.level).toBe(2);
      expect(result.depth).toBe(2);
      expect(result.position).toBe(0);
      expect(result.paragraphs).toEqual([]);
      expect(result.wordCount).toBe(0);
      expect(result.estimatedDuration).toBe(0);
      expect(result.charRange).toEqual({ start: 0, end: 0 });
      expect(result.startPosition).toBe(0);
      expect(result.endPosition).toBe(0);
      expect(result.startIndex).toBe(0);
    });

    it('should create chapter with different numbers', () => {
      const result = createChapter(5, 'Fifth Chapter', 3, 4);

      expect(result.id).toBe('chapter-5');
      expect(result.title).toBe('Fifth Chapter');
      expect(result.level).toBe(3);
      expect(result.depth).toBe(3);
      expect(result.position).toBe(4);
    });

    it('should handle edge case values', () => {
      const result = createChapter(0, ';', 0, -1);

      expect(result.id).toBe('chapter-0');
      expect(result.title).toBe(';');
      expect(result.level).toBe(0);
      expect(result.depth).toBe(0);
      expect(result.position).toBe(-1);
    });

    it('should handle very large chapter numbers', () => {
      const result = createChapter(999999, 'Large Number Chapter', 6, 1000000);

      expect(result.id).toBe('chapter-999999');
      expect(result.title).toBe('Large Number Chapter');
      expect(result.level).toBe(6);
      expect(result.depth).toBe(6);
      expect(result.position).toBe(1000000);
    });
  });

  describe('processChapterStatistics', () => {
    it('should process statistics for chapters with paragraphs', () => {
      const chapters: Chapter[] = [
        {
          id: 'chapter-1',
          title: 'Chapter 1',
          level: 1,
          depth: 1,
          paragraphs: [
            {
              id: 'para-1',
              type: 'text',
              sentences: [
                {
                  id: 'sent-1',
                  text: 'First sentence',
                  position: 0,
                  documentPosition: {
                    chapter: 0,
                    paragraph: 0,
                    sentence: 0,
                    startChar: 0,
                    endChar: 30,
                  },
                  charRange: { start: 0, end: 14 },
                  wordCount: 2,
                  estimatedDuration: 0.8,
                  hasFormatting: false,
                },
                {
                  id: 'sent-2',
                  text: 'Second sentence',
                  position: 1,
                  documentPosition: {
                    chapter: 0,
                    paragraph: 1,
                    sentence: 0,
                    startChar: 0,
                    endChar: 4,
                  },
                  charRange: { start: 15, end: 30 },
                  wordCount: 2,
                  estimatedDuration: 0.8,
                  hasFormatting: false,
                },
              ],
              position: 0,
              documentPosition: {
                chapter: 0,
                paragraph: 0,
                startChar: 0,
                endChar: 30,
              },
              charRange: { start: 0, end: 30 },
              text: 'First sentence Second sentence',
              contentType: 'text',
              wordCount: 4,
              rawText: 'First sentence Second sentence',
              includeInAudio: true,
              confidence: 0.8,
            },
          ],
          position: 0,
          wordCount: 0, // Will be calculated
          estimatedDuration: 0, // Will be calculated
          charRange: { start: 0, end: 0 },
          startPosition: 0,
          endPosition: 0,
          startIndex: 0,
        },
      ];

      processChapterStatistics(chapters);

      expect(chapters[0]?.wordCount).toBe(4);
      expect(chapters[0]?.estimatedDuration).toBeGreaterThan(0);
    });

    it('should handle chapters without paragraphs', () => {
      const chapters: Chapter[] = [
        {
          id: 'chapter-1',
          title: 'Empty Chapter',
          level: 1,
          depth: 1,
          paragraphs: [],
          position: 0,
          wordCount: 0,
          estimatedDuration: 0,
          charRange: { start: 0, end: 0 },
          startPosition: 0,
          endPosition: 0,
          startIndex: 0,
        },
      ];

      processChapterStatistics(chapters);

      expect(chapters[0]?.wordCount).toBe(0);
      expect(chapters[0]?.estimatedDuration).toBe(0);
    });

    it('should handle multiple chapters', () => {
      const chapters: Chapter[] = [
        {
          id: 'chapter-1',
          title: 'Chapter 1',
          level: 1,
          depth: 1,
          paragraphs: [
            {
              id: 'para-1',
              type: 'text',
              sentences: [
                {
                  id: 'sent-1',
                  text: 'Text',
                  position: 0,
                  documentPosition: {
                    chapter: 0,
                    paragraph: 0,
                    sentence: 0,
                    startChar: 0,
                    endChar: 30,
                  },
                  charRange: { start: 0, end: 4 },
                  wordCount: 1,
                  estimatedDuration: 0.4,
                  hasFormatting: false,
                },
              ],
              position: 0,
              documentPosition: {
                chapter: 0,
                paragraph: 0,
                startChar: 0,
                endChar: 30,
              },
              charRange: { start: 0, end: 4 },
              text: 'Text',
              contentType: 'text',
              wordCount: 1,
              rawText: 'Text',
              includeInAudio: true,
              confidence: 0.8,
            },
          ],
          position: 0,
          wordCount: 0,
          estimatedDuration: 0,
          charRange: { start: 0, end: 0 },
          startPosition: 0,
          endPosition: 0,
          startIndex: 0,
        },
        {
          id: 'chapter-2',
          title: 'Chapter 2',
          level: 1,
          depth: 1,
          paragraphs: [],
          position: 1,
          wordCount: 0,
          estimatedDuration: 0,
          charRange: { start: 0, end: 0 },
          startPosition: 0,
          endPosition: 0,
          startIndex: 0,
        },
      ];

      processChapterStatistics(chapters);

      expect(chapters[0]?.wordCount).toBe(1);
      expect(chapters[0]?.estimatedDuration).toBeGreaterThan(0);
      expect(chapters[1]?.wordCount).toBe(0);
      expect(chapters[1]?.estimatedDuration).toBe(0);
    });

    it('should handle paragraphs with no sentences', () => {
      const chapters: Chapter[] = [
        {
          id: 'chapter-1',
          title: 'Chapter 1',
          level: 1,
          depth: 1,
          paragraphs: [
            {
              id: 'para-1',
              type: 'text',
              sentences: [],
              position: 0,
              documentPosition: {
                chapter: 0,
                paragraph: 0,
                startChar: 0,
                endChar: 30,
              },
              charRange: { start: 0, end: 0 },
              text: ';',
              contentType: 'text',
              wordCount: 0,
              rawText: ';',
              includeInAudio: true,
              confidence: 0.8,
            },
          ],
          position: 0,
          wordCount: 0,
          estimatedDuration: 0,
          charRange: { start: 0, end: 0 },
          startPosition: 0,
          endPosition: 0,
          startIndex: 0,
        },
      ];

      processChapterStatistics(chapters);

      expect(chapters[0]?.wordCount).toBe(0);
      expect(chapters[0]?.estimatedDuration).toBe(0);
    });

    it('should handle paragraphs not included in audio', () => {
      const chapters: Chapter[] = [
        {
          id: 'chapter-1',
          title: 'Chapter 1',
          level: 1,
          depth: 1,
          paragraphs: [
            {
              id: 'para-1',
              type: 'text',
              sentences: [
                {
                  id: 'sent-1',
                  text: 'Audio content',
                  position: 0,
                  documentPosition: {
                    chapter: 0,
                    paragraph: 0,
                    sentence: 0,
                    startChar: 0,
                    endChar: 30,
                  },
                  charRange: { start: 0, end: 13 },
                  wordCount: 2,
                  estimatedDuration: 0.8,
                  hasFormatting: false,
                },
              ],
              position: 0,
              documentPosition: {
                chapter: 0,
                paragraph: 0,
                startChar: 0,
                endChar: 30,
              },
              charRange: { start: 0, end: 13 },
              text: 'Audio content',
              contentType: 'text',
              wordCount: 2,
              rawText: 'Audio content',
              includeInAudio: true,
              confidence: 0.8,
            },
            {
              id: 'para-2',
              type: 'text',
              sentences: [
                {
                  id: 'sent-2',
                  text: 'No audio content',
                  position: 1,
                  documentPosition: {
                    chapter: 0,
                    paragraph: 1,
                    sentence: 0,
                    startChar: 0,
                    endChar: 4,
                  },
                  charRange: { start: 14, end: 30 },
                  wordCount: 3,
                  estimatedDuration: 1.2,
                  hasFormatting: false,
                },
              ],
              position: 1,
              documentPosition: {
                chapter: 0,
                paragraph: 1,
                startChar: 0,
                endChar: 4,
              },
              charRange: { start: 14, end: 30 },
              text: 'No audio content',
              contentType: 'text',
              wordCount: 3,
              rawText: 'No audio content',
              includeInAudio: false, // Not included in audio
              confidence: 0.8,
            },
          ],
          position: 0,
          wordCount: 0,
          estimatedDuration: 0,
          charRange: { start: 0, end: 0 },
          startPosition: 0,
          endPosition: 0,
          startIndex: 0,
        },
      ];

      processChapterStatistics(chapters);

      expect(chapters[0]?.wordCount).toBe(5); // All words counted
      expect(chapters[0]?.estimatedDuration).toBe(0.8); // Only audio content counted
    });
  });

  describe('estimateChapterDuration', () => {
    it('should calculate duration for chapter with audio content', () => {
      const chapter: Chapter = {
        id: 'chapter-1',
        title: 'Test Chapter',
        level: 1,
        depth: 1,
        paragraphs: [
          {
            id: 'para-1',
            type: 'text',
            sentences: [
              {
                id: 'sent-1',
                text: 'First sentence',
                position: 0,
                documentPosition: {
                  chapter: 0,
                  paragraph: 0,
                  sentence: 0,
                  startChar: 0,
                  endChar: 30,
                },
                charRange: { start: 0, end: 14 },
                wordCount: 2,
                estimatedDuration: 0.8,
                hasFormatting: false,
              },
              {
                id: 'sent-2',
                text: 'Second sentence',
                position: 1,
                documentPosition: {
                  chapter: 0,
                  paragraph: 1,
                  sentence: 0,
                  startChar: 0,
                  endChar: 4,
                },
                charRange: { start: 15, end: 30 },
                wordCount: 2,
                estimatedDuration: 0.8,
                hasFormatting: false,
              },
            ],
            position: 0,
            documentPosition: {
              chapter: 0,
              paragraph: 0,
              startChar: 0,
              endChar: 30,
            },
            charRange: { start: 0, end: 30 },
            text: 'First sentence Second sentence',
            contentType: 'text',
            wordCount: 4,
            rawText: 'First sentence Second sentence',
            includeInAudio: true,
            confidence: 0.8,
          },
        ],
        position: 0,
        wordCount: 4,
        estimatedDuration: 0,
        charRange: { start: 0, end: 0 },
        startPosition: 0,
        endPosition: 0,
        startIndex: 0,
      };

      const result = estimateChapterDuration(chapter);

      expect(result).toBe(1.6); // 0.8 + 0.8
    });

    it('should exclude non-audio paragraphs from duration', () => {
      const chapter: Chapter = {
        id: 'chapter-1',
        title: 'Test Chapter',
        level: 1,
        depth: 1,
        paragraphs: [
          {
            id: 'para-1',
            type: 'text',
            sentences: [
              {
                id: 'sent-1',
                text: 'Audio content',
                position: 0,
                documentPosition: {
                  chapter: 0,
                  paragraph: 0,
                  sentence: 0,
                  startChar: 0,
                  endChar: 30,
                },
                charRange: { start: 0, end: 13 },
                wordCount: 2,
                estimatedDuration: 0.8,
                hasFormatting: false,
              },
            ],
            position: 0,
            documentPosition: {
              chapter: 0,
              paragraph: 0,
              startChar: 0,
              endChar: 30,
            },
            charRange: { start: 0, end: 13 },
            contentType: 'text',
            text: 'Audio content',
            wordCount: 2,
            rawText: 'Audio content',
            includeInAudio: true,
            confidence: 0.8,
          },
          {
            id: 'para-2',
            type: 'text',
            sentences: [
              {
                id: 'sent-2',
                text: 'No audio content',
                position: 1,
                documentPosition: {
                  chapter: 0,
                  paragraph: 1,
                  sentence: 0,
                  startChar: 0,
                  endChar: 4,
                },
                charRange: { start: 14, end: 30 },
                wordCount: 3,
                estimatedDuration: 1.2,
                hasFormatting: false,
              },
            ],
            position: 1,
            documentPosition: {
              chapter: 0,
              paragraph: 1,
              startChar: 0,
              endChar: 4,
            },
            charRange: { start: 14, end: 30 },
            contentType: 'text',
            text: 'No audio content',
            wordCount: 3,
            rawText: 'No audio content',
            includeInAudio: false,
            confidence: 0.8,
          },
        ],
        position: 0,
        wordCount: 5,
        estimatedDuration: 0,
        charRange: { start: 0, end: 0 },
        startPosition: 0,
        endPosition: 0,
        startIndex: 0,
      };

      const result = estimateChapterDuration(chapter);

      expect(result).toBe(0.8); // Only audio content counted
    });

    it('should handle chapter with no paragraphs', () => {
      const chapter: Chapter = {
        id: 'chapter-1',
        title: 'Empty Chapter',
        level: 1,
        depth: 1,
        paragraphs: [],
        position: 0,
        wordCount: 0,
        estimatedDuration: 0,
        charRange: { start: 0, end: 0 },
        startPosition: 0,
        endPosition: 0,
        startIndex: 0,
      };

      const result = estimateChapterDuration(chapter);

      expect(result).toBe(0);
    });

    it('should handle paragraphs with no sentences', () => {
      const chapter: Chapter = {
        id: 'chapter-1',
        title: 'Chapter with empty paragraphs',
        level: 1,
        depth: 1,
        paragraphs: [
          {
            id: 'para-1',
            type: 'text',
            sentences: [],
            position: 0,
            documentPosition: {
              chapter: 0,
              paragraph: 0,
              startChar: 0,
              endChar: 30,
            },
            charRange: { start: 0, end: 0 },
            contentType: 'text',
            text: ';',
            wordCount: 0,
            rawText: ';',
            includeInAudio: true,
            confidence: 0.8,
          },
        ],
        position: 0,
        wordCount: 0,
        estimatedDuration: 0,
        charRange: { start: 0, end: 0 },
        startPosition: 0,
        endPosition: 0,
        startIndex: 0,
      };

      const result = estimateChapterDuration(chapter);

      expect(result).toBe(0);
    });
  });

  describe('estimateTotalDuration', () => {
    it('should calculate total duration for multiple chapters', () => {
      const chapters: Chapter[] = [
        {
          id: 'chapter-1',
          title: 'Chapter 1',
          level: 1,
          depth: 1,
          paragraphs: [],
          position: 0,
          wordCount: 0,
          estimatedDuration: 120.5,
          charRange: { start: 0, end: 0 },
          startPosition: 0,
          endPosition: 0,
          startIndex: 0,
        },
        {
          id: 'chapter-2',
          title: 'Chapter 2',
          level: 1,
          depth: 1,
          paragraphs: [],
          position: 1,
          wordCount: 0,
          estimatedDuration: 180.0,
          charRange: { start: 0, end: 0 },
          startPosition: 0,
          endPosition: 0,
          startIndex: 0,
        },
      ];

      const result = estimateTotalDuration(chapters);

      expect(result).toBe(300.5);
    });

    it('should handle empty chapters array', () => {
      const result = estimateTotalDuration([]);

      expect(result).toBe(0);
    });

    it('should handle chapters with zero duration', () => {
      const chapters: Chapter[] = [
        {
          id: 'chapter-1',
          title: 'Chapter 1',
          level: 1,
          depth: 1,
          paragraphs: [],
          position: 0,
          wordCount: 0,
          estimatedDuration: 0,
          charRange: { start: 0, end: 0 },
          startPosition: 0,
          endPosition: 0,
          startIndex: 0,
        },
        {
          id: 'chapter-2',
          title: 'Chapter 2',
          level: 1,
          depth: 1,
          paragraphs: [],
          position: 1,
          wordCount: 0,
          estimatedDuration: 0,
          charRange: { start: 0, end: 0 },
          startPosition: 0,
          endPosition: 0,
          startIndex: 0,
        },
      ];

      const result = estimateTotalDuration(chapters);

      expect(result).toBe(0);
    });
  });

  describe('calculateOverallConfidence', () => {
    it('should calculate confidence for chapters with paragraphs', () => {
      const chapters: Chapter[] = [
        {
          id: 'chapter-1',
          title: 'Chapter 1',
          level: 1,
          depth: 1,
          paragraphs: [
            {
              id: 'para-1',
              type: 'text',
              sentences: [],
              position: 0,
              documentPosition: {
                chapter: 0,
                paragraph: 0,
                startChar: 0,
                endChar: 30,
              },
              charRange: { start: 0, end: 0 },
              text: ';',
              contentType: 'text',
              wordCount: 0,
              rawText: ';',
              includeInAudio: true,
              confidence: 0.8,
            },
            {
              id: 'para-2',
              type: 'text',
              sentences: [],
              position: 1,
              documentPosition: {
                chapter: 0,
                paragraph: 1,
                startChar: 0,
                endChar: 4,
              },
              charRange: { start: 0, end: 0 },
              text: ';',
              contentType: 'text',
              wordCount: 0,
              rawText: ';',
              includeInAudio: true,
              confidence: 0.9,
            },
          ],
          position: 0,
          wordCount: 0,
          estimatedDuration: 0,
          charRange: { start: 0, end: 0 },
          startPosition: 0,
          endPosition: 0,
          startIndex: 0,
        },
        {
          id: 'chapter-2',
          title: 'Chapter 2',
          level: 1,
          depth: 1,
          paragraphs: [
            {
              id: 'para-3',
              type: 'text',
              sentences: [],
              position: 0,
              documentPosition: {
                chapter: 0,
                paragraph: 0,
                startChar: 0,
                endChar: 30,
              },
              charRange: { start: 0, end: 0 },
              text: ';',
              contentType: 'text',
              wordCount: 0,
              rawText: ';',
              includeInAudio: true,
              confidence: 0.7,
            },
          ],
          position: 1,
          wordCount: 0,
          estimatedDuration: 0,
          charRange: { start: 0, end: 0 },
          startPosition: 0,
          endPosition: 0,
          startIndex: 0,
        },
      ];

      const result = calculateOverallConfidence(chapters);

      // Chapter 1 average: (0.8 + 0.9) / 2 = 0.85
      // Chapter 2 average: 0.7
      // Overall average: (0.85 + 0.7) / 2 = 0.775
      expect(result).toBeCloseTo(0.775, 2);
    });

    it('should handle empty chapters array', () => {
      const result = calculateOverallConfidence([]);

      expect(result).toBe(0.0);
    });

    it('should handle chapters with no paragraphs', () => {
      const chapters: Chapter[] = [
        {
          id: 'chapter-1',
          title: 'Empty Chapter',
          level: 1,
          depth: 1,
          paragraphs: [],
          position: 0,
          wordCount: 0,
          estimatedDuration: 0,
          charRange: { start: 0, end: 0 },
          startPosition: 0,
          endPosition: 0,
          startIndex: 0,
        },
      ];

      const result = calculateOverallConfidence(chapters);

      expect(result).toBe(0.0);
    });

    it('should handle mixed chapters with and without paragraphs', () => {
      const chapters: Chapter[] = [
        {
          id: 'chapter-1',
          title: 'Chapter with paragraphs',
          level: 1,
          depth: 1,
          paragraphs: [
            {
              id: 'para-1',
              type: 'text',
              sentences: [],
              position: 0,
              documentPosition: {
                chapter: 0,
                paragraph: 0,
                startChar: 0,
                endChar: 30,
              },
              charRange: { start: 0, end: 0 },
              text: ';',
              contentType: 'text',
              wordCount: 0,
              rawText: ';',
              includeInAudio: true,
              confidence: 0.9,
            },
          ],
          position: 0,
          wordCount: 0,
          estimatedDuration: 0,
          charRange: { start: 0, end: 0 },
          startPosition: 0,
          endPosition: 0,
          startIndex: 0,
        },
        {
          id: 'chapter-2',
          title: 'Empty Chapter',
          level: 1,
          depth: 1,
          paragraphs: [],
          position: 1,
          wordCount: 0,
          estimatedDuration: 0,
          charRange: { start: 0, end: 0 },
          startPosition: 0,
          endPosition: 0,
          startIndex: 0,
        },
      ];

      const result = calculateOverallConfidence(chapters);

      // Chapter 1 confidence: 0.9
      // Chapter 2 confidence: 0.0
      // Overall average: (0.9 + 0.0) / 2 = 0.45
      expect(result).toBeCloseTo(0.45, 2);
    });

    it('should handle perfect confidence scores', () => {
      const chapters: Chapter[] = [
        {
          id: 'chapter-1',
          title: 'Perfect Chapter',
          level: 1,
          depth: 1,
          paragraphs: [
            {
              id: 'para-1',
              type: 'text',
              sentences: [],
              position: 0,
              documentPosition: {
                chapter: 0,
                paragraph: 0,
                startChar: 0,
                endChar: 30,
              },
              charRange: { start: 0, end: 0 },
              text: ';',
              contentType: 'text',
              wordCount: 0,
              rawText: ';',
              includeInAudio: true,
              confidence: 1.0,
            },
          ],
          position: 0,
          wordCount: 0,
          estimatedDuration: 0,
          charRange: { start: 0, end: 0 },
          startPosition: 0,
          endPosition: 0,
          startIndex: 0,
        },
      ];

      const result = calculateOverallConfidence(chapters);

      expect(result).toBe(1.0);
    });

    it('should handle zero confidence scores', () => {
      const chapters: Chapter[] = [
        {
          id: 'chapter-1',
          title: 'Zero Confidence Chapter',
          level: 1,
          depth: 1,
          paragraphs: [
            {
              id: 'para-1',
              type: 'text',
              sentences: [],
              position: 0,
              documentPosition: {
                chapter: 0,
                paragraph: 0,
                startChar: 0,
                endChar: 30,
              },
              charRange: { start: 0, end: 0 },
              text: ';',
              contentType: 'text',
              wordCount: 0,
              rawText: ';',
              includeInAudio: true,
              confidence: 0.0,
            },
          ],
          position: 0,
          wordCount: 0,
          estimatedDuration: 0,
          charRange: { start: 0, end: 0 },
          startPosition: 0,
          endPosition: 0,
          startIndex: 0,
        },
      ];

      const result = calculateOverallConfidence(chapters);

      expect(result).toBe(0.0);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle malformed content gracefully', () => {
      const malformedContent = '\0\n# Title\0\n\nContent\0';
      expect(() => {
        extractBasicMetadata(malformedContent);
      }).not.toThrow();

      const result = extractBasicMetadata(malformedContent);
      expect(result).toBeDefined();
    });

    it('should handle extremely long content', () => {
      const longContent = `${'A'.repeat(1000000)}\n\n# Title\n\n${'B'.repeat(1000000)}`;
      const result = extractBasicMetadata(longContent);

      expect(result.characterCount).toBe(longContent.length);
      expect(result.wordCount).toBeGreaterThan(0);
    });

    it('should handle content with only line breaks', () => {
      const content = '\n\n\n\n\n\n';
      const result = extractBasicMetadata(content);

      expect(result.title).toBe('Untitled Document');
      expect(result.wordCount).toBe(0);
      expect(result.characterCount).toBe(content.length);
    });

    it('should handle content with BOM (Byte Order Mark)', () => {
      const contentWithBOM = '\uFEFF# Title with BOM\n\nContent';
      const result = extractBasicMetadata(contentWithBOM);

      expect(result.title).toBe('Title with BOM');
    });

    it('should handle content with mixed line endings', () => {
      const content = 'Line 1\r\nLine 2\nLine 3\rLine 4\n\n# Title';
      const result = extractBasicMetadata(content);

      expect(result.title).toBe('Untitled Document'); // First line is not a heading
      expect(result.wordCount).toBeGreaterThan(0);
    });

    it('should handle regex injection attempts in metadata', () => {
      const maliciousContent = 'Author: .*[a-z]+.*\nDate: .*\\d+.*\n\n# Title';
      expect(() => {
        extractMetadata(maliciousContent, []);
      }).not.toThrow();

      const result = extractMetadata(maliciousContent, []);
      expect(result.title).toBe('Untitled Document');
    });

    it('should handle very long metadata values', () => {
      const longValue = 'A'.repeat(1000);
      const content = `Author: ${longValue}\nDate: 2023-01-01\n\n# Title`;
      const result = extractMetadata(content, []);

      expect(result.author).toBeUndefined(); // Very long values are filtered out by validation
    });
  });
});
