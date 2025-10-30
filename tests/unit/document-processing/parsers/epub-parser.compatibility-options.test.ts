import { describe, test, expect } from 'bun:test';
import { EPUBParser } from '../../../../src/core/document-processing/parsers/epub-parser.js';

describe('EPUBParser Compatibility Options Tests - Performance', () => {
  test('COMPATIBILITY-TC07: should test performance options compatibility', () => {
    const perfConfigs = [
      { verbose: true },
      { verbose: false },
      { extractMedia: true },
      { extractMedia: false },
      { preserveHTML: true, chapterSensitivity: 0.5 },
      { preserveHTML: false, chapterSensitivity: 0.3 },
    ];

    for (const config of perfConfigs) {
      const parser = new EPUBParser(config);
      expect(parser).toBeDefined();

      const stats = parser.getStats();
      expect(stats).toBeDefined();
      expect(stats.parseTime).toBe(0);
    }
  });
});
