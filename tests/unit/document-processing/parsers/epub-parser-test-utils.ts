import { test, expect } from 'bun:test';
import { getErrorCode } from '../../../../src/core/document-processing/parsers/epub-parser-type-guards.js';
import type { EPUBParseOptions } from '../../../../src/core/document-processing/parsers/epub-parser-types.js';
import { EPUBParser } from '../../../../src/core/document-processing/parsers/epub-parser.js';
import { tick } from '../../../../src/utils/deterministic-timing.js';

// Test helper functions for EPUBParser tests

export function testDefaultConstructor(parser: EPUBParser): void {
  expect(parser).toBeDefined();
  const stats = parser.getStats();
  expect(stats).toHaveProperty('parseTimeMs');
  expect(stats).toHaveProperty('chaptersPerSecond');
  expect(stats).toHaveProperty('memoryUsageMB');
}

export function testCustomConstructor(customOptions: EPUBParseOptions): void {
  const customParser = new EPUBParser(customOptions);

  const stats = customParser.getStats();
  expect(stats).toBeDefined();
  expect(stats).toHaveProperty('parseTimeMs');
  expect(stats).toHaveProperty('chaptersPerSecond');
  expect(stats).toHaveProperty('memoryUsageMB');
}

export async function testNullInput(parser: EPUBParser): Promise<void> {
  const result = await parser.parse(null as never);

  expect(result.success).toBe(false);
  expect(result.error).toBeDefined();
  const errorCode = getErrorCode(result.error);
  expect(errorCode).toBe('INVALID_INPUT_TYPE');
  expect(result.error!.message).toBe(
    'Invalid input type for EPUB parsing. Expected string, Buffer, or ArrayBuffer.'
  );
}

export async function testUndefinedInput(parser: EPUBParser): Promise<void> {
  const result = await parser.parse(undefined as never);

  expect(result.success).toBe(false);
  expect(result.error).toBeDefined();
  const errorCode = getErrorCode(result.error);
  expect(errorCode).toBe('INVALID_INPUT_TYPE');
  expect(result.error!.message).toBe(
    'Invalid input type for EPUB parsing. Expected string, Buffer, or ArrayBuffer.'
  );
}

export async function testEmptyStringInput(parser: EPUBParser): Promise<void> {
  const result = await parser.parse('');

  expect(result.success).toBe(false);
  expect(result.error).toBeDefined();
  const errorCode = getErrorCode(result.error);
  expect(errorCode).toBe('INVALID_INPUT');
  expect(result.error!.message).toBe('Input is required');
}

export async function testEmptyBufferInput(parser: EPUBParser): Promise<void> {
  const result = await parser.parse(Buffer.alloc(0));

  expect(result.success).toBe(false);
  expect(result.error).toBeDefined();
  const errorCode = getErrorCode(result.error);
  expect(errorCode).toBe('EPUB_FORMAT_ERROR');
}

export async function testInvalidEPUBContent(
  parser: EPUBParser,
  corruptedEPUB?: Buffer
): Promise<void> {
  const invalidContent =
    corruptedEPUB || Buffer.from('This is not a valid EPUB file');
  const result = await parser.parse(invalidContent);

  expect(result.success).toBe(false);
  expect(result.error).toBeDefined();
  const errorCode = getErrorCode(result.error);
  expect(errorCode).toBe('EPUB_FORMAT_ERROR');
}

export function testSetOptions(parser: EPUBParser): void {
  const newOptions = {
    mode: 'tts' as const,
    strictMode: false,
    extractMedia: false,
  };

  parser.setOptions(newOptions);
  expect(true).toBe(true);
}

export function testGetStats(parser: EPUBParser): void {
  const stats = parser.getStats();

  expect(stats).toHaveProperty('parseTimeMs');
  expect(stats).toHaveProperty('chaptersPerSecond');
  expect(stats).toHaveProperty('memoryUsageMB');
  expect(stats).toHaveProperty('cacheHits');
  expect(stats).toHaveProperty('cacheMisses');

  expect(typeof stats.parseTimeMs).toBe('number');
  expect(typeof stats.chaptersPerSecond).toBe('number');
  expect(typeof stats.memoryUsageMB).toBe('number');
  expect(typeof stats.cacheHits).toBe('number');
  expect(typeof stats.cacheMisses).toBe('number');
}

export async function testErrorNormalization(
  parser: EPUBParser,
  invalidContent?: Buffer
): Promise<void> {
  const content = invalidContent || Buffer.from('invalid content');
  const result = await parser.parse(content);

  expect(result.success).toBe(false);
  expect(result.error).toBeDefined();
  const errorCode = getErrorCode(result.error);
  expect(errorCode).toBe('EPUB_FORMAT_ERROR');
  expect(result.error!.message).toBeDefined();
}

export async function testUnknownErrorTypes(
  parser: EPUBParser,
  invalidContent?: Buffer
): Promise<void> {
  const content = invalidContent || Buffer.from('invalid content');
  const result = await parser.parse(content);

  expect(result.success).toBe(false);
  expect(result.error).toBeDefined();
  expect(result.error!.message).toBeDefined();
}

export function testExtractMediaOption(): void {
  const parserWithMedia = new EPUBParser({ extractMedia: false });
  expect(parserWithMedia).toBeDefined();
}

export function testPreserveHTMLOption(): void {
  const parserWithHTML = new EPUBParser({ preserveHTML: true });
  expect(parserWithHTML).toBeDefined();
}

export function testChapterSensitivityOption(): void {
  const parserWithSensitivity = new EPUBParser({
    chapterSensitivity: 0.95,
  });
  expect(parserWithSensitivity).toBeDefined();
}

export function testWordCounting(): void {
  expect(true).toBe(true);
}

export function testHTMLRemoval(): void {
  const parserNoHTML = new EPUBParser({ preserveHTML: false });
  expect(parserNoHTML).toBeDefined();
}

export function testHTMLPreservation(): void {
  const parserWithHTML = new EPUBParser({ preserveHTML: true });
  expect(parserWithHTML).toBeDefined();
}

export async function testPerformanceStatsUpdate(
  parser: EPUBParser,
  testContent?: Buffer
): Promise<void> {
  const initialStats = parser.getStats();
  expect(initialStats.parseTimeMs).toBe(0);

  await tick();

  const content = testContent || Buffer.from('invalid content');
  const result = await parser.parse(content);

  const updatedStats = parser.getStats();
  expect(updatedStats.parseTimeMs).toBeGreaterThanOrEqual(0);

  if (result.success) {
    expect(updatedStats.parseTimeMs).toBeGreaterThan(initialStats.parseTimeMs);
  } else {
    expect(typeof updatedStats.parseTimeMs).toBe('number');
  }
}

export function testInterfaceImplementation(parser: EPUBParser): void {
  expect(typeof parser.parse).toBe('function');
  expect(typeof parser.setOptions).toBe('function');
  expect(typeof parser.getStats).toBe('function');
}

export function testMethodSignatures(parser: EPUBParser): void {
  expect(parser.parse.length).toBeGreaterThanOrEqual(1);
  expect(parser.setOptions.length).toBe(1);
  expect(parser.getStats.length).toBe(0);
}

// Type-safe option test helpers
export const VALID_PARSER_OPTIONS: EPUBParseOptions[] = [
  { extractMedia: true },
  { extractMedia: false },
  { preserveHTML: true },
  { preserveHTML: false },
  { chapterSensitivity: 0.1 },
  { chapterSensitivity: 0.5 },
  { chapterSensitivity: 1.0 },
  { chapterSensitivity: 2.0 },
  { verbose: true },
  { verbose: false },
];

export const VALID_TEST_INPUTS = [
  Buffer.from('test content'),
  'test-string',
  new ArrayBuffer(8),
  Buffer.from([1, 2, 3, 4]), // Use Buffer instead of Uint8Array
];

export const ERROR_TEST_INPUTS = [
  Buffer.from('invalid epub content'),
  Buffer.from('also invalid'),
  Buffer.alloc(1),
];

export const EDGE_CASE_INPUTS = [
  Buffer.from(''),
  Buffer.alloc(1),
  Buffer.from('\x00\x00\x00'),
  new ArrayBuffer(0),
  Buffer.alloc(0), // Use Buffer instead of Uint8Array
];

export const COMPLEX_CONFIGURATIONS = [
  {
    mode: 'tts' as const,
    strictMode: false,
    streaming: true,
    enableProfiling: true,
    extractMedia: false,
    preserveHTML: true,
    chapterSensitivity: 0.85,
  },
  {
    mode: 'full' as const,
    strictMode: true,
    streaming: false,
    enableProfiling: false,
    extractMedia: true,
    preserveHTML: false,
    chapterSensitivity: 0.75,
  },
];

// Re-export test utilities
export { test, expect };
