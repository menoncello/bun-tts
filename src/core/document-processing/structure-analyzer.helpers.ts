/**
 * Helper methods for StructureAnalyzer - extracted to reduce file length.
 */
import { generateConfidenceReport } from './confidence-scoring';
import {
  extractChapters,
  extractSections,
  extractParagraphs,
  extractSentences,
  getDocumentMetadata,
  meetsQualityThresholds,
  generateDocumentTree,
} from './structure-analyzer.utils';
import type {
  DocumentStructure,
  Chapter,
  Paragraph,
  Sentence,
  DocumentMetadata,
} from './types';
import type {
  DocumentTreeNode,
  ConfidenceReport,
} from './types/structure-analyzer-types';

/**
 * Extracts all chapters from a document structure.
 *
 * @param {DocumentStructure} structure - Document structure
 * @returns {Chapter[]} Array of chapters
 */
export function extractChaptersHelper(structure: DocumentStructure): Chapter[] {
  return extractChapters(structure);
}
/**
 * Extracts all sections from a document structure.
 *
 * @param {DocumentStructure} structure - Document structure
 * @returns {Array<{chapterId: string, sections: Paragraph[]}>} Array of section groups with chapter IDs
 */
export function extractSectionsHelper(
  structure: DocumentStructure
): Array<{ chapterId: string; sections: Paragraph[] }> {
  return extractSections(structure);
}
/**
 * Extracts all paragraphs from a document structure.
 *
 * @param {DocumentStructure} structure - Document structure
 * @returns {Paragraph[]} Array of all paragraphs
 */
export function extractParagraphsHelper(
  structure: DocumentStructure
): Paragraph[] {
  return extractParagraphs(structure);
}
/**
 * Extracts all sentences from a document structure.
 *
 * @param {DocumentStructure} structure - Document structure
 * @returns {Sentence[]} Array of all sentences
 */
export function extractSentencesHelper(
  structure: DocumentStructure
): Sentence[] {
  return extractSentences(structure);
}
/**
 * Extracts metadata from a document structure.
 *
 * @param {DocumentStructure} structure - Document structure
 * @returns {DocumentMetadata} Document metadata including statistics
 */
export function getDocumentMetadataHelper(
  structure: DocumentStructure
): DocumentMetadata {
  return getDocumentMetadata(structure);
}
/**
 * Checks if a document structure meets quality thresholds.
 *
 * @param {DocumentStructure} structure - Document structure to evaluate
 * @param {number} threshold - Quality threshold
 * @returns {boolean} Whether the structure meets quality standards
 */
export function meetsQualityThresholdsHelper(
  structure: DocumentStructure,
  threshold: number
): boolean {
  return meetsQualityThresholds(structure, threshold);
}
/**
 * Generates a confidence report for a document structure.
 *
 * @param {DocumentStructure} structure - Document structure to analyze
 * @param {boolean} detailed - Whether to include detailed metrics
 * @returns {ConfidenceReport} Confidence report with quality metrics
 */
export function generateConfidenceReportHelper(
  structure: DocumentStructure,
  detailed = true
): ConfidenceReport {
  return generateConfidenceReport(structure, detailed);
}
/**
 * Generates a hierarchical tree representation of the document structure.
 *
 * @param {DocumentStructure} structure - Document structure
 * @returns {DocumentTreeNode} Tree representation of the document
 */
export function generateStructureTreeHelper(
  structure: DocumentStructure
): DocumentTreeNode {
  return generateDocumentTree(structure);
}
