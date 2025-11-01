/**
 * Integration tests for PDF parser OCR fallback validation.
 * Test case 1.3-PDF-023: OCR fallback mechanism validation.
 *
 * This file serves as the main entry point for OCR fallback tests.
 * Individual test scenarios are organized in separate files for better maintainability.
 */

import { describe, it, expect } from 'bun:test';

// Import all OCR fallback test modules to ensure they run as part of the test suite
// Note: Only import existing test files to avoid import errors
import './pdf-ocr-fallback-text-extraction.test.ts';
import './pdf-ocr-fallback-error-handling.test.ts';
import './pdf-ocr-fallback-formatting.test.ts';

describe('PDF Parser OCR Fallback Integration', () => {
  it('should have all OCR fallback test modules loaded', () => {
    // This is a placeholder test to ensure the test suite is recognized
    // All actual tests are in the imported modules above
    expect(true).toBe(true);
  });
});
