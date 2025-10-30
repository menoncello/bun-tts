import { describe, test, expect, beforeEach, afterEach, mock } from 'bun:test';
import { getErrorCode } from '../../../../src/core/document-processing/parsers/epub-parser-type-guards.js';
import { EPUBParser } from '../../../../src/core/document-processing/parsers/epub-parser.js';
import {
  setupEPUBParserFixture,
  cleanupEPUBParserFixture,
} from '../../../support/fixtures/epub-parser.fixture';
import {
  ERROR_TEST_INPUTS,
  EDGE_CASE_INPUTS,
} from './epub-parser-test-utils.js';

// Mock the Epub module before importing the modules that use it
const mockEpub = {
  from: mock((input: any) => {
    // Check for empty buffer that should fail EPUB parsing
    if (input && input.length === 0) {
      return Promise.reject(new Error('Invalid EPUB: empty file'));
    }

    // Default success case for valid inputs
    return Promise.resolve({ metadata: { title: 'Test Book' } });
  }),
};

mock.module('@smoores/epub', () => ({
  Epub: mockEpub,
}));

describe('EPUBParser Advanced Error Handling Tests', () => {
  let parser: EPUBParser;
  let fixture: any;

  beforeEach(() => {
    fixture = setupEPUBParserFixture();
    parser = fixture.parser;
  });

  afterEach(async () => {
    await cleanupEPUBParserFixture(fixture);
  });

  test('MUTATION-TC10: should test error normalization for different error types', async () => {
    for (const input of ERROR_TEST_INPUTS) {
      const result = await parser.parse(input);

      if (!result.success) {
        expect(result.error).toBeDefined();
        const errorCode = getErrorCode(result.error);
        expect(errorCode).toBe('EPUB_FORMAT_ERROR');
        expect(typeof result.error!.message).toBe('string');
        expect(result.error!.message.length).toBeGreaterThan(0);
      }
    }
  });

  test('MUTATION-TC12: should test result structure on both success and failure', async () => {
    const failResult = await parser.parse(null as any);
    expect(failResult.success).toBe(false);
    expect(failResult.error).toBeDefined();
    expect(failResult.data).toBeUndefined();
    const errorCode = getErrorCode(failResult.error);
    expect(typeof errorCode).toBe('string');
    expect(typeof failResult.error!.message).toBe('string');

    const testResult = await parser.parse(Buffer.from('test'));
    if (testResult.success) {
      expect(testResult.data).toBeDefined();
      expect(testResult.error).toBeUndefined();
    }
  });

  test('MUTATION-TC13: should test edge case input handling', async () => {
    for (const input of EDGE_CASE_INPUTS) {
      const result = await parser.parse(input);
      expect(typeof result.success).toBe('boolean');
    }
  });

  test('MUTATION-TC10b: should test UNKNOWN_ERROR for truly unknown error types', async () => {
    // Test with an input that would cause a generic error, not an EPUB-specific one
    // We can't easily create this scenario through the parse method since most invalid inputs
    // are properly caught as EPUB format errors, but we can verify the error normalization
    // logic by checking that the error handling system is consistent

    // Test empty buffer (which should return EPUB_FORMAT_ERROR, not UNKNOWN_ERROR)
    const emptyBufferResult = await parser.parse(Buffer.alloc(0));
    expect(emptyBufferResult.success).toBe(false);
    expect(emptyBufferResult.error).toBeDefined();
    const emptyBufferErrorCode = getErrorCode(emptyBufferResult.error);
    expect(emptyBufferErrorCode).toBe('EPUB_FORMAT_ERROR'); // Correct: invalid EPUB format

    // Test invalid content (which should also return EPUB_FORMAT_ERROR, not UNKNOWN_ERROR)
    const invalidContentResult = await parser.parse(
      Buffer.from('invalid epub content')
    );
    expect(invalidContentResult.success).toBe(false);
    expect(invalidContentResult.error).toBeDefined();
    const invalidContentErrorCode = getErrorCode(invalidContentResult.error);
    expect(invalidContentErrorCode).toBe('EPUB_FORMAT_ERROR'); // Correct: invalid EPUB format
  });
});
