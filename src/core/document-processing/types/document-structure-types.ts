/**
 * Document structure types for comprehensive document representation.
 * Provides interfaces for hierarchical document content organization.
 */

import { TableOfContentsItem } from './epub-types';
import { MarkdownElement } from './markdown-types';

/**
 * Document metadata extracted from parsed content
 */
export interface DocumentMetadata {
  /** Title extracted from first h1 or filename */
  title: string;
  /** Author information if available */
  author?: string;
  /** Publisher information if available */
  publisher?: string;
  /** Document identifier (ISBN, UUID, etc.) */
  identifier?: string;
  /** Document creation/modification dates */
  created?: Date;
  modified?: Date;
  /** Alternative date property names for compatibility */
  createdDate?: Date;
  modifiedDate?: Date;
  /** Document publication date */
  date?: string;
  /** Total word count in document */
  wordCount: number;
  /** Total word count in document (alias for compatibility) */
  totalWords?: number;
  /** Document language detection result */
  language?: string;
  /** Total character count in document */
  characterCount?: number;
  /** Page count for PDF documents */
  pageCount?: number;
  /** Total character count in document (alias for compatibility) */
  totalCharacters?: number;
  /** Total chapter count in document (alias for compatibility) */
  totalChapters?: number;
  /** Estimated duration for TTS processing (seconds) */
  estimatedDuration?: number;
  /** Encoding information for PDF processing */
  encoding?: string;
  /** Additional custom metadata */
  customMetadata: Record<string, unknown>;
  /** EPUB version (for EPUB documents) */
  version?: string;
  /** Document description or summary */
  description?: string;
  /** Estimated reading time in minutes */
  estimatedReadingTime?: number;
  /** Chapter count in document */
  chapterCount?: number;
  /** Layout information for PDF processing */
  layoutInfo?: {
    hasColumns: boolean;
    hasTables: boolean;
    hasImages: boolean;
    pageOrientation: 'portrait' | 'landscape';
    columnCount?: number;
    pageSize?: {
      width: number;
      height: number;
      unit: string;
    };
  };
  /** Encoding information for PDF processing */
  encodingInfo?: {
    detectedEncoding: string;
    confidence: number;
    hasBOM: boolean;
  };
  /** Security information for PDF processing */
  securityInfo?: {
    isEncrypted: boolean;
    hasPassword: boolean;
    permissions: string[];
  };
  /** Document format (for compatibility) */
  format?: string;
  /** Page size information (for compatibility) */
  pageSize?: {
    width: number;
    height: number;
    unit: string;
  };
  /** File path for document processing */
  filePath?: string;
}

/**
 * Individual sentence within a paragraph
 */
export interface Sentence {
  /** Sequential sentence number within paragraph */
  id: string;
  /** The actual sentence text */
  text: string;
  /** Position of sentence in paragraph (0-based) */
  position: number;
  /** Word count in this sentence */
  wordCount: number;
  /** Estimated duration for TTS processing (seconds) */
  estimatedDuration: number;
  /** Whether sentence contains special formatting (code, emphasis, etc.) */
  hasFormatting: boolean;
  /** Character range in original document */
  charRange?: {
    start: number;
    end: number;
  };
  /** Document position metadata */
  documentPosition?: {
    chapter: number;
    paragraph: number;
    sentence: number;
    startChar: number;
    endChar: number;
  };
}

/**
 * Individual paragraph within a chapter
 */
export interface Paragraph {
  /** Unique paragraph identifier */
  id: string;
  /** Type of paragraph content */
  type: 'text' | 'code' | 'blockquote' | 'list' | 'table' | 'heading';
  /** All sentences in this paragraph */
  sentences: Sentence[];
  /** Position of paragraph in chapter (0-based) */
  position: number;
  /** Word count in this paragraph */
  wordCount: number;
  /** Raw text content (sentences joined) */
  rawText: string;
  /** Whether paragraph should be included in TTS processing */
  includeInAudio: boolean;
  /** Confidence score for paragraph structure detection (0-1) */
  confidence: number;
  /** Paragraph text (for compatibility) */
  text: string;
  /** Character range in original document */
  charRange?: {
    start: number;
    end: number;
  };
  /** Document position metadata */
  documentPosition?: {
    chapter: number;
    paragraph: number;
    startChar: number;
    endChar: number;
  };
  /** Content type for classification */
  contentType?: string;
}

/**
 * Individual chapter in the document
 */
export interface Chapter {
  /** Unique chapter identifier */
  id: string;
  /** Chapter title (from ## header or generated) */
  title: string;
  /** Chapter hierarchy level (1 for main chapters) */
  level: number;
  /** All paragraphs in this chapter */
  paragraphs: Paragraph[];
  /** Position of chapter in document (0-based) */
  position: number;
  /** Word count in this chapter */
  wordCount: number;
  /** Estimated chapter duration for TTS (seconds) */
  estimatedDuration: number;
  /** Chapter starts at this character position in source */
  startPosition: number;
  /** Chapter ends at this character position in source */
  endPosition: number;
  /** Chapter start index (for compatibility) */
  startIndex: number;
  /** Character range in original document */
  charRange?: {
    start: number;
    end: number;
  };
  /** Chapter depth in document hierarchy */
  depth?: number;
  /** Extracted markdown elements */
  codeBlocks?: MarkdownElement[];
  tables?: MarkdownElement[];
  lists?: MarkdownElement[];
  blockquotes?: MarkdownElement[];
  links?: MarkdownElement[];
  images?: MarkdownElement[];
  /** Chapter content text (for compatibility) */
  content?: string | string[];
  /** Chapter index (for compatibility) */
  index?: number;
}

/**
 * Complete document structure
 */
export interface DocumentStructure {
  /** Document metadata */
  metadata: DocumentMetadata;
  /** All chapters in the document */
  chapters: Chapter[];
  /** Table of contents structure */
  tableOfContents?: TableOfContentsItem[];
  /** Total paragraph count in document */
  totalParagraphs: number;
  /** Total sentence count in document */
  totalSentences: number;
  /** Total word count in document */
  totalWordCount: number;
  /** Total chapter count in document */
  totalChapters: number;
  /** Estimated total duration for TTS processing (seconds) */
  estimatedTotalDuration: number;
  /** Overall confidence score for structure detection (0-1) */
  confidence: number;
  /** Processing metrics and timestamps */
  processingMetrics: {
    parseStartTime: Date;
    parseEndTime: Date;
    parseDurationMs: number;
    sourceLength: number;
    processingErrors: string[];
  };
  /** Extracted markdown elements */
  elements?: MarkdownElement[];
  /** Processing statistics */
  stats?: {
    totalWords: number;
    totalCharacters?: number;
    averageWordsPerParagraph?: number;
    averageSentencesPerParagraph?: number;
    processingTime: number;
    confidenceScore: number;
    extractionMethod: string;
    errorCount?: number;
    fallbackCount?: number;
    processingTimeMs?: number;
  };
  /** Extracted tables from document (for PDF processing) */
  tables?: Array<{
    id: string;
    pageNumber: number;
    rowCount: number;
    columnCount: number;
    confidence: number;
    formatType: string;
  }>;
}
