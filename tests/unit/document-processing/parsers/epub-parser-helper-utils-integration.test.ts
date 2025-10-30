// Import all helper utils integration test modules
// This file serves as an index for all EPUB parser helper utils integration tests

import { describe, test, expect } from 'bun:test';
import './epub-parser-helper-utils-integration-split.test';

describe('EPUB Parser Helper Utils Integration Tests Index', () => {
  test('should load all integration test modules', () => {
    // This test ensures that all integration test modules can be loaded
    // Actual integration tests are in the imported modules
    expect(true).toBe(true);
  });
});
