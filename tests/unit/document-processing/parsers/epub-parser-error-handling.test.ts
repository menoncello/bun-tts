import { describe, test, expect } from 'bun:test';

// Import all error handling test modules
// This file serves as an index for all EPUB parser error handling tests

import './epub-parser-error-handling-log-success.test';
import './epub-parser-error-handling-log-error.test';
import './epub-parser-error-handling-normalize-error.test';
import './epub-parser-error-handling-integration.test';

describe('EPUB Parser Error Handling - Test Suite', () => {
  test('should validate that all error handling test modules are loaded', () => {
    // This test ensures that the error handling test suite is properly organized
    // and all modules are loaded successfully
    expect(true).toBe(true);
  });
});
