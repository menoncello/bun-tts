import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { EPUBParser } from '../../../../src/core/document-processing/parsers/epub-parser.js';
import {
  setupEPUBParserFixture,
  cleanupEPUBParserFixture,
} from '../../../support/fixtures/epub-parser.fixture.js';

describe('EPUBParser Compatibility Tests - Version', () => {
  let fixture: any;

  beforeEach(() => {
    fixture = setupEPUBParserFixture();
  });

  afterEach(async () => {
    await cleanupEPUBParserFixture(fixture);
  });

  test('COMPATIBILITY-TC01: should test EPUB version compatibility handling', () => {
    const compatibilityParsers = [
      new EPUBParser({ verbose: false }),
      new EPUBParser({ verbose: true }),
      new EPUBParser({ extractMedia: true }),
      new EPUBParser({ preserveHTML: true }),
    ];

    for (const parser of compatibilityParsers) {
      expect(parser).toBeDefined();
      const stats = parser.getStats();
      expect(stats).toBeDefined();
      expect(typeof stats.parseTime).toBe('number');
    }
  });
});
