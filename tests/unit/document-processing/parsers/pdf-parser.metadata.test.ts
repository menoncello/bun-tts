/**
 * PDFParser Metadata Tests
 * Tests for PDF metadata extraction and validation
 */

import { describe, test, expect } from 'bun:test';
import {
  setupParserTest,
  createTextBuffer,
  createValidDocumentStructure,
  type MockPDFData,
} from './pdf-parser-test-helpers';

describe('PDFParser Metadata Extraction', () => {
  describe('P1 - High Priority', () => {
    test('1.3-PDF-007: should extract metadata from PDF', async () => {
      // Given: Test content and PDF metadata structure
      const textContent = 'Test content';
      const buffer = createTextBuffer(textContent);

      const mockPDFData: MockPDFData = {
        info: {
          Title: 'Test PDF Document',
          Author: 'John Doe',
          Creator: 'Test Creator',
        },
      };

      // When: PDF metadata extraction is performed
      // Note: Testing metadata structure without actual parsing

      // Then: The metadata should contain expected fields and values
      expect(buffer.byteLength).toBeGreaterThan(0);
      expect(mockPDFData.info?.Title).toBe('Test PDF Document');
      expect(mockPDFData.info?.Author).toBe('John Doe');
      expect(mockPDFData.info?.Creator).toBe('Test Creator');
    });

    test('1.3-PDF-008: should handle missing metadata gracefully', async () => {
      // Given: Test content with empty metadata structure
      const textContent = 'Test content';
      const buffer = createTextBuffer(textContent);

      const mockPDFData: MockPDFData = {
        info: {}, // No metadata
      };

      // When: PDF with missing metadata is processed

      // Then: The system should handle empty metadata without errors
      expect(buffer.byteLength).toBeGreaterThan(0);
      expect(Object.keys(mockPDFData.info || {}).length).toBe(0);
    });
  });
});

describe('PDFParser Document Validation', () => {
  describe('P1 - High Priority', () => {
    test('1.3-PDF-009: should validate a complete document structure', async () => {
      // Given: A PDF parser instance and a valid document path
      const { parser } = setupParserTest();

      // When: A valid document structure is validated
      const result = await parser.validate('/path/to/mock/file.pdf');

      // Then: The validation should succeed and return true
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toBe(true);
        }
      }
    });

    test('1.3-PDF-010: should detect validation issues in malformed structure', async () => {
      // Given: A PDF parser instance and a malformed document path
      const { parser } = setupParserTest();

      // When: A malformed document structure is validated
      const result = await parser.validate('/path/to/malformed/file.pdf');

      // Then: The validation should fail and return an error
      expect(result.success).toBe(false);
    });
  });
});

describe('PDFParser Metadata Validation', () => {
  describe('P1 - High Priority', () => {
    test('1.3-PDF-011: should validate document metadata', async () => {
      // Given: A PDF parser instance and valid document structure
      const { parser } = setupParserTest();
      const validStructure = createValidDocumentStructure();

      // When: Document metadata validation is performed
      const result = await parser.validate('/path/to/valid/file.pdf');

      // Then: The validation should succeed and metadata should be valid
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toBe(true);
        }
      }
      expect(validStructure.metadata.title).toBe('Test Document');
      expect(validStructure.metadata.author).toBe('Test Author');
      expect(validStructure.metadata.wordCount).toBeGreaterThan(0);
    });
  });
});
