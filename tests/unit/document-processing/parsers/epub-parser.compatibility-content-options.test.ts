import { describe, test, expect } from 'bun:test';
import { EPUBParser } from '../../../../src/core/document-processing/parsers/epub-parser.js';
import { COMPLEX_CONFIGURATIONS } from './epub-parser-test-utils.js';

describe('EPUBParser Compatibility Options Tests - Content', () => {
  test('COMPATIBILITY-TC08: should test content processing options', () => {
    const contentConfigs = [
      { extractMedia: true, preserveHTML: false },
      { extractMedia: false, preserveHTML: true },
      { extractMedia: true, preserveHTML: true },
      { extractMedia: false, preserveHTML: false },
    ];

    for (const config of contentConfigs) {
      const parser = new EPUBParser(config);
      expect(parser).toBeDefined();

      expect(() =>
        parser.setOptions({ chapterSensitivity: 0.9 })
      ).not.toThrow();
      expect(() => parser.getStats()).not.toThrow();
    }
  });

  test('COMPATIBILITY-TC09: should test chapter detection sensitivity options', () => {
    const sensitivityValues = [0.1, 0.5, 0.8, 0.9, 1.0];

    for (const sensitivity of sensitivityValues) {
      const parser = new EPUBParser({ chapterSensitivity: sensitivity });
      expect(parser).toBeDefined();

      const stats = parser.getStats();
      expect(stats).toBeDefined();
    }
  });

  test('COMPATIBILITY-TC10: should test complex configuration combinations', () => {
    for (const config of COMPLEX_CONFIGURATIONS) {
      const parser = new EPUBParser(config);
      expect(parser).toBeDefined();

      expect(() => parser.getStats()).not.toThrow();
      expect(() => parser.setOptions({})).not.toThrow();
    }
  });
});
