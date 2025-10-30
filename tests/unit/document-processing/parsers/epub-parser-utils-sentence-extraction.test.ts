/**
 * EPUB Parser Utils - Sentence Extraction Tests (Split File)
 *
 * This file imports and runs all sentence extraction related tests
 * from split test files to maintain organization and reduce file size.
 */

import { describe, test, expect } from 'bun:test';

// Import split test files
import './epub-parser-utils-sentence-extraction-paragraph.test';
import './epub-parser-utils-sentence-extraction-sentence.test';
import './epub-parser-utils-sentence-extraction-object.test';
import './epub-parser-utils-sentence-extraction-remaining.test';

describe('EPUB Parser Utils - Sentence Extraction Test Suite', () => {
  test('should load all sentence extraction test modules', () => {
    // This test ensures that all sentence extraction test modules are properly loaded
    // and serves as a sanity check for the test aggregation
    expect(true).toBe(true);
  });
});
