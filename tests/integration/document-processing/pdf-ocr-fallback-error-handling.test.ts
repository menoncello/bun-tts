/**
 * OCR error handling and recovery tests.
 * Test case 1.3-PDF-023: OCR fallback mechanism validation - Error handling.
 */

import { describe, it, expect } from 'bun:test';
import { validateGracefulErrorHandling } from '../../unit/document-processing/parsers/pdf-ocr-fallback-test-utils';
import {
  createCustomOCRParser,
  OCR_CONFIGS,
} from './pdf-ocr-fallback-test-setup';

describe('PDF Parser OCR Fallback - Error Handling', () => {
  it('should handle OCR fallback errors gracefully', async () => {
    const robustParser = await createCustomOCRParser(
      OCR_CONFIGS.ERROR_HANDLING
    );
    const result = await robustParser.parse('test-file.pdf');

    expect(result.success).toBe(true);
    if (!result.success) return;

    const documentStructure = result.data;
    validateGracefulErrorHandling(documentStructure);
  });
});
