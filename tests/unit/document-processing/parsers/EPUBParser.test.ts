import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { EPUBParser } from '../../../../src/core/document-processing/parsers/epub-parser';
import {
  DocumentParseError,
  EPUBFormatError,
} from '../../../../src/errors/document-parse-error';
import {
  setupEPUBParserFixture,
  cleanupEPUBParserFixture,
} from '../../../support/fixtures/epub-parser.fixture';
import {
  testDefaultConstructor,
  testCustomConstructor,
  testNullInput,
  testUndefinedInput,
  testEmptyStringInput,
  testEmptyBufferInput,
  testInvalidEPUBContent,
  testSetOptions,
  testGetStats,
  testErrorNormalization,
  testUnknownErrorTypes,
  testExtractMediaOption,
  testPreserveHTMLOption,
  testChapterSensitivityOption,
  testWordCounting,
  testHTMLRemoval,
  testHTMLPreservation,
  testPerformanceStatsUpdate,
  testInterfaceImplementation,
  testMethodSignatures,
} from './epub-parser-test-utils';

describe('EPUBParser Constructor', () => {
  let parser: EPUBParser;
  let fixture: any;

  beforeEach(() => {
    fixture = setupEPUBParserFixture();
    parser = fixture.parser;
  });

  afterEach(async () => {
    await cleanupEPUBParserFixture(fixture);
  });

  test('AC1-TC01: should create parser with default options', () => {
    testDefaultConstructor(parser);
  });

  test('AC1-TC02: should accept custom options', () => {
    const customOptions = {
      mode: 'tts' as const,
      extractMedia: false,
      preserveHTML: true,
      chapterSensitivity: 0.9,
    };

    testCustomConstructor(customOptions);
  });
});

describe('EPUBParser Parse Method', () => {
  let parser: EPUBParser;
  let fixture: any;

  beforeEach(() => {
    fixture = setupEPUBParserFixture();
    parser = fixture.parser;
  });

  afterEach(async () => {
    await cleanupEPUBParserFixture(fixture);
  });

  test('AC1-TC03: should handle null input', async () => {
    await testNullInput(parser);
  });

  test('AC1-TC04: should handle undefined input', async () => {
    await testUndefinedInput(parser);
  });

  test('AC1-TC05: should handle empty string input', async () => {
    await testEmptyStringInput(parser);
  });

  test('AC1-TC06: should handle empty buffer input', async () => {
    await testEmptyBufferInput(parser);
  });

  test('AC1-TC07: should handle invalid EPUB content', async () => {
    await testInvalidEPUBContent(parser, fixture.corruptedEPUB);
  });
});

describe('EPUBParser Configuration and Stats', () => {
  let parser: EPUBParser;
  let fixture: any;

  beforeEach(() => {
    fixture = setupEPUBParserFixture();
    parser = fixture.parser;
  });

  afterEach(async () => {
    await cleanupEPUBParserFixture(fixture);
  });

  test('AC1-TC08: should update parser options', () => {
    testSetOptions(parser);
  });

  test('AC1-TC09: should return performance statistics', () => {
    testGetStats(parser);
  });
});

describe('EPUBParser Error Handling', () => {
  let parser: EPUBParser;
  let fixture: any;

  beforeEach(() => {
    fixture = setupEPUBParserFixture();
    parser = fixture.parser;
  });

  afterEach(async () => {
    await cleanupEPUBParserFixture(fixture);
  });

  test('AC1-TC10: should normalize Error objects to DocumentParseError', async () => {
    await testErrorNormalization(parser, fixture.corruptedEPUB);
  });

  test('AC1-TC11: should handle unknown error types', async () => {
    await testUnknownErrorTypes(parser, fixture.corruptedEPUB);
  });
});

describe('EPUBParser Content Processing', () => {
  test('AC3-TC01: should respect extractMedia option', () => {
    testExtractMediaOption();
  });

  test('AC3-TC02: should respect preserveHTML option', () => {
    testPreserveHTMLOption();
  });

  test('AC2-TC01: should respect chapterSensitivity option', () => {
    testChapterSensitivityOption();
  });

  test('AC6-TC01: should count words correctly', () => {
    testWordCounting();
  });

  test('AC6-TC02: should process content with HTML removal when preserveHTML is false', () => {
    testHTMLRemoval();
  });

  test('AC6-TC03: should preserve HTML when preserveHTML is true', () => {
    testHTMLPreservation();
  });
});

describe('EPUBParser Statistics and Interface', () => {
  let parser: EPUBParser;
  let fixture: any;

  beforeEach(() => {
    fixture = setupEPUBParserFixture();
    parser = fixture.parser;
  });

  afterEach(async () => {
    await cleanupEPUBParserFixture(fixture);
  });

  test('AC1-TC12: should update performance stats after parsing attempt', async () => {
    await testPerformanceStatsUpdate(parser, fixture.corruptedEPUB);
  });

  test('AC1-TC13: should implement DocumentParser interface', () => {
    testInterfaceImplementation(parser);
  });

  test('AC1-TC14: should have correct method signatures', () => {
    testMethodSignatures(parser);
  });
});
