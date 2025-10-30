/**
 * Core types for document processing functionality.
 * Provides interfaces for structured document representation.
 */

/**
 * Generic document parser interface
 */
export interface DocumentParser {
  /** Parser name identifier */
  name: string;
  /** Parser version */
  version: string;
  /**
   * Parse method for document processing
   * @param {input} - Input data to parse
   * @param {any} options - Optional parse configuration
   * @returns {any} Promise resolving to parse result
   */
  parse: (input: unknown, options?: unknown) => Promise<ParseResult>;
  /**
   * Update parser options
   * @param {any} options - Partial options to merge
   */
  setOptions?: (options: Partial<unknown>) => void;
  /**
   * Get parser statistics
   * @returns {any} Parser performance statistics
   */
  getStats?: () => PerformanceStats;
}

/**
 * Generic parse result interface
 */
export interface ParseResult<T = unknown> {
  /** Whether parsing was successful */
  success: boolean;
  /** Parsed document data if successful */
  data?: T;
  /** Error information if parsing failed - can be an Error object or structured error */
  error?:
    | Error
    | {
        /** Error message */
        message: string;
        /** Error code if available */
        code?: string;
        /** Stack trace for debugging */
        stack?: string;
        /** Whether the error is recoverable */
        recoverable?: boolean;
        /** Additional error details */
        details?: Record<string, unknown> | unknown;
        /** Error severity level */
        severity?: string;
        /** Error category */
        category?: string;
        /** Error timestamp */
        timestamp?: string;
        /** Error context */
        context?: Record<string, unknown>;
      };
}

// Base parse options for all document processors
export interface ParseOptions {
  /** Whether to enable detailed logging */
  verbose?: boolean;
  /** Custom configuration for parsing */
  config?: Record<string, unknown>;
}

// EPUB-specific types
export interface EmbeddedAssets {
  images: Array<{
    id: string;
    href: string;
    mediaType: string;
    size: number;
    type?: string;
    properties?: string[];
  }>;
  styles: Array<{
    id: string;
    href: string;
    mediaType: string;
    size: number;
    type?: string;
    properties?: string[];
  }>;
  fonts: Array<{
    id: string;
    href: string;
    mediaType: string;
    size: number;
    type?: string;
    properties?: string[];
  }>;
  other: Array<{
    id: string;
    href: string;
    mediaType: string;
    size: number;
    type?: string;
    properties?: string[];
  }>;
  audio: Array<{
    id: string;
    href: string;
    mediaType: string;
    size: number;
    type?: string;
    properties?: string[];
  }>;
  video: Array<{
    id: string;
    href: string;
    mediaType: string;
    size: number;
    type?: string;
    properties?: string[];
  }>;
}

export interface TableOfContentsItem {
  id: string;
  title: string;
  href: string;
  level: number;
  children: TableOfContentsItem[];
}

export interface DocumentStatistics {
  totalParagraphs: number;
  totalSentences: number;
  totalWords: number;
  estimatedReadingTime: number;
  chapterCount: number;
  imageCount: number;
  tableCount: number;
}

export interface PerformanceStats {
  // Document content statistics
  totalParagraphs: number;
  totalSentences: number;
  totalWords: number;
  estimatedReadingTime: number;
  chapterCount: number;
  imageCount: number;
  tableCount: number;
  // Performance metrics
  parseTimeMs: number;
  parseTime?: number; // For backward compatibility
  memoryUsageMB: number;
  memoryUsage?: number; // For backward compatibility
  throughputMBs: number;
  validationTimeMs?: number;
  chaptersPerSecond: number;
  cacheHits: number;
  cacheMisses: number;
}

export interface ParagraphMatch {
  text: string;
  startIndex: number;
  endIndex: number;
  sentences: Array<{ text: string; startIndex: number; endIndex: number }>;
}

/**
 * Token interface for parsed Markdown elements
 */
export interface ParsedToken {
  type: string;
  text: string;
  raw: string;
  depth?: number;
  items?: ParsedToken[];
  lang?: string;
  [key: string]: unknown;
}

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
  /** Document publication date */
  date?: string;
  /** Total word count in document */
  wordCount: number;
  /** Document language detection result */
  language?: string;
  /** Additional custom metadata */
  customMetadata: Record<string, unknown>;
  /** EPUB version (for EPUB documents) */
  version?: string;
  /** Document description or summary */
  description?: string;
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
}

/**
 * Streaming document processing interface for large documents
 */
export interface DocumentStream {
  /** Async generator for processing document in chunks */
  chunks: () => AsyncGenerator<DocumentChunk>;
  /** Get complete document structure after streaming */
  getStructure: () => Promise<DocumentStructure>;
}

/**
 * Individual chunk for streaming processing
 */
export interface DocumentChunk {
  /** Chunk identifier */
  id: string;
  /** Type of content in this chunk */
  type: 'chapter' | 'paragraphs' | 'metadata';
  /** Chapter data if type is 'chapter' */
  chapter?: Chapter;
  /** Paragraph data if type is 'paragraphs' */
  paragraphs?: Paragraph[];
  /** Metadata if type is 'metadata' */
  metadata?: DocumentMetadata;
  /** Position in overall document */
  position: number;
  /** Processing progress (0-1) */
  progress: number;
}

/**
 * Parser validation result
 */
export interface ValidationResult {
  /** Whether validation passed */
  isValid: boolean;
  /** Validation errors found */
  errors: ValidationError[];
  /** Validation warnings found */
  warnings: ValidationWarning[];
  /** Overall validation score (0-1) */
  score: number;
}

/**
 * Validation error details
 */
export interface ValidationError {
  /** Error code for categorization */
  code: string;
  /** Human-readable error message */
  message: string;
  /** Location where error occurred */
  location: {
    chapter?: number;
    paragraph?: number;
    sentence?: number;
    line?: number;
  };
  /** Error severity level */
  severity: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Validation warning details
 */
export interface ValidationWarning {
  /** Warning code for categorization */
  code: string;
  /** Human-readable warning message */
  message: string;
  /** Location where warning occurred */
  location: {
    chapter?: number;
    paragraph?: number;
    sentence?: number;
    line?: number;
  };
  /** Suggested action for the warning */
  suggestion?: string;
}
