/**
 * OCR text extraction tests.
 * Test case 1.3-PDF-023: OCR fallback mechanism validation - Text extraction.
 */

import { describe, it, expect } from 'bun:test';
import { validateOCRTextExtraction } from '../../unit/document-processing/parsers/pdf-ocr-fallback-test-utils';
import {
  createCustomOCRParser,
  OCR_CONFIGS,
} from './pdf-ocr-fallback-test-setup';

describe('PDF Parser OCR Fallback - Text Extraction', () => {
  it('should handle OCR processing for text extraction from images', async () => {
    const ocrTextParser = await createCustomOCRParser(
      OCR_CONFIGS.TEXT_EXTRACTION
    );
    const result = await ocrTextParser.parse('test-file.pdf');

    expect(result.success).toBe(true);
    if (!result.success) return;

    const documentStructure = result.data;
    validateOCRTextExtraction(documentStructure);
  });
});
