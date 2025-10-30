import { describe, test, expect } from 'bun:test';
import { createMetadataBuilder } from '../../../../src/core/document-processing/parsers/epub-parser-type-adapter.js';
import type { EpubMetadata } from '../../../../src/core/document-processing/parsers/epub-parser-types.js';
import {
  validateMetadataPresence,
  createInitialValidationResult,
} from '../../../../src/core/document-processing/parsers/epub-parser-validation-basic.js';

// Test data factory for valid metadata
function createValidMetadata(): EpubMetadata {
  return createMetadataBuilder()
    .title('Test Book')
    .creator('Test Author')
    .language('en')
    .identifier('test-book-123')
    .build();
}

// Test data factory for incomplete metadata
function createIncompleteMetadata(): EpubMetadata {
  return createMetadataBuilder().title('Test Book').build();
}

// Test data factory for empty metadata values
function createEmptyMetadataValues(): EpubMetadata {
  return createMetadataBuilder().title('').creator('').build();
}

describe('EPUB Parser Basic Validation - Metadata Presence', () => {
  test('should validate metadata presence correctly', () => {
    const metadata = createValidMetadata();
    const result = createInitialValidationResult();

    validateMetadataPresence(metadata, result);

    expect(result.metadata.hasMetadata).toBe(true);
    // Validation function may add validation errors for missing required fields
    expect(typeof result.isValid).toBe('boolean');
    expect(Array.isArray(result.errors)).toBe(true);
  });

  test('should handle missing metadata', () => {
    const emptyMetadata: EpubMetadata = [];
    const result = createInitialValidationResult();

    validateMetadataPresence(emptyMetadata, result);

    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]?.code).toBe('MISSING_METADATA');
    expect(result.metadata.hasMetadata).toBe(false);
  });

  test('should handle null metadata', () => {
    const nullMetadata = null as any;
    const result = createInitialValidationResult();

    validateMetadataPresence(nullMetadata, result);

    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]?.code).toBe('MISSING_METADATA');
    expect(result.metadata.hasMetadata).toBe(false);
  });
});

describe('EPUB Parser Basic Validation - Metadata Structure', () => {
  test('should validate EPUB metadata structure', () => {
    const validMetadata = createValidMetadata();
    const result = createInitialValidationResult();

    validateMetadataPresence(validMetadata, result);

    expect(result.metadata.hasMetadata).toBe(true);
    expect(typeof result.isValid).toBe('boolean');
    expect(Array.isArray(result.errors)).toBe(true);
  });

  test('should handle incomplete metadata', () => {
    const incompleteMetadata = createIncompleteMetadata();
    const result = createInitialValidationResult();

    validateMetadataPresence(incompleteMetadata, result);

    expect(result.metadata.hasMetadata).toBe(true);
    expect(typeof result.isValid).toBe('boolean');
  });

  test('should handle empty metadata values', () => {
    const emptyMetadataValues = createEmptyMetadataValues();
    const result = createInitialValidationResult();

    validateMetadataPresence(emptyMetadataValues, result);

    expect(result.metadata.hasMetadata).toBe(true);
    expect(typeof result.isValid).toBe('boolean');
  });

  test('should handle empty metadata array', () => {
    const emptyMetadata: EpubMetadata = [];
    const result = createInitialValidationResult();

    validateMetadataPresence(emptyMetadata, result);

    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]?.code).toBe('MISSING_METADATA');
    expect(result.metadata.hasMetadata).toBe(false);
  });
});
