/**
 * Streaming functionality for large document processing.
 * Provides memory-efficient processing of large Markdown files.
 */

import { logger, type LogContext } from '../../../utils/logger.js';
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
const MAX_CHUNK_PROGRESS = 90;
const SINGLE_CHAPTER_PROGRESS = 80;
const MULTI_CHAPTER_MAX_PROGRESS = 85;

// Interface for index tracking object
interface IndexTracker {
  value: number;
}

/**
 * Create metadata chunk with document information
 * @param {string} content - The document content
 * @param {MarkdownParser} parser - The parser instance to extract metadata
 * @returns {DocumentChunk} A metadata chunk
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
 * @param {string} text - The sentence text
 * @returns {Sentence} A sentence object
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
 * @param {string} chunkContent - The chunk content
 * @param {number} chunkIndex - The chunk index
 * @returns {Paragraph} A paragraph object
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
  text: chunkContent, // For compatibility with Paragraph interface
  includeInAudio: true,
  confidence: DEFAULT_CONFIDENCE,
});

/**
 * Create a content chunk from lines
 * @param {string[]} lines - The lines to include in the chunk
 * @param {number} currentIndex - Current index in the document
 * @param {number} chunkSize - Size of the chunk
 * @param {number} totalLines - Total number of lines in the document
 * @returns {DocumentChunk} A content chunk
 */
const createContentChunk = (
  lines: string[],
  currentIndex: number,
  chunkSize: number,
  totalLines: number
): DocumentChunk => {
  const chunkContent = lines.join('\n');
  const chunkIndex = Math.floor(currentIndex / chunkSize);

  // Calculate progress ensuring it's always > 0 when there's content and capped below 100
  const rawProgress =
    lines.length > 0
      ? ((currentIndex + lines.length) / totalLines) * MAX_PROGRESS_PERCENTAGE
      : 0;
  const progress =
    lines.length > 0
      ? Math.max(Math.min(rawProgress, MAX_CHUNK_PROGRESS), 1) // Cap at 90% to leave room for completion
      : 0;

  return {
    id: `chunk-${chunkIndex}`,
    position: currentIndex,
    type: 'paragraphs',
    progress,
    paragraphs: [createParagraph(chunkContent, chunkIndex)],
  };
};

/**
 * Create completion chunk indicating processing is done
 * @param {number} totalLines - Total number of lines in the document
 * @returns {DocumentChunk} A completion chunk
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
      startIndex: 0, // For compatibility with Chapter interface
      level: 1,
    },
  };
};

/**
 * Generate content chunks from document lines
 * @param {string[]} lines - All document lines
 * @param {number} chunkSize - Size of each chunk in lines
 * @param {IndexTracker} currentIndex - Starting index object with value property (will be modified)
 * @returns {AsyncGenerator<DocumentChunk>} Async generator of content chunks
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

    yield createContentChunk(
      chunkLines,
      currentIndex.value,
      chunkSize,
      lines.length
    );

    currentIndex.value += chunkSize;
  }
}

/**
 * Generate chapter chunks from parsed content
 * @param {string} content - The document content
 * @param {MarkdownParser} parser - The parser instance to use for parsing
 * @returns {AsyncGenerator<DocumentChunk>} Async generator of chapter chunks
 */
async function* generateChapterChunks(
  content: string,
  parser: MarkdownParser
): AsyncGenerator<DocumentChunk> {
  try {
    // Parse the content to get actual chapters
    const result = await parser.parse(content);

    if (result.success) {
      const structure = result.data;

      // Yield a chunk for each chapter
      for (let i = 0; i < structure.chapters.length; i++) {
        const chapter = structure.chapters[i];
        // Calculate progress to leave room for completion chunk, ensuring intermediate progress is < 100
        const progress =
          structure.chapters.length === 1
            ? SINGLE_CHAPTER_PROGRESS // Single chapter gets 80% to leave room for other chunks
            : ((i + 1) / structure.chapters.length) *
              MULTI_CHAPTER_MAX_PROGRESS; // Scale to max 85% to leave room for completion

        yield {
          id: `chapter-${i}`,
          position: i,
          type: 'chapter',
          progress,
          chapter,
        };
      }
    }
  } catch (error) {
    // Use logger instead of console for error handling
    logger.warn('Chapter generation failed:', error as LogContext);
    // Don't yield anything on error - let the stream continue with other chunks
    // This prevents unhandled errors from breaking the stream
  }
}

/**
 * Create basic document structure
 * @param {string} content - The document content
 * @param {MarkdownParser} parser - The parser instance to extract metadata
 * @returns {DocumentStructure} A document structure
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
    totalChapters: 0, // For compatibility with DocumentStructure interface
  };
};

/**
 * Create a document stream for processing large files
 * @param {string|Buffer} input - The input content as string or Buffer to be processed
 * @param {MarkdownParser} parser - The parser instance to use for processing
 * @returns {DocumentStream} A document stream that provides chunks and structure information
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
      try {
        // Return the actual parsed structure instead of a basic one
        const result = await parser.parse(content);
        if (result.success) {
          return result.data;
        }
      } catch (error) {
        // Log error but continue with fallback
        logger.warn(
          'Failed to parse content for structure, using fallback',
          error as LogContext
        );
      }
      // Fallback to basic structure if parsing fails
      return createBasicDocumentStructure(content, parser);
    },
  };
};
