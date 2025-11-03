/**
 * StructureAnalyzer utility functions
 *
 * This module contains helper functions for document structure analysis,
 * extracted from StructureAnalyzer to maintain file size limits.
 */

import type {
  DocumentStructure,
  Chapter,
  Paragraph,
  Sentence,
  DocumentMetadata,
} from './types';
import type { DocumentTreeNode } from './types/structure-analyzer-types';

/**
 * StructureAnalyzer configuration constants
 */
const CONSTANTS = {
  DOCUMENT_CONFIDENCE_THRESHOLD: 0.7,
  CHAPTER_CONFIDENCE_THRESHOLD: 0.6,
  DEFAULT_EXPANDED_CHAPTERS: 3,
  MAX_SENTENCES_PREVIEW: 3,
  MAX_HEADING_LABEL_LENGTH: 50,
  MAX_SENTENCE_LABEL_LENGTH: 60,
  DEFAULT_FILE_SIZE_MB: 50,
  BYTES_PER_KILOBYTE: 1024,
  BYTES_PER_MEGABYTE: 1048576,
  MAX_FILE_SIZE_BYTES: 52428800,
  DEFAULT_CONFIDENCE_THRESHOLD: 0.7,
  ROOT_LEVEL: 0,
  CHAPTER_LEVEL: 1,
  SENTENCE_LEVEL: 3,
  SECTION_LEVEL: 2,
  CHAPTER_INDEX_OFFSET: 1,
} as const;

/**
 * Options for creating a base paragraph node
 * Contains all necessary data to construct a paragraph tree node with proper hierarchy.
 */
export interface BaseParagraphNodeOptions {
  /** Unique identifier of the parent chapter */
  chapterId: string;
  /** Zero-based index of the paragraph within the chapter */
  paragraphIndex: number;
  /** Paragraph data with content, type, and metadata */
  paragraph: Paragraph;
  /** Zero-based index of the chapter within the document */
  chapterIndex: number;
  /** Pre-constructed sentence nodes to be added as children */
  sentenceNodes: DocumentTreeNode[];
}

/**
 * Create root node for document tree.
 *
 * @param {DocumentStructure} structure - Document structure to create root node for
 * @returns {DocumentTreeNode} Root document tree node with configured properties
 */
export function createRootNode(structure: DocumentStructure): DocumentTreeNode {
  return {
    id: 'root',
    label: structure.metadata.title || 'Document',
    type: 'document',
    level: CONSTANTS.ROOT_LEVEL,
    children: [],
    data: { index: CONSTANTS.ROOT_LEVEL },
    display: {
      expanded: false,
      hasIssues: structure.confidence < CONSTANTS.DOCUMENT_CONFIDENCE_THRESHOLD,
      confidence: structure.confidence,
      icon: '📄',
    },
    position: { chapter: CONSTANTS.ROOT_LEVEL },
  };
}

/**
 * Create chapter node for document tree.
 *
 * @param {Chapter} chapter - Chapter data containing title, ID, and confidence information
 * @param {number} chapterIndex - Zero-based index of the chapter in the document
 * @returns {DocumentTreeNode} Configured chapter node with proper hierarchy and display settings
 */
export function createChapterNode(
  chapter: Chapter,
  chapterIndex: number
): DocumentTreeNode {
  return {
    id: chapter.id,
    label:
      chapter.title ||
      `Chapter ${chapterIndex + CONSTANTS.CHAPTER_INDEX_OFFSET}`,
    type: 'chapter',
    level: CONSTANTS.CHAPTER_LEVEL,
    children: [],
    data: { chapter, index: chapterIndex },
    display: {
      expanded: chapterIndex < CONSTANTS.DEFAULT_EXPANDED_CHAPTERS,
      hasIssues:
        (chapter.confidence || 0) < CONSTANTS.CHAPTER_CONFIDENCE_THRESHOLD,
      confidence: chapter.confidence,
      icon: '📖',
    },
    position: { chapter: chapterIndex },
  };
}

/**
 * Create sentence node for document tree.
 *
 * @param {string} chapterId - Unique identifier of the parent chapter
 * @param {number} paragraphIndex - Zero-based index of the paragraph within the chapter
 * @param {number} sentenceIndex - Zero-based index of the sentence within the paragraph
 * @param {Sentence} sentence - Sentence object containing text content and metadata
 * @returns {DocumentTreeNode} Configured sentence node with truncated label for display
 */
export function createSentenceNode(
  chapterId: string,
  paragraphIndex: number,
  sentenceIndex: number,
  sentence: Sentence
): DocumentTreeNode {
  return {
    id: `${chapterId}-p-${paragraphIndex}-s-${sentenceIndex}`,
    label: sentence.text.substring(0, CONSTANTS.MAX_SENTENCE_LABEL_LENGTH),
    type: 'sentence',
    level: CONSTANTS.SENTENCE_LEVEL,
    children: [],
    data: { sentence },
    display: {
      icon: '💬',
    },
  };
}

/**
 * Create ellipsis node for additional sentences.
 *
 * @param {string} chapterId - Unique identifier of the parent chapter
 * @param {number} paragraphIndex - Zero-based index of the paragraph within the chapter
 * @param {number} moreCount - Number of additional sentences not displayed in preview
 * @returns {DocumentTreeNode} Ellipsis node indicating truncated sentence list
 */
export function createEllipsisNode(
  chapterId: string,
  paragraphIndex: number,
  moreCount: number
): DocumentTreeNode {
  return {
    id: `${chapterId}-p-${paragraphIndex}-more`,
    label: `... and ${moreCount} more sentences`,
    type: 'sentence',
    level: CONSTANTS.SENTENCE_LEVEL,
    children: [],
    display: {
      icon: '⋯',
    },
  };
}

/**
 * Create base paragraph node.
 *
 * @param {BaseParagraphNodeOptions} options - Configuration object containing paragraph data and context
 * @returns {DocumentTreeNode} Configured paragraph node with proper hierarchy and display settings
 */
export function createBaseParagraphNode(
  options: BaseParagraphNodeOptions
): DocumentTreeNode {
  const { chapterId, paragraphIndex, paragraph, chapterIndex, sentenceNodes } =
    options;
  return {
    id: `${chapterId}-p-${paragraphIndex}`,
    label:
      paragraph.type === 'heading'
        ? paragraph.rawText.substring(0, CONSTANTS.MAX_HEADING_LABEL_LENGTH)
        : `${paragraph.sentences.length} sentences`,
    type: 'section',
    level: CONSTANTS.SECTION_LEVEL,
    children: sentenceNodes,
    data: { paragraph, index: paragraphIndex },
    display: {
      confidence: paragraph.confidence,
      icon: paragraph.type === 'heading' ? '📑' : '📝',
      metadata: {
        type: paragraph.type,
        sentenceCount: paragraph.sentences.length,
      },
    },
    position: { chapter: chapterIndex, paragraph: paragraphIndex },
  };
}

/**
 * Create paragraph node for document tree.
 *
 * @param {Chapter} chapter - Chapter data containing ID and relationship information
 * @param {number} chapterIndex - Zero-based index of the chapter in the document
 * @param {Paragraph} paragraph - Paragraph data with content and metadata
 * @param {number} paragraphIndex - Zero-based index of the paragraph within the chapter
 * @returns {DocumentTreeNode} Complete paragraph node with sentence children and ellipsis if needed
 */
export function createParagraphNode(
  chapter: Chapter,
  chapterIndex: number,
  paragraph: Paragraph,
  paragraphIndex: number
): DocumentTreeNode {
  const chapterId = chapter.id;
  const sentenceNodes = paragraph.sentences
    .slice(0, CONSTANTS.MAX_SENTENCES_PREVIEW)
    .map((sentence, sentenceIndex) =>
      createSentenceNode(chapterId, paragraphIndex, sentenceIndex, sentence)
    );

  const paragraphNode = createBaseParagraphNode({
    chapterId,
    paragraphIndex,
    paragraph,
    chapterIndex,
    sentenceNodes,
  });

  // Add "..." node if more sentences
  const moreSentencesCount =
    paragraph.sentences.length - CONSTANTS.MAX_SENTENCES_PREVIEW;
  if (paragraph.sentences.length > CONSTANTS.MAX_SENTENCES_PREVIEW) {
    paragraphNode.children.push(
      createEllipsisNode(chapterId, paragraphIndex, moreSentencesCount)
    );
  }

  return paragraphNode;
}

/**
 * Analysis context for building result.
 * Contains all data generated during document analysis process.
 */
export interface AnalysisContext {
  /** Document format identifier (e.g., 'pdf', 'epub', 'markdown') */
  format: string;
  /** Complete document structure with chapters, paragraphs, and sentences */
  documentStructure: DocumentStructure;
  /** Confidence scoring report with quality metrics and recommendations */
  confidenceReport: unknown;
  /** Hierarchical tree representation for TUI visualization */
  documentTree: DocumentTreeNode;
  /** Validation results with identified issues and corrections */
  validation: unknown;
  /** Analysis start timestamp for performance measurement */
  startTime: Date;
}

/**
 * Generate hierarchical document tree for TUI visualization.
 * Note: This is a placeholder implementation. The actual tree generation
 * would be more sophisticated based on the TUI framework requirements.
 *
 * @param {DocumentStructure} structure - Complete document structure with all chapters and paragraphs
 * @returns {DocumentTreeNode} Hierarchical tree with root node, chapters, paragraphs, and sentences
 */
export function generateDocumentTree(
  structure: DocumentStructure
): DocumentTreeNode {
  const rootNode = createRootNode(structure);

  // Add chapters
  for (const [chapterIndex, chapter] of structure.chapters.entries()) {
    const chapterNode = createChapterNode(chapter, chapterIndex);

    // Add paragraphs as children
    for (const [paragraphIndex, paragraph] of chapter.paragraphs.entries()) {
      const paragraphNode = createParagraphNode(
        chapter,
        chapterIndex,
        paragraph,
        paragraphIndex
      );
      chapterNode.children.push(paragraphNode);
    }

    rootNode.children.push(chapterNode);
  }

  return rootNode;
}

/**
 * Extract chapters from document structure.
 *
 * @param {DocumentStructure} structure - Document structure containing all chapters and their content
 * @returns {Chapter[]} Array of all chapters in the document with their paragraphs and sentences
 */
export function extractChapters(structure: DocumentStructure): Chapter[] {
  return structure.chapters;
}

/**
 * Extract sections (subsections within chapters).
 *
 * @param {DocumentStructure} structure - Document structure containing chapters with paragraphs
 * @returns {Array<{chapterId: string, sections: Paragraph[]}>} Array of sections grouped by chapter ID, containing only heading-type paragraphs
 */
export function extractSections(structure: DocumentStructure): Array<{
  chapterId: string;
  sections: Paragraph[];
}> {
  return structure.chapters.map((chapter) => ({
    chapterId: chapter.id,
    sections: chapter.paragraphs.filter((p) => p.type === 'heading'),
  }));
}

/**
 * Extract all paragraphs from document structure.
 *
 * @param {DocumentStructure} structure - Document structure containing all chapters and their paragraphs
 * @returns {Paragraph[]} Flattened array of all paragraphs from all chapters in document order
 */
export function extractParagraphs(structure: DocumentStructure): Paragraph[] {
  return structure.chapters.flatMap((chapter) => chapter.paragraphs);
}

/**
 * Extract all sentences from document structure.
 *
 * @param {DocumentStructure} structure - Document structure containing chapters, paragraphs, and sentences
 * @returns {Sentence[]} Flattened array of all sentences from all paragraphs in document order
 */
export function extractSentences(structure: DocumentStructure): Sentence[] {
  return structure.chapters
    .flatMap((chapter) => chapter.paragraphs)
    .flatMap((paragraph) => paragraph.sentences);
}

/**
 * Get document metadata.
 *
 * @param {DocumentStructure} structure - Document structure containing metadata information
 * @returns {DocumentMetadata} Complete document metadata including title, author, and other properties
 */
export function getDocumentMetadata(
  structure: DocumentStructure
): DocumentMetadata {
  return structure.metadata;
}

/**
 * Check if document meets minimum quality thresholds.
 *
 * @param {DocumentStructure} structure - Document structure with confidence score to evaluate
 * @param {number} threshold - Minimum confidence threshold (0-1) required for quality acceptance
 * @returns {boolean} Whether document meets specified quality threshold
 */
export function meetsQualityThresholds(
  structure: DocumentStructure,
  threshold: number
): boolean {
  return structure.confidence >= threshold;
}
