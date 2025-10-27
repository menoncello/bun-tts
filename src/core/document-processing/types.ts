/**
 * Core types for document processing functionality.
 * Provides interfaces for structured document representation.
 */

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
  /** Document creation/modification dates */
  created?: Date;
  modified?: Date;
  /** Total word count in document */
  wordCount: number;
  /** Document language detection result */
  language?: string;
  /** Additional custom metadata */
  customMetadata: Record<string, unknown>;
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
}

/**
 * Complete document structure
 */
export interface DocumentStructure {
  /** Document metadata */
  metadata: DocumentMetadata;
  /** All chapters in the document */
  chapters: Chapter[];
  /** Total paragraph count in document */
  totalParagraphs: number;
  /** Total sentence count in document */
  totalSentences: number;
  /** Total word count in document */
  totalWordCount: number;
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
