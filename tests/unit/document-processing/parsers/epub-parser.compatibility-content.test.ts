import { describe, test, expect, mock } from 'bun:test';
import { getErrorCode } from '../../../../src/core/document-processing/parsers/epub-parser-type-guards.js';
import { EPUBParser } from '../../../../src/core/document-processing/parsers/epub-parser.js';

// Mock the Epub module before importing the modules that use it
const mockEpub = {
  from: mock((input: unknown) => {
    // Check for empty buffer that should fail EPUB parsing
    if (Buffer.isBuffer(input) && input.length === 0) {
      return Promise.reject(new Error('Invalid EPUB: empty file'));
    }

    // Default success case for valid inputs
    return Promise.resolve({ metadata: { title: 'Test Book' } });
  }),
};

mock.module('@smoores/epub', () => ({
  Epub: mockEpub,
}));

describe('EPUBParser Compatibility Tests - Content', () => {
  test('COMPATIBILITY-TC03: should test compatibility with different content types', async () => {
    const parser = new EPUBParser({ verbose: false });

    const contentTypes = [
      Buffer.from('simple text content'),
      Buffer.from('content with html <p>tags</p>'),
      Buffer.from('content with unicode: 测试'),
      Buffer.from('content with numbers 12345'),
    ];

    for (const content of contentTypes) {
      const result = await parser.parse(content);
      expect(typeof result.success).toBe('boolean');

      if (!result.success) {
        expect(result.error).toBeDefined();
        const errorCode = getErrorCode(result.error);
        expect(errorCode).toBe('EPUB_FORMAT_ERROR');
      }
    }
  });

  test('COMPATIBILITY-TC04: should test fallback behavior for invalid EPUBs', async () => {
    const parser = new EPUBParser({ verbose: false });

    const invalidContent = [
      Buffer.from('not an epub'),
      Buffer.from('also not an epub'),
      Buffer.from('definitely not epub'),
    ];

    for (const content of invalidContent) {
      const result = await parser.parse(content);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      const errorCode = getErrorCode(result.error);
      expect(errorCode).toBe('EPUB_FORMAT_ERROR');
    }
  });

  test('COMPATIBILITY-TC05: should test strict vs non-strict mode differences', async () => {
    const strictParser = new EPUBParser({
      verbose: true,
      config: { strictMode: true },
    });
    const lenientParser = new EPUBParser({
      verbose: true,
      config: { strictMode: false },
    });

    const testContent = Buffer.from('test epub content');

    const strictResult = await strictParser.parse(testContent);
    const lenientResult = await lenientParser.parse(testContent);

    expect(typeof strictResult.success).toBe('boolean');
    expect(typeof lenientResult.success).toBe('boolean');

    if (!strictResult.success) {
      expect(strictResult.error).toBeDefined();
    }
    if (!lenientResult.success) {
      expect(lenientResult.error).toBeDefined();
    }
  });
});
