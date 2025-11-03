import { faker } from '@faker-js/faker';
import type { DocumentFormat } from '../../../src/core/document-processing/structure-analyzer.core.js';
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
const calculateDocumentStatistics = (
  chapters: Chapter[]
): {
  totalParagraphs: number;
  totalSentences: number;
  totalWordCount: number;
  totalChapters: number;
  estimatedTotalDuration: number;
} => {
  const totalParagraphs = chapters.reduce(
    (sum: number, chapter: Chapter) => sum + chapter.paragraphs.length,
    0
  );
  const totalSentences = chapters.reduce(
    (sum: number, chapter: Chapter) =>
      sum +
      chapter.paragraphs.reduce(
        (chapterSum: number, paragraph: Paragraph) =>
          chapterSum + paragraph.sentences.length,
        0
      ),
    0
  );
  const totalWordCount = chapters.reduce(
    (sum: number, chapter: Chapter) => sum + chapter.wordCount,
    0
  );
  const estimatedTotalDuration = chapters.reduce(
    (sum: number, chapter: Chapter) => sum + chapter.estimatedDuration,
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
const createProcessingMetrics = (
  wordCount: number
): {
  parseStartTime: Date;
  parseEndTime: Date;
  parseDurationMs: number;
  sourceLength: number;
  processingErrors: string[];
} => {
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
  const chapters = Array.from({ length: 3 }, (_: unknown, i: number) =>
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
    .filter((s: string) => s.trim().length > 0) || [rawText];

  return sentenceTexts.map((sentenceText: string, sentenceIndex: number) => {
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
const createParagraphs = (
  paragraphCount: number,
  startIndex: number
): {
  paragraphs: Paragraph[];
  endPosition: number;
} => {
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
  const totalWords = paragraphs.reduce(
    (sum: number, p: Paragraph) => sum + p.wordCount,
    0
  );

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
    content: paragraphs.map((p: Paragraph) => p.text).join('\n\n'),
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

/**
 * Additional factory functions for StructureAnalyzer tests
 */

// Document structure node types
export type DocumentNodeType =
  | 'document'
  | 'chapter'
  | 'section'
  | 'paragraph'
  | 'sentence';

export interface DocumentNode {
  id: string;
  type: DocumentNodeType;
  title?: string;
  content?: string;
  level: number;
  position: number;
  startOffset?: number;
  endOffset?: number;
  confidence?: number;
  children?: DocumentNode[];
  metadata?: Record<string, any>;
  parent?: DocumentNode;
}

/**
 * Create a document node with default values
 */
export function createDocumentNode(
  overrides: Partial<DocumentNode> = {}
): DocumentNode {
  const nodeType = overrides.type || 'section';
  const level = overrides.level || 1;

  return {
    id: faker.string.uuid(),
    type: nodeType,
    title: overrides.title || generateTitleForType(nodeType),
    content: overrides.content,
    level,
    position: overrides.position || faker.number.int({ min: 0, max: 100 }),
    startOffset: overrides.startOffset,
    endOffset: overrides.endOffset,
    confidence:
      overrides.confidence ?? faker.number.float({ min: 0.3, max: 0.99 }),
    children: overrides.children || [],
    metadata: overrides.metadata || {},
  };
}

/**
 * Generate a title for a given node type
 */
function generateTitleForType(type: DocumentNodeType): string {
  switch (type) {
    case 'chapter':
      return `Chapter ${faker.number.int({ min: 1, max: 100 })}: ${faker.word.words(
        {
          count: { min: 2, max: 5 },
        }
      )}`;
    case 'section':
      return `${faker.number.int({ min: 1, max: 20 })}.${faker.number.int({ min: 1, max: 20 })} ${faker.word.words(
        {
          count: { min: 2, max: 4 },
        }
      )}`;
    case 'paragraph':
      return faker.lorem.sentence();
    case 'sentence':
      return faker.lorem.sentence();
    default:
      return faker.word.words({ count: { min: 2, max: 4 } });
  }
}

/**
 * Create a chapter node
 */
export function createStructureChapter(
  overrides: Partial<DocumentNode> = {}
): DocumentNode {
  return createDocumentNode({
    type: 'chapter',
    level: 1,
    confidence:
      overrides.confidence ?? faker.number.float({ min: 0.7, max: 0.99 }),
    ...overrides,
  });
}

/**
 * Create a section node
 */
export function createStructureSection(
  overrides: Partial<DocumentNode> = {}
): DocumentNode {
  const level = overrides.level || faker.number.int({ min: 2, max: 5 });
  return createDocumentNode({
    type: 'section',
    level,
    confidence:
      overrides.confidence ?? faker.number.float({ min: 0.6, max: 0.95 }),
    ...overrides,
  });
}

/**
 * Create subsections for a section
 */
function createSubsections(
  chapterIndex: number,
  sectionIndex: number,
  subsectionsPerSection: number
): DocumentNode[] {
  const subsections: DocumentNode[] = [];

  for (let k = 0; k < subsectionsPerSection; k++) {
    const subsection = createStructureSection({
      title: `${chapterIndex + 1}.${sectionIndex + 1}.${k + 1} ${faker.word.words(
        {
          count: { min: 2, max: 4 },
        }
      )}`,
      position: chapterIndex * 100 + sectionIndex * 10 + k,
      level: 3,
    });

    subsections.push(subsection);
  }

  return subsections;
}

/**
 * Create sections for a chapter
 */
function createSectionsForChapter(
  chapterIndex: number,
  sectionsPerChapter: number,
  subsectionsPerSection: number
): DocumentNode[] {
  const sections: DocumentNode[] = [];

  for (let j = 0; j < sectionsPerChapter; j++) {
    const section = createStructureSection({
      title: `${chapterIndex + 1}.${j + 1} ${faker.word.words({
        count: { min: 2, max: 4 },
      })}`,
      position: chapterIndex * 10 + j,
      metadata: {
        wordCount: faker.number.int({ min: 200, max: 2000 }),
      },
    });

    const subsections = createSubsections(
      chapterIndex,
      j,
      subsectionsPerSection
    );

    if (subsections.length > 0) {
      section.children = subsections;
      for (const sub of subsections) sub.parent = section;
    }

    sections.push(section);
  }

  return sections;
}

/**
 * Create a chapter with sections and subsections
 */
function createChapterWithSections(
  chapterIndex: number,
  sectionsPerChapter: number,
  subsectionsPerSection: number
): DocumentNode {
  const chapter = createStructureChapter({
    title: `Chapter ${chapterIndex + 1}: ${faker.word.words({
      count: { min: 2, max: 5 },
    })}`,
    position: chapterIndex,
    metadata: {
      wordCount: faker.number.int({ min: 500, max: 5000 }),
      pageCount: faker.number.int({ min: 1, max: 20 }),
    },
  });

  const sections = createSectionsForChapter(
    chapterIndex,
    sectionsPerChapter,
    subsectionsPerSection
  );

  if (sections.length > 0) {
    chapter.children = sections;
    for (const sec of sections) sec.parent = chapter;
  }

  return chapter;
}

/**
 * Create a document structure with nested chapters and sections
 */
export function createNestedStructure(
  options: {
    format: DocumentFormat;
    chapterCount?: number;
    sectionsPerChapter?: number;
    subsectionsPerSection?: number;
    includeContent?: boolean;
  } = { format: 'markdown' }
): {
  format: DocumentFormat;
  content: string;
  metadata: {
    title: string;
    author: string;
    createdAt: string;
  };
  nodes: DocumentNode[];
} {
  const {
    format,
    chapterCount = faker.number.int({ min: 2, max: 10 }),
    sectionsPerChapter = faker.number.int({ min: 1, max: 5 }),
    subsectionsPerSection = faker.number.int({ min: 0, max: 3 }),
    includeContent = true,
  } = options;

  const chapters: DocumentNode[] = [];

  for (let i = 0; i < chapterCount; i++) {
    const chapter = createChapterWithSections(
      i,
      sectionsPerChapter,
      subsectionsPerSection
    );
    chapters.push(chapter);
  }

  return {
    format,
    content: includeContent ? faker.lorem.text() : '',
    metadata: {
      title: faker.word.words({ count: { min: 3, max: 6 } }),
      author: faker.person.fullName(),
      createdAt: new Date().toISOString(),
    },
    nodes: chapters,
  };
}

/**
 * Create a document with varying confidence levels
 */
export function createMixedConfidenceStructure(
  options: {
    format: DocumentFormat;
    highConfidenceCount?: number;
    mediumConfidenceCount?: number;
    lowConfidenceCount?: number;
  } = { format: 'markdown' }
): {
  format: DocumentFormat;
  content: string;
  metadata: { title: string };
  nodes: DocumentNode[];
  averageConfidence: number;
} {
  const {
    format,
    highConfidenceCount = 3,
    mediumConfidenceCount = 3,
    lowConfidenceCount = 2,
  } = options;

  const nodes: DocumentNode[] = [];

  // High confidence chapters
  for (let i = 0; i < highConfidenceCount; i++) {
    nodes.push(
      createStructureChapter({
        title: `Chapter ${i + 1}: Well-Formatted Structure`,
        confidence: faker.number.float({ min: 0.85, max: 0.99 }),
      })
    );
  }

  // Medium confidence chapters
  for (let i = 0; i < mediumConfidenceCount; i++) {
    nodes.push(
      createStructureChapter({
        title: `Chapter ${highConfidenceCount + i + 1}: Some Formatting Issues`,
        confidence: faker.number.float({ min: 0.5, max: 0.84 }),
      })
    );
  }

  // Low confidence chapters
  for (let i = 0; i < lowConfidenceCount; i++) {
    nodes.push(
      createStructureChapter({
        title: faker.datatype.boolean() ? '?' : faker.word.words({ count: 1 }),
        confidence: faker.number.float({ min: 0.1, max: 0.49 }),
      })
    );
  }

  return {
    format,
    content: faker.lorem.text(),
    metadata: { title: 'Mixed Confidence Document' },
    nodes,
    averageConfidence:
      nodes.reduce(
        (sum: number, node: DocumentNode) => sum + (node.confidence || 0),
        0
      ) / nodes.length,
  };
}
