import { describe, test, expect } from 'bun:test';
import { EPUBParser } from '../../../../src/core/document-processing/parsers/epub-parser';

describe('EPUBParser Compatibility Tests - Content', () => {
  test('COMPATIBILITY-TC03: should test compatibility with different content types', async () => {
    const parser = new EPUBParser({ strictMode: false });

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
        expect(result.error!.code).toMatch(/INVALID_INPUT|EPUB_FORMAT_ERROR/);
      }
    }
  });

  test('COMPATIBILITY-TC04: should test fallback behavior for invalid EPUBs', async () => {
    const parser = new EPUBParser({ strictMode: false });

    const invalidContent = [
      Buffer.from('not an epub'),
      Buffer.from('also not an epub'),
      Buffer.from('definitely not epub'),
    ];

    for (const content of invalidContent) {
      const result = await parser.parse(content);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error!.code).toBe('EPUB_FORMAT_ERROR');
    }
  });

  test('COMPATIBILITY-TC05: should test strict vs non-strict mode differences', async () => {
    const strictParser = new EPUBParser({ strictMode: true });
    const lenientParser = new EPUBParser({ strictMode: false });

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
