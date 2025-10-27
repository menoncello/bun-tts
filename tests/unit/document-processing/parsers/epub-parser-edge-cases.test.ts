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

let parser: EPUBParser;
let fixture: any;

const setupTestEnvironment = () => {
  fixture = setupEPUBParserFixture();
  parser = fixture.parser;
};

const teardownTestEnvironment = async () => {
  await cleanupEPUBParserFixture(fixture);
};

const testLargeBufferHandling = async () => {
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
    expect(result.error!.code).toBeDefined();
  }
};

const testCorruptedStructureHandling = async () => {
  // GIVEN: Malformed EPUB content with corrupted zip structure
  const corruptedContent = Buffer.from([
    0x50,
    0x4b,
    0x03,
    0x04, // ZIP signature
    0x14,
    0x00,
    0x00,
    0x00, // Version
    0xff,
    0xff,
    0xff,
    0xff, // Invalid flags
    // ... rest of corrupted content
  ]);

  // WHEN: Parsing corrupted EPUB
  const result = await parser.parse(corruptedContent);

  // THEN: Should handle gracefully with structured error
  expect(result.success).toBe(false);
  expect(result.error).toBeDefined();
  expect(result.error!.code).toBe('EPUB_FORMAT_ERROR');
};

const testBinaryContentHandling = async () => {
  // GIVEN: Binary content that's not EPUB format
  const binaryContent = Buffer.from([
    0x89,
    0x50,
    0x4e,
    0x47,
    0x0d,
    0x0a,
    0x1a,
    0x0a, // PNG header
  ]);

  // WHEN: Parsing binary content as EPUB
  const result = await parser.parse(binaryContent);

  // THEN: Should fail gracefully
  expect(result.success).toBe(false);
  expect(result.error).toBeDefined();
};

const testUnicodeContentHandling = async () => {
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

const createParserWithOptions = (options: any) => {
  expect(() => new EPUBParser(options)).not.toThrow();
};

const testParserOptionsValidation = () => {
  // GIVEN: Parser with various option combinations
  const testOptions = [
    { strictMode: true },
    { strictMode: false },
    { enableProfiling: true },
    { enableProfiling: false },
    { streaming: true },
    { streaming: false },
    { extractMedia: true },
    { extractMedia: false },
    { preserveHTML: true },
    { preserveHTML: false },
  ];

  // WHEN: Creating parsers with different options
  // THEN: All should be created without errors
  testOptions.forEach(createParserWithOptions);
};

const testEmptyOptionsHandling = () => {
  // GIVEN: Empty options object
  // WHEN: Creating parser
  const parserWithOptions = new EPUBParser({});

  // THEN: Should create successfully
  expect(parserWithOptions).toBeDefined();
  expect(typeof parserWithOptions.parse).toBe('function');
};

const testNullOrUndefinedOptionsHandling = () => {
  // GIVEN: Null or undefined options
  // WHEN: Creating parser with null/undefined options
  // THEN: Should not throw and use defaults
  expect(() => new EPUBParser(null as any)).not.toThrow();
  expect(() => new EPUBParser(undefined as any)).not.toThrow();
};

const testStatisticsTracking = async () => {
  // GIVEN: Parser instance
  const statsBefore = parser.getStats();

  // WHEN: Performing parse operation that affects stats
  await parser.parse(fixture.corruptedEPUB);

  const statsAfter = parser.getStats();

  // THEN: Statistics should be properly tracked
  expect(statsAfter).toBeDefined();
  expect(typeof statsAfter.parseTime).toBe('number');
  expect(typeof statsAfter.chaptersPerSecond).toBe('number');
  expect(typeof statsAfter.memoryUsage).toBe('number');
  expect(typeof statsAfter.cacheHits).toBe('number');
  expect(typeof statsAfter.cacheMisses).toBe('number');
};

const testRepeatedOperations = async () => {
  // GIVEN: Parser instance
  // WHEN: Performing multiple parse operations
  const results = await Promise.all([
    parser.parse(fixture.corruptedEPUB),
    parser.parse(fixture.corruptedEPUB),
    parser.parse(fixture.corruptedEPUB),
  ]);

  // THEN: All should complete without errors
  results.forEach((result) => {
    expect(result).toBeDefined();
    expect(typeof result.success).toBe('boolean');
  });
};

const testConcurrentOperations = async () => {
  // GIVEN: Parser instance
  // WHEN: Running multiple parse operations concurrently
  const concurrentPromises = Array.from({ length: 5 }, () =>
    parser.parse(fixture.corruptedEPUB)
  );

  const results = await Promise.all(concurrentPromises);

  // THEN: All should complete successfully
  expect(results).toHaveLength(5);
  results.forEach((result) => {
    expect(result).toBeDefined();
    expect(typeof result.success).toBe('boolean');
  });
};

const testMalformedJSONHandling = async () => {
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

const testParserStateMutations = async () => {
  // GIVEN: Parser instance
  const initialStats = parser.getStats();

  // WHEN: Modifying parser options during operation
  parser.setOptions({ strictMode: !parser.getStats().parseTime });
  await parser.parse(fixture.corruptedEPUB);
  parser.setOptions({ strictMode: false });

  // THEN: Parser should remain functional
  const finalStats = parser.getStats();
  expect(finalStats).toBeDefined();
  expect(typeof finalStats.parseTime).toBe('number');
};

const testBoundaryConditions = async () => {
  // GIVEN: Buffer with various boundary conditions
  const boundaryConditions = [
    Buffer.alloc(0), // Empty buffer
    Buffer.from([0x00]), // Single null byte
    Buffer.from([0xff]), // Single 0xFF byte
    Buffer.from('\x00\x00\x00'), // Multiple null bytes
    Buffer.from(new Array(1000).fill(0).join('')), // Long empty string
  ];

  // WHEN: Testing each boundary condition
  const results = await Promise.all(
    boundaryConditions.map((buffer) => parser.parse(buffer))
  );

  // THEN: All should handle gracefully
  results.forEach((result, index) => {
    expect(result).toBeDefined();
    expect(typeof result.success).toBe('boolean');
    if (!result.success) {
      expect(result.error).toBeDefined();
    }
  });
};

const validateErrorConditionResult = (result: any) => {
  // THEN: Each should produce structured error response
  expect(result).toBeDefined();
  if (!result.success) {
    expect(result.error).toBeDefined();
    expect(result.error!.code).toBeDefined();
    expect(result.error!.message).toBeDefined();
    expect(typeof result.error!.recoverable).toBe('boolean');
  }
};

const testErrorConditionHandling = async () => {
  // GIVEN: Various error conditions
  const errorConditions = [
    null,
    undefined,
    '',
    Buffer.alloc(0),
    Buffer.from('invalid'),
    Buffer.from('\x00\x01\x02'),
  ];

  // WHEN: Testing each error condition
  for (const condition of errorConditions) {
    const result = await parser.parse(condition as any);
    validateErrorConditionResult(result);
  }
};

const generateAllConfigurations = () => {
  // GIVEN: All possible parser configuration combinations
  const booleanOptions = [true, false];
  const configurations = [];

  for (const strictMode of booleanOptions) {
    for (const enableProfiling of booleanOptions) {
      for (const streaming of booleanOptions) {
        for (const extractMedia of booleanOptions) {
          for (const preserveHTML of booleanOptions) {
            configurations.push({
              strictMode,
              enableProfiling,
              streaming,
              extractMedia,
              preserveHTML,
            });
          }
        }
      }
    }
  }
  return configurations;
};

const testConfigurationCreation = () => {
  const configurations = generateAllConfigurations();

  // WHEN: Creating parsers with all configurations
  // THEN: All should be created successfully
  configurations.forEach((config) => {
    expect(() => new EPUBParser(config)).not.toThrow();
  });
};

const validateStatsStructure = (stats: any) => {
  expect(stats).toBeDefined();
  expect(typeof stats.parseTime).toBe('number');
  expect(typeof stats.chaptersPerSecond).toBe('number');
  expect(typeof stats.memoryUsage).toBe('number');
  expect(typeof stats.cacheHits).toBe('number');
  expect(typeof stats.cacheMisses).toBe('number');
};

const testStatisticsWithDifferentStates = () => {
  // GIVEN: Parser in different states
  const freshParser = new EPUBParser();
  const configuredParser = new EPUBParser({ strictMode: true });

  // WHEN: Getting statistics from different parser states
  const freshStats = freshParser.getStats();
  const configuredStats = configuredParser.getStats();

  // THEN: All should return proper statistics structure
  [freshStats, configuredStats].forEach(validateStatsStructure);
};

const defineBufferHandlingTests = () => {
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

const defineParserOptionsTests = () => {
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

const definePerformanceTests = () => {
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

const defineDataHandlingTests = () => {
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

const defineCriticalEdgeCaseTests = () => {
  describe('Critical Edge Cases for Mutation Coverage', () => {
    defineBufferHandlingTests();
    defineParserOptionsTests();
    definePerformanceTests();
    defineDataHandlingTests();
  });
};

const defineMutationCoverageTests = () => {
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
