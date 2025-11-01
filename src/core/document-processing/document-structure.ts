/**
 * Document structure types and utilities.
 * Provides common interfaces for document structure across different formats.
 */

import type { Chapter } from './types';

/**
 * Re-export Chapter type for compatibility with existing imports.
 */
export type { Chapter } from './types';

/**
 * Section interface for document structure.
 */
export interface Section {
  /** Section identifier */
  id: string;
  /** Section title */
  title: string;
  /** Section content */
  content: string[];
  /** Parent chapter ID */
  chapterId: string;
  /** Start page number (if applicable) */
  startPage?: number;
  /** End page number (if applicable) */
  endPage?: number;
  /** Subsections */
  subsections: Section[];
}

/**
 * Enhanced chapter interface with additional properties for PDF parsing.
 */
export interface EnhancedChapter extends Chapter {
  /** Chapter content (overriding string with array) */
  content: string[];
  /** Sub-chapters */
  subChapters: Chapter[];
  /** Content confidence score */
  confidence?: number;
  /** Parent chapter ID */
  parentId?: string;
  /** Chapter depth in document hierarchy */
  depth?: number;
  /** Character range in the original document */
  charRange?: {
    start: number;
    end: number;
  };
}

/**
 * Document structure builder utilities.
 */
export class DocumentStructureBuilder {
  /**
   * Create a new chapter with default values.
   *
   * @param {string} id - Chapter identifier
   * @param {string} title - Chapter title
   * @param {number} level - Chapter level
   * @returns {EnhancedChapter} New chapter instance
   */
  static createChapter(id: string, title: string, level = 1): EnhancedChapter {
    return {
      id,
      title,
      level,
      paragraphs: [],
      position: 0,
      depth: level,
      content: [],
      subChapters: [],
      confidence: 0.5,
      wordCount: 0,
      estimatedDuration: 0,
      startPosition: 0,
      endPosition: 0,
      startIndex: 0,
    };
  }

  /**
   * Create a new section with default values.
   *
   * @param {string} id - Section identifier
   * @param {string} title - Section title
   * @param {string} chapterId - Parent chapter ID
   * @returns {Section} New section instance
   */
  static createSection(id: string, title: string, chapterId: string): Section {
    return {
      id,
      title,
      content: [],
      chapterId,
      subsections: [],
    };
  }

  /**
   * Calculate chapter statistics.
   *
   * @param {EnhancedChapter[]} chapters - Array of chapters
   * @returns {{ totalChapters: number; totalContentLength: number; averageChapterLength: number; maxDepth: number; totalSubChapters: number; }} Statistics object
   */
  static calculateChapterStats(chapters: EnhancedChapter[]): {
    totalChapters: number;
    totalContentLength: number;
    averageChapterLength: number;
    maxDepth: number;
    totalSubChapters: number;
  } {
    return {
      totalChapters: chapters.length,
      totalContentLength: chapters.reduce(
        (sum, ch) => sum + ch.content.join(' ').length,
        0
      ),
      averageChapterLength:
        chapters.length > 0
          ? chapters.reduce((sum, ch) => sum + ch.content.join(' ').length, 0) /
            chapters.length
          : 0,
      maxDepth: Math.max(...chapters.map((ch) => ch.depth ?? 0), 0),
      totalSubChapters: chapters.reduce(
        (sum, ch) => sum + ch.subChapters.length,
        0
      ),
    };
  }
}
