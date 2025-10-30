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

    return {
      id: `sentence-${paragraphIndex}-${sentenceIndex}`,
      text: sentenceText.trim(),
      position: sentenceIndex,
      wordCount: sentenceText.trim().split(/\s+/).length,
      estimatedDuration: sentenceText.trim().split(/\s+/).length * 0.5, // 0.5 seconds per word
      hasFormatting: false,
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

  return {
    id: `paragraph-${paragraphIndex}`,
    type: 'text' as const,
    sentences,
    position: paragraphIndex,
    wordCount: rawText.split(/\s+/).length,
    rawText,
    includeInAudio: true,
    confidence: faker.number.float({ min: 0.8, max: 1.0 }),
    text: rawText,
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
    ...overrides,
  };
};

/**
 * Factory for creating DocumentMetadata objects
 */
export const createDocumentMetadata = (
  overrides: Partial<DocumentMetadata> = {}
): DocumentMetadata => ({
  title: faker.lorem.words(3),
  author: faker.person.fullName(),
  language: 'en',
  publisher: faker.company.name(),
  identifier: faker.string.uuid(),
  wordCount: faker.number.int({ min: 1000, max: 10000 }),
  customMetadata: {
    description: faker.lorem.sentence(),
    tags: [faker.lorem.word(), faker.lorem.word()],
  },
  ...overrides,
});
