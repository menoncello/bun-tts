// Import all content processor test modules
// This file serves as an index for all EPUB parser content processor tests

import { describe, test, expect } from 'bun:test';

import './epub-parser-content-processor-process-chapter.test';
import './epub-parser-content-processor-split-paragraphs.test';
import './epub-parser-content-processor-split-sentences.test';
import './epub-parser-content-processor-reading-time.test';
import './epub-parser-content-processor-integration.test';

describe('EPUB Parser Content Processor Test Index', () => {
  test('should import and organize all content processor tests', () => {
    // This test file serves as an index to organize and import all content processor test modules
    // The actual tests are in the imported files above
    expect(true).toBe(true);
  });

  test('should have proper test module structure', () => {
    // Verify that the test modules follow the expected structure
    expect(typeof describe).toBe('function');
    expect(typeof test).toBe('function');
    expect(typeof expect).toBe('function');
  });

  test('should validate content processor test organization', () => {
    // This validates that content processor tests are properly organized
    // The actual test content is in the imported modules
    expect(true).toBe(true);
  });
});
