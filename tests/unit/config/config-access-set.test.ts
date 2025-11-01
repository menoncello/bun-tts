import { describe, it, expect, beforeEach } from 'bun:test';
import { ConfigAccess } from '../../../src/config/config-access';
import { createTestConfig } from './config-test-helpers';

describe('ConfigAccess Set - Basic Value Setting', () => {
  let configAccess: ConfigAccess;
  let testConfig: any;

  beforeEach(() => {
    configAccess = new ConfigAccess();
    testConfig = createTestConfig();
  });

  it('should set value for existing top-level key', () => {
    const result = configAccess.set(testConfig, 'logging.level', 'debug');
    expect(result.logging.level).toBe('debug');
  });

  it('should set value for nested key with dot notation', () => {
    const result = configAccess.set(
      testConfig,
      'tts.defaultEngine',
      'chatterbox'
    );
    expect(result.tts.defaultEngine).toBe('chatterbox');
  });

  it('should create intermediate objects when they do not exist', () => {
    const partialConfig = {} as any;
    const result = configAccess.set(partialConfig, 'new.nested.key', 'value');
    expect(result as any).toEqual({
      new: {
        nested: {
          key: 'value',
        },
      },
    });
  });

  it('should preserve existing nested properties', () => {
    const result = configAccess.set(testConfig, 'logging.level', 'debug');
    expect(result.logging.level).toBe('debug');
    expect(result.logging.pretty).toBe(true);
    expect(result.logging.file).toBe(false);
    expect(result.logging.filePath).toBe('./test.log');
  });
});

describe('ConfigAccess Set - Type Handling', () => {
  let configAccess: ConfigAccess;
  let testConfig: any;

  beforeEach(() => {
    configAccess = new ConfigAccess();
    testConfig = createTestConfig();
  });

  it('should set string values', () => {
    const result = configAccess.set(testConfig, 'logging.level', 'warn');
    expect(typeof result.logging.level).toBe('string');
    expect(result.logging.level).toBe('warn');
  });

  it('should set boolean values', () => {
    const result = configAccess.set(testConfig, 'logging.pretty', false);
    expect(typeof result.logging.pretty).toBe('boolean');
    expect(result.logging.pretty).toBe(false);
  });

  it('should set number values', () => {
    const result = configAccess.set(testConfig, 'tts.sampleRate', 44100);
    expect(typeof result.tts.sampleRate).toBe('number');
    expect(result.tts.sampleRate).toBe(44100);
  });

  it('should set object values', () => {
    const newTTSConfig = {
      defaultEngine: 'chatterbox' as const,
      outputFormat: 'wav' as const,
      sampleRate: 44100,
      quality: 0.9,
      rate: 1.2,
      volume: 0.8,
    };
    const result = configAccess.set(testConfig, 'tts', newTTSConfig);
    expect(result.tts).toEqual(newTTSConfig);
  });
});

describe('ConfigAccess Set - Special Values', () => {
  let configAccess: ConfigAccess;
  let testConfig: any;

  beforeEach(() => {
    configAccess = new ConfigAccess();
    testConfig = createTestConfig();
  });

  it('should handle setting undefined values', () => {
    const result = configAccess.set(testConfig, 'logging.filePath', undefined);
    expect(result.logging.filePath).toBeUndefined();
  });

  it('should handle setting null values', () => {
    const result = configAccess.set(testConfig, 'logging.filePath', undefined);
    expect(result.logging.filePath).toBeUndefined();
  });

  it('should handle setting complex objects', () => {
    const newObject = {
      newSection: {
        nestedValue: 'test',
        number: 42,
        boolean: true,
      },
    };
    const result = configAccess.set(
      testConfig,
      'newSection',
      newObject.newSection
    );
    expect((result as any).newSection).toEqual(newObject.newSection);
  });
});

describe('ConfigAccess Set - Edge Cases', () => {
  let configAccess: ConfigAccess;
  let testConfig: any;

  beforeEach(() => {
    configAccess = new ConfigAccess();
    testConfig = createTestConfig();
  });

  it('should handle empty key parts', () => {
    const result = configAccess.set(testConfig, '.logging..level.', 'debug');
    // Empty key parts are ignored, so it doesn't set the value
    expect(result.logging.level).toBe('info');
  });

  it('should create new top-level section when it does not exist', () => {
    const result = configAccess.set(testConfig, 'newSection', 'newValue');
    expect((result as any).newSection).toBe('newValue');
  });

  it('should handle deeply nested paths', () => {
    const deepConfig = {} as any;
    const result = configAccess.set(
      deepConfig,
      'level1.level2.level3.value',
      'deep-value'
    );
    expect(result).toEqual({
      level1: {
        level2: {
          level3: {
            value: 'deep-value',
          },
        },
      },
    } as any);
  });

  it('should handle array index setting', () => {
    const arrayConfig = { items: ['first', 'second', 'third'] };
    const result = configAccess.set(arrayConfig as any, 'items.1', 'modified');
    expect((result as any).items[1]).toBe('modified');
  });

  it('should handle empty key', () => {
    const result = configAccess.set(testConfig, '', 'value');
    expect(result).toEqual(testConfig); // Should remain unchanged
  });

  it('should handle null key', () => {
    const result = configAccess.set(testConfig, null as any, 'value');
    expect(result).toEqual(testConfig); // Should remain unchanged
  });
});
