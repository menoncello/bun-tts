import { describe, test, expect } from 'bun:test';
import {
  WORD_DURATION_SECONDS,
  DEFAULT_PARAGRAPH_CONFIDENCE,
  convertSentenceToFormat,
  processParagraphSentences,
  calculateParagraphStats,
  convertParagraphToFormat,
  calculateParagraphsDuration,
  convertChapterDataToChapter,
  calculateStatistics,
  calculateStatisticsFromChapters,
  calculateEstimatedDuration,
  calculateEstimatedDurationFromChapters,
  type ChapterData,
} from '../../../../src/core/document-processing/parsers/document-utils.js';
import type { Chapter } from '../../../../src/core/document-processing/types.js';

describe('Document Utils', () => {
  describe('Constants', () => {
    test('should have correct constants defined', () => {
      expect(WORD_DURATION_SECONDS).toBe(0.4);
      expect(DEFAULT_PARAGRAPH_CONFIDENCE).toBe(0.8);
    });
  });

  describe('convertSentenceToFormat', () => {
    test('should convert string sentence correctly', () => {
      const sentence = 'This is a test sentence.';
      const result = convertSentenceToFormat(sentence, 0, 'paragraph-1');

      expect(result).toEqual({
        id: 'paragraph-1-sentence-1',
        text: 'This is a test sentence.',
        position: 0,
        wordCount: 5,
        estimatedDuration: 5 * WORD_DURATION_SECONDS,
        hasFormatting: false,
      });
    });

    test('should convert non-string sentence to string', () => {
      const sentence = 123;
      const result = convertSentenceToFormat(sentence, 1, 'paragraph-2');

      expect(result).toEqual({
        id: 'paragraph-2-sentence-2',
        text: '123',
        position: 1,
        wordCount: 1,
        estimatedDuration: 1 * WORD_DURATION_SECONDS,
        hasFormatting: false,
      });
    });

    test('should handle empty sentence', () => {
      const sentence = '';
      const result = convertSentenceToFormat(sentence, 0, 'paragraph-empty');

      expect(result).toEqual({
        id: 'paragraph-empty-sentence-1',
        text: '',
        position: 0,
        wordCount: 0,
        estimatedDuration: 0,
        hasFormatting: false,
      });
    });

    test('should handle sentence with multiple spaces', () => {
      const sentence = 'Word1    word2     word3';
      const result = convertSentenceToFormat(sentence, 0, 'paragraph-spaces');

      expect(result.wordCount).toBe(3);
      expect(result.estimatedDuration).toBe(3 * WORD_DURATION_SECONDS);
    });

    test('should handle sentence with special characters', () => {
      const sentence = 'Hello, world! How are you?';
      const result = convertSentenceToFormat(sentence, 2, 'paragraph-special');

      expect(result.wordCount).toBe(5);
      expect(result.text).toBe('Hello, world! How are you?');
    });
  });

  describe('processParagraphSentences', () => {
    test('should process paragraph with sentences', () => {
      const paragraph = {
        sentences: ['Sentence 1.', 'Sentence 2.', 'Sentence 3.'],
      };
      const result = processParagraphSentences(paragraph, 'paragraph-1');

      expect(result).toHaveLength(3);
      if (result[0]) {
        expect(result[0].id).toBe('paragraph-1-sentence-1');
        expect(result[0].position).toBe(0);
      }
      if (result[1]) {
        expect(result[1].id).toBe('paragraph-1-sentence-2');
        expect(result[1].position).toBe(1);
      }
      if (result[2]) {
        expect(result[2].id).toBe('paragraph-1-sentence-3');
        expect(result[2].position).toBe(2);
      }
    });

    test('should handle paragraph without sentences', () => {
      const paragraph = {};
      const result = processParagraphSentences(paragraph, 'paragraph-empty');

      expect(result).toHaveLength(0);
    });

    test('should handle paragraph with empty sentences array', () => {
      const paragraph = { sentences: [] };
      const result = processParagraphSentences(
        paragraph,
        'paragraph-no-sentences'
      );

      expect(result).toHaveLength(0);
    });

    test('should handle paragraph with mixed content types', () => {
      const paragraph = {
        sentences: ['String sentence', 123, null, undefined, 'Another string'],
      };
      const result = processParagraphSentences(paragraph, 'paragraph-mixed');

      expect(result).toHaveLength(5);
      if (result[0]) expect(result[0].text).toBe('String sentence');
      if (result[1]) expect(result[1].text).toBe('123');
      if (result[2]) expect(result[2].text).toBe('null');
      if (result[3]) expect(result[3].text).toBe('undefined');
      if (result[4]) expect(result[4].text).toBe('Another string');
    });
  });

  describe('calculateParagraphStats', () => {
    test('should calculate stats for sentences', () => {
      const sentences = [
        {
          id: 's1',
          text: 'First sentence.',
          position: 0,
          wordCount: 2,
          estimatedDuration: 1,
          hasFormatting: false,
        },
        {
          id: 's2',
          text: 'Second sentence here.',
          position: 1,
          wordCount: 3,
          estimatedDuration: 1.5,
          hasFormatting: false,
        },
        {
          id: 's3',
          text: 'Third',
          position: 2,
          wordCount: 1,
          estimatedDuration: 0.5,
          hasFormatting: false,
        },
      ];
      const result = calculateParagraphStats(sentences);

      expect(result).toEqual({
        rawText: 'First sentence. Second sentence here. Third',
        wordCount: 6,
      });
    });

    test('should handle empty sentences array', () => {
      const result = calculateParagraphStats([]);

      expect(result).toEqual({
        rawText: '',
        wordCount: 0,
      });
    });

    test('should handle single sentence', () => {
      const sentences = [
        {
          id: 's1',
          text: 'Single sentence.',
          position: 0,
          wordCount: 2,
          estimatedDuration: 1,
          hasFormatting: false,
        },
      ];
      const result = calculateParagraphStats(sentences);

      expect(result).toEqual({
        rawText: 'Single sentence.',
        wordCount: 2,
      });
    });
  });

  describe('convertParagraphToFormat', () => {
    test('should convert paragraph correctly', () => {
      const paragraph = {
        sentences: ['Sentence 1.', 'Sentence 2.'],
      };
      const result = convertParagraphToFormat(paragraph, 0, 'chapter-1');

      expect(result).toEqual({
        id: 'chapter-1-paragraph-1',
        type: 'text',
        sentences: expect.any(Array),
        position: 0,
        wordCount: 4,
        rawText: 'Sentence 1. Sentence 2.',
        text: 'Sentence 1. Sentence 2.',
        includeInAudio: true,
        confidence: DEFAULT_PARAGRAPH_CONFIDENCE,
      });
    });

    test('should handle paragraph without sentences', () => {
      const paragraph = {};
      const result = convertParagraphToFormat(paragraph, 1, 'chapter-2');

      expect(result.id).toBe('chapter-2-paragraph-2');
      expect(result.sentences).toHaveLength(0);
      expect(result.wordCount).toBe(0);
      expect(result.rawText).toBe('');
      expect(result.text).toBe('');
    });

    test('should use correct position and IDs', () => {
      const paragraph = { sentences: ['Test.'] };
      const result = convertParagraphToFormat(paragraph, 5, 'chapter-test');

      expect(result.id).toBe('chapter-test-paragraph-6');
      expect(result.position).toBe(5);
    });
  });

  describe('calculateParagraphsDuration', () => {
    test('should calculate duration for multiple paragraphs', () => {
      const paragraphs = [
        {
          sentences: [{ estimatedDuration: 1.0 }, { estimatedDuration: 1.5 }],
        },
        {
          sentences: [{ estimatedDuration: 2.0 }],
        },
        {
          sentences: [],
        },
      ];
      const result = calculateParagraphsDuration(paragraphs);

      expect(result).toBe(4.5); // 1.0 + 1.5 + 2.0
    });

    test('should handle empty paragraphs array', () => {
      const result = calculateParagraphsDuration([]);

      expect(result).toBe(0);
    });

    test('should handle paragraphs with empty sentences', () => {
      const paragraphs = [{ sentences: [] }, { sentences: [] }];
      const result = calculateParagraphsDuration(paragraphs);

      expect(result).toBe(0);
    });

    test('should handle single paragraph with single sentence', () => {
      const paragraphs = [
        {
          sentences: [{ estimatedDuration: 3.2 }],
        },
      ];
      const result = calculateParagraphsDuration(paragraphs);

      expect(result).toBe(3.2);
    });
  });

  describe('convertChapterDataToChapter', () => {
    test('should convert chapter data with all fields', () => {
      const chapterData: ChapterData = {
        title: 'Test Chapter',
        level: 2,
        paragraphs: [
          {
            sentences: ['Sentence 1.', 'Sentence 2.'],
          },
          {
            sentences: ['Sentence 3.'],
          },
        ],
        estimatedDuration: 120,
      };
      const result = convertChapterDataToChapter(chapterData, 0);

      expect(result).toMatchObject({
        id: 'chapter-1',
        title: 'Test Chapter',
        level: 2,
        position: 0,
        estimatedDuration: 120,
        startPosition: 0,
        endPosition: 0,
        startIndex: 0,
      });
      expect(result.paragraphs).toHaveLength(2);
      expect(result.wordCount).toBe(6); // "Sentence 1." (2) + "Sentence 2." (2) + "Sentence 3." (2) = 6
    });

    test('should use default values for missing fields', () => {
      const chapterData: ChapterData = {};
      const result = convertChapterDataToChapter(chapterData, 2);

      expect(result.id).toBe('chapter-3');
      expect(result.title).toBe('Chapter 3');
      expect(result.level).toBe(1);
      expect(result.paragraphs).toHaveLength(0);
      expect(result.wordCount).toBe(0);
      expect(result.estimatedDuration).toBe(0);
    });

    test('should calculate duration when not provided', () => {
      const chapterData: ChapterData = {
        title: 'Chapter without duration',
        paragraphs: [
          {
            sentences: ['This is a sentence with six words here.'],
          },
        ],
      };
      const result = convertChapterDataToChapter(chapterData, 0);

      // "This is a sentence with six words here." is actually 8 words
      // 8 words * 0.4 seconds per word = 3.2 seconds
      expect(result.estimatedDuration).toBeCloseTo(3.2, 1);
    });

    test('should handle chapter position correctly', () => {
      const chapterData: ChapterData = {
        title: 'Chapter at position 5',
      };
      const result = convertChapterDataToChapter(chapterData, 5);

      expect(result.id).toBe('chapter-6');
      expect(result.title).toBe('Chapter at position 5');
      expect(result.position).toBe(5);
    });
  });

  describe('calculateStatistics', () => {
    test('should calculate statistics from chapter data', () => {
      const chapters: ChapterData[] = [
        {
          paragraphs: [
            { sentences: ['Sentence 1.', 'Sentence 2.'] },
            { sentences: ['Sentence 3.'] },
          ],
        },
        {
          paragraphs: [
            { sentences: ['Sentence 4.', 'Sentence 5.', 'Sentence 6.'] },
          ],
        },
        {
          paragraphs: [],
        },
      ];
      const result = calculateStatistics(chapters);

      expect(result).toEqual({
        totalParagraphs: 3,
        totalSentences: 6,
      });
    });

    test('should handle empty chapters array', () => {
      const result = calculateStatistics([]);

      expect(result).toEqual({
        totalParagraphs: 0,
        totalSentences: 0,
      });
    });

    test('should handle chapters without paragraphs', () => {
      const chapters: ChapterData[] = [
        {},
        { paragraphs: undefined },
        { paragraphs: [] },
      ];
      const result = calculateStatistics(chapters);

      expect(result).toEqual({
        totalParagraphs: 0,
        totalSentences: 0,
      });
    });

    test('should handle chapters with paragraphs without sentences', () => {
      const chapters: ChapterData[] = [
        {
          paragraphs: [{}, { sentences: [] }, { sentences: undefined }],
        },
      ];
      const result = calculateStatistics(chapters);

      expect(result).toEqual({
        totalParagraphs: 3,
        totalSentences: 0,
      });
    });
  });

  describe('calculateStatisticsFromChapters', () => {
    test('should calculate statistics from Chapter objects', () => {
      const chapters: Chapter[] = [
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
                  text: 'Sentence 1.',
                  position: 0,
                  wordCount: 2,
                  estimatedDuration: 0.8,
                  hasFormatting: false,
                },
                {
                  id: 'sent-2',
                  text: 'Sentence 2.',
                  position: 1,
                  wordCount: 2,
                  estimatedDuration: 0.8,
                  hasFormatting: false,
                },
              ],
              position: 0,
              wordCount: 4,
              rawText: 'Sentence 1. Sentence 2.',
              text: 'Sentence 1. Sentence 2.',
              includeInAudio: true,
              confidence: 0.8,
            },
          ],
          position: 0,
          wordCount: 4,
          estimatedDuration: 5,
          startPosition: 0,
          endPosition: 100,
          startIndex: 0,
        },
        {
          id: 'chapter-2',
          title: 'Chapter 2',
          level: 1,
          paragraphs: [
            {
              id: 'para-2',
              type: 'text',
              sentences: [
                {
                  id: 'sent-3',
                  text: 'Sentence 3.',
                  position: 0,
                  wordCount: 2,
                  estimatedDuration: 0.8,
                  hasFormatting: false,
                },
              ],
              position: 0,
              wordCount: 2,
              rawText: 'Sentence 3.',
              text: 'Sentence 3.',
              includeInAudio: true,
              confidence: 0.8,
            },
          ],
          position: 1,
          wordCount: 2,
          estimatedDuration: 3,
          startPosition: 100,
          endPosition: 200,
          startIndex: 0,
        },
      ];
      const result = calculateStatisticsFromChapters(chapters);

      expect(result).toEqual({
        totalParagraphs: 2,
        totalSentences: 3,
      });
    });

    test('should handle empty Chapter array', () => {
      const result = calculateStatisticsFromChapters([]);

      expect(result).toEqual({
        totalParagraphs: 0,
        totalSentences: 0,
      });
    });

    test('should handle chapters with empty paragraphs', () => {
      const chapters: Chapter[] = [
        {
          id: 'chapter-1',
          title: 'Chapter 1',
          level: 1,
          paragraphs: [],
          position: 0,
          wordCount: 0,
          estimatedDuration: 0,
          startPosition: 0,
          endPosition: 0,
          startIndex: 0,
        },
      ];
      const result = calculateStatisticsFromChapters(chapters);

      expect(result).toEqual({
        totalParagraphs: 0,
        totalSentences: 0,
      });
    });
  });

  describe('calculateEstimatedDuration', () => {
    test('should calculate total duration from chapter data', () => {
      const chapters: ChapterData[] = [
        { estimatedDuration: 120 },
        { estimatedDuration: 180 },
        { estimatedDuration: 90 },
      ];
      const result = calculateEstimatedDuration(chapters);

      expect(result).toBe(390); // 120 + 180 + 90
    });

    test('should handle chapters without estimated duration', () => {
      const chapters: ChapterData[] = [
        { estimatedDuration: 100 },
        {},
        { estimatedDuration: undefined },
        { estimatedDuration: 50 },
      ];
      const result = calculateEstimatedDuration(chapters);

      expect(result).toBe(150); // 100 + 0 + 0 + 50
    });

    test('should handle empty chapters array', () => {
      const result = calculateEstimatedDuration([]);

      expect(result).toBe(0);
    });
  });

  describe('calculateEstimatedDurationFromChapters', () => {
    test('should calculate total duration from Chapter objects', () => {
      const chapters: Chapter[] = [
        {
          id: 'chapter-1',
          title: 'Chapter 1',
          level: 1,
          paragraphs: [],
          position: 0,
          wordCount: 0,
          estimatedDuration: 120,
          startPosition: 0,
          endPosition: 0,
          startIndex: 0,
        },
        {
          id: 'chapter-2',
          title: 'Chapter 2',
          level: 1,
          paragraphs: [],
          position: 1,
          wordCount: 0,
          estimatedDuration: 180,
          startPosition: 0,
          endPosition: 0,
          startIndex: 0,
        },
      ];
      const result = calculateEstimatedDurationFromChapters(chapters);

      expect(result).toBe(300); // 120 + 180
    });

    test('should handle chapters with zero duration', () => {
      const chapters: Chapter[] = [
        {
          id: 'chapter-1',
          title: 'Chapter 1',
          level: 1,
          paragraphs: [],
          position: 0,
          wordCount: 0,
          estimatedDuration: 0,
          startPosition: 0,
          endPosition: 0,
          startIndex: 0,
        },
      ];
      const result = calculateEstimatedDurationFromChapters(chapters);

      expect(result).toBe(0);
    });

    test('should handle empty Chapter array', () => {
      const result = calculateEstimatedDurationFromChapters([]);

      expect(result).toBe(0);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle null and undefined inputs gracefully', () => {
      expect(() => {
        convertSentenceToFormat(null as any, 0, 'test');
      }).not.toThrow();

      expect(() => {
        convertSentenceToFormat(undefined as any, 0, 'test');
      }).not.toThrow();

      expect(() => {
        processParagraphSentences(null as any, 'test');
      }).toThrow(); // This function expects an object with sentences property

      expect(() => {
        processParagraphSentences(undefined as any, 'test');
      }).toThrow(); // This function expects an object with sentences property
    });

    test('should handle very large word counts', () => {
      const largeSentence = 'word '.repeat(10000).trim();
      const result = convertSentenceToFormat(largeSentence, 0, 'large-test');

      expect(result.wordCount).toBe(10000);
      expect(result.estimatedDuration).toBe(10000 * WORD_DURATION_SECONDS);
    });

    test('should handle unusual characters in sentences', () => {
      const unusualSentence =
        'Test 😊 emoji áéíóú 中文 русский "quotes" \'apostrophes\'';
      const result = convertSentenceToFormat(
        unusualSentence,
        0,
        'unicode-test'
      );

      expect(result.text).toBe(unusualSentence);
      expect(result.wordCount).toBeGreaterThan(0);
    });

    test('should handle deeply nested chapter structures', () => {
      const deepChapter: ChapterData = {
        title: 'Deep Chapter',
        paragraphs: Array(100)
          .fill(null)
          .map((_, i) => ({
            sentences: Array(50)
              .fill(null)
              .map((_, j) => `Sentence ${i}-${j}.`),
          })),
      };
      const result = convertChapterDataToChapter(deepChapter, 0);

      expect(result.paragraphs).toHaveLength(100);
      expect(result.wordCount).toBeGreaterThan(0);
      expect(result.estimatedDuration).toBeGreaterThan(0);
    });
  });

  describe('Integration Tests', () => {
    test('should work end-to-end with realistic data', () => {
      const chapters: ChapterData[] = [
        {
          title: 'Getting Started',
          level: 1,
          paragraphs: [
            {
              sentences: [
                'Welcome to this comprehensive guide.',
                'In this chapter, we will cover the basics.',
              ],
            },
            {
              sentences: [
                'Let us begin with an introduction.',
                'This will set the foundation for later topics.',
                'Pay attention to these key concepts.',
              ],
            },
          ],
          estimatedDuration: 300,
        },
        {
          title: 'Advanced Topics',
          level: 1,
          paragraphs: [
            {
              sentences: [
                'Now we move on to more complex subjects.',
                'These topics require careful consideration.',
              ],
            },
          ],
          estimatedDuration: 240,
        },
      ];

      // Convert to Chapter objects
      const convertedChapters = chapters.map((chapter, index) =>
        convertChapterDataToChapter(chapter, index)
      );

      // Calculate statistics
      const stats = calculateStatisticsFromChapters(convertedChapters);
      const totalDuration =
        calculateEstimatedDurationFromChapters(convertedChapters);

      expect(stats?.totalParagraphs).toBe(3);
      expect(stats?.totalSentences).toBe(7);
      expect(totalDuration).toBe(540); // 300 + 240

      // Verify the structure is correct
      expect(convertedChapters[0]?.title).toBe('Getting Started');
      expect(convertedChapters[1]?.title).toBe('Advanced Topics');
      expect(convertedChapters[0]?.paragraphs).toHaveLength(2);
      expect(convertedChapters[1]?.paragraphs).toHaveLength(1);
    });
  });
});
