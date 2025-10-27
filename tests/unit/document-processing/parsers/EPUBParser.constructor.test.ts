import { describe, test, expect } from 'bun:test';
import { EPUBParser } from '../../../../src/core/document-processing/parsers/epub-parser';

describe('EPUBParser Constructor Mutation Tests', () => {
  test('MUTATION-TC01: should test all constructor branches', () => {
    const defaultParser = new EPUBParser();
    expect(defaultParser).toBeDefined();

    const emptyOptionsParser = new EPUBParser({});
    expect(emptyOptionsParser).toBeDefined();

    const fullOptionsParser = new EPUBParser({
      mode: 'tts',
      streaming: true,
      strictMode: true,
      enableProfiling: true,
      extractMedia: false,
      preserveHTML: true,
      chapterSensitivity: 0.95,
    });
    expect(fullOptionsParser).toBeDefined();

    [defaultParser, emptyOptionsParser, fullOptionsParser].forEach((p) => {
      const stats = p.getStats();
      expect(stats).toBeDefined();
      expect(typeof stats.parseTime).toBe('number');
    });
  });
});
