/**
 * EPUB Parser Enhanced Validation Consistency Tests
 *
 * Tests for the enhanced validation system being used consistently
 */

import { describe, test, expect, beforeEach } from 'bun:test';
import { createMetadataEntry } from '../../../../src/core/document-processing/parsers/epub-parser-type-adapter.js';
import type { EpubMetadata } from '../../../../src/core/document-processing/parsers/epub-parser-types.js';
import {
  ValidationLevel,
  type ValidationConfig,
} from '../../../../src/core/document-processing/parsers/epub-parser-validation-types.js';
import {
  validateEPUBStructure,
  validateEPUBMetadata,
  validateEPUBSpine,
  validateEPUBManifest,
} from '../../../../src/core/document-processing/parsers/epub-parser-validation.js';

describe('EPUB Parser Validation - Enhanced Consistency', () => {
  let mockEpub: any;
  let mockMetadata: EpubMetadata;
  let mockSpineItems: Array<{ id: string; href: string; mediaType?: string }>;
  let mockManifest: Record<string, { href: string; mediaType?: string }>;

  beforeEach(() => {
    // Create mock EPUB object with required methods
    mockEpub = {
      getMetadata: async () => mockMetadata,
      getSpineItems: async () => mockSpineItems,
      getManifest: async () => mockManifest,
    };

    mockMetadata = [
      createMetadataEntry('title', 'Test Book'),
      createMetadataEntry('creator', 'Test Author'),
      createMetadataEntry('language', 'en'),
      createMetadataEntry('identifier', 'test-book-123'),
      createMetadataEntry('date', '2023-01-01'),
    ] as EpubMetadata;

    mockSpineItems = [
      {
        id: 'chapter1',
        href: 'chapter1.xhtml',
        mediaType: 'application/xhtml+xml',
      },
      {
        id: 'chapter2',
        href: 'chapter2.xhtml',
        mediaType: 'application/xhtml+xml',
      },
    ];

    mockManifest = {
      chapter1: { href: 'chapter1.xhtml', mediaType: 'application/xhtml+xml' },
      chapter2: { href: 'chapter2.xhtml', mediaType: 'application/xhtml+xml' },
      cover: { href: 'cover.jpg', mediaType: 'image/jpeg' },
    };
  });

  describe('validateEPUBStructure with enhanced system', () => {
    test('should use enhanced validation by default', async () => {
      const result = await validateEPUBStructure(mockEpub);

      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('errors');
      expect(result).toHaveProperty('warnings');
      expect(result).toHaveProperty('metadata');
    });

    test('should accept custom validation config', async () => {
      const config: ValidationConfig = { level: ValidationLevel.STRICT };
      const result = await validateEPUBStructure(mockEpub, config);

      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('errors');
      expect(result).toHaveProperty('warnings');
      expect(result).toHaveProperty('metadata');
    });

    test('should handle basic validation level', async () => {
      const config: ValidationConfig = { level: ValidationLevel.BASIC };
      const result = await validateEPUBStructure(mockEpub, config);

      expect(result).toHaveProperty('isValid');
      expect(Array.isArray(result.errors)).toBe(true);
      expect(Array.isArray(result.warnings)).toBe(true);
    });

    test('should handle standard validation level', async () => {
      const config: ValidationConfig = { level: ValidationLevel.STANDARD };
      const result = await validateEPUBStructure(mockEpub, config);

      expect(result).toHaveProperty('isValid');
      expect(Array.isArray(result.errors)).toBe(true);
      expect(Array.isArray(result.warnings)).toBe(true);
    });

    test('should handle strict validation level', async () => {
      const config: ValidationConfig = { level: ValidationLevel.STRICT };
      const result = await validateEPUBStructure(mockEpub, config);

      expect(result).toHaveProperty('isValid');
      expect(Array.isArray(result.errors)).toBe(true);
      expect(Array.isArray(result.warnings)).toBe(true);
    });
  });

  describe('validateEPUBMetadata with enhanced system', () => {
    test('should use enhanced validation for metadata', async () => {
      const result = await validateEPUBMetadata(mockMetadata);

      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('errors');
      expect(result).toHaveProperty('warnings');
      expect(result).toHaveProperty('metadata');
    });

    test('should accept custom validation config for metadata', async () => {
      const config: ValidationConfig = { level: ValidationLevel.STRICT };
      const result = await validateEPUBMetadata(mockMetadata, config);

      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('errors');
      expect(result).toHaveProperty('warnings');
      expect(result).toHaveProperty('metadata');
    });

    test('should handle incomplete metadata gracefully', async () => {
      const incompleteMetadata = [
        createMetadataEntry('title', 'Incomplete Book'),
        // Missing other required fields
      ] as EpubMetadata;

      const result = await validateEPUBMetadata(incompleteMetadata);

      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('errors');
      expect(result).toHaveProperty('warnings');
    });
  });

  describe('validateEPUBSpine with enhanced system', () => {
    test('should use enhanced validation for spine', async () => {
      const result = await validateEPUBSpine(mockSpineItems);

      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('errors');
      expect(result).toHaveProperty('warnings');
      expect(result).toHaveProperty('metadata');
    });

    test('should accept custom validation config for spine', async () => {
      const config: ValidationConfig = { level: ValidationLevel.STRICT };
      const result = await validateEPUBSpine(mockSpineItems, config);

      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('errors');
      expect(result).toHaveProperty('warnings');
      expect(result).toHaveProperty('metadata');
    });

    test('should handle empty spine gracefully', async () => {
      const result = await validateEPUBSpine([]);

      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('errors');
      expect(result).toHaveProperty('warnings');
    });

    test('should handle malformed spine items', async () => {
      const malformedSpineItems = [
        { id: '', href: '' }, // Empty id and href
        { id: 'chapter2', href: '' }, // Empty href
      ];

      const result = await validateEPUBSpine(malformedSpineItems);

      expect(result).toHaveProperty('isValid');
      expect(Array.isArray(result.errors)).toBe(true);
    });
  });

  describe('validateEPUBManifest with enhanced system', () => {
    test('should use enhanced validation for manifest', async () => {
      const result = await validateEPUBManifest(mockManifest);

      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('errors');
      expect(result).toHaveProperty('warnings');
      expect(result).toHaveProperty('metadata');
    });

    test('should accept custom validation config for manifest', async () => {
      const config: ValidationConfig = { level: ValidationLevel.STRICT };
      const result = await validateEPUBManifest(mockManifest, config);

      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('errors');
      expect(result).toHaveProperty('warnings');
      expect(result).toHaveProperty('metadata');
    });

    test('should handle empty manifest gracefully', async () => {
      const result = await validateEPUBManifest({});

      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('errors');
      expect(result).toHaveProperty('warnings');
    });

    test('should handle malformed manifest entries', async () => {
      const malformedManifest = {
        'invalid-entry': { href: '' }, // Empty href
        'no-href': { href: '' }, // Empty href
      };

      const result = await validateEPUBManifest(malformedManifest);

      expect(result).toHaveProperty('isValid');
      expect(Array.isArray(result.errors)).toBe(true);
    });
  });

  describe('Consistency across validation functions', () => {
    test('should return consistent ValidationResult structure across all functions', async () => {
      const structureResult = await validateEPUBStructure(mockEpub);
      const metadataResult = await validateEPUBMetadata(mockMetadata);
      const spineResult = await validateEPUBSpine(mockSpineItems);
      const manifestResult = await validateEPUBManifest(mockManifest);

      // All should have the same structure
      const expectedKeys = ['isValid', 'errors', 'warnings', 'metadata'];

      for (const result of [
        structureResult,
        metadataResult,
        spineResult,
        manifestResult,
      ]) {
        expect(Object.keys(result)).toEqual(
          expect.arrayContaining(expectedKeys)
        );
        expect(typeof result.isValid).toBe('boolean');
        expect(Array.isArray(result.errors)).toBe(true);
        expect(Array.isArray(result.warnings)).toBe(true);
        expect(typeof result.metadata).toBe('object');
      }
    });

    test('should handle the same validation config consistently', async () => {
      const config: ValidationConfig = { level: ValidationLevel.STRICT };

      const structureResult = await validateEPUBStructure(mockEpub, config);
      const metadataResult = await validateEPUBMetadata(mockMetadata, config);
      const spineResult = await validateEPUBSpine(mockSpineItems, config);
      const manifestResult = await validateEPUBManifest(mockManifest, config);

      // All should return valid ValidationResult objects
      expect(structureResult).toHaveProperty('isValid');
      expect(metadataResult).toHaveProperty('isValid');
      expect(spineResult).toHaveProperty('isValid');
      expect(manifestResult).toHaveProperty('isValid');
    });
  });

  describe('Error handling in enhanced validation', () => {
    test('should handle EPUB method failures gracefully', async () => {
      const failingEpub = {
        getMetadata: async () => {
          throw new Error('Metadata access failed');
        },
        getSpineItems: async () => {
          throw new Error('Spine access failed');
        },
        getManifest: async () => {
          throw new Error('Manifest access failed');
        },
      };

      const result = await validateEPUBStructure(failingEpub as any);

      expect(result).toHaveProperty('isValid');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should handle async validation errors properly', async () => {
      const result = await validateEPUBMetadata(null as any);

      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('errors');
    });
  });

  describe('Integration with existing validation levels', () => {
    test('should provide more detailed results than legacy validation', async () => {
      const config: ValidationConfig = { level: ValidationLevel.STANDARD };
      const result = await validateEPUBStructure(mockEpub, config);

      // Enhanced validation should provide detailed metadata
      expect(result.metadata).toHaveProperty('spineItemCount');
      expect(result.metadata).toHaveProperty('manifestItemCount');
      expect(result.metadata).toHaveProperty('hasMetadata');
      expect(result.metadata).toHaveProperty('hasNavigation');
    });

    test('should maintain backward compatibility with basic validation', async () => {
      const config: ValidationConfig = { level: ValidationLevel.BASIC };
      const result = await validateEPUBStructure(mockEpub, config);

      // Basic validation should still work
      expect(result).toHaveProperty('isValid');
      expect(Array.isArray(result.errors)).toBe(true);
      expect(Array.isArray(result.warnings)).toBe(true);
    });
  });
});
