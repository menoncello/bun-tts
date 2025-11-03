import { describe, test, expect, beforeEach, afterEach, mock } from 'bun:test';
import {
  getErrorCode,
  getErrorRecoverable,
} from '../../../../src/core/document-processing/parsers/epub-parser-type-guards.js';
import type { EPUBParseOptions } from '../../../../src/core/document-processing/parsers/epub-parser-types.js';
import { EPUBParser } from '../../../../src/core/document-processing/parsers/epub-parser.js';
import type {
  ParseResult,
  PerformanceStats,
} from '../../../../src/core/document-processing/types.js';
import {
  setupEPUBParserFixture,
  cleanupEPUBParserFixture,
} from '../../../support/fixtures/epub-parser.fixture.js';

// Mock the Epub module before importing the modules that use it
const mockEpub = {
  from: mock((input: unknown) => {
    // Check for empty buffer that should fail EPUB parsing
    if (Buffer.isBuffer(input) && input.length === 0) {
      return Promise.reject(new Error('Invalid EPUB: empty file'));
    }

    // Default success case for valid inputs
    const mockEpubInstance = {
      metadata: { title: 'Test Book', creator: 'Test Author' },
      getMetadata: mock(() =>
        Promise.resolve({ title: 'Test Book', creator: 'Test Author' })
      ),
      getTitle: mock(() => Promise.resolve('Test Book')),
      getCreators: mock(() => Promise.resolve(['Test Author'])),
      getLanguage: mock(() => Promise.resolve('en')),
      getSpineItems: mock(() =>
        Promise.resolve([{ idref: 'chapter1', href: 'chapter1.xhtml' }])
      ),
      readXhtmlItemContents: mock(() => Promise.resolve('<p>Test content</p>')),
      close: mock(() => Promise.resolve()),
    };
    return Promise.resolve(mockEpubInstance);
  }),
};

mock.module('@smoores/epub', () => ({
  Epub: mockEpub,
}));

let parser: EPUBParser;
let fixture: ReturnType<typeof setupEPUBParserFixture>;

const setupTestEnvironment = (): void => {
  fixture = setupEPUBParserFixture();
  parser = fixture.parser;
};

const teardownTestEnvironment = async (): Promise<void> => {
  await cleanupEPUBParserFixture(fixture);
};

const testLargeBufferHandling = async (): Promise<void> => {
  // GIVEN: Extremely large buffer input
  const largeBuffer = Buffer.alloc(10 * 1024 * 1024); // 10MB buffer
  largeBuffer.fill('A');

  // WHEN: Parsing large buffer
  const result = await parser.parse(largeBuffer);

  // THEN: Should handle gracefully without memory issues
  expect(result).toBeDefined();
  expect(typeof result.success).toBe('boolean');
  if (!result.success) {
    expect(result.error).toBeDefined();
    const errorCode = getErrorCode(result.error);
    expect(errorCode).toBeDefined();
  }
};

const testCorruptedStructureHandling = async (): Promise<void> => {
  // GIVEN: Malformed EPUB content with corrupted zip structure
  const corruptedContent = Buffer.from([
    0x50,
    0x4B,
    0x03,
    0x04, // ZIP signature
    0x14,
    0x00,
    0x00,
    0x00, // Version
    0xFF,
    0xFF,
    0xFF,
    0xFF, // Invalid flags
    // ... rest of corrupted content
  ]);

  // WHEN: Parsing corrupted EPUB
  const result = await parser.parse(corruptedContent);

  // THEN: Should handle gracefully with structured error
  expect(result.success).toBe(false);
  expect(result.error).toBeDefined();
  const errorCode = getErrorCode(result.error);
  expect(errorCode).toBe('EPUB_FORMAT_ERROR');
};

const testBinaryContentHandling = async (): Promise<void> => {
  // GIVEN: Binary content that's not EPUB format
  const binaryContent = Buffer.from([
    0x89,
    0x50,
    0x4E,
    0x47,
    0x0D,
    0x0A,
    0x1A,
    0x0A, // PNG header
  ]);

  // WHEN: Parsing binary content as EPUB
  const result = await parser.parse(binaryContent);

  // THEN: Should fail gracefully
  expect(result.success).toBe(false);
  expect(result.error).toBeDefined();
};

const testUnicodeContentHandling = async (): Promise<void> => {
  // GIVEN: Content with unicode characters
  const unicodeContent = Buffer.from(
    'PK\x03\x04Unicode content: ñáéíóú 📚',
    'utf8'
  );

  // WHEN: Parsing unicode content
  const result = await parser.parse(unicodeContent);

  // THEN: Should handle unicode gracefully
  expect(result).toBeDefined();
  expect(typeof result.success).toBe('boolean');
};

const createParserWithOptions = (options: EPUBParseOptions): void => {
  expect(() => new EPUBParser(options)).not.toThrow();
};

const testParserOptionsValidation = (): void => {
  // GIVEN: Parser with various option combinations
  const testOptions: EPUBParseOptions[] = [
    { extractMedia: true },
    { extractMedia: false },
    { preserveHTML: true },
    { preserveHTML: false },
    { chapterSensitivity: 0.5 },
    { chapterSensitivity: 1.0 },
    { extractMedia: false },
    { preserveHTML: true },
    { preserveHTML: false },
  ];

  // WHEN: Creating parsers with different options
  // THEN: All should be created without errors
  for (const options of testOptions) {
    createParserWithOptions(options);
  }
};

const testEmptyOptionsHandling = (): void => {
  // GIVEN: Empty options object
  // WHEN: Creating parser
  const parserWithOptions = new EPUBParser({});

  // THEN: Should create successfully
  expect(parserWithOptions).toBeDefined();
  expect(typeof parserWithOptions.parse).toBe('function');
};

const testNullOrUndefinedOptionsHandling = (): void => {
  // GIVEN: Null or undefined options
  // WHEN: Creating parser with null/undefined options
  // THEN: Should not throw and use defaults
  expect(
    () => new EPUBParser(null as unknown as EPUBParseOptions)
  ).not.toThrow();
  expect(
    () => new EPUBParser(undefined as unknown as EPUBParseOptions)
  ).not.toThrow();
};

const testStatisticsTracking = async (): Promise<void> => {
  // GIVEN: Parser instance

  // WHEN: Performing parse operation that affects stats
  await parser.parse(fixture.corruptedEPUB);

  const statsAfter = parser.getStats();

  // THEN: Statistics should be properly tracked
  expect(statsAfter).toBeDefined();
  expect(typeof statsAfter.parseTimeMs).toBe('number');
  expect(typeof statsAfter.chaptersPerSecond).toBe('number');
  expect(typeof statsAfter.memoryUsageMB).toBe('number');
  expect(typeof statsAfter.cacheHits).toBe('number');
  expect(typeof statsAfter.cacheMisses).toBe('number');
};

const testRepeatedOperations = async (): Promise<void> => {
  // GIVEN: Parser instance
  // WHEN: Performing multiple parse operations
  const results = await Promise.all([
    parser.parse(fixture.corruptedEPUB),
    parser.parse(fixture.corruptedEPUB),
    parser.parse(fixture.corruptedEPUB),
  ]);

  // THEN: All should complete without errors
  for (const result of results) {
    expect(result).toBeDefined();
    expect(typeof result.success).toBe('boolean');
  }
};

const testConcurrentOperations = async (): Promise<void> => {
  // GIVEN: Parser instance
  // WHEN: Running multiple parse operations concurrently
  const concurrentPromises = Array.from({ length: 5 }, () =>
    parser.parse(fixture.corruptedEPUB)
  );

  const results = await Promise.all(concurrentPromises);

  // THEN: All should complete successfully
  expect(results).toHaveLength(5);
  for (const result of results) {
    expect(result).toBeDefined();
    expect(typeof result.success).toBe('boolean');
  }
};

const testMalformedJSONHandling = async (): Promise<void> => {
  // GIVEN: Content that simulates malformed metadata
  const malformedContent = Buffer.from(
    'PK\x03\x04mimetypeapplication/epub+zipPK\x03\x04META-INF/container.xml' +
      '<?xml version="1.0"?><container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">' +
      '<rootfiles><rootfile full-path="content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>' +
      'PK\x03\x04content.opf' +
      '<?xml version="1.0" encoding="UTF-8"?>' +
      '<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="BookId">' +
      '<metadata xmlns:dc="http://purl.org/dc/elements/1.1/">' +
      '<dc:title>{"invalid": json}' + // Malformed JSON-like title
      '</metadata></package>'
  );

  // WHEN: Parsing content with malformed metadata
  const result = await parser.parse(malformedContent);

  // THEN: Should handle gracefully without crashing
  expect(result).toBeDefined();
  expect(typeof result.success).toBe('boolean');
};

const testParserStateMutations = async (): Promise<void> => {
  // GIVEN: Parser instance

  // WHEN: Modifying parser options during operation
  const currentStats = parser.getStats();
  parser.setOptions({ extractMedia: !currentStats.parseTimeMs });
  await parser.parse(fixture.corruptedEPUB);
  parser.setOptions({ extractMedia: false });

  // THEN: Parser should remain functional
  const finalStats = parser.getStats();
  expect(finalStats).toBeDefined();
  expect(typeof finalStats.parseTimeMs).toBe('number');
};

const testBoundaryConditions = async (): Promise<void> => {
  // GIVEN: Buffer with various boundary conditions
  const boundaryConditions = [
    Buffer.alloc(0), // Empty buffer
    Buffer.from([0x00]), // Single null byte
    Buffer.from([0xFF]), // Single 0xFF byte
    Buffer.from('\x00\x00\x00'), // Multiple null bytes
    Buffer.from(Array.from({ length: 1000 }).fill(0).join('')), // Long empty string
  ];

  // WHEN: Testing each boundary condition
  const results = await Promise.all(
    boundaryConditions.map((buffer) => parser.parse(buffer))
  );

  // THEN: All should handle gracefully
  for (const result of results) {
    expect(result).toBeDefined();
    expect(typeof result.success).toBe('boolean');
    if (!result.success) {
      expect(result.error).toBeDefined();
    }
  }
};

const validateErrorConditionResult = (result: ParseResult): void => {
  // THEN: Each should produce structured error response
  expect(result).toBeDefined();
  if (!result.success) {
    expect(result.error).toBeDefined();
    const errorCode = getErrorCode(result.error);
    const isRecoverable = getErrorRecoverable(result.error);
    expect(errorCode).toBeDefined();
    expect(result.error!.message).toBeDefined();
    expect(isRecoverable === null || typeof isRecoverable === 'boolean').toBe(
      true
    );
  }
};

const testErrorConditionHandling = async (): Promise<void> => {
  // GIVEN: Various error conditions
  const errorConditions: Array<string | Buffer | null | undefined> = [
    null,
    undefined,
    '',
    Buffer.alloc(0),
    Buffer.from('invalid'),
    Buffer.from('\x00\x01\x02'),
  ];

  // WHEN: Testing each error condition
  for (const condition of errorConditions) {
    const result = await parser.parse(condition as unknown);
    validateErrorConditionResult(result);
  }
};

const generateAllConfigurations = (): EPUBParseOptions[] => {
  // GIVEN: All possible parser configuration combinations
  const booleanOptions = [true, false];
  const configurations: EPUBParseOptions[] = [];

  for (const extractMedia of booleanOptions) {
    for (const preserveHTML of booleanOptions) {
      for (const chapterSensitivity of [0.5, 0.8, 1.0]) {
        configurations.push({
          extractMedia,
          preserveHTML,
          chapterSensitivity,
        });
      }
    }
  }
  return configurations;
};

const testConfigurationCreation = (): void => {
  const configurations = generateAllConfigurations();

  // WHEN: Creating parsers with all configurations
  // THEN: All should be created successfully
  for (const config of configurations) {
    expect(() => new EPUBParser(config)).not.toThrow();
  }
};

const validateStatsStructure = (stats: PerformanceStats): void => {
  expect(stats).toBeDefined();
  expect(typeof stats.parseTimeMs).toBe('number');
  expect(typeof stats.chaptersPerSecond).toBe('number');
  expect(typeof stats.memoryUsageMB).toBe('number');
  expect(typeof stats.cacheHits).toBe('number');
  expect(typeof stats.cacheMisses).toBe('number');
};

const testStatisticsWithDifferentStates = (): void => {
  // GIVEN: Parser in different states
  const freshParser = new EPUBParser();
  const configuredParser = new EPUBParser({ extractMedia: true });

  // WHEN: Getting statistics from different parser states
  const freshStats = freshParser.getStats();
  const configuredStats = configuredParser.getStats();

  // THEN: All should return proper statistics structure
  for (const stats of [freshStats, configuredStats]) {
    validateStatsStructure(stats);
  }
};

const defineBufferHandlingTests = (): void => {
  describe('Buffer Handling Edge Cases', () => {
    test(
      'AC1-EC01: should handle extremely large buffer input',
      testLargeBufferHandling
    );

    test(
      'AC1-EC02: should handle malformed EPUB with corrupted structure',
      testCorruptedStructureHandling
    );

    test(
      'AC1-EC03: should handle binary non-EPUB content',
      testBinaryContentHandling
    );

    test(
      'AC1-EC04: should handle UTF-8 and unicode content in EPUB',
      testUnicodeContentHandling
    );

    test(
      'AC1-EC13: should handle boundary conditions in string processing',
      testBoundaryConditions
    );
  });
};

const defineParserOptionsTests = (): void => {
  describe('Parser Options Edge Cases', () => {
    test(
      'AC1-EC05: should handle parser options validation',
      testParserOptionsValidation
    );

    test(
      'AC1-EC06: should handle empty options object',
      testEmptyOptionsHandling
    );

    test(
      'AC1-EC07: should handle null and undefined options gracefully',
      testNullOrUndefinedOptionsHandling
    );
  });
};

const definePerformanceTests = (): void => {
  describe('Performance and Concurrency Edge Cases', () => {
    test(
      'AC1-EC08: should handle statistics tracking mutations',
      testStatisticsTracking
    );

    test(
      'AC1-EC09: should handle repeated parse operations',
      testRepeatedOperations
    );

    test(
      'AC1-EC10: should handle concurrent parse operations',
      testConcurrentOperations
    );
  });
};

const defineDataHandlingTests = (): void => {
  describe('Data Handling Edge Cases', () => {
    test(
      'AC1-EC11: should handle malformed JSON in metadata extraction',
      testMalformedJSONHandling
    );

    test(
      'AC1-EC12: should handle parser state mutations',
      testParserStateMutations
    );
  });
};

const defineCriticalEdgeCaseTests = (): void => {
  describe('Critical Edge Cases for Mutation Coverage', () => {
    defineBufferHandlingTests();
    defineParserOptionsTests();
    definePerformanceTests();
    defineDataHandlingTests();
  });
};

const defineMutationCoverageTests = (): void => {
  describe('Mutation Testing Coverage', () => {
    test(
      'AC1-MT01: should test all conditional branches in error handling',
      testErrorConditionHandling
    );

    test(
      'AC1-MT02: should test all parser configuration combinations',
      testConfigurationCreation
    );

    test(
      'AC1-MT03: should test statistics method with different states',
      testStatisticsWithDifferentStates
    );
  });
};

describe('EPUBParser Edge Cases and Error Handling', () => {
  beforeEach(setupTestEnvironment);
  afterEach(teardownTestEnvironment);

  defineCriticalEdgeCaseTests();
  defineMutationCoverageTests();
});
