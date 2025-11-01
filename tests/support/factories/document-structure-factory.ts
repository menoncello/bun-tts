import { faker } from '@faker-js/faker';
import {
  DocumentStructure,
  Chapter,
  DocumentMetadata,
  Paragraph,
  Sentence,
} from '../../../src/core/document-processing/types.js';

/**
 * Helper function to calculate document statistics from chapters
 */
const calculateDocumentStatistics = (chapters: Chapter[]) => {
  const totalParagraphs = chapters.reduce(
    (sum, chapter) => sum + chapter.paragraphs.length,
    0
  );
  const totalSentences = chapters.reduce(
    (sum, chapter) =>
      sum +
      chapter.paragraphs.reduce(
        (chapterSum, paragraph) => chapterSum + paragraph.sentences.length,
        0
      ),
    0
  );
  const totalWordCount = chapters.reduce(
    (sum, chapter) => sum + chapter.wordCount,
    0
  );
  const estimatedTotalDuration = chapters.reduce(
    (sum, chapter) => sum + chapter.estimatedDuration,
    0
  );

  return {
    totalParagraphs,
    totalSentences,
    totalWordCount,
    totalChapters: chapters.length,
    estimatedTotalDuration,
  };
};

/**
 * Helper function to create processing metrics
 */
const createProcessingMetrics = (wordCount: number) => {
  const parseStartTime = new Date();
  const parseEndTime = new Date(parseStartTime.getTime() + 1000); // 1 second later

  return {
    parseStartTime,
    parseEndTime,
    parseDurationMs: parseEndTime.getTime() - parseStartTime.getTime(),
    sourceLength: wordCount * 6, // Average 6 characters per word
    processingErrors: [],
  };
};

/**
 * Factory for creating DocumentStructure objects
 */
export const createDocumentStructure = (
  overrides: Partial<DocumentStructure> = {}
): DocumentStructure => {
  const chapters = Array.from({ length: 3 }, (_, i) =>
    createChapter({
      id: `chapter-${i + 1}`,
      title: `Chapter ${i + 1}`,
      startIndex: i * 100,
      position: i,
    })
  );

  const statistics = calculateDocumentStatistics(chapters);
  const processingMetrics = createProcessingMetrics(statistics.totalWordCount);

  return {
    metadata: createDocumentMetadata({ wordCount: statistics.totalWordCount }),
    chapters,
    ...statistics,
    confidence: faker.number.float({ min: 0.8, max: 1.0 }),
    processingMetrics,
    elements: [], // Empty elements array for testing
    stats: {
      totalWords: statistics.totalWordCount,
      processingTime: processingMetrics.parseDurationMs,
      confidenceScore: faker.number.float({ min: 0.8, max: 1.0 }),
      extractionMethod: 'test-factory',
      errorCount: 0,
      fallbackCount: 0,
      processingTimeMs: processingMetrics.parseDurationMs,
    },
    ...overrides,
  };
};

/**
 * Helper function to create sentences from text
 */
const createSentences = (
  rawText: string,
  paragraphIndex: number,
  currentIndexRef: { value: number }
): Sentence[] => {
  const sentenceTexts = rawText
    .split(/(?<=[!.?])\s+/)
    .filter((s) => s.trim().length > 0) || [rawText];

  return sentenceTexts.map((sentenceText, sentenceIndex) => {
    const sentenceEnd = currentIndexRef.value + sentenceText.length;
    currentIndexRef.value = sentenceEnd + 1; // +1 for space or punctuation

    const trimmedText = sentenceText.trim();
    const wordCount = trimmedText.split(/\s+/).length;
    return {
      id: `sentence-${paragraphIndex}-${sentenceIndex}`,
      text: trimmedText,
      position: sentenceIndex,
      wordCount,
      estimatedDuration: wordCount * 0.5, // 0.5 seconds per word
      hasFormatting: false,
      charRange: {
        start: sentenceEnd - sentenceText.length,
        end: sentenceEnd,
      },
      documentPosition: {
        chapter: 0,
        paragraph: paragraphIndex,
        sentence: sentenceIndex,
        startChar: sentenceEnd - sentenceText.length,
        endChar: sentenceEnd,
      },
    };
  });
};

/**
 * Helper function to create a paragraph
 */
const createParagraph = (
  paragraphIndex: number,
  currentIndexRef: { value: number }
): Paragraph => {
  const rawText = faker.lorem.paragraph();
  const paragraphEnd = currentIndexRef.value + rawText.length;

  const sentences = createSentences(rawText, paragraphIndex, currentIndexRef);
  currentIndexRef.value = paragraphEnd + 2; // +2 for paragraph break

  const wordCount = rawText.split(/\s+/).length;
  return {
    id: `paragraph-${paragraphIndex}`,
    type: 'text' as const,
    sentences,
    position: paragraphIndex,
    wordCount,
    rawText,
    includeInAudio: true,
    confidence: faker.number.float({ min: 0.8, max: 1.0 }),
    text: rawText,
    charRange: {
      start: currentIndexRef.value - rawText.length,
      end: currentIndexRef.value,
    },
    documentPosition: {
      chapter: 0,
      paragraph: paragraphIndex,
      startChar: currentIndexRef.value - rawText.length,
      endChar: currentIndexRef.value,
    },
    contentType: 'text' as const,
  };
};

/**
 * Helper function to create paragraphs for a chapter
 */
const createParagraphs = (paragraphCount: number, startIndex: number) => {
  const currentIndexRef = { value: startIndex };
  const paragraphs: Paragraph[] = [];

  for (let i = 0; i < paragraphCount; i++) {
    paragraphs.push(createParagraph(i, currentIndexRef));
  }

  return {
    paragraphs,
    endPosition: currentIndexRef.value,
  };
};

/**
 * Factory for creating Chapter objects
 */
export const createChapter = (overrides: Partial<Chapter> = {}): Chapter => {
  const paragraphCount = faker.number.int({ min: 5, max: 20 });
  const startPosition = faker.number.int({ min: 0, max: 1000 });
  const startIndex = startPosition;

  const { paragraphs, endPosition } = createParagraphs(
    paragraphCount,
    startIndex
  );
  const totalWords = paragraphs.reduce((sum, p) => sum + p.wordCount, 0);

  return {
    id: faker.string.uuid(),
    title: faker.lorem.sentence(),
    level: 1,
    paragraphs,
    position: 0,
    startPosition,
    endPosition,
    startIndex,
    wordCount: totalWords,
    estimatedDuration: totalWords * 0.5, // 0.5 seconds per word
    charRange: {
      start: startPosition,
      end: endPosition,
    },
    depth: 1,
    content: paragraphs.map((p) => p.text).join('\n\n'),
    index: startPosition,
    ...overrides,
  };
};

/**
 * Factory for creating DocumentMetadata objects
 */
export const createDocumentMetadata = (
  overrides: Partial<DocumentMetadata> = {}
): DocumentMetadata => {
  const wordCount = faker.number.int({ min: 1000, max: 10000 });
  return {
    title: faker.lorem.words(3),
    author: faker.person.fullName(),
    language: 'en',
    publisher: faker.company.name(),
    identifier: faker.string.uuid(),
    wordCount,
    totalWords: wordCount, // Add alias for compatibility
    characterCount: wordCount * 6, // Average 6 characters per word
    createdDate: faker.date.past(),
    modifiedDate: faker.date.recent(),
    date: faker.date.recent().toISOString().split('T')[0],
    format: 'pdf',
    estimatedReadingTime: Math.ceil(wordCount / 250), // Average reading speed
    chapterCount: faker.number.int({ min: 1, max: 10 }),
    customMetadata: {
      description: faker.lorem.sentence(),
      tags: [faker.lorem.word(), faker.lorem.word()],
    },
    ...overrides,
  };
};
