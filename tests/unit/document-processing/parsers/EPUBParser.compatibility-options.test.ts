import { describe, test, expect } from 'bun:test';
import { EPUBParser } from '../../../../src/core/document-processing/parsers/epub-parser';

describe('EPUBParser Compatibility Options Tests - Performance', () => {
  test('COMPATIBILITY-TC07: should test performance options compatibility', () => {
    const perfConfigs = [
      { enableProfiling: true },
      { enableProfiling: false },
      { streaming: true },
      { streaming: false },
      { enableProfiling: true, streaming: true },
      { enableProfiling: false, streaming: false },
    ];

    perfConfigs.forEach((config) => {
      const parser = new EPUBParser(config);
      expect(parser).toBeDefined();

      const stats = parser.getStats();
      expect(stats).toBeDefined();
      expect(stats.parseTime).toBe(0);
    });
  });
});
