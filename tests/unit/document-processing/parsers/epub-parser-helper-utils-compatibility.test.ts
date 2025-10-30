import { describe, test, expect } from 'bun:test';
import { createCompatibilityConfig as _createCompatibilityConfig } from '../../../../src/core/document-processing/parsers/epub-parser-helper-utils.js';

describe('EPUB Parser Helper Utilities - Compatibility Config', () => {
  test('should create config with strict mode enabled', () => {
    const options = { strictMode: true };

    const config = _createCompatibilityConfig(options);

    expect(config).toEqual({
      strictMode: true,
      enableFallbacks: true,
      logCompatibilityWarnings: true,
    });
  });

  test('should create config with strict mode disabled', () => {
    const options = { strictMode: false };

    const config = _createCompatibilityConfig(options);

    expect(config).toEqual({
      strictMode: false,
      enableFallbacks: true,
      logCompatibilityWarnings: true,
    });
  });

  test('should create default config when strict mode is undefined', () => {
    const options = {};

    const config = _createCompatibilityConfig(options);

    expect(config).toEqual({
      strictMode: false,
      enableFallbacks: true,
      logCompatibilityWarnings: true,
    });
  });

  test('should create config with custom options', () => {
    const options = { strictMode: true };

    const config = _createCompatibilityConfig(options);

    expect(config.strictMode).toBe(true);
    expect(config.enableFallbacks).toBe(true);
    expect(config.logCompatibilityWarnings).toBe(true);
  });
});
