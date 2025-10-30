import { describe, test, expect } from 'bun:test';
import { createMetaStructure } from '../../../../src/core/document-processing/parsers/epub-parser-helper-utils.js';
import { createMockMetadata } from './helpers/epub-parser-test-data.js';

describe('EPUB Parser Helper Utilities - Meta Structure Complex', () => {
  describe('complex configuration handling', () => {
    test('should handle complex config object', () => {
      const metadata = createMockMetadata({
        title: 'Complex Book',
        author: 'Complex Author',
        language: 'en',
        wordCount: 2000,
        customMetadata: { complexity: 'high' },
      });

      const options = {
        mode: 'full' as const,
        strictMode: true,
        config: {
          setting1: 'value1',
          setting2: 42,
          setting3: true,
          nested: {
            deep: 'value',
          },
        },
      };

      const result = createMetaStructure(metadata, options);

      expect(result.version).toBe('unknown');
      expect(result.warnings).toHaveLength(0);
      expect(result.configApplied).toEqual({
        setting1: 'value1',
        setting2: 42,
        setting3: true,
        nested: {
          deep: 'value',
        },
      });
      expect((result.configApplied as any).nested.deep).toBe('value');
    });

    test('should handle nested config structures', () => {
      const metadata = createMockMetadata();

      const options = {
        mode: 'full' as const,
        strictMode: false,
        config: {
          level1: {
            level2: {
              level3: 'deep value',
              array: [1, 2, 3],
            },
          },
          booleanValue: true,
          numericValue: 42,
        },
      };

      const result = createMetaStructure(metadata, options);

      expect(result.configApplied).toEqual({
        level1: {
          level2: {
            level3: 'deep value',
            array: [1, 2, 3],
          },
        },
        booleanValue: true,
        numericValue: 42,
      });
    });

    test('should preserve config integrity', () => {
      const metadata = createMockMetadata({
        title: 'Config Integrity Test',
      });

      const originalConfig = {
        preserve: 'this value',
        number: 100,
        boolean: false,
        nested: {
          inner: 'value',
        },
      };

      const options = {
        mode: 'tts' as const,
        strictMode: true,
        config: originalConfig,
      };

      const result = createMetaStructure(metadata, options);

      expect(result.configApplied).toEqual(originalConfig);
      expect(result.configApplied.preserve).toBe('this value');
      expect(result.configApplied.number).toBe(100);
      expect(result.configApplied.boolean).toBe(false);
      expect((result.configApplied as any).nested.inner).toBe('value');
    });
  });

  describe('metadata property handling', () => {
    test('should handle extended metadata properties', () => {
      const metadata = createMockMetadata({
        title: 'Extended Test',
        author: 'Test Author',
        language: 'en',
        wordCount: 1500,
        customMetadata: {
          publisher: 'Test Publisher',
          publicationDate: '2023-01-01',
          isbn: '123-456-789',
        },
      });

      const options = {
        mode: 'full' as const,
        config: { testSetting: 'testValue' },
        strictMode: false,
      };

      const result = createMetaStructure(metadata, options);

      expect(result.version).toBe('unknown');
      expect(result.warnings).toHaveLength(0);
      expect(result.configApplied).toEqual({ testSetting: 'testValue' });
    });

    test('should handle metadata with various data types', () => {
      const metadata = createMockMetadata({
        title: 'Data Types Test',
        wordCount: 2000,
        customMetadata: {
          stringField: 'string value',
          numberField: 42,
          booleanField: true,
          arrayField: ['item1', 'item2'],
          objectField: { nested: 'value' },
        },
      });

      const options = {
        mode: 'tts' as const,
        config: {},
        strictMode: true,
      };

      const result = createMetaStructure(metadata, options);

      expect(result.version).toBe('unknown');
      expect(result.warnings).toHaveLength(0);
      expect(result.configApplied).toEqual({});
    });
  });
});
