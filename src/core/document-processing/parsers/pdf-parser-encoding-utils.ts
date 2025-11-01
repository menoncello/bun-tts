/**
 * PDF Parser encoding utilities - Main export file.
 * Refactored into smaller, focused modules for better maintainability.
 *
 * This file re-exports all encoding utilities from the following modules:
 * - pdf-parser-encoding-constants.ts: Constants and configuration values
 * - pdf-parser-text-analysis.ts: Character script and RTL detection
 * - pdf-parser-encoding-detection.ts: Encoding detection algorithms
 * - pdf-parser-encoding-validation.ts: Encoding validation
 * - pdf-parser-encoding-conversion.ts: Encoding conversion
 * - pdf-parser-encoding-diagnostics.ts: Comprehensive analysis and diagnostics
 */

// Constants and configuration values
export * from './pdf-parser-encoding-constants';

// Text analysis utilities
export * from './pdf-parser-text-analysis';

// Encoding detection utilities
export * from './pdf-parser-encoding-detection';

// Encoding validation utilities
export * from './pdf-parser-encoding-validation';

// Encoding conversion utilities
export * from './pdf-parser-encoding-conversion';

// Encoding diagnostics utilities
export * from './pdf-parser-encoding-diagnostics';
