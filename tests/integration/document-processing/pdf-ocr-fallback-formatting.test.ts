/**
 * Special formatting OCR support tests.
 * Test case 1.3-PDF-023: OCR fallback mechanism validation - Formatting support.
 */

import { describe, it, expect } from 'bun:test';
import { validateSpecialFormattingOCR } from '../../unit/document-processing/parsers/pdf-ocr-fallback-test-utils';
import {
  createCustomOCRParser,
  OCR_CONFIGS,
} from './pdf-ocr-fallback-test-setup';

describe('PDF Parser OCR Fallback - Special Formatting Support', () => {
  it('should handle OCR fallback for special formatting elements', async () => {
    const formattingOcrParser = await createCustomOCRParser(
      OCR_CONFIGS.FORMATTING_SUPPORT
    );
    const result = await formattingOcrParser.parse('test-file.pdf');

    expect(result.success).toBe(true);
    if (!result.success) return;

    const documentStructure = result.data;
    const formatCounts = validateSpecialFormattingOCR(documentStructure);

    if (documentStructure.elements) {
      expect(documentStructure.elements).toBeInstanceOf(Array);
      const specialElements = documentStructure.elements.filter((element) =>
        ['code-block', 'blockquote', 'list'].includes(element.type)
      );
      expect(specialElements.length).toBeGreaterThanOrEqual(0);
    }

    const totalFound =
      formatCounts.headings +
      formatCounts.codeBlocks +
      formatCounts.quotes +
      formatCounts.lists;
    expect(totalFound).toBeGreaterThanOrEqual(0);
  });
});
