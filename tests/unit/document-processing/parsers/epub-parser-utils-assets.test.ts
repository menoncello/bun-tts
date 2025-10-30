/**
 * EPUB Parser Utils - Assets Tests (Split File)
 *
 * This file imports and runs all asset-related tests
 * from split test files to maintain organization and reduce file size.
 */

import { describe, test, expect } from 'bun:test';

// Import split test files
import './epub-parser-utils-assets-create.test';
import './epub-parser-utils-assets-category.test';
import './epub-parser-utils-assets-empty.test';

describe('EPUB Parser Utils - Assets Test Suite', () => {
  test('should load all asset-related test modules', () => {
    // This test ensures that all asset-related test modules are properly loaded
    // and serves as a sanity check for the test aggregation
    expect(true).toBe(true);
  });
});
