/**
 * Streaming functionality for large document processing.
 * Provides memory-efficient processing of large Markdown files.
 */

import type {
  DocumentStructure,
  DocumentStream,
  DocumentChunk,
  Paragraph,
  Sentence,
} from '../types.js';
import type { MarkdownParser } from './markdown-parser.js';

// Constants to avoid magic numbers
const DEFAULT_CHUNK_SIZE = 100;
const MAX_PROGRESS_PERCENTAGE = 100;
const DEFAULT_PROGRESS_PERCENTAGE = 0;
const DEFAULT_CONFIDENCE = 1.0;
const DEFAULT_STRUCTURE_CONFIDENCE = 0.8;
const DEFAULT_ESTIMATED_DURATION = 60;

// Interface for index tracking object
interface IndexTracker {
  value: number;
}

/**
 * Create metadata chunk with document information
 * @param content - The document content
 * @param parser - The parser instance to extract metadata
 * @returns A metadata chunk
 */
const createMetadataChunk = (
  content: string,
  parser: MarkdownParser
): DocumentChunk => {
  // Use parser's metadata extraction for consistency
  const metadata = parser.extractBasicMetadata(content);

  return {
    id: 'metadata-0',
    position: 0,
    type: 'metadata',
    progress: DEFAULT_PROGRESS_PERCENTAGE,
    metadata,
  };
};

/**
 * Create a sentence object for a chunk
 * @param text - The sentence text
 * @returns A sentence object
 */
const createSentence = (text: string): Sentence => ({
  id: 'sentence-1',
  text,
  position: 0,
  wordCount: text.split(/\s+/).length,
  estimatedDuration: 0,
  hasFormatting: false,
});

/**
 * Create a paragraph object for a chunk
 * @param chunkContent - The chunk content
 * @param chunkIndex - The chunk index
 * @returns A paragraph object
 */
const createParagraph = (
  chunkContent: string,
  chunkIndex: number
): Paragraph => ({
  id: `chunk-${chunkIndex}`,
  type: 'text',
  sentences: [createSentence(chunkContent)],
  position: chunkIndex,
  wordCount: chunkContent.split(/\s+/).length,
  rawText: chunkContent,
  includeInAudio: true,
  confidence: DEFAULT_CONFIDENCE,
});

/**
 * Create a content chunk from lines
 * @param lines - The lines to include in the chunk
 * @param currentIndex - Current index in the document
 * @param chunkSize - Size of the chunk
 * @returns A content chunk
 */
const createContentChunk = (
  lines: string[],
  currentIndex: number,
  chunkSize: number
): DocumentChunk => {
  const chunkContent = lines.join('\n');
  const chunkIndex = Math.floor(currentIndex / chunkSize);

  return {
    id: `chunk-${chunkIndex}`,
    position: currentIndex,
    type: 'paragraphs',
    progress: (currentIndex / lines.length) * MAX_PROGRESS_PERCENTAGE,
    paragraphs: [createParagraph(chunkContent, chunkIndex)],
  };
};

/**
 * Create completion chunk indicating processing is done
 * @param totalLines - Total number of lines in the document
 * @returns A completion chunk
 */
const createCompletionChunk = (totalLines: number): DocumentChunk => {
  return {
    id: 'chapter-complete',
    position: totalLines,
    type: 'chapter',
    progress: MAX_PROGRESS_PERCENTAGE,
    chapter: {
      id: 'complete',
      title: 'Document Complete',
      paragraphs: [],
      position: 0,
      wordCount: 0,
      estimatedDuration: 0,
      startPosition: 0,
      endPosition: totalLines,
      level: 1,
    },
  };
};

/**
 * Generate content chunks from document lines
 * @param lines - All document lines
 * @param chunkSize - Size of each chunk in lines
 * @param currentIndex - Starting index object with value property (will be modified)
 * @returns Async generator of content chunks
 */
async function* generateContentChunks(
  lines: string[],
  chunkSize: number,
  currentIndex: IndexTracker
): AsyncGenerator<DocumentChunk> {
  while (currentIndex.value < lines.length) {
    const chunkLines = lines.slice(
      currentIndex.value,
      currentIndex.value + chunkSize
    );

    yield createContentChunk(chunkLines, currentIndex.value, chunkSize);

    currentIndex.value += chunkSize;
  }
}

/**
 * Generate chapter chunks from parsed content
 * @param content - The document content
 * @param parser - The parser instance to use for parsing
 * @returns Async generator of chapter chunks
 */
async function* generateChapterChunks(
  content: string,
  parser: MarkdownParser
): AsyncGenerator<DocumentChunk> {
  // Parse the content to get actual chapters
  const result = await parser.parse(content);

  if (result.success) {
    const structure = result.data;

    // Yield a chunk for each chapter
    for (let i = 0; i < structure.chapters.length; i++) {
      const chapter = structure.chapters[i];
      const progress =
        ((i + 1) / structure.chapters.length) * MAX_PROGRESS_PERCENTAGE;

      yield {
        id: `chapter-${i}`,
        position: i,
        type: 'chapter',
        progress,
        chapter,
      };
    }
  }
}

/**
 * Create basic document structure
 * @param content - The document content
 * @param parser - The parser instance to extract metadata
 * @returns A document structure
 */
const createBasicDocumentStructure = (
  content: string,
  parser: MarkdownParser
): DocumentStructure => {
  const wordCount = content.split(/\s+/).length;
  const now = new Date();

  // Use parser's metadata extraction for consistency
  const metadata = parser.extractBasicMetadata(content);

  return {
    metadata,
    chapters: [],
    totalParagraphs: 0,
    totalSentences: 0,
    confidence: DEFAULT_STRUCTURE_CONFIDENCE,
    estimatedTotalDuration: DEFAULT_ESTIMATED_DURATION,
    processingMetrics: {
      parseStartTime: now,
      parseEndTime: now,
      parseDurationMs: 0,
      sourceLength: content.length,
      processingErrors: [],
    },
    totalWordCount: wordCount,
  };
};

/**
 * Create a document stream for processing large files
 * @param input - The input content as string or Buffer to be processed
 * @param parser - The parser instance to use for processing
 * @returns A document stream that provides chunks and structure information
 */
export const createStream = (
  input: string | Buffer,
  parser: MarkdownParser
): DocumentStream => {
  const content = typeof input === 'string' ? input : input.toString('utf-8');
  const lines = content.split('\n');
  const currentIndex: IndexTracker = { value: 0 };

  return {
    async *chunks(): AsyncGenerator<DocumentChunk> {
      // Emit metadata chunk
      yield createMetadataChunk(content, parser);

      // Emit actual chapter chunks from parsed content
      yield* generateChapterChunks(content, parser);

      // Process remaining content in chunks if needed
      yield* generateContentChunks(lines, DEFAULT_CHUNK_SIZE, currentIndex);

      // Emit completion chunk
      yield createCompletionChunk(lines.length);
    },

    async getStructure(): Promise<DocumentStructure> {
      // Return the actual parsed structure instead of a basic one
      const result = await parser.parse(content);
      if (result.success) {
        return result.data;
      }
      // Fallback to basic structure if parsing fails
      return createBasicDocumentStructure(content, parser);
    },
  };
};
