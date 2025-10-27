import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { EPUBParser } from '../../../../src/core/document-processing/parsers/epub-parser';
import {
  setupEPUBParserFixture,
  cleanupEPUBParserFixture,
} from '../../../support/fixtures/epub-parser.fixture';
import { VALID_PARSER_OPTIONS } from './epub-parser-test-utils';

describe('EPUBParser Configuration Options Tests', () => {
  let parser: EPUBParser;
  let fixture: any;

  beforeEach(() => {
    fixture = setupEPUBParserFixture();
    parser = fixture.parser;
  });

  afterEach(async () => {
    await cleanupEPUBParserFixture(fixture);
  });

  test('MUTATION-TC03: should test all configuration option combinations', () => {
    VALID_PARSER_OPTIONS.forEach((options) => {
      const testParser = new EPUBParser(options);
      expect(testParser).toBeDefined();

      const stats = testParser.getStats();
      expect(stats).toBeDefined();
      expect(typeof stats.parseTime).toBe('number');
      expect(stats.parseTime).toBe(0);
    });
  });

  test('MUTATION-TC04: should test setOptions with different option types', () => {
    const optionUpdates = [
      { mode: 'tts' as const },
      { strictMode: false },
      { extractMedia: true },
      { preserveHTML: false },
      { chapterSensitivity: 0.85 },
      { mode: 'full' as const, streaming: true },
      { strictMode: false, enableProfiling: true },
      { extractMedia: false, preserveHTML: true },
    ];

    optionUpdates.forEach((options) => {
      expect(() => parser.setOptions(options)).not.toThrow();
    });
  });
});
