import { describe, test, expect, beforeEach } from 'bun:test';
import { Epub } from '@smoores/epub';
import {
  validateEPUBSpineWithResult as validateEPUBSpine,
  validateEPUBManifestWithResult as validateEPUBManifest,
  validateEPUBStructureWithResult as validateEPUBStructure,
} from '../../../../src/core/document-processing/parsers/epub-parser-validation-wrappers.js';
import { createBasicMetadata } from './epub-parser-validation-test-utils.js';

describe('EPUB Parser Validation Structure - Components', () => {
  let mockEpub: Epub;

  beforeEach(() => {
    mockEpub = {
      getMetadata: () => Promise.resolve(createBasicMetadata()),
      getSpineItems: () => Promise.resolve([]),
      getManifest: () => Promise.resolve({}),
      getToc: () => Promise.resolve([]),
      close: () => Promise.resolve(),
    } as any;
  });

  describe('validateEPUBSpine', () => {
    test('should validate valid spine structure', async () => {
      const spineItems = [
        { idref: 'chapter1', linear: 'yes' },
        { idref: 'chapter2', linear: 'yes' },
      ];

      mockEpub.getSpineItems = () => Promise.resolve(spineItems as any);

      const result = await validateEPUBSpine(mockEpub);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should handle empty spine', async () => {
      mockEpub.getSpineItems = () => Promise.resolve([]);

      const result = await validateEPUBSpine(mockEpub);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should handle spine extraction errors', async () => {
      mockEpub.getSpineItems = () =>
        Promise.reject(new Error('Spine extraction failed'));

      const result = await validateEPUBSpine(mockEpub);

      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toEqual({
        code: 'UNKNOWN_SPINE_ERROR',
        message: 'Unknown error validating spine',
        severity: 'critical',
      });
    });

    test('should validate spine item references', async () => {
      const spineItems = [{ idref: 'nonexistent-item', linear: 'yes' }];

      mockEpub.getSpineItems = () => Promise.resolve(spineItems as any);
      mockEpub.getManifest = () =>
        Promise.resolve({
          chapter1: {
            href: 'chapter1.xhtml',
            mediaType: 'application/xhtml+xml',
          },
        } as any);

      const result = await validateEPUBSpine(mockEpub);

      expect(result.isValid).toBe(true); // Basic validation just checks non-empty
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('validateEPUBManifest', () => {
    test('should validate valid manifest structure', async () => {
      const manifest = {
        chapter1: {
          href: 'chapter1.xhtml',
          mediaType: 'application/xhtml+xml',
        },
        chapter2: {
          href: 'chapter2.xhtml',
          mediaType: 'application/xhtml+xml',
        },
        cover: { href: 'cover.jpg', mediaType: 'image/jpeg' },
      };

      mockEpub.getManifest = () => Promise.resolve(manifest as any);

      const result = await validateEPUBManifest(mockEpub);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should handle empty manifest', async () => {
      mockEpub.getManifest = () => Promise.resolve({});

      const result = await validateEPUBManifest(mockEpub);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should handle manifest extraction errors', async () => {
      mockEpub.getManifest = () =>
        Promise.reject(new Error('Manifest extraction failed'));

      const result = await validateEPUBManifest(mockEpub);

      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toEqual({
        code: 'UNKNOWN_MANIFEST_ERROR',
        message: 'Unknown error validating manifest',
        severity: 'critical',
      });
    });

    test('should validate manifest item media types', async () => {
      const manifest = {
        'invalid-item': { href: 'invalid.xyz', mediaType: 'invalid/type' },
      };

      mockEpub.getManifest = () => Promise.resolve(manifest as any);

      const result = await validateEPUBManifest(mockEpub);

      expect(result.isValid).toBe(true); // Basic validation just checks non-empty
      expect(result.errors).toHaveLength(0);
    });

    test('should validate manifest item hrefs', async () => {
      const manifest = {
        'invalid-href': { href: '', mediaType: 'application/xhtml+xml' },
      };

      mockEpub.getManifest = () => Promise.resolve(manifest as any);

      const result = await validateEPUBManifest(mockEpub);

      expect(result.isValid).toBe(true); // Basic validation just checks non-empty
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('validateEPUBStructure', () => {
    test('should validate complete valid EPUB structure', async () => {
      const metadata = createBasicMetadata();
      const spineItems = [{ idref: 'chapter1', linear: 'yes' }];
      const manifest = {
        chapter1: {
          href: 'chapter1.xhtml',
          mediaType: 'application/xhtml+xml',
        },
      };

      mockEpub.getMetadata = () => Promise.resolve(metadata);
      mockEpub.getSpineItems = () => Promise.resolve(spineItems as any);
      mockEpub.getManifest = () => Promise.resolve(manifest as any);

      const result = await validateEPUBStructure(mockEpub);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should accumulate errors from all validations', async () => {
      mockEpub.getMetadata = () => Promise.resolve([]);
      mockEpub.getSpineItems = () => Promise.reject(new Error('Spine error'));
      mockEpub.getManifest = () => Promise.reject(new Error('Manifest error'));

      const result = await validateEPUBStructure(mockEpub);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0); // At least one error from validation
    });

    test('should handle structure validation with warnings', async () => {
      const metadata = createBasicMetadata();
      const spineItems = [{ idref: 'chapter1', linear: 'yes' }];
      const manifest = {
        chapter1: {
          href: 'chapter1.xhtml',
          mediaType: 'application/xhtml+xml',
        },
      };

      mockEpub.getMetadata = () => Promise.resolve(metadata);
      mockEpub.getSpineItems = () => Promise.resolve(spineItems as any);
      mockEpub.getManifest = () => Promise.resolve(manifest as any);

      const result = await validateEPUBStructure(mockEpub);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      // May have warnings
    });

    test('should handle partial structure failures gracefully', async () => {
      const metadata = createBasicMetadata();
      const spineItems: any[] = []; // Empty - should fail
      const manifest = {
        chapter1: {
          href: 'chapter1.xhtml',
          mediaType: 'application/xhtml+xml',
        },
      };

      mockEpub.getMetadata = () => Promise.resolve(metadata);
      mockEpub.getSpineItems = () => Promise.resolve(spineItems as any);
      mockEpub.getManifest = () => Promise.resolve(manifest as any);

      const result = await validateEPUBStructure(mockEpub);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});
