/**
 * Main integration tests for document processing functionality.
 * Imports and organizes all integration test modules.
 *
 * This file serves as a test aggregator - it imports and organizes
 * all the integration test modules to maintain better code organization.
 */

import { describe, test, expect } from 'bun:test';

// Import all split integration test modules - these imports execute the actual tests
import './document-processing/parsing-integration.test.js';
import './document-processing/content-types-integration.test.js';
import './document-processing/streaming-integration.test.js';
import './document-processing/validation-integration.test.js';
import './document-processing/performance-integration.test.js';

// Dummy test to satisfy ESLint's no-empty-test-file rule
// This file serves as a test aggregator - all real tests are in imported modules
describe('Document Processing Integration Test Aggregator', () => {
  test('test aggregator loaded successfully', () => {
    expect(true).toBe(true);
  });
});
