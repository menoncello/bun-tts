import { describe, it, expect } from 'bun:test';
import {
  TTSError,
  TTSSynthesisError,
  TTSConfigurationError,
  TTSCapabilityError,
  isTTSError,
  isTTSSynthesisError,
  isTTSConfigurationError,
  isTTSCapabilityError,
  createTTSError,
} from '../../../../src/core/tts/adapters/errors/index.js';

describe('TTS Error Hierarchy', () => {
  describe('TTSError', () => {
    it('should create a base TTS error with required properties', () => {
      const error = new TTSError('Test TTS error', 'TTS_TEST_ERROR', {
        operation: 'synthesize',
        engine: 'TestEngine',
        requestId: 'req-123',
        details: { customDetail: 'value' },
      });

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(TTSError);
      expect(error.name).toBe('TTSError');
      expect(error.message).toBe('Test TTS error');
      expect(error.code).toBe('TTS_TEST_ERROR');
      expect(error.category).toBe('tts');
      expect(error.recoverable).toBe(true);
      expect(error.engine).toBe('TestEngine');
      expect(error.operation).toBe('synthesize');
      expect(error.requestId).toBe('req-123');
      expect(error.details?.customDetail).toBe('value');
      expect(error.stack).toBeDefined();
    });

    it('should use default recoverable value when not provided', () => {
      const error = new TTSError('Test error', 'TTS_TEST_ERROR');

      expect(error.recoverable).toBe(true);
    });

    it('should create user-friendly message with engine and operation', () => {
      const error = new TTSError('Test error', 'TTS_TEST_ERROR', {
        operation: 'synthesize',
        engine: 'TestEngine',
      });

      const userMessage = error.getUserMessage();
      expect(userMessage).toContain('Test error');
      expect(userMessage).toContain('Error code: TTS_TEST_ERROR');
      expect(userMessage).toContain('Engine: TestEngine');
      expect(userMessage).toContain('Operation: synthesize');
    });

    it('should log details when no sensitive content', () => {
      const error = new TTSError('Test error', 'TTS_TEST_ERROR', {
        operation: 'synthesize',
        engine: 'TestEngine',
        requestId: 'req-123',
        details: { safeDetail: 'value' },
      });

      expect(error.shouldLogDetails()).toBe(true);
    });

    it('should not log details when text content is present', () => {
      const error = new TTSError('Test error', 'TTS_TEST_ERROR', {
        operation: 'synthesize',
        engine: 'TestEngine',
        requestId: 'req-123',
        details: { text: 'sensitive content' },
      });

      expect(error.shouldLogDetails()).toBe(false);
    });

    it('should serialize to JSON with all properties', () => {
      const error = new TTSError('Test error', 'TTS_TEST_ERROR', {
        operation: 'synthesize',
        engine: 'TestEngine',
        requestId: 'req-123',
        details: { customDetail: 'value' },
      });

      const json = error.toJSON();
      expect(json.name).toBe('TTSError');
      expect(json.message).toBe('Test error');
      expect(json.code).toBe('TTS_TEST_ERROR');
      expect(json.category).toBe('tts');
      expect(json.recoverable).toBe(true);
      expect(json.engine).toBe('TestEngine');
      expect(json.operation).toBe('synthesize');
      expect(json.requestId).toBe('req-123');
      expect((json.details as { customDetail?: string })?.customDetail).toBe(
        'value'
      );
      expect(json.stack).toBeDefined();
    });

    it('should sanitize text content for logging', () => {
      const error = new TTSError('Test error', 'TTS_TEST_ERROR', {
        operation: 'synthesize',
        engine: 'TestEngine',
        requestId: 'req-123',
        details: { text: 'very long sensitive text content here' },
      });

      const logSafe = error.toLogSafeJSON();
      expect((logSafe.details as { text?: string })?.text).toBe(
        '[37 characters]'
      );
    });

    it('should handle non-string text content', () => {
      const error = new TTSError('Test error', 'TTS_TEST_ERROR', {
        operation: 'synthesize',
        engine: 'TestEngine',
        requestId: 'req-123',
        details: { text: 123 },
      });

      const logSafe = error.toLogSafeJSON();
      expect((logSafe.details as { text?: string })?.text).toBe(
        '[text content]'
      );
    });
  });

  describe('TTSSynthesisError', () => {
    it('should create synthesis error with text details', () => {
      const error = new TTSSynthesisError(
        'Synthesis failed',
        'TestEngine',
        'req-123',
        {
          text: 'Hello world',
          voice: 'en-US-Jenny',
          details: { stage: 'processing' },
        }
      );

      expect(error).toBeInstanceOf(TTSError);
      expect(error).toBeInstanceOf(TTSSynthesisError);
      expect(error.name).toBe('TTSSynthesisError');
      expect(error.message).toBe('Synthesis failed');
      expect(error.code).toBe('TTS_SYNTHESIS_ERROR');
      expect(error.operation).toBe('synthesize');
      expect(error.engine).toBe('TestEngine');
      expect(error.requestId).toBe('req-123');
      expect(error.text).toBe('Hello world');
      expect(error.voice).toBe('en-US-Jenny');
      expect(error.textLength).toBe(11);
      expect(error.details?.stage).toBe('processing');
    });

    it('should calculate text length correctly', () => {
      const error = new TTSSynthesisError(
        'Synthesis failed',
        'TestEngine',
        'req-123',
        {
          text: 'A longer text with multiple words',
        }
      );

      expect(error.textLength).toBe(33);
    });

    it('should handle undefined text gracefully', () => {
      const error = new TTSSynthesisError(
        'Synthesis failed',
        'TestEngine',
        'req-123'
      );

      expect(error.text).toBeUndefined();
      expect(error.textLength).toBeUndefined();
    });

    it('should be recoverable', () => {
      const error = new TTSSynthesisError(
        'Synthesis failed',
        'TestEngine',
        'req-123'
      );

      expect(error.isRecoverable()).toBe(true);
    });

    it('should provide recovery suggestions', () => {
      const error = new TTSSynthesisError(
        'Synthesis failed',
        'TestEngine',
        'req-123',
        {
          text: 'A'.repeat(1500), // Long text
          voice: 'en-US-Jenny',
        }
      );

      const suggestions = error.getRecoverySuggestions();
      expect(suggestions).toContain('Try synthesizing shorter text segments');
      expect(suggestions).toContain(
        'Try using a different voice than "en-US-Jenny"'
      );
      expect(suggestions).toContain(
        'Check text for unsupported characters or formats'
      );
      expect(suggestions).toContain(
        'Verify voice compatibility with selected engine'
      );
    });
  });

  describe('TTSConfigurationError', () => {
    it('should create configuration error with property details', () => {
      const error = new TTSConfigurationError(
        'Invalid configuration',
        'TestEngine',
        'apiKey',
        'invalid-key',
        'string with valid format'
      );

      expect(error).toBeInstanceOf(TTSError);
      expect(error).toBeInstanceOf(TTSConfigurationError);
      expect(error.name).toBe('TTSConfigurationError');
      expect(error.message).toBe('Invalid configuration');
      expect(error.code).toBe('TTS_CONFIGURATION_ERROR');
      expect(error.operation).toBe('configure');
      expect(error.property).toBe('apiKey');
      expect(error.invalidValue).toBe('invalid-key');
      expect(error.expected).toBe('string with valid format');
    });

    it('should not be recoverable', () => {
      const error = new TTSConfigurationError(
        'Invalid configuration',
        'TestEngine'
      );

      expect(error.isRecoverable()).toBe(false);
    });

    it('should provide fix suggestions', () => {
      const error = new TTSConfigurationError(
        'Invalid configuration',
        'TestEngine',
        'rate',
        5.0,
        'number between 0.1 and 3.0'
      );

      const suggestions = error.getFixSuggestions();
      expect(suggestions).toContain(
        'Fix "rate" property: number between 0.1 and 3.0'
      );
      expect(suggestions).toContain(
        'Check configuration documentation for "rate"'
      );
      expect(suggestions).toContain(
        'Verify all required configuration properties are set'
      );
      expect(suggestions).toContain(
        'Check for typos in property names or values'
      );
    });
  });

  describe('TTSCapabilityError', () => {
    it('should create capability error with capability details', () => {
      const error = new TTSCapabilityError(
        'Capability not supported',
        'TestEngine',
        {
          capability: 'SSML',
          requestedValue: '<speak>test</speak>',
          alternatives: ['text', 'prosody'],
          capabilityDetails: { requestedCapability: 'SSML' },
        }
      );

      expect(error).toBeInstanceOf(TTSError);
      expect(error).toBeInstanceOf(TTSCapabilityError);
      expect(error.name).toBe('TTSCapabilityError');
      expect(error.message).toBe('Capability not supported');
      expect(error.code).toBe('TTS_CAPABILITY_ERROR');
      expect(error.operation).toBe('validate');
      expect(error.capability).toBe('SSML');
      expect(error.requestedValue).toBe('<speak>test</speak>');
      expect(error.alternatives).toEqual(['text', 'prosody']);
    });

    it('should be recoverable', () => {
      const error = new TTSCapabilityError(
        'Capability not supported',
        'TestEngine',
        'SSML'
      );

      expect(error.isRecoverable()).toBe(true);
    });

    it('should provide alternative suggestions', () => {
      const error = new TTSCapabilityError(
        'Capability not supported',
        'TestEngine',
        {
          capability: 'SSML',
          requestedValue: undefined,
          alternatives: ['text', 'prosody'],
        }
      );

      const suggestions = error.getAlternativeSuggestions();
      expect(suggestions).toContain(
        'Try one of these alternatives: text, prosody'
      );
      expect(suggestions).toContain(
        'Check engine documentation for supported SSML options'
      );
      expect(suggestions).toContain(
        'Use engine capabilities detection to find supported features'
      );
      expect(suggestions).toContain(
        'Consider switching to a different engine that supports this capability'
      );
    });
  });

  describe('Type Guards', () => {
    it('should correctly identify TTSError instances', () => {
      const ttsError = new TTSError('Test error', 'TTS_TEST_ERROR');
      const synthesisError = new TTSSynthesisError(
        'Synthesis failed',
        'TestEngine',
        'req-123'
      );
      const configError = new TTSConfigurationError(
        'Config error',
        'TestEngine'
      );
      const capabilityError = new TTSCapabilityError(
        'Capability error',
        'TestEngine',
        'SSML'
      );
      const regularError = new Error('Regular error');
      const nonError = { message: 'not an error' };

      expect(isTTSError(ttsError)).toBe(true);
      expect(isTTSError(synthesisError)).toBe(true);
      expect(isTTSError(configError)).toBe(true);
      expect(isTTSError(capabilityError)).toBe(true);
      expect(isTTSError(regularError)).toBe(false);
      expect(isTTSError(nonError)).toBe(false);
    });

    it('should correctly identify TTSSynthesisError instances', () => {
      const synthesisError = new TTSSynthesisError(
        'Synthesis failed',
        'TestEngine',
        'req-123'
      );
      const configError = new TTSConfigurationError(
        'Config error',
        'TestEngine'
      );
      const regularError = new Error('Regular error');

      expect(isTTSSynthesisError(synthesisError)).toBe(true);
      expect(isTTSSynthesisError(configError)).toBe(false);
      expect(isTTSSynthesisError(regularError)).toBe(false);
    });

    it('should correctly identify TTSConfigurationError instances', () => {
      const synthesisError = new TTSSynthesisError(
        'Synthesis failed',
        'TestEngine',
        'req-123'
      );
      const configError = new TTSConfigurationError(
        'Config error',
        'TestEngine'
      );
      const regularError = new Error('Regular error');

      expect(isTTSConfigurationError(synthesisError)).toBe(false);
      expect(isTTSConfigurationError(configError)).toBe(true);
      expect(isTTSConfigurationError(regularError)).toBe(false);
    });

    it('should correctly identify TTSCapabilityError instances', () => {
      const capabilityError = new TTSCapabilityError(
        'Capability error',
        'TestEngine',
        'SSML'
      );
      const configError = new TTSConfigurationError(
        'Config error',
        'TestEngine'
      );
      const regularError = new Error('Regular error');

      expect(isTTSCapabilityError(capabilityError)).toBe(true);
      expect(isTTSCapabilityError(configError)).toBe(false);
      expect(isTTSCapabilityError(regularError)).toBe(false);
    });
  });

  describe('createTTSError', () => {
    it('should return existing TTSError unchanged', () => {
      const originalError = new TTSError('Original error', 'TTS_ORIGINAL');
      const result = createTTSError(
        originalError,
        'TestEngine',
        'synthesize',
        'req-123'
      );

      expect(result).toBe(originalError);
    });

    it('should convert Error to TTSError', () => {
      const originalError = new Error('Original error');
      const result = createTTSError(
        originalError,
        'TestEngine',
        'synthesize',
        'req-123'
      );

      expect(result).toBeInstanceOf(TTSError);
      expect(result.message).toBe('Original error');
      expect(result.engine).toBe('TestEngine');
      expect(result.operation).toBe('synthesize');
      expect(result.requestId).toBe('req-123');
      expect(result.code).toBe('TTS_UNKNOWN_ERROR');
      expect(result.details?.originalError).toBe('Error');
      expect(result.details?.stack).toBeDefined();
    });

    it('should convert unknown to TTSError', () => {
      const originalError = 'Some string error';
      const result = createTTSError(
        originalError,
        'TestEngine',
        'synthesize',
        'req-123'
      );

      expect(result).toBeInstanceOf(TTSError);
      expect(result.message).toBe('Some string error');
      expect(result.engine).toBe('TestEngine');
      expect(result.operation).toBe('synthesize');
      expect(result.requestId).toBe('req-123');
      expect(result.code).toBe('TTS_UNKNOWN_ERROR');
      expect(result.details?.originalError).toBe('Some string error');
    });

    it('should handle null/undefined gracefully', () => {
      const result = createTTSError(
        null,
        'TestEngine',
        'synthesize',
        'req-123'
      );

      expect(result).toBeInstanceOf(TTSError);
      expect(result.message).toBe('null');
      expect(result.details?.originalError).toBe(null);
    });
  });

  describe('Error Inheritance Chain', () => {
    it('should maintain proper inheritance hierarchy', () => {
      const synthesisError = new TTSSynthesisError(
        'Synthesis failed',
        'TestEngine',
        'req-123'
      );
      const configError = new TTSConfigurationError(
        'Config error',
        'TestEngine'
      );
      const capabilityError = new TTSCapabilityError(
        'Capability error',
        'TestEngine',
        'SSML'
      );

      // All TTS errors should be instances of Error
      expect(synthesisError).toBeInstanceOf(Error);
      expect(configError).toBeInstanceOf(Error);
      expect(capabilityError).toBeInstanceOf(Error);

      // All TTS errors should be instances of TTSError
      expect(synthesisError).toBeInstanceOf(TTSError);
      expect(configError).toBeInstanceOf(TTSError);
      expect(capabilityError).toBeInstanceOf(TTSError);

      // Specific error types
      expect(synthesisError).toBeInstanceOf(TTSSynthesisError);
      expect(configError).toBeInstanceOf(TTSConfigurationError);
      expect(capabilityError).toBeInstanceOf(TTSCapabilityError);

      // Should not be instances of other specific error types
      expect(synthesisError).not.toBeInstanceOf(TTSConfigurationError);
      expect(synthesisError).not.toBeInstanceOf(TTSCapabilityError);
      expect(configError).not.toBeInstanceOf(TTSSynthesisError);
      expect(configError).not.toBeInstanceOf(TTSCapabilityError);
      expect(capabilityError).not.toBeInstanceOf(TTSSynthesisError);
      expect(capabilityError).not.toBeInstanceOf(TTSConfigurationError);
    });
  });

  describe('Error Code Consistency', () => {
    it('should use consistent error codes', () => {
      const ttsError = new TTSError('Base error', 'TTS_BASE_ERROR');
      const synthesisError = new TTSSynthesisError(
        'Synthesis error',
        'TestEngine',
        'req-123'
      );
      const configError = new TTSConfigurationError(
        'Config error',
        'TestEngine'
      );
      const capabilityError = new TTSCapabilityError(
        'Capability error',
        'TestEngine',
        'SSML'
      );

      expect(ttsError.code).toBe('TTS_BASE_ERROR');
      expect(synthesisError.code).toBe('TTS_SYNTHESIS_ERROR');
      expect(configError.code).toBe('TTS_CONFIGURATION_ERROR');
      expect(capabilityError.code).toBe('TTS_CAPABILITY_ERROR');
    });
  });
});
