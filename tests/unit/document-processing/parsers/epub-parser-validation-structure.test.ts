/**
 * EPUB Parser Validation Structure Tests (Aggregation File)
 *
 * This file serves as a test aggregation point that imports and runs all
 * validation structure related tests from split test files to maintain
 * organization and reduce individual file sizes.
 *
 * The validation structure tests cover:
 * - Basic structure validation requirements
 * - Metadata structure validation
 * - Structure components validation
 *
 * By splitting tests into focused files and aggregating them here,
 * we maintain better organization while ensuring all tests run together.
 */

import { describe, test, expect } from 'bun:test';

// Import split test files - these imports execute the contained tests
import './epub-parser-validation-structure-basic.test';
import './epub-parser-validation-structure-metadata.test';
import './epub-parser-validation-structure-components.test';

describe('EPUB Parser Validation Structure Test Suite', () => {
  test('aggregation file loads successfully', () => {
    // This test verifies that the aggregation file loads and runs
    // All actual validation structure tests are in the imported files above
    expect(true).toBe(true);
  });
});
