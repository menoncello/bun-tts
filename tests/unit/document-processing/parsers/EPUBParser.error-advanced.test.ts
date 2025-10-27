import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { EPUBParser } from '../../../../src/core/document-processing/parsers/epub-parser';
import {
  setupEPUBParserFixture,
  cleanupEPUBParserFixture,
} from '../../../support/fixtures/epub-parser.fixture';
import { ERROR_TEST_INPUTS, EDGE_CASE_INPUTS } from './epub-parser-test-utils';

describe('EPUBParser Advanced Error Handling Tests', () => {
  let parser: EPUBParser;
  let fixture: any;

  beforeEach(() => {
    fixture = setupEPUBParserFixture();
    parser = fixture.parser;
  });

  afterEach(async () => {
    await cleanupEPUBParserFixture(fixture);
  });

  test('MUTATION-TC10: should test error normalization for different error types', async () => {
    for (const input of ERROR_TEST_INPUTS) {
      const result = await parser.parse(input);

      if (!result.success) {
        expect(result.error).toBeDefined();
        expect(result.error!.code).toBe('EPUB_FORMAT_ERROR');
        expect(typeof result.error!.message).toBe('string');
        expect(result.error!.message.length).toBeGreaterThan(0);
      }
    }
  });

  test('MUTATION-TC12: should test result structure on both success and failure', async () => {
    const failResult = await parser.parse(null as any);
    expect(failResult.success).toBe(false);
    expect(failResult.error).toBeDefined();
    expect(failResult.data).toBeUndefined();
    expect(typeof failResult.error!.code).toBe('string');
    expect(typeof failResult.error!.message).toBe('string');

    const testResult = await parser.parse(Buffer.from('test'));
    if (testResult.success) {
      expect(testResult.data).toBeDefined();
      expect(testResult.error).toBeUndefined();
    }
  });

  test('MUTATION-TC13: should test edge case input handling', async () => {
    for (const input of EDGE_CASE_INPUTS) {
      const result = await parser.parse(input);
      expect(typeof result.success).toBe('boolean');
    }
  });
});
