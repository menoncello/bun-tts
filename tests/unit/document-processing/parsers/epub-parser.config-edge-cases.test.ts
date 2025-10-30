import { describe, test, expect } from 'bun:test';
import { EPUBParser } from '../../../../src/core/document-processing/parsers/epub-parser.js';

describe('EPUBParser Configuration Edge Cases', () => {
  test('MUTATION-TC14: should test configuration options edge cases', () => {
    const edgeConfigOptions = [
      { chapterSensitivity: 0 },
      { chapterSensitivity: 1 },
      { chapterSensitivity: -1 },
      { chapterSensitivity: 2 },
      { mode: 'tts' as const },
      { mode: 'full' as const },
      { strictMode: true },
      { strictMode: false },
      { streaming: true },
      { streaming: false },
      { enableProfiling: true },
      { enableProfiling: false },
      { extractMedia: true },
      { extractMedia: false },
      { preserveHTML: true },
      { preserveHTML: false },
    ];

    for (const options of edgeConfigOptions) {
      const testParser = new EPUBParser(options);
      expect(testParser).toBeDefined();
      const stats = testParser.getStats();
      expect(stats).toBeDefined();
    }
  });
});
