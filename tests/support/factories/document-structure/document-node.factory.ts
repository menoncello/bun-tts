/**
 * Document Node Factory
 * Factory functions for creating document structure test data with faker
 */

import { faker } from '@faker-js/faker';

// Types based on story requirements
export type DocumentNodeType =
  | 'document'
  | 'chapter'
  | 'section'
  | 'paragraph'
  | 'sentence';

export interface DocumentNode {
  id: string;
  type: DocumentNodeType;
  level: number;
  title?: string;
  content: string;
  startPosition: number;
  endPosition: number;
  children: DocumentNode[];
  parent?: DocumentNode;
  confidenceScore: number;
  metadata: Record<string, unknown>;
}

export interface ConfidenceScore {
  overall: number;
  chapterDetection: number;
  sectionDetection: number;
  paragraphDetection: number;
  sentenceDetection: number;
}

/**
 * Get the hierarchical level for a document node based on its type
 */
const getDocumentNodeLevel = (nodeType: DocumentNodeType): number => {
  switch (nodeType) {
    case 'document':
      return 0;
    case 'chapter':
      return 1;
    case 'section':
      return 2;
    case 'paragraph':
      return 3;
    case 'sentence':
      return 4;
    default:
      return 0;
  }
};

/**
 * Get default title for a document node based on its type
 */
const getDefaultTitle = (nodeType: DocumentNodeType): string | undefined => {
  if (nodeType === 'paragraph' || nodeType === 'sentence') {
    return undefined;
  }
  return faker.lorem.sentence();
};

/**
 * Get random node type from available types
 */
const getRandomNodeType = (): DocumentNodeType =>
  faker.helpers.arrayElement<DocumentNodeType>([
    'chapter',
    'section',
    'paragraph',
    'sentence',
  ]);

/**
 * Build default values for a document node
 */
const buildDocumentNodeDefaults = (
  nodeType: DocumentNodeType
): Required<
  Pick<
    DocumentNode,
    | 'level'
    | 'title'
    | 'content'
    | 'startPosition'
    | 'endPosition'
    | 'children'
    | 'confidenceScore'
    | 'metadata'
  >
> => ({
  level: getDocumentNodeLevel(nodeType),
  title: getDefaultTitle(nodeType) || '',
  content: faker.lorem.paragraph(),
  startPosition: faker.number.int({ min: 0, max: 10000 }),
  endPosition: faker.number.int({ min: 100, max: 11000 }),
  children: [],
  confidenceScore: faker.number.float({
    min: 0.5,
    max: 1.0,
    fractionDigits: 2,
  }),
  metadata: {},
});

/**
 * Merge overrides with defaults for document node properties
 */
const mergeDocumentNodeValues = (
  nodeType: DocumentNodeType,
  overrides: Partial<DocumentNode>
): Required<
  Pick<
    DocumentNode,
    | 'level'
    | 'title'
    | 'content'
    | 'startPosition'
    | 'endPosition'
    | 'children'
    | 'confidenceScore'
    | 'metadata'
  >
> => {
  const defaults = buildDocumentNodeDefaults(nodeType);

  return {
    level: overrides.level ?? defaults.level,
    title: overrides.title ?? defaults.title,
    content: overrides.content ?? defaults.content,
    startPosition: overrides.startPosition ?? defaults.startPosition,
    endPosition: overrides.endPosition ?? defaults.endPosition,
    children: overrides.children ?? defaults.children,
    confidenceScore: overrides.confidenceScore ?? defaults.confidenceScore,
    metadata: overrides.metadata ?? defaults.metadata,
  };
};

/**
 * Create a single document node with sensible defaults
 */
export const createDocumentNode = (
  overrides: Partial<DocumentNode> = {}
): DocumentNode => {
  const nodeType = overrides.type || getRandomNodeType();
  const values = mergeDocumentNodeValues(nodeType, overrides);

  return {
    id: faker.string.uuid(),
    type: nodeType,
    parent: overrides.parent,
    ...values,
  };
};

/**
 * Create multiple document nodes of the same type
 */
export const createDocumentNodes = (
  count: number,
  overrides: Partial<DocumentNode> = {}
): DocumentNode[] => {
  return Array.from({ length: count }, () => createDocumentNode(overrides));
};

/**
 * Create a document tree with hierarchical structure
 */
export const createDocumentTree = (
  overrides: {
    chapters?: number;
    sectionsPerChapter?: number;
    paragraphsPerSection?: number;
    sentencesPerParagraph?: number;
  } = {}
): DocumentNode => {
  const {
    chapters = faker.number.int({ min: 2, max: 5 }),
    sectionsPerChapter = faker.number.int({ min: 2, max: 4 }),
    paragraphsPerSection = faker.number.int({ min: 3, max: 6 }),
    sentencesPerParagraph = faker.number.int({ min: 3, max: 8 }),
  } = overrides;

  // Create document root
  const document = createDocumentNode({
    type: 'document',
    level: 0,
    title: faker.lorem.words({ min: 3, max: 6 }),
    content: '',
    confidenceScore: 1.0,
  });

  // Create chapters
  const chaptersArray = Array.from({ length: chapters }, (_, chapterIndex) => {
    const chapter = createDocumentNode({
      type: 'chapter',
      level: 1,
      title: `Chapter ${chapterIndex + 1}: ${faker.lorem.sentence()}`,
      content: faker.lorem.paragraphs({ min: 5, max: 10 }),
      parent: document,
      confidenceScore: faker.number.float({
        min: 0.7,
        max: 1.0,
        fractionDigits: 2,
      }),
    });

    // Create sections for each chapter
    const sections = Array.from(
      { length: sectionsPerChapter },
      (_, sectionIndex) => {
        const section = createDocumentNode({
          type: 'section',
          level: 2,
          title: `Section ${sectionIndex + 1}: ${faker.lorem.sentence()}`,
          content: faker.lorem.paragraphs({ min: 2, max: 4 }),
          parent: chapter,
          confidenceScore: faker.number.float({
            min: 0.6,
            max: 0.9,
            fractionDigits: 2,
          }),
        });

        // Create paragraphs for each section
        const paragraphs = Array.from({ length: paragraphsPerSection }, () => {
          const paragraph = createDocumentNode({
            type: 'paragraph',
            level: 3,
            content: faker.lorem.paragraph(),
            parent: section,
            confidenceScore: faker.number.float({
              min: 0.5,
              max: 0.8,
              fractionDigits: 2,
            }),
          });

          // Create sentences for each paragraph
          const sentences = Array.from({ length: sentencesPerParagraph }, () =>
            createDocumentNode({
              type: 'sentence',
              level: 4,
              content: faker.lorem.sentence(),
              parent: paragraph,
              confidenceScore: faker.number.float({
                min: 0.4,
                max: 0.7,
                fractionDigits: 2,
              }),
            })
          );

          paragraph.children = sentences;
          return paragraph;
        });

        section.children = paragraphs;
        return section;
      }
    );

    chapter.children = sections;
    return chapter;
  });

  document.children = chaptersArray;
  return document;
};

/**
 * Create confidence score object
 */
export const createConfidenceScore = (
  overrides: Partial<ConfidenceScore> = {}
): ConfidenceScore => {
  return {
    overall:
      overrides.overall ??
      faker.number.float({ min: 0.5, max: 1.0, fractionDigits: 2 }),
    chapterDetection:
      overrides.chapterDetection ??
      faker.number.float({ min: 0.6, max: 1.0, fractionDigits: 2 }),
    sectionDetection:
      overrides.sectionDetection ??
      faker.number.float({ min: 0.5, max: 0.9, fractionDigits: 2 }),
    paragraphDetection:
      overrides.paragraphDetection ??
      faker.number.float({ min: 0.4, max: 0.8, fractionDigits: 2 }),
    sentenceDetection:
      overrides.sentenceDetection ??
      faker.number.float({ min: 0.3, max: 0.7, fractionDigits: 2 }),
  };
};

/**
 * Create edge case document nodes with low confidence or irregular structure
 */
export const createEdgeCaseDocument = (
  overrides: {
    missingHeaders?: boolean;
    irregularFormatting?: boolean;
    lowConfidence?: boolean;
  } = {}
): DocumentNode => {
  const {
    missingHeaders = false,
    irregularFormatting = false,
    lowConfidence = false,
  } = overrides;

  const confidenceBase = lowConfidence
    ? faker.number.float({ min: 0.1, max: 0.5, fractionDigits: 2 })
    : undefined;

  const document = createDocumentNode({
    type: 'document',
    level: 0,
    title: missingHeaders ? undefined : faker.lorem.sentence(),
    confidenceScore: confidenceBase,
  });

  // Create chapters with missing titles if specified
  const chapters = Array.from(
    { length: faker.number.int({ min: 2, max: 4 }) },
    () => {
      return createDocumentNode({
        type: 'chapter',
        level: 1,
        title: missingHeaders ? undefined : faker.lorem.sentence(),
        content: irregularFormatting
          ? faker.lorem.text()
          : faker.lorem.paragraph(),
        parent: document,
        confidenceScore: confidenceBase,
      });
    }
  );

  document.children = chapters;
  return document;
};

/**
 * Create parse options for structure analysis
 */
export interface StructureParseOptions {
  enableChapterDetection: boolean;
  enableSectionDetection: boolean;
  enableParagraphDetection: boolean;
  enableSentenceDetection: boolean;
  confidenceThreshold: number;
  streamingMode: boolean;
  format: 'markdown' | 'pdf' | 'epub';
}

export const createStructureParseOptions = (
  overrides: Partial<StructureParseOptions> = {}
): StructureParseOptions => {
  return {
    enableChapterDetection: overrides.enableChapterDetection ?? true,
    enableSectionDetection: overrides.enableSectionDetection ?? true,
    enableParagraphDetection: overrides.enableParagraphDetection ?? true,
    enableSentenceDetection: overrides.enableSentenceDetection ?? true,
    confidenceThreshold: overrides.confidenceThreshold ?? 0.5,
    streamingMode: overrides.streamingMode ?? false,
    format:
      overrides.format ??
      faker.helpers.arrayElement(['markdown', 'pdf', 'epub']),
  };
};
