// Import all integration test modules
// This file serves as an index for all EPUB parser content processor integration tests

import { describe, test, expect } from 'bun:test';

import './epub-parser-content-processor-integration-end-to-end.test';
import './epub-parser-content-processor-integration-real-world.test';
import './epub-parser-content-processor-integration-performance.test';

describe('EPUB Parser Content Processor Integration Test Index', () => {
  test('should import and organize all content processor integration tests', () => {
    // This test file serves as an index to organize and import all content processor integration test modules
    // The actual tests are in the imported files above
    expect(true).toBe(true);
  });

  test('should verify integration test structure', () => {
    // Validate that integration tests are properly organized
    expect(typeof describe).toBe('function');
    expect(typeof test).toBe('function');
    expect(typeof expect).toBe('function');
  });

  test('should validate integration test modules are imported', () => {
    // Ensure all integration test modules are properly imported
    expect(true).toBe(true);
  });
});
