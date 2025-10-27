import { describe, it, expect } from 'bun:test';
import { BunTtsError } from '../../src/errors/bun-tts-error.js';
import { ConfigurationError } from '../../src/errors/configuration-error.js';
import { ProcessingError } from '../../src/errors/processing-error.js';
import {
  Ok,
  Err,
  map,
  chain,
  unwrap,
  unwrapOr,
  match,
} from '../../src/errors/result.js';
import { ValidationError } from '../../src/errors/validation-error.js';

function createTestError(code: string, category: 'configuration' | 'parsing' | 'tts' | 'file' | 'validation'): BunTtsError {
  return new BunTtsError('test error', { code, category });
}

describe('BunTtsError Core Functionality', () => {
  it('should create error with message and code', () => {
    const error = new BunTtsError('Test error', {
      code: 'TEST_CODE',
      category: 'validation'
    });

    expect(error.message).toBe('Test error');
    expect(error.code).toBe('TEST_CODE');
    expect(error.category).toBe('validation');
    expect(error.name).toBe('BunTtsError');
  });

  it('should include details when provided', () => {
    const details = { key: 'value' };
    const error = new BunTtsError('Test error', {
      code: 'TEST_CODE',
      category: 'validation',
      details
    });

    expect(error.details).toEqual(details);
  });

  it('should provide user-friendly message', () => {
    const error = new BunTtsError('Test error', {
      code: 'TEST_CODE',
      category: 'validation'
    });
    expect(error.getUserMessage()).toBe('Test error (Error code: TEST_CODE)');
  });

  it('should have default exit code', () => {
    const error = new BunTtsError('Test error', {
      code: 'TEST_CODE',
      category: 'validation'
    });
    expect(error.getExitCode()).toBe(1);
  });

  it('should maintain stack trace', () => {
    const error = new BunTtsError('Test error', {
      code: 'TEST_CODE',
      category: 'validation'
    });
    expect(error.stack).toBeDefined();
    expect(error.stack).toContain('BunTtsError');
  });
});

describe('Specific Error Types', () => {
  it('should create configuration error', () => {
    const error = new ConfigurationError('Config error');

    expect(error.name).toBe('ConfigurationError');
    expect(error.code).toBe('CONFIG_ERROR');
    expect(error.getExitCode()).toBe(2);
  });

  it('should create validation error', () => {
    const error = new ValidationError('Validation error');

    expect(error.name).toBe('ValidationError');
    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.getExitCode()).toBe(3);
  });

  it('should create processing error', () => {
    const error = new ProcessingError('Processing error');

    expect(error.name).toBe('ProcessingError');
    expect(error.code).toBe('PROCESSING_ERROR');
    expect(error.getExitCode()).toBe(4);
  });

  it('should log details by default for processing error', () => {
    const error = new ProcessingError('Processing error');
    expect(error.shouldLogDetails()).toBe(true);
  });
});

describe('Result Type Creation', () => {
  it('should create successful result', () => {
    const result = Ok('success');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe('success');
    }
  });

  it('should create error result', () => {
    const error = createTestError('TEST', 'validation');
    const result = Err(error);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect((result as any).error).toBe(error);
    }
  });
});

describe('Result Type Mapping', () => {
  it('should map successful results', () => {
    const result = Ok(5);
    const mapped = map(result, (x) => x * 2);

    expect(mapped.success).toBe(true);
    if (mapped.success) {
      expect(mapped.data).toBe(10);
    }
  });

  it('should preserve error results during mapping', () => {
    const error = createTestError('TEST', 'validation');
    const result = Err(error);
    const mapped = map(result, (x) => x * 2);

    expect(mapped.success).toBe(false);
    if (!mapped.success) {
      expect((mapped as any).error).toBe(error);
    }
  });
});

describe('Result Type Chaining', () => {
  it('should chain successful results', () => {
    const result = Ok(5);
    const chained = chain(result, (x) => Ok(x * 2));

    expect(chained.success).toBe(true);
    if (chained.success) {
      expect(chained.data).toBe(10);
    }
  });

  it('should handle errors in chain', () => {
    const result = Ok(5);
    const error = createTestError('CHAIN', 'validation');
    const chained = chain(result, () => Err(error));

    expect(chained.success).toBe(false);
    if (!chained.success) {
      expect((chained as any).error).toBe(error);
    }
  });

  it('should preserve original errors in chain', () => {
    const error = createTestError('ORIGINAL', 'validation');
    const result = Err(error);
    const chained = chain(result, (x) => Ok(x * 2));

    expect(chained.success).toBe(false);
    if (!chained.success) {
      expect((chained as any).error).toBe(error);
    }
  });
});

describe('Result Type Unwrapping', () => {
  it('should return value for successful results', () => {
    const result = Ok('value');
    expect(unwrap(result)).toBe('value');
  });

  it('should throw error for error results', () => {
    const error = createTestError('TEST', 'validation');
    const result = Err(error);

    expect(() => unwrap(result)).toThrow('test error');
  });

  it('should return value for successful results with unwrapOr', () => {
    const result = Ok('value');
    expect(unwrapOr(result, 'default')).toBe('value');
  });

  it('should return default for error results with unwrapOr', () => {
    const error = createTestError('TEST', 'validation');
    const result = Err(error);
    expect(unwrapOr(result, 'default')).toBe('default');
  });
});

describe('Result Type Pattern Matching', () => {
  it('should call onSuccess for successful results', () => {
    const result = Ok(42);
    const output = match(
      result,
      (value) => `Success: ${value}`,
      (error) => `Error: ${error.message}`
    );

    expect(output).toBe('Success: 42');
  });

  it('should call onError for error results', () => {
    const error = createTestError('TEST', 'validation');
    const result = Err(error);
    const output = match(
      result,
      (value) => `Success: ${value}`,
      (error) => `Error: ${error.message}`
    );

    expect(output).toBe('Error: test error');
  });
});
