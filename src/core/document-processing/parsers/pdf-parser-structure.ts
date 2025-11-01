/**
 * PDF parser structure definitions.
 * Provides type definitions for PDF parsing structures and metadata.
 */

import type { DocumentMetadata } from '../types';

// Re-export for compatibility
export type { DocumentMetadata as PDFMetadata } from '../types';

/**
 * Raw PDF data structure from pdf-parse library.
 */
export interface PDFData {
  /** Extracted text content */
  text: string;
  /** PDF metadata information */
  info?: {
    Title?: string;
    Author?: string;
    Subject?: string;
    Creator?: string;
    Producer?: string;
    CreationDate?: string;
    ModificationDate?: string;
  };
  /** Number of pages */
  numPages?: number;
  /** PDF version */
  pdfVersion?: string;
}

/**
 * Enhanced PDF metadata interface for internal PDF parsing operations.
 */
export interface PDFParserMetadata extends DocumentMetadata {
  /** PDF page count */
  pageCount?: number;
  /** PDF encryption information */
  encryptionInfo?: {
    isEncrypted: boolean;
    hasUserPassword: boolean;
    hasOwnerPassword: boolean;
    keyLength?: number;
  };
  /** Font information */
  fontInfo?: Array<{
    name: string;
    type: 'embedded' | 'standard' | 'custom';
    encoding: string;
  }>;
  /** Content analysis */
  contentAnalysis?: {
    hasImages: boolean;
    hasTables: boolean;
    hasForms: boolean;
    hasAnnotations: boolean;
    textDensity: number; // Characters per page
  };
}

/**
 * PDF page analysis result.
 */
export interface PDFPageAnalysis {
  /** Page number (1-based) */
  pageNumber: number;
  /** Page dimensions */
  dimensions: {
    width: number;
    height: number;
    unit: 'pt' | 'in' | 'mm';
  };
  /** Page rotation angle */
  rotation: number;
  /** Text content extracted from page */
  textContent: string;
  /** Estimated confidence of text extraction */
  confidence: number;
  /** Page features detected */
  features: {
    hasImages: boolean;
    hasTables: boolean;
    hasColumns: boolean;
    hasHeaders: boolean;
    hasFooters: boolean;
  };
  /** Layout analysis */
  layout: {
    columnCount: number;
    textBlocks: Array<{
      x: number;
      y: number;
      width: number;
      height: number;
      text: string;
    }>;
  };
}

/**
 * PDF parsing options and configuration.
 */
export interface PDFParsingOptions {
  /** Whether to extract images */
  extractImages: boolean;
  /** Whether to extract tables */
  extractTables: boolean;
  /** Whether to analyze layout */
  analyzeLayout: boolean;
  /** Whether to extract fonts information */
  extractFontInfo: boolean;
  /** OCR options for scanned PDFs */
  ocrOptions?: {
    enabled: boolean;
    language: string;
    confidenceThreshold: number;
  };
  /** Text cleaning options */
  textCleaning: {
    removeExtraWhitespace: boolean;
    normalizeLineBreaks: boolean;
    removePageNumbers: boolean;
    removeHeadersFooters: boolean;
  };
}

/**
 * PDF table cell structure.
 */
export interface PDFTableCell {
  /** Cell content text */
  text: string;
  /** Cell position */
  position: {
    row: number;
    column: number;
  };
  /** Cell metadata */
  metadata?: {
    isHeader: boolean;
    isMerged: boolean;
    colspan?: number;
    rowspan?: number;
  };
}

/**
 * PDF table row structure.
 */
export interface PDFTableRow {
  /** Row number (0-based) */
  rowNumber: number;
  /** Cells in this row */
  cells: PDFTableCell[];
  /** Row metadata */
  metadata?: {
    isHeader: boolean;
    isSpanner: boolean;
  };
}

/**
 * PDF table structure.
 */
export interface PDFTable {
  /** Unique table identifier */
  id: string;
  /** Table page number */
  pageNumber: number;
  /** Table position on page */
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  /** Table title/caption if detected */
  title?: string;
  /** Number of rows */
  rowCount: number;
  /** Number of columns */
  columnCount: number;
  /** Table rows */
  rows: PDFTableRow[];
  /** Extraction confidence */
  confidence: number;
  /** Table format type */
  formatType: 'delimited' | 'aligned' | 'box' | 'spanner';
  /** Table metadata */
  metadata?: {
    hasHeaderRow: boolean;
    hasMergedCells: boolean;
    encoding?: string;
  };
}

/**
 * PDF structure analysis result.
 */
export interface PDFStructureAnalysis {
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
  /** Tables detected in document */
  tables?: PDFTable[];
  /** Overall document complexity */
  complexity: 'simple' | 'moderate' | 'complex';
  /** Reading time estimate in minutes */
  estimatedReadingTime: number;
}
