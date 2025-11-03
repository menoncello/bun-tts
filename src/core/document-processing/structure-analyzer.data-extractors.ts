/**
 * Data extraction utilities for StructureAnalyzerCore.
 * Contains methods for extracting various components from document structures.
 */

import type {
  DocumentStructure,
  Chapter,
  Paragraph,
  Sentence,
  DocumentMetadata,
} from './types';

/**
 * Data extraction utilities for StructureAnalyzerCore.
 */
export class StructureAnalyzerDataExtractors {
  /**
   * Extracts chapters from document structure.
   * @param {DocumentStructure} structure - The document structure containing chapters
   * @returns {Chapter[]} An array of chapters extracted from the document structure
   */
  static extractChapters(structure: DocumentStructure): Chapter[] {
    return structure.chapters;
  }

  /**
   * Extracts sections from a chapter.
   * @param {Chapter} chapter - The chapter containing paragraphs
   * @returns {Paragraph[]} An array of paragraphs representing sections from the chapter
   */
  static extractSections(chapter: Chapter): Paragraph[] {
    return chapter.paragraphs;
  }

  /**
   * Extracts all paragraphs from document structure.
   * @param {DocumentStructure} structure - The document structure containing chapters and paragraphs
   * @returns {Paragraph[]} A flattened array of all paragraphs from all chapters
   */
  static extractParagraphs(structure: DocumentStructure): Paragraph[] {
    return structure.chapters.flatMap((c) => c.paragraphs);
  }

  /**
   * Extracts sentences from a paragraph.
   * @param {Paragraph} paragraph - The paragraph containing sentences
   * @returns {Sentence[]} An array of sentences extracted from the paragraph
   */
  static extractSentences(paragraph: Paragraph): Sentence[] {
    return paragraph.sentences;
  }

  /**
   * Gets document metadata from structure.
   * @param {DocumentStructure} structure - The document structure containing metadata
   * @returns {DocumentMetadata} Document metadata including word counts, sentence counts, and structure metrics
   */
  static getDocumentMetadata(structure: DocumentStructure): DocumentMetadata {
    return {
      title: structure.metadata.title,
      wordCount: structure.metadata.wordCount,
      totalWords: structure.totalWordCount,
      totalChapters: structure.totalChapters,
      customMetadata: structure.metadata.customMetadata,
      author: structure.metadata.author,
      publisher: structure.metadata.publisher,
      created: structure.metadata.created,
      modified: structure.metadata.modified,
      language: structure.metadata.language,
      characterCount: structure.metadata.characterCount,
      pageCount: structure.metadata.pageCount,
      totalCharacters: structure.metadata.totalCharacters,
      estimatedDuration: structure.metadata.estimatedDuration,
      encoding: structure.metadata.encoding,
      version: structure.metadata.version,
      description: structure.metadata.description,
      estimatedReadingTime: structure.metadata.estimatedReadingTime,
      chapterCount: structure.totalChapters,
      layoutInfo: structure.metadata.layoutInfo,
      encodingInfo: structure.metadata.encodingInfo,
      securityInfo: structure.metadata.securityInfo,
      format: structure.metadata.format,
      pageSize: structure.metadata.pageSize,
      filePath: structure.metadata.filePath,
    };
  }

  /**
   * Checks if document meets quality thresholds.
   * @param {DocumentStructure} structure - The document structure to evaluate
   * @param {number} threshold - Optional custom confidence threshold (uses default if not provided)
   * @param {number} defaultThreshold - The default confidence threshold
   * @returns {boolean} True if the document meets or exceeds the quality threshold
   */
  static meetsQualityThresholds(
    structure: DocumentStructure,
    threshold?: number,
    defaultThreshold = 0.7
  ): boolean {
    return structure.confidence >= (threshold ?? defaultThreshold);
  }
}
