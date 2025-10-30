/**
 * Chapter Factory for EPUB Parser Tests
 *
 * Provides factory functions for creating mock chapter data
 * to reduce duplication and improve maintainability in tests.
 */

import type { Chapter } from '../../../../../src/core/document-processing/types.js';

/**
 * Factory for creating mock chapters
 */
export class ChapterFactory {
  static createBasic(): Chapter {
    return {
      id: 'chapter1',
      title: 'Chapter 1',
      level: 1,
      paragraphs: [
        {
          id: 'paragraph-1',
          type: 'text',
          sentences: [
            {
              id: 'sentence-1',
              text: 'This is the content of chapter 1.',
              position: 0,
              wordCount: 8,
              estimatedDuration: 2,
              hasFormatting: false,
            },
          ],
          position: 0,
          wordCount: 8,
          rawText: 'This is the content of chapter 1.',
          includeInAudio: true,
          confidence: 1,
          text: 'This is the content of chapter 1.',
        },
      ],
      position: 0,
      wordCount: 8,
      estimatedDuration: 2,
      startPosition: 0,
      endPosition: 35,
      startIndex: 0,
    };
  }

  static createChapterWithCustomContent(
    id: string,
    title: string,
    content: string,
    position: number
  ): Chapter {
    return {
      id,
      title,
      level: 1,
      paragraphs: [
        {
          id: `paragraph-${position + 1}`,
          type: 'text',
          sentences: [
            {
              id: `sentence-${position + 1}`,
              text: content,
              position: 0,
              wordCount: content.split(' ').length,
              estimatedDuration: Math.ceil(content.split(' ').length / 4),
              hasFormatting: false,
            },
          ],
          position: 0,
          wordCount: content.split(' ').length,
          rawText: content,
          includeInAudio: true,
          confidence: 1,
          text: content,
        },
      ],
      position,
      wordCount: content.split(' ').length,
      estimatedDuration: Math.ceil(content.split(' ').length / 4),
      startPosition: position * 36,
      endPosition: (position + 1) * 36 - 1,
      startIndex: position * 36,
    };
  }

  static createMultiple(): Chapter[] {
    const chapter1Content = 'This is the content of chapter 1.';
    const chapter2Content = 'This is the content of chapter 2.';

    return [
      this.createChapterWithCustomContent(
        'chapter1',
        'Chapter 1',
        chapter1Content,
        0
      ),
      this.createChapterWithCustomContent(
        'chapter2',
        'Chapter 2',
        chapter2Content,
        1
      ),
    ];
  }

  static createWithParagraphs(): Chapter[] {
    return [
      {
        id: 'chapter1',
        title: 'Chapter 1',
        level: 1,
        paragraphs: [
          {
            id: 'paragraph-1',
            type: 'text',
            sentences: [
              {
                id: 'sentence-1',
                text: 'First sentence of chapter 1.',
                position: 0,
                wordCount: 5,
                estimatedDuration: 2,
                hasFormatting: false,
              },
              {
                id: 'sentence-2',
                text: 'Second sentence of chapter 1.',
                position: 26,
                wordCount: 5,
                estimatedDuration: 2,
                hasFormatting: false,
              },
            ],
            position: 0,
            wordCount: 10,
            rawText:
              'First sentence of chapter 1. Second sentence of chapter 1.',
            includeInAudio: true,
            confidence: 1,
            text: 'First sentence of chapter 1. Second sentence of chapter 1.',
          },
          {
            id: 'paragraph-2',
            type: 'text',
            sentences: [
              {
                id: 'sentence-3',
                text: 'Third sentence of chapter 1.',
                position: 59,
                wordCount: 5,
                estimatedDuration: 2,
                hasFormatting: false,
              },
            ],
            position: 58,
            wordCount: 5,
            rawText: 'Third sentence of chapter 1.',
            includeInAudio: true,
            confidence: 1,
            text: 'Third sentence of chapter 1.',
          },
        ],
        position: 0,
        wordCount: 15,
        estimatedDuration: 6,
        startPosition: 0,
        endPosition: 85,
        startIndex: 0,
      },
    ];
  }
}
