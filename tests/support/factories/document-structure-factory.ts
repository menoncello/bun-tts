import { faker } from '@faker-js/faker';
import {
  DocumentStructure,
  Chapter,
  DocumentMetadata,
} from '../../../src/core/document-processing/types';

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
      endIndex: (i + 1) * 100 - 1,
    })
  );

  const totalParagraphs = faker.number.int({ min: 50, max: 500 });
  const totalSentences = faker.number.int({ min: 100, max: 1000 });
  const totalWords = faker.number.int({ min: 500, max: 5000 });

  return {
    metadata: createDocumentMetadata(),
    chapters,
    tableOfContents: chapters.map((chapter, index) => ({
      id: chapter.id,
      title: chapter.title,
      href: `chapter${index + 1}.xhtml`,
      level: 1,
    })),
    embeddedAssets: {
      images: [],
      audio: [],
      video: [],
      fonts: [],
      other: [],
    },
    totalParagraphs,
    totalSentences,
    totalWords,
    estimatedReadingTime: Math.ceil(totalWords / 200), // Assume 200 words per minute
    version: '3.0',
    warnings: [],
    ...overrides,
  };
};

/**
 * Factory for creating Chapter objects
 */
export const createChapter = (overrides: Partial<Chapter> = {}): Chapter => {
  const paragraphCount = faker.number.int({ min: 5, max: 20 });
  const startIndex = faker.number.int({ min: 0, max: 1000 });

  let currentIndex = startIndex;
  const paragraphs = Array.from({ length: paragraphCount }, () => {
    const text = faker.lorem.paragraph();
    const paragraphStart = currentIndex;
    const paragraphEnd = currentIndex + text.length;

    const sentences = Array.from(
      { length: faker.number.int({ min: 2, max: 8 }) },
      () => {
        const sentenceText = faker.lorem.sentence();
        const sentenceStart = currentIndex;
        const sentenceEnd = currentIndex + sentenceText.length;
        currentIndex = sentenceEnd + 1; // +1 for space or punctuation

        return {
          text: sentenceText,
          startIndex: sentenceStart,
          endIndex: sentenceEnd,
          confidence: faker.number.float({ min: 0.8, max: 1.0 }),
        };
      }
    );

    currentIndex = paragraphEnd + 2; // +2 for paragraph break

    return {
      text,
      startIndex: paragraphStart,
      endIndex: paragraphEnd,
      sentences,
    };
  });

  const endIndex = currentIndex;
  const totalWords = paragraphs.reduce(
    (sum, p) => sum + p.text.split(' ').length,
    0
  );

  return {
    id: faker.string.uuid(),
    title: faker.lorem.sentence(),
    paragraphs,
    startIndex,
    endIndex,
    wordCount: totalWords,
    estimatedReadingTime: Math.ceil(totalWords / 200), // Assume 200 words per minute
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
  ...overrides,
});
