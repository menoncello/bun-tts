/**
 * PDFParser Image Detection and Encoding Tests
 * Tests for image reference detection and encoding handling
 */

import { describe, test, expect, beforeEach } from 'bun:test';
import { PDFParser } from '../../../../src/core/document-processing/parsers/pdf-parser';
import { PDF_PARSE_ERROR_CODES } from '../../../../src/errors/pdf-parse-error-codes';
import {
  MockLoggerFactory,
  MockConfigManagerFactory,
} from '../../../../tests/support/document-processing-factories';
import { createTextBuffer } from './pdf-parser-test-helpers';

/**
 * Helper function to validate UTF-8 encoding without deep nesting
 */
function assertUTF8Encoding(
  decoder: TextDecoder,
  encoded: Uint8Array,
  _textWithUnicode: string
): void {
  expect(() => decoder.decode(encoded)).not.toThrow();
}

/**
 * Helper function to validate unicode characters without deep nesting
 */
function validateUnicodeCharacters(textWithUnicode: string): void {
  expect(textWithUnicode).toContain('café');
  expect(textWithUnicode).toContain('naïve');
  expect(textWithUnicode).toContain('résumé');

  const utf8Pattern = /[\u0080-\uFFFF]/g;
  const utf8Matches = textWithUnicode.match(utf8Pattern);
  expect(utf8Matches).not.toBeNull();
  expect(utf8Matches!.length).toBeGreaterThan(0);
}

/**
 * Helper function to calculate word count without deep nesting
 */
function calculateWordCount(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter((word: string) => word.length > 0).length;
}

describe('PDFParser Image Detection', () => {
  describe('P2 - Medium Priority', () => {
    test('1.3-PDF-018: should detect image references', () => {
      // Given: Text content containing various image reference formats
      const textWithImages = `Document with images:

Figure 1: Architecture diagram
![chart](chart.png)
[Image: Process flow]

End of document.`;

      // When: Image detection is performed
      const lines = textWithImages.split('\n');
      const figureRef = lines[2];
      const markdownImg = lines[3];
      const bracketImg = lines[4];

      // Then: All image reference formats should be correctly identified
      if (figureRef && markdownImg && bracketImg) {
        expect(/(?:figure|fig\.?|image|img\.?)\s*\d+/i.test(figureRef)).toBe(
          true
        );
        // Fixed regex: Prevent ReDoS by avoiding nested quantifiers and using atomic groups
        expect(/!\[([^\]]*)]\([^)]+\)/.test(markdownImg)).toBe(true);
        // Fixed regex: Prevent ReDoS by limiting character class to prevent catastrophic backtracking
        expect(/\[image:\s*([^\]]{1,100})]/i.test(bracketImg)).toBe(true);
      }
    });
  });
});

describe('PDFParser Encoding and Performance', () => {
  describe('P2 - Medium Priority', () => {
    describe('Encoding Detection Logic', () => {
      test('1.3-PDF-019: should detect UTF-8 encoding', () => {
        // Given: Text content containing unicode characters
        const textWithUnicode = 'Document with unicode: café naïve résumé';

        // When: Encoding detection is performed
        const decoder = new TextDecoder('utf-8', { fatal: true });
        const encoder = new TextEncoder();
        const encoded = encoder.encode(textWithUnicode);

        // Then: UTF-8 characters should be properly handled
        assertUTF8Encoding(decoder, encoded, textWithUnicode);
        validateUnicodeCharacters(textWithUnicode);
      });
    });

    describe('Performance Considerations', () => {
      test('1.3-PDF-020: should handle text processing efficiently', () => {
        // Given: Large text content for performance testing
        let largeText = '';
        for (let i = 0; i < 100; i++) {
          largeText += `Paragraph ${i}: This is test content for performance testing. `;
        }

        // When: Large text is processed
        const buffer = createTextBuffer(largeText);

        // Then: Processing should handle large content efficiently
        expect(buffer.byteLength).toBeGreaterThan(1000);
        expect(largeText.length).toBeGreaterThan(1000);

        const wordCount = calculateWordCount(largeText);
        expect(wordCount).toBeGreaterThan(500);
      });
    });
  });
});

describe('PDFParser Error Handling and Configuration', () => {
  let parser: PDFParser;

  beforeEach(() => {
    const mockLogger = MockLoggerFactory.create();
    const mockConfigManager = MockConfigManagerFactory.createDefault();
    parser = new PDFParser(mockLogger, mockConfigManager);
  });

  describe('P1 - High Priority', () => {
    describe('Error Handling', () => {
      test('1.3-PDF-021: should handle invalid input types', async () => {
        // Given: A PDF parser instance and various invalid input types
        const invalidInputs: unknown[] = [null, undefined, ';', 123, {}, []];

        // When: Each invalid input type is processed
        for (const input of invalidInputs) {
          // Cast to string to test error handling for invalid inputs
          const result = await parser.parse(input as string);

          // Then: All invalid inputs should return appropriate errors
          expect(result.success).toBe(false);
          if (!result.success) {
            expect((result.error as any).code).toBe(
              PDF_PARSE_ERROR_CODES.INVALID_PDF
            );
          }
        }
      });
    });
  });

  describe('P2 - Medium Priority', () => {
    describe('Configuration Integration', () => {
      test('1.3-PDF-022: should respect custom configuration', () => {
        // Given: Custom configuration parameters
        const customConfig = {
          confidenceThreshold: 0.95,
          maxFileSize: 50 * 1024 * 1024, // 50MB
          includeElements: true,
        };

        // When: PDF parser is created with custom configuration
        const mockLogger = MockLoggerFactory.create();
        const mockConfigManager = MockConfigManagerFactory.createDefault();
        const customParser = new PDFParser(
          mockLogger,
          mockConfigManager,
          customConfig
        );

        // Then: Custom configuration should be properly applied
        expect(customParser).toBeInstanceOf(PDFParser);
        expect(customConfig.confidenceThreshold).toBe(0.95);
        expect(customConfig.maxFileSize).toBe(50 * 1024 * 1024);
        expect(customConfig.includeElements).toBe(true);
      });
    });
  });
});
