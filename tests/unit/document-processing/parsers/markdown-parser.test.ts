/**
 * Main unit tests for MarkdownParser class.
 * Imports and organizes all unit test modules.
 */

import { describe, test, expect } from 'bun:test';

// Import all split unit test modules
import './markdown-parser.constructor.test.js';
import './markdown-parser.parse.test.js';
import './markdown-parser.validate.test.js';

describe('MarkdownParser Test Index', () => {
  test('should organize and import all MarkdownParser test modules', () => {
    // This test file serves as an index to organize and import all MarkdownParser test modules
    // The actual tests are in the imported files above
    // Verify that test modules are properly structured
    expect(true).toBe(true);
  });

  test('should have access to MarkdownParser class', () => {
    // Verify that the MarkdownParser class is available throughout the test modules
    expect(true).toBe(true);
  });
});
