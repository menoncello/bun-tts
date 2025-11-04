import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { getErrorCode } from '../../../../src/core/document-processing/parsers/epub-parser-type-guards.js';
import { EPUBParser } from '../../../../src/core/document-processing/parsers/epub-parser.js';
import {
  setupEPUBParserFixture,
  cleanupEPUBParserFixture,
  type EPUBParserFixture,
} from '../../../support/fixtures/epub-parser.fixture';
import { VALID_TEST_INPUTS } from './epub-parser-test-utils.js';

describe('EPUBParser Interface Tests', () => {
  let parser: EPUBParser;
  let fixture: EPUBParserFixture;

  beforeEach(() => {
    fixture = setupEPUBParserFixture();
    parser = fixture.parser;
  });

  afterEach(async () => {
    await cleanupEPUBParserFixture(fixture);
  });

  test('MUTATION-TC06: should test parse method with various inputs', async () => {
    for (const input of VALID_TEST_INPUTS) {
      const result = await parser.parse(input);
      expect(typeof result.success).toBe('boolean');

      if (result.success) {
        expect(result.data).toBeDefined();
        expect(result.error).toBeUndefined();
      } else {
        expect(result.error).toBeDefined();
        const errorCode = getErrorCode(result.error);
        expect(errorCode).toBeDefined();
        expect(result.error!.message).toBeDefined();
        expect(result.data).toBeUndefined();
      }
    }
  });

  test('MUTATION-TC07: should test parse with options override', async () => {
    const testBuffer = Buffer.from('test content');
    const parseOptions = {
      mode: 'tts' as const,
      preserveHTML: true,
      chapterSensitivity: 0.9,
    };

    const result = await parser.parse(testBuffer, parseOptions);
    expect(typeof result.success).toBe('boolean');
  });

  test('MUTATION-TC11: should test interface compliance thoroughly', () => {
    expect(typeof parser.parse).toBe('function');
    expect(typeof parser.setOptions).toBe('function');
    expect(typeof parser.getStats).toBe('function');

    expect(parser.parse.length).toBeGreaterThanOrEqual(1);
    expect(parser.setOptions.length).toBe(1);
    expect(parser.getStats.length).toBe(0);

    expect(() => parser.getStats()).not.toThrow();
    expect(() => parser.setOptions({})).not.toThrow();
    expect(parser.parse(Buffer.from('test'))).resolves.toBeDefined();
  });
});
