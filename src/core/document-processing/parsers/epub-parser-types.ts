/**
 * EPUB Parser Type Definitions
 *
 * Type definitions and interfaces used by the EPUB parser
 */

// Import actual types from @smoores/epub library
import type {
  EpubMetadata as LibraryEpubMetadata,
  ManifestItem as LibraryManifestItem,
} from '@smoores/epub';
import type { ParseOptions } from '../types.js';

export interface EPUBParseOptions extends ParseOptions {
  /** Extract images and media content */
  extractMedia?: boolean;
  /** Preserve original HTML structure */
  preserveHTML?: boolean;
  /** Chapter detection sensitivity */
  chapterSensitivity?: number;
  /** Enable strict mode validation */
  strictMode?: boolean;
}

// Type interfaces for better readability
export interface EpubInput {
  type: 'string' | 'buffer' | 'arraybuffer';
  data: string | Buffer | ArrayBuffer;
}

// Use the actual EpubMetadata type from the library
export type EpubMetadata = LibraryEpubMetadata;

export interface EpubSpineItem {
  idref: string;
  title?: string;
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

export type ManifestItem = LibraryManifestItem;

export interface ParagraphMatch {
  text: string;
  startIndex: number;
  endIndex: number;
  sentences: Array<{ text: string; startIndex: number; endIndex: number }>;
}
