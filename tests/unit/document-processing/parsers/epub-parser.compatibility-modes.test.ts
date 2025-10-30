import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { EPUBParser } from '../../../../src/core/document-processing/parsers/epub-parser.js';
import {
  setupEPUBParserFixture,
  cleanupEPUBParserFixture,
} from '../../../support/fixtures/epub-parser.fixture';

describe('EPUBParser Compatibility Tests - Modes', () => {
  let fixture: any;

  beforeEach(() => {
    fixture = setupEPUBParserFixture();
  });

  afterEach(async () => {
    await cleanupEPUBParserFixture(fixture);
  });

  test('COMPATIBILITY-TC02: should test different EPUB specification modes', () => {
    const specModes = [
      { verbose: false, extractMedia: false },
      { verbose: true, extractMedia: true },
      { preserveHTML: false, chapterSensitivity: 0.3 },
      { preserveHTML: true, chapterSensitivity: 0.7 },
    ];

    for (const config of specModes) {
      const parser = new EPUBParser(config);
      expect(parser).toBeDefined();

      expect(() => parser.setOptions({ preserveHTML: true })).not.toThrow();
      expect(() => parser.getStats()).not.toThrow();
    }
  });

  test('COMPATIBILITY-TC06: should test configuration option inheritance', () => {
    const baseConfig = {
      mode: 'tts' as const,
      strictMode: false,
      chapterSensitivity: 0.8,
    };

    const parser = new EPUBParser(baseConfig);
    parser.setOptions({ preserveHTML: true });

    expect(() => parser.getStats()).not.toThrow();

    const stats = parser.getStats();
    expect(stats).toBeDefined();
    expect(typeof stats.parseTime).toBe('number');
  });
});
