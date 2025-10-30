import { describe, test, expect, beforeEach, afterEach, mock } from 'bun:test';
import { getErrorCode } from '../../../../src/core/document-processing/parsers/epub-parser-type-guards.js';
import { EPUBParser } from '../../../../src/core/document-processing/parsers/epub-parser.js';
import {
  setupEPUBParserFixture,
  cleanupEPUBParserFixture,
} from '../../../support/fixtures/epub-parser.fixture';

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

describe('EPUBParser Error Handling Basic Tests', () => {
  let parser: EPUBParser;
  let fixture: any;

  beforeEach(() => {
    fixture = setupEPUBParserFixture();
    parser = fixture.parser;
  });

  afterEach(async () => {
    await cleanupEPUBParserFixture(fixture);
  });

  test('MUTATION-TC02: should test all error code paths', async () => {
    const nullResult = await parser.parse(null as any);
    expect(nullResult.success).toBe(false);
    const nullErrorCode = getErrorCode(nullResult.error);
    expect(nullErrorCode).toBe('INVALID_INPUT_TYPE');

    const undefinedResult = await parser.parse(undefined as any);
    expect(undefinedResult.success).toBe(false);
    const undefinedErrorCode = getErrorCode(undefinedResult.error);
    expect(undefinedErrorCode).toBe('INVALID_INPUT_TYPE');

    const emptyStringResult = await parser.parse('');
    expect(emptyStringResult.success).toBe(false);
    const emptyStringErrorCode = getErrorCode(emptyStringResult.error);
    expect(emptyStringErrorCode).toBe('INVALID_INPUT');

    const emptyBufferResult = await parser.parse(Buffer.alloc(0));
    expect(emptyBufferResult.success).toBe(false);
    const emptyBufferErrorCode = getErrorCode(emptyBufferResult.error);
    expect(emptyBufferErrorCode).toBe('EPUB_FORMAT_ERROR');
  });
});
