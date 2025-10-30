import { describe, test, expect } from 'bun:test';
import { createMetaStructure } from '../../../../src/core/document-processing/parsers/epub-parser-helper-utils.js';
import type { DocumentMetadata } from '../../../../src/core/document-processing/types.js';
import {
  createMockMetadata,
  createEmptyMockMetadata,
} from './helpers/epub-parser-test-data';

describe('EPUB Parser Helper Utilities - Meta Structure Basic', () => {
  describe('basic metadata structure creation', () => {
    test('should create metadata structure with version and config', () => {
      const metadata: DocumentMetadata = {
        ...createMockMetadata(),
        version: '3.0',
      };

      const options = {
        mode: 'full' as const,
        config: { customSetting: 'value' },
        strictMode: false,
      };

      const result = createMetaStructure(metadata, options);

      expect(result).toEqual({
        version: '3.0',
        warnings: [],
        configApplied: { customSetting: 'value' },
      });
    });

    test('should handle metadata without version', () => {
      const metadata = createMockMetadata();
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

  describe('empty and edge case handling', () => {
    test('should handle empty metadata and options', () => {
      const metadata = createEmptyMockMetadata();
      const options = {};

      const result = createMetaStructure(metadata, options);

      expect(result.version).toBe('unknown');
      expect(result.warnings).toHaveLength(0);
      expect(result.configApplied).toEqual({});
    });

    test('should handle empty config object', () => {
      const metadata = createMockMetadata();
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

    test('should handle null config object', () => {
      const metadata = createMockMetadata();
      const options = {
        mode: 'full' as const,
        config: null as any,
        strictMode: false,
      };

      const result = createMetaStructure(metadata, options);

      expect(result.version).toBe('unknown');
      expect(result.warnings).toHaveLength(0);
      expect(result.configApplied).toEqual({});
    });
  });
});
