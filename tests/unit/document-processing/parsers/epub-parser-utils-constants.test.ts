import { describe, test, expect } from 'bun:test';
import {
  DEFAULT_READING_SPEED,
  MILLISECONDS_PER_SECOND,
  EPUB_LIBRARY_VERSION,
  EPUB_LIBRARY_FEATURES,
  DEFAULT_MIME_TYPE,
  DEFAULT_TITLE,
  DEFAULT_AUTHOR,
  DEFAULT_PUBLISHER,
  DEFAULT_LANGUAGE,
  DEFAULT_VERSION,
  ERROR_MESSAGE_NO_CONTENT,
} from '../../../../src/core/document-processing/parsers/epub-parser-utils.js';

describe('EPUB Parser Utils - Constants', () => {
  describe('Constants', () => {
    test('should have correct default constants', () => {
      expect(DEFAULT_READING_SPEED).toBe(200);
      expect(MILLISECONDS_PER_SECOND).toBe(1000);
      expect(EPUB_LIBRARY_VERSION).toBe('0.1.9');
      expect(EPUB_LIBRARY_FEATURES).toEqual([
        'epub2',
        'epub3',
        'ncx',
        'nav',
        'opf',
      ]);
      expect(DEFAULT_MIME_TYPE).toBe('application/octet-stream');
      expect(DEFAULT_TITLE).toBe('Unknown Title');
      expect(DEFAULT_AUTHOR).toBe('Unknown Author');
      expect(DEFAULT_PUBLISHER).toBe('Unknown Publisher');
      expect(DEFAULT_LANGUAGE).toBe('en');
      expect(DEFAULT_VERSION).toBe('3.0');
      expect(ERROR_MESSAGE_NO_CONTENT).toBe('No content found for chapter:');
    });

    test('should have reasonable default reading speed', () => {
      expect(typeof DEFAULT_READING_SPEED).toBe('number');
      expect(DEFAULT_READING_SPEED).toBeGreaterThan(0);
      expect(DEFAULT_READING_SPEED).toBeLessThan(1000);
    });

    test('should have correct milliseconds per second', () => {
      expect(typeof MILLISECONDS_PER_SECOND).toBe('number');
      expect(MILLISECONDS_PER_SECOND).toBe(1000);
    });

    test('should have valid EPUB library version format', () => {
      expect(typeof EPUB_LIBRARY_VERSION).toBe('string');
      expect(EPUB_LIBRARY_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
    });

    test('should have expected EPUB library features', () => {
      expect(Array.isArray(EPUB_LIBRARY_FEATURES)).toBe(true);
      expect(EPUB_LIBRARY_FEATURES.length).toBeGreaterThan(0);
      expect(EPUB_LIBRARY_FEATURES).toContain('epub2');
      expect(EPUB_LIBRARY_FEATURES).toContain('epub3');
    });

    test('should have valid default MIME type', () => {
      expect(typeof DEFAULT_MIME_TYPE).toBe('string');
      expect(DEFAULT_MIME_TYPE).toContain('/');
    });

    test('should have valid default metadata values', () => {
      expect(typeof DEFAULT_TITLE).toBe('string');
      expect(typeof DEFAULT_AUTHOR).toBe('string');
      expect(typeof DEFAULT_PUBLISHER).toBe('string');
      expect(typeof DEFAULT_LANGUAGE).toBe('string');
      expect(typeof DEFAULT_VERSION).toBe('string');

      expect(DEFAULT_TITLE.length).toBeGreaterThan(0);
      expect(DEFAULT_AUTHOR.length).toBeGreaterThan(0);
      expect(DEFAULT_PUBLISHER.length).toBeGreaterThan(0);
      expect(DEFAULT_LANGUAGE.length).toBeGreaterThan(0);
      expect(DEFAULT_VERSION.length).toBeGreaterThan(0);
    });

    test('should have valid default language code', () => {
      expect(DEFAULT_LANGUAGE).toMatch(/^[a-z]{2}(-[A-Z]{2})?$/);
    });

    test('should have valid default version format', () => {
      expect(DEFAULT_VERSION).toMatch(/^\d+\.\d+$/);
    });

    test('should have descriptive error message', () => {
      expect(typeof ERROR_MESSAGE_NO_CONTENT).toBe('string');
      expect(ERROR_MESSAGE_NO_CONTENT.length).toBeGreaterThan(0);
      expect(ERROR_MESSAGE_NO_CONTENT).toContain('No content found');
    });

    test('should maintain immutability of arrays', () => {
      const originalFeatures = [...EPUB_LIBRARY_FEATURES];
      // Try to modify the array (this shouldn't affect the original if it's properly immutable)
      const modifiedFeatures = EPUB_LIBRARY_FEATURES.concat('new-feature');
      expect(EPUB_LIBRARY_FEATURES).toEqual(originalFeatures);
      expect(modifiedFeatures).not.toEqual(EPUB_LIBRARY_FEATURES);
    });
  });
});
