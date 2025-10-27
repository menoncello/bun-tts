import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { EPUBParser } from '../../../../src/core/document-processing/parsers/epub-parser';
import {
  setupEPUBParserFixture,
  cleanupEPUBParserFixture,
} from '../../../support/fixtures/epub-parser.fixture';

describe('EPUBParser Error Handling Basic Tests', () => {
  let parser: EPUBParser;
  let fixture: any;

  beforeEach(() => {
    fixture = setupEPUBParserFixture();
    parser = fixture.parser;
  });

  afterEach(async () => {
    await cleanupEPUBParserFixture(fixture);
  });

  test('MUTATION-TC02: should test all error code paths', async () => {
    const nullResult = await parser.parse(null as any);
    expect(nullResult.success).toBe(false);
    expect(nullResult.error!.code).toBe('INVALID_INPUT');

    const undefinedResult = await parser.parse(undefined as any);
    expect(undefinedResult.success).toBe(false);
    expect(undefinedResult.error!.code).toBe('INVALID_INPUT');

    const emptyStringResult = await parser.parse('');
    expect(emptyStringResult.success).toBe(false);
    expect(emptyStringResult.error!.code).toBe('INVALID_INPUT');

    const emptyBufferResult = await parser.parse(Buffer.alloc(0));
    expect(emptyBufferResult.success).toBe(false);
    expect(emptyBufferResult.error!.code).toBe('EPUB_FORMAT_ERROR');
  });
});
