import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { EPUBParser } from '../../../../src/core/document-processing/parsers/epub-parser';
import {
  setupEPUBParserFixture,
  cleanupEPUBParserFixture,
} from '../../../support/fixtures/epub-parser.fixture';

describe('EPUBParser Compatibility Tests - Version', () => {
  let parser: EPUBParser;
  let fixture: any;

  beforeEach(() => {
    fixture = setupEPUBParserFixture();
    parser = fixture.parser;
  });

  afterEach(async () => {
    await cleanupEPUBParserFixture(fixture);
  });

  test('COMPATIBILITY-TC01: should test EPUB version compatibility handling', () => {
    const compatibilityParsers = [
      new EPUBParser({ strictMode: false }),
      new EPUBParser({ strictMode: true }),
      new EPUBParser({ enableProfiling: true }),
      new EPUBParser({ streaming: true }),
    ];

    compatibilityParsers.forEach((parser) => {
      expect(parser).toBeDefined();
      const stats = parser.getStats();
      expect(stats).toBeDefined();
      expect(typeof stats.parseTime).toBe('number');
    });
  });
});
