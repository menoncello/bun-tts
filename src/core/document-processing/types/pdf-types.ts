/**
 * PDF-specific types for PDF document processing.
 * Provides interfaces for PDF analysis and structure representation.
 */

import { DocumentStructure } from './document-structure-types';

/**
 * PDF-specific analysis metadata
 */
export interface PDFAnalysisMetadata {
  /** Document structure type detected */
  structureType: 'linear' | 'hierarchical' | 'mixed';
  /** Confidence in structure detection */
  confidence: number;
  /** Chapter/section detection results */
  chapters: Array<{
    id: string;
    title: string;
    level: number;
    pageNumber: number;
    position: number;
  }>;
  /** Table of contents if detected */
  tableOfContents?: Array<{
    title: string;
    pageNumber: number;
    level: number;
  }>;
  /** Overall document complexity */
  complexity: 'simple' | 'moderate' | 'complex';
}

/**
 * Extended DocumentStructure interface for PDF processing
 */
export interface PDFStructure extends DocumentStructure {
  /** PDF-specific analysis metadata */
  analysisMetadata: PDFAnalysisMetadata;
  /** Additional PDF-specific properties */
  title?: string;
  author?: string;
}

/**
 * Alias for DocumentStructure for PDF processing compatibility
 */
export type PDFStructureAlias = DocumentStructure;
