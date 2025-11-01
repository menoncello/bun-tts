/**
 * PDF parser test helpers and utilities.
 * Provides common testing utilities for PDF parser tests.
 */

import type { PDFData } from '../../../../src/core/document-processing/parsers/pdf-parser-structure.js';
import { PDFParser } from '../../../../src/core/document-processing/parsers/pdf-parser.js';
import type {
  DocumentStructure,
  Chapter,
  DocumentMetadata,
} from '../../../../src/core/document-processing/types.js';
import {
  PdfParseError,
  PdfParseErrorCode,
} from '../../../../src/errors/pdf-parse-error.js';
import {
  MockLoggerFactory,
  MockConfigManagerFactory,
} from '../../../../tests/support/document-processing-factories.js';

/**
 * Mock PDF data interface for testing
 */
export interface MockPDFData {
  info?: {
    Title?: string;
    Author?: string;
    Creator?: string;
    Subject?: string;
    Producer?: string;
    CreationDate?: string;
    ModificationDate?: string;
  };
  numPages?: number;
  pdfVersion?: string;
  text?: string;
}

/**
 * Sample PDF metadata for testing
 */
export const createSamplePDFMetadata = (): DocumentMetadata => ({
  title: 'Test PDF Document',
  wordCount: 1500,
  totalWords: 1500,
  characterCount: 7500,
  createdDate: new Date('2024-01-01'),
  modifiedDate: new Date('2024-01-02'),
  date: '2024-01-01',
  format: 'pdf',
  author: 'Test Author',
  language: 'en',
  estimatedReadingTime: 6,
  chapterCount: 3,
  customMetadata: {
    subject: 'Testing',
    description: 'A test PDF document for unit testing',
    creator: 'Test Creator',
    producer: 'Test Producer',
  },
});

/**
 * Sample chapters for testing
 */
export const createSampleChapters = (): Chapter[] => [
  {
    id: 'chapter-1',
    title: 'Introduction',
    level: 1,
    paragraphs: [
      {
        id: 'paragraph-1-1',
        type: 'text',
        sentences: [
          {
            id: 'sentence-1-1-1',
            text: 'This is the introduction chapter.',
            position: 0,
            wordCount: 5,
            estimatedDuration: 1.2,
            hasFormatting: false,
          },
          {
            id: 'sentence-1-1-2',
            text: 'It contains some sample text for testing PDF parsing functionality.',
            position: 1,
            wordCount: 10,
            estimatedDuration: 2.4,
            hasFormatting: false,
          },
        ],
        position: 0,
        wordCount: 15,
        rawText:
          'This is the introduction chapter.\n\nIt contains some sample text for testing PDF parsing functionality.',
        includeInAudio: true,
        confidence: 0.9,
        text: 'This is the introduction chapter.\n\nIt contains some sample text for testing PDF parsing functionality.',
      },
    ],
    position: 0,
    wordCount: 15,
    estimatedDuration: 3.6,
    startPosition: 0,
    endPosition: 85,
    startIndex: 0,
    charRange: { start: 0, end: 85 },
    depth: 1,
    content:
      'This is the introduction chapter.\n\nIt contains some sample text for testing PDF parsing functionality.',
    index: 1,
  },
  {
    id: 'chapter-2',
    title: 'Chapter 1: Getting Started',
    level: 1,
    paragraphs: [
      {
        id: 'paragraph-2-1',
        type: 'text',
        sentences: [
          {
            id: 'sentence-2-1-1',
            text: 'This is the first chapter with more detailed content.',
            position: 0,
            wordCount: 9,
            estimatedDuration: 2.1,
            hasFormatting: false,
          },
          {
            id: 'sentence-2-1-2',
            text: 'It includes multiple paragraphs and various text elements that might be found in a typical PDF document.',
            position: 1,
            wordCount: 19,
            estimatedDuration: 4.5,
            hasFormatting: false,
          },
        ],
        position: 0,
        wordCount: 28,
        rawText:
          'This is the first chapter with more detailed content.\n\nIt includes multiple paragraphs and various text elements that might be found in a typical PDF document.',
        includeInAudio: true,
        confidence: 0.9,
        text: 'This is the first chapter with more detailed content.\n\nIt includes multiple paragraphs and various text elements that might be found in a typical PDF document.',
      },
    ],
    position: 1,
    wordCount: 28,
    estimatedDuration: 6.6,
    startPosition: 86,
    endPosition: 225,
    startIndex: 1,
    charRange: { start: 86, end: 225 },
    depth: 1,
    content:
      'This is the first chapter with more detailed content.\n\nIt includes multiple paragraphs and various text elements that might be found in a typical PDF document.',
    index: 2,
  },
  {
    id: 'chapter-3',
    title: 'Chapter 2: Advanced Topics',
    level: 1,
    paragraphs: [
      {
        id: 'paragraph-3-1',
        type: 'text',
        sentences: [
          {
            id: 'sentence-3-1-1',
            text: 'This is the second chapter covering advanced topics.',
            position: 0,
            wordCount: 8,
            estimatedDuration: 1.9,
            hasFormatting: false,
          },
          {
            id: 'sentence-3-1-2',
            text: "The content here is more complex and tests the parser's ability to handle various text structures.",
            position: 1,
            wordCount: 18,
            estimatedDuration: 4.2,
            hasFormatting: false,
          },
        ],
        position: 0,
        wordCount: 26,
        rawText:
          "This is the second chapter covering advanced topics.\n\nThe content here is more complex and tests the parser's ability to handle various text structures.",
        includeInAudio: true,
        confidence: 0.9,
        text: "This is the second chapter covering advanced topics.\n\nThe content here is more complex and tests the parser's ability to handle various text structures.",
      },
    ],
    position: 2,
    wordCount: 26,
    estimatedDuration: 6.1,
    startPosition: 226,
    endPosition: 345,
    startIndex: 2,
    charRange: { start: 226, end: 345 },
    depth: 1,
    content:
      "This is the second chapter covering advanced topics.\n\nThe content here is more complex and tests the parser's ability to handle various text structures.",
    index: 3,
  },
];

/**
 * Sample document structure for testing
 */
export const createSampleDocumentStructure = (): DocumentStructure => ({
  metadata: createSamplePDFMetadata(),
  chapters: createSampleChapters(),
  totalParagraphs: 3,
  totalSentences: 6,
  totalWordCount: 69,
  totalChapters: 3,
  estimatedTotalDuration: 16.3,
  confidence: 0.9,
  processingMetrics: {
    parseStartTime: new Date('2024-01-01T10:00:00Z'),
    parseEndTime: new Date('2024-01-01T10:00:01Z'),
    parseDurationMs: 1000,
    sourceLength: 345,
    processingErrors: [],
  },
  elements: [],
  stats: {
    totalWords: 69,
    processingTime: 1000,
    confidenceScore: 0.9,
    extractionMethod: 'pdf-parser',
    errorCount: 0,
    fallbackCount: 0,
    processingTimeMs: 1000,
  },
});

/**
 * Sample raw PDF data structure
 */
export const createSamplePDFData = (): PDFData => ({
  text: 'Chapter 1: Getting Started\n\nThis is the first chapter content.\n\nChapter 2: Advanced Topics\n\nThis is the second chapter content.',
  info: {
    Title: 'Test PDF Document',
    Author: 'Test Author',
    Subject: 'Testing',
    Creator: 'Test Creator',
    Producer: 'Test Producer',
    CreationDate: '2024-01-01',
    ModificationDate: '2024-01-02',
  },
  numPages: 5,
  pdfVersion: '1.7',
});

/**
 * Sample PDF text content with common formatting issues
 */
export const createSamplePDFTextWithIssues = (): string =>
  `
Chapter 1: Introduction

    This text has irregular    spacing

And line breaks that might need
normalization.

Chapter 2: Content

This chapter has some content with
special characters: café, naïve, résumé.

And numbers like 1,234.56 and dates like 01/15/2024.
`.trim();

/**
 * Sample PDF text for OCR testing
 */
export const createSampleOCRText = (): string =>
  `
CHAPTER 1: GETTING STARTED

This is a sample text that simulates OCR output.
It might contain some common OCR errors like:

• l instead of I (Ietter → letter)
• 0 instead of O (0ver → over)
• rn instead of m (leam → learn)

Chapter 2: ADVANCED TOPICS

This chapter tests more complex OCR scenarios
including different fonts and layouts.
`.trim();

/**
 * Sample PDF text with complex structure
 */
export const createComplexPDFText = (): string =>
  `
1. Introduction

This is the introduction section with numbered headings.

1.1 Background

This is a subsection with more detailed information.

2. Main Content

This is the main content section.

2.1 Subsection A

Content for subsection A.

2.2 Subsection B

Content for subsection B.

3. Conclusion

This is the conclusion section.
`.trim();

/**
 * Create a mock PDF parse error
 */
export const createMockPDFParseError = (
  code: PdfParseErrorCode = 'PARSE_FAILED',
  message?: string
): PdfParseError => {
  const errorMessage = message || `Mock PDF parse error: ${code}`;
  return new PdfParseError(code, errorMessage);
};

/**
 * Create PDF text with encoding issues
 */
export const createPDFTextWithEncodingIssues = (): string =>
  `
Chapter Title

This text contains encoding issues:
• Invalid characters:
• Mixed encoding: caf�, na�ve
• Unicode issues: â€œquotesâ€� instead of "quotes"

More content with problems.
`.trim();

/**
 * Create PDF text with table-like structures
 */
export const createPDFTextWithTables = (): string =>
  `
Chapter 1: Data Tables

Name    Age    City
John    25     New York
Jane    30     Los Angeles
Bob     35     Chicago

This is regular text between tables.

Product    Price    Quantity
Laptop     $999     1
Mouse      $25      2
Keyboard   $75      1

End of chapter content.
`.trim();

/**
 * Create PDF text with multiple columns (simulated)
 */
export const createPDFTextWithColumns = (): string =>
  `
Chapter 1: Multi-column Content

Left Column Text        Right Column Text
This is content in      This is content in
the left column.        the right column.
It might contain        It could contain
different information.  related information.

More left content       More right content
continues here.         continues on this side.
`.trim();

/**
 * Create PDF text with headers and footers (to be stripped)
 */
export const createPDFTextWithHeadersFooters = (): string =>
  `
Page 1 of 5
Document Title
========================

Chapter 1: Introduction

This is the main content of page 1.
It should be extracted properly.

Page 1
 Confidential

Page 2 of 5
Document Title
========================

Chapter 1: Continued

This is content from page 2.
Headers and footers should be removed.

Page 2
 Confidential
`.trim();

/**
 * Sample PDF text for testing chapter detection
 */
export const createPDFTextForChapterDetection = (): string =>
  `
Document Title

Introduction

This is the introduction section of the document.

Chapter 1: Getting Started

This is the first chapter content. It explains how to get started with the subject matter.

Chapter 2: Advanced Topics

This is the second chapter. It covers more advanced topics and concepts.

Chapter 3: Conclusion

This is the final chapter that summarizes the key points.
`.trim();

/**
 * Performance test data - large PDF text
 */
export const createLargePDFText = (): string => {
  const chapters = [];
  for (let i = 1; i <= 50; i++) {
    chapters.push(
      `
Chapter ${i}: Chapter Title

This is chapter ${i} content. ${'Sample text content '.repeat(20)}

The content includes multiple paragraphs and various text elements
that would typically be found in a real PDF document. This helps test
the performance and memory usage of the PDF parser.

${'Additional content for testing purposes. '.repeat(10)}
    `.trim()
    );
  }
  return chapters.join('\n\n');
};

/**
 * Test helper to verify chapter extraction
 */
export const verifyChapters = (
  chapters: Chapter[],
  expectedCount: number,
  expectedTitles?: string[]
): boolean => {
  if (chapters.length !== expectedCount) {
    return false;
  }

  if (expectedTitles) {
    for (const [i, expectedTitle] of expectedTitles.entries()) {
      if (chapters[i]?.title !== expectedTitle) {
        return false;
      }
    }
  }

  return chapters.every(
    (chapter) =>
      (chapter.index ?? 0) > 0 &&
      (chapter.title?.length ?? 0) > 0 &&
      (chapter.content?.length ?? 0) > 0 &&
      (chapter.wordCount ?? 0) >= 0
  );
};

/**
 * Test helper to verify document structure
 */
export const verifyDocumentStructure = (
  structure: DocumentStructure,
  expectedChapterCount: number
): boolean => {
  return (
    structure.metadata !== undefined &&
    structure.chapters.length === expectedChapterCount &&
    verifyChapters(structure.chapters, expectedChapterCount)
  );
};

/**
 * Test helper to create error scenarios
 */
export const createErrorScenarios = () => ({
  emptyText: () => '',
  invalidCharacters: () => 'Text with \x00\x01\x02 invalid characters',
  veryLongLine: () => 'A'.repeat(10000),
  tooManyChapters: () => {
    let result = '';
    for (let i = 1; i <= 1000; i++) {
      result += `Chapter ${i}\n\nChapter content here.\n\n`;
    }
    return result;
  },
  nestedStructure: () => {
    let result = 'Chapter 1\n';
    for (let i = 0; i < 100; i++) {
      result += `${'  '.repeat(i)}Section ${i}\n`;
    }
    return result;
  },
});

/**
 * Test helper to measure performance
 */
export const measurePerformance = <T>(
  fn: () => T | Promise<T>,
  iterations = 1
): Promise<{ result: T; averageTime: number; totalTime: number }> => {
  return new Promise(async (resolve) => {
    const startTime = performance.now();
    let result: T;

    for (let i = 0; i < iterations; i++) {
      result = await fn();
    }

    const totalTime = performance.now() - startTime;
    const averageTime = totalTime / iterations;

    resolve({
      result: result!,
      averageTime,
      totalTime,
    });
  });
};

/**
 * Setup function for parser tests
 * Creates a configured PDF parser instance for testing
 */
export const setupParserTest = () => {
  const mockLogger = MockLoggerFactory.create();
  const mockConfigManager = MockConfigManagerFactory.createDefault();
  const parser = new PDFParser(mockLogger, mockConfigManager);
  return { parser };
};

/**
 * Helper function to create text buffer
 */
export const createTextBuffer = (content: string): ArrayBuffer => {
  const encoder = new TextEncoder();
  return encoder.encode(content).buffer;
};

/**
 * Helper function to create malformed document structure
 */
export const createMalformedDocumentStructure = (): DocumentStructure => ({
  metadata: {
    title: '',
    wordCount: 0,
    totalWords: 0,
    characterCount: 0,
    createdDate: new Date(),
    modifiedDate: new Date(),
    date: '',
    format: 'pdf' as const,
    language: 'en',
    estimatedReadingTime: 0,
    chapterCount: 0,
    customMetadata: {},
  },
  chapters: [],
  elements: [],
  totalParagraphs: 0,
  totalSentences: 0,
  totalWordCount: 0,
  totalChapters: 0,
  estimatedTotalDuration: 0,
  confidence: 0.1,
  processingMetrics: {
    parseStartTime: new Date(),
    parseEndTime: new Date(),
    parseDurationMs: 0,
    sourceLength: 0,
    processingErrors: ['Error 1', 'Error 2'],
  },
  stats: {
    processingTimeMs: 0,
    errorCount: 10,
    fallbackCount: 5,
    totalWords: 0,
    processingTime: 0,
    confidenceScore: 0.1,
    extractionMethod: 'pdf-parser',
  },
});

/**
 * Helper function to create valid document structure
 */
export const createValidDocumentStructure = (): DocumentStructure => {
  const metadata = createTestMetadata();
  const chapters = createTestChapters();
  const stats = createTestStats();

  return {
    metadata,
    chapters,
    elements: [],
    totalParagraphs: 1,
    totalSentences: 1,
    totalWordCount: 6,
    totalChapters: 1,
    estimatedTotalDuration: 3,
    confidence: 0.9,
    processingMetrics: {
      parseStartTime: new Date(),
      parseEndTime: new Date(),
      parseDurationMs: 100,
      sourceLength: 50,
      processingErrors: [],
    },
    stats,
  };
};

/**
 * Helper function to create test metadata
 */
const createTestMetadata = () => ({
  title: 'Test Document',
  wordCount: 100,
  totalWords: 100,
  characterCount: 500,
  createdDate: new Date('2023-10-27'),
  modifiedDate: new Date('2023-10-27'),
  date: '2023-10-27',
  format: 'pdf' as const,
  author: 'Test Author',
  language: 'en',
  estimatedReadingTime: 1,
  chapterCount: 1,
  customMetadata: {},
});

/**
 * Helper function to create test chapters
 */
const createTestChapters = () => [
  {
    id: 'chapter-1',
    title: 'Chapter 1',
    level: 1,
    paragraphs: createTestParagraphs(),
    position: 0,
    charRange: { start: 0, end: 25 },
    depth: 1,
    wordCount: 6,
    estimatedDuration: 1.5,
    startPosition: 0,
    endPosition: 25,
    startIndex: 0,
    content: 'This is a test sentence.',
    index: 1,
  },
];

/**
 * Helper function to create test paragraphs
 */
const createTestParagraphs = () => [
  {
    id: 'paragraph-1',
    type: 'text' as const,
    sentences: createTestSentences(),
    position: 0,
    wordCount: 6,
    rawText: 'This is a test sentence.',
    includeInAudio: true,
    confidence: 0.9,
    text: 'This is a test sentence.',
    charRange: { start: 0, end: 25 },
    documentPosition: {
      chapter: 0,
      paragraph: 0,
      startChar: 0,
      endChar: 25,
    },
    contentType: 'text' as const,
  },
];

/**
 * Helper function to create test sentences
 */
const createTestSentences = () => [
  {
    id: 'sentence-1',
    text: 'This is a test sentence.',
    position: 0,
    wordCount: 6,
    estimatedDuration: 1.5,
    hasFormatting: false,
    charRange: { start: 0, end: 25 },
    documentPosition: {
      chapter: 0,
      paragraph: 0,
      sentence: 0,
      startChar: 0,
      endChar: 25,
    },
  },
];

/**
 * Helper function to create test stats
 */
const createTestStats = () => ({
  totalWords: 6,
  processingTime: 100,
  confidenceScore: 0.9,
  extractionMethod: 'pdf-parser',
  processingTimeMs: 100,
  errorCount: 0,
  fallbackCount: 0,
});
