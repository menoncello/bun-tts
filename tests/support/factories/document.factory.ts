/**
 * Document Factory for generating test data
 *
 * Provides factory functions for creating:
 * - Document structures
 * - Chapter data
 * - Paragraph content
 * - Various markdown elements
 */

export interface DocumentStructureOverrides {
  chapters?: ChapterData[];
  paragraphs?: ParagraphData[];
  codeBlocks?: CodeBlockData[];
  tables?: TableData[];
  lists?: ListData[];
  confidence?: number;
  warnings?: string[];
  metadata?: DocumentMetadata;
}

export interface ChapterData {
  title: string;
  level: number;
  content: string;
  startPosition: number;
  endPosition: number;
}

export interface ParagraphData {
  content: string;
  sentences: string[];
  startPosition: number;
  endPosition: number;
}

export interface CodeBlockData {
  type: 'inline' | 'fenced' | 'indented';
  language?: string;
  content: string;
  startPosition: number;
  endPosition: number;
}

export interface TableData {
  headers: string[];
  rows: string[][];
  startPosition: number;
  endPosition: number;
}

export interface ListData {
  type: 'ordered' | 'unordered';
  items: string[];
  startPosition: number;
  endPosition: number;
}

export interface DocumentMetadata {
  title?: string;
  author?: string;
  date?: string;
  wordCount?: number;
  paragraphCount?: number;
  chapterCount?: number;
}

/**
 * Create document structure with optional overrides
 */
export const createDocumentStructure = (
  overrides: DocumentStructureOverrides = {}
) => ({
  chapters: overrides.chapters || createChapters(2),
  paragraphs: overrides.paragraphs || createParagraphs(5),
  codeBlocks: overrides.codeBlocks || createCodeBlocks(1),
  tables: overrides.tables || createTables(1),
  lists: overrides.lists || createLists(1),
  confidence: overrides.confidence ?? 0.95,
  warnings: overrides.warnings || [],
  metadata: overrides.metadata || createDocumentMetadata(),
});

/**
 * Create array of chapters
 */
export const createChapters = (count: number, baseIndex = 1): ChapterData[] =>
  Array.from({ length: count }, (_, i) => createChapter(baseIndex + i));

/**
 * Create single chapter
 */
export const createChapter = (index: number): ChapterData => ({
  title: `Chapter ${index}: Test Content`,
  level: 2,
  content: `This is the content for chapter ${index}. It contains multiple sentences to demonstrate proper parsing. The content should be realistic and varied.`,
  startPosition: index * 100,
  endPosition: index * 100 + 50,
});

/**
 * Create array of paragraphs
 */
export const createParagraphs = (
  count: number,
  baseIndex = 1
): ParagraphData[] =>
  Array.from({ length: count }, (_, i) => createParagraph(baseIndex + i));

/**
 * Create single paragraph
 */
export const createParagraph = (index: number): ParagraphData => ({
  content: `This is paragraph ${index}. It contains multiple sentences to test sentence boundary detection. The parsing should handle various punctuation marks correctly.`,
  sentences: [
    `This is paragraph ${index}.`,
    `It contains multiple sentences to test sentence boundary detection.`,
    `The parsing should handle various punctuation marks correctly.`,
  ],
  startPosition: index * 50,
  endPosition: index * 50 + 30,
});

/**
 * Create array of code blocks
 */
export const createCodeBlocks = (
  count: number,
  baseIndex = 1
): CodeBlockData[] =>
  Array.from({ length: count }, (_, i) => createCodeBlock(baseIndex + i));

/**
 * Create single code block
 */
export const createCodeBlock = (index: number): CodeBlockData => ({
  type: 'fenced',
  language: 'javascript',
  content: `function test${index}() {\n  console.log("Test code block ${index}");\n  return true;\n}`,
  startPosition: index * 25,
  endPosition: index * 25 + 15,
});

/**
 * Create array of tables
 */
export const createTables = (count: number, baseIndex = 1): TableData[] =>
  Array.from({ length: count }, (_, i) => createTable(baseIndex + i));

/**
 * Create single table
 */
export const createTable = (index: number): TableData => ({
  headers: ['Name', 'Type', 'Value'],
  rows: [
    [`Item ${index}.1`, 'Type A', `Value ${index}.1`],
    [`Item ${index}.2`, 'Type B', `Value ${index}.2`],
  ],
  startPosition: index * 30,
  endPosition: index * 30 + 20,
});

/**
 * Create array of lists
 */
export const createLists = (count: number, baseIndex = 1): ListData[] =>
  Array.from({ length: count }, (_, i) => createList(baseIndex + i));

/**
 * Create single list
 */
export const createList = (index: number): ListData => ({
  type: index % 2 === 0 ? 'ordered' : 'unordered',
  items: [
    `List item ${index}.1`,
    `List item ${index}.2`,
    `List item ${index}.3`,
  ],
  startPosition: index * 15,
  endPosition: index * 15 + 10,
});

/**
 * Create document metadata
 */
export const createDocumentMetadata = (): DocumentMetadata => ({
  title: 'Test Document',
  author: 'Test Author',
  date: '2025-10-27',
  wordCount: 250,
  paragraphCount: 5,
  chapterCount: 2,
});

/**
 * Create markdown content string from structure
 */
export const createMarkdownContent = (
  overrides: DocumentStructureOverrides = {}
): string => {
  const doc = createDocumentStructure(overrides);
  let content = '';

  content += addDocumentTitle(doc.metadata);
  content += addDocumentMetadata(doc.metadata);
  content += addChaptersAndContent(doc);

  return content;
};

function addDocumentTitle(metadata: DocumentMetadata): string {
  if (!metadata.title) return '';
  return `# ${metadata.title}\n\n`;
}

function addDocumentMetadata(metadata: DocumentMetadata): string {
  if (!metadata.author && !metadata.date) return '';

  let content = '';
  if (metadata.author) content += `Author: ${metadata.author}\n`;
  if (metadata.date) content += `Date: ${metadata.date}\n`;
  return `${content}\n`;
}

function addChaptersAndContent(doc: any): string {
  const { chapters, paragraphs, codeBlocks, tables, lists } = doc;
  let content = '';
  let paraIndex = 0;

  chapters.forEach((chapter: any, i: number) => {
    content += `## ${chapter.title}\n\n`;
    content += `${chapter.content}\n\n`;

    // Add a paragraph
    if (paraIndex < paragraphs.length) {
      content += `${paragraphs[paraIndex].content}\n\n`;
      paraIndex++;
    }

    // Add a code block
    content += addCodeBlock(codeBlocks[i]);

    // Add a list
    content += addList(lists[i]);

    // Add a table
    content += addTable(tables[i]);
  });

  return content;
}

function addCodeBlock(codeBlock: any): string {
  if (!codeBlock || codeBlock.type !== 'fenced') return '';

  return `\`\`\`${codeBlock.language || ''}\n${codeBlock.content}\n\`\`\`\n\n`;
}

function addList(list: any): string {
  if (!list) return '';

  let content = '';
  list.items.forEach((item: string) => {
    const prefix = list.type === 'ordered' ? '1. ' : '* ';
    content += `${prefix}${item}\n`;
  });
  return `${content}\n`;
}

function addTable(table: any): string {
  if (!table) return '';

  const headerRow = `| ${table.headers.join(' | ')} |`;
  const separatorRow = `| ${table.headers.map(() => '---').join(' | ')} |`;
  let content = `${headerRow}\n${separatorRow}\n`;

  table.rows.forEach((row: string[]) => {
    content += `| ${row.join(' | ')} |\n`;
  });

  return `${content}\n`;
}

/**
 * Create malformed markdown content for error testing
 */
export const createMalformedMarkdownContent = (): string => {
  return `# Malformed Document

##Chapter without space

\`\`\`javascript
function unclosed() {
  console.log("This code block never closes

| Column 1 | Column 2
| --- (incomplete separator)
| Row 1 cell 1 | Row 1 cell 2 | Extra cell

- List without proper spacing
 Another list item

[Unclosed link](http://example.com

More broken content...
`;
};

/**
 * Create complex mixed content for comprehensive testing
 */
export const createComplexMarkdownContent = (): string => {
  return [
    createDocumentHeaderWithMetadata(),
    createChapterOne(),
    createChapterTwo(),
    createChapterThree(),
    createConclusion(),
  ].join('\n');
};

function createDocumentHeaderWithMetadata(): string {
  return `# Complex Technical Document

Author: Technical Writer
Date: 2025-10-27`;
}

function createChapterOne(): string {
  return `## Chapter 1: Introduction

This document demonstrates various markdown features that need to be parsed correctly. It includes multiple types of content and formatting.

### Section 1.1: Code Examples

Here is some inline \`code\` text for testing inline code block detection.

\`\`\`javascript
function example() {
  return "This is a code example";
}
\`\`\`

### Section 1.2: Lists and Tables

Features include:
- Markdown parsing with high accuracy
- Support for various content types
- Error resilience and recovery
- Performance optimization

| Feature | Status | Priority |
|---------|--------|----------|
| Chapter Detection | Complete | High |
| Sentence Parsing | In Progress | High |
| Error Recovery | Planned | Medium |`;
}

function createChapterTwo(): string {
  return `## Chapter 2: Advanced Topics

This chapter covers more complex scenarios that the parser needs to handle.

### 2.1 Edge Cases

The parser should handle edge cases like:
- Nested lists with proper indentation
  - Subitem 1
  - Subitem 2
    - Deeply nested item
- Mixed content types
- Unicode characters: áéíóú, 中文, русский

### 2.2 Error Scenarios

Even with malformed content, the parser should be resilient:

\`\`\`python
def example():
    print("Unclosed code block example")
    # This block never closes in the test

> This is a blockquote that might be
> improperly formatted but should still
> be handled gracefully.`;
}

function createChapterThree(): string {
  return `## Chapter 3: Performance Considerations

Large documents should be processed efficiently. The parser needs to handle:
- Files up to 10MB in size
- Thousands of paragraphs
- Complex nested structures

### 3.1 Memory Management

Efficient memory usage is critical for processing large documents without running out of resources.

### 3.2 Streaming Architecture

For very large files, consider implementing a streaming approach to avoid loading the entire document into memory at once.`;
}

function createConclusion(): string {
  return `## Conclusion

This document demonstrates the variety of content that the markdown parser needs to handle correctly and efficiently.`;
}

/**
 * Factory presets for common test scenarios
 */
export const DocumentFactoryPresets = {
  /**
   * Simple document with basic chapters and paragraphs
   */
  simple: () =>
    createMarkdownContent({
      chapters: createChapters(2),
      paragraphs: createParagraphs(3),
      confidence: 1.0,
      warnings: [],
    }),

  /**
   * Complex document with all content types
   */
  complex: () => createComplexMarkdownContent(),

  /**
   * Malformed document for error testing
   */
  malformed: () => createMalformedMarkdownContent(),

  /**
   * Large document for performance testing
   */
  large: () => {
    const chapters = createChapters(50); // 50 chapters
    const paragraphs = createParagraphs(200); // 200 paragraphs
    return createMarkdownContent({ chapters, paragraphs });
  },

  /**
   * Document with low confidence for testing confidence scoring
   */
  lowConfidence: () =>
    createMarkdownContent({
      confidence: 0.3,
      warnings: [
        'unclosed-code-block',
        'malformed-table',
        'invalid-header-format',
      ],
    }),
};

/**
 * Type helper for Result pattern testing
 */
export type TestParseResult<T = any> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error: Error;
    };

/**
 * Create successful parse result
 */
export const createSuccessfulParseResult = <T>(
  data: T
): TestParseResult<T> => ({
  success: true,
  data,
});

/**
 * Create failed parse result
 */
export const createFailedParseResult = (error: Error): TestParseResult => ({
  success: false,
  error,
});
