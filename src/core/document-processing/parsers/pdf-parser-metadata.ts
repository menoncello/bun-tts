/**
 * PDF metadata creation utilities.
 * These utilities handle PDF metadata creation for mock and demonstration purposes.
 */

import type { PDFMetadata } from './pdf-parser-structure';

/**
 * Creates mock PDF metadata for demonstration purposes.
 *
 * @param {string} filePath - Path to the PDF file
 * @param {string} text - Text content for word count calculation
 * @returns {PDFMetadata} Mock PDF metadata
 */
export function createMockPDFMetadata(
  filePath: string,
  text: string
): PDFMetadata {
  const basicMetadata = createBasicPDFMetadata(filePath, text);
  const layoutInfo = createMockLayoutInfo();
  const encodingInfo = createMockEncodingInfo();
  const securityInfo = createMockSecurityInfo();

  return {
    ...basicMetadata,
    layoutInfo,
    encodingInfo,
    securityInfo,
  };
}

/**
 * Creates basic PDF metadata.
 *
 * @param {string} filePath - File path
 * @param {string} text - Text content
 * @returns {Omit<PDFMetadata, 'layoutInfo' | 'encodingInfo' | 'securityInfo'>} Basic PDF metadata
 */
function createBasicPDFMetadata(
  filePath: string,
  text: string
): Omit<PDFMetadata, 'layoutInfo' | 'encodingInfo' | 'securityInfo'> {
  const now = new Date();
  const wordCount = text.split(/\s+/).length;

  return {
    title: 'Sample PDF Document',
    author: 'Unknown Author',
    createdDate: now,
    modifiedDate: now,
    language: 'en',
    wordCount,
    characterCount: text.length,
    format: 'pdf' as const,
    filePath,
    customMetadata: {},
  };
}

/**
 * Creates mock layout information.
 *
 * @returns {PDFMetadata['layoutInfo']} Layout information
 */
function createMockLayoutInfo(): PDFMetadata['layoutInfo'] {
  return {
    hasColumns: false,
    hasTables: false,
    hasImages: false,
    pageOrientation: 'portrait' as const,
    columnCount: 1,
    pageSize: {
      width: 612,
      height: 792,
      unit: 'pt' as const,
    },
  };
}

/**
 * Creates mock encoding information.
 *
 * @returns {PDFMetadata['encodingInfo']} Encoding information
 */
function createMockEncodingInfo(): PDFMetadata['encodingInfo'] {
  return {
    detectedEncoding: 'utf-8',
    confidence: 1.0,
    hasBOM: false,
  };
}

/**
 * Creates mock security information.
 *
 * @returns {PDFMetadata['securityInfo']} Security information
 */
function createMockSecurityInfo(): PDFMetadata['securityInfo'] {
  return {
    isEncrypted: false,
    hasPassword: false,
    permissions: ['print', 'copy', 'modify'],
  };
}

/**
 * Gets mock PDF text for demonstration purposes.
 *
 * @returns {string} Mock PDF text content
 */
export function getMockPDFText(): string {
  return `Sample PDF Content

Chapter 1: Introduction
This is the first chapter of the PDF document. It contains sample text content.

Chapter 2: Main Content
This is the second chapter with more detailed content and structure.

Chapter 3: Conclusion
This chapter summarizes the document content.`;
}
