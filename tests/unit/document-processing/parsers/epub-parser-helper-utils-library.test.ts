import { describe, test, expect } from 'bun:test';
import { createLibraryInfo } from '../../../../src/core/document-processing/parsers/epub-parser-helper-utils.js';

describe('EPUB Parser Helper Utilities - Library Info', () => {
  test('should create library information object', () => {
    const result = createLibraryInfo();

    expect(result).toHaveProperty('name');
    expect(result).toHaveProperty('version');
    expect(result).toHaveProperty('features');
    expect(result.name).toBe('@smoores/epub');
    expect(typeof result.version).toBe('string');
    expect(Array.isArray(result.features)).toBe(true);
  });

  test('should create library info with correct structure', () => {
    const result = createLibraryInfo();

    expect(typeof result.name).toBe('string');
    expect(typeof result.version).toBe('string');
    expect(Array.isArray(result.features)).toBe(true);
    expect(result.features.length).toBeGreaterThan(0);
  });
});
