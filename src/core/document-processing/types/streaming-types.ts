/**
 * Streaming document processing types for large document handling.
 * Provides interfaces for chunked document processing.
 */

import {
  Chapter,
  Paragraph,
  DocumentMetadata,
  DocumentStructure,
} from './document-structure-types';

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
