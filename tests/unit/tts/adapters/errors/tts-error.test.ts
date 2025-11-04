import { describe, test, expect } from 'bun:test';
import {
  TTSError,
  TTSSynthesisError,
  TTSConfigurationError,
  TTSCapabilityError,
  createConfigurationError,
  type TTSErrorOptions,
} from '../../../../../src/core/tts/adapters/errors/index.js';

describe('TTSError Base Class', () => {
  test('should create base TTS error with required properties', () => {
    // GIVEN: Error details
    const message = 'Base TTS error occurred';
    const code = 'TTS_BASE_ERROR';
    const engine = 'test-adapter-1';
    const requestId = 'req-abc123';
    const operation = 'synthesize';
    const options: TTSErrorOptions = {
      operation,
      engine,
      requestId,
    };

    // WHEN: Creating TTS error
    const error = new TTSError(message, code, options);

    // THEN: Should have all required properties
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(TTSError);
    expect(error.name).toBe('TTSError');
    expect(error.message).toBe(message);
    expect(error.code).toBe(code);
    expect(error.engine).toBe(engine);
    expect(error.requestId).toBe(requestId);
    expect(error.operation).toBe(operation);
    expect(error.details).toBeDefined();
    expect(error.stack).toBeDefined();
  });

  test('should support error chaining for root cause analysis', () => {
    // GIVEN: Original error that causes TTS error
    const originalError = new Error('Network connection failed');
    (originalError as any).code = 'ENOTFOUND';

    // WHEN: Creating TTS error with root cause
    const ttsError = new TTSError(
      'Failed to connect to TTS service',
      'CONNECTION_ERROR',
      {
        operation: 'synthesize',
        engine: 'remote-adapter',
        requestId: 'req-456',
        cause: originalError,
      }
    );

    // THEN: Should maintain error chain
    expect(ttsError.cause).toBe(originalError);
    expect(ttsError.message).toContain('Failed to connect to TTS service');
    expect(ttsError.stack).toContain('TTSError');
    expect(ttsError.stack).toContain(
      'Caused by: Error: Network connection failed'
    );
  });

  test('should provide toJSON method for serialization', () => {
    // GIVEN: TTS error instance
    const error = new TTSError('Serialization test error', 'SERIALIZE_TEST', {
      operation: 'synthesize',
      engine: 'test-adapter',
      requestId: 'req-json-test',
    });

    // WHEN: Serializing error
    const serialized = error.toJSON();

    // THEN: Should include all relevant information
    expect(serialized).toHaveProperty('name', 'TTSError');
    expect(serialized).toHaveProperty('message', 'Serialization test error');
    expect(serialized).toHaveProperty('code', 'SERIALIZE_TEST');
    expect(serialized).toHaveProperty('engine', 'test-adapter');
    expect(serialized).toHaveProperty('requestId', 'req-json-test');
    expect(serialized).toHaveProperty('recoverable');
    expect(serialized).toHaveProperty('category', 'tts');
    expect(serialized).toHaveProperty('stack');
  });

  test('should support context information for debugging', () => {
    // GIVEN: Error with additional context
    const context = {
      voiceId: 'en-us-female-1',
      textLength: 250,
      format: 'mp3',
      retryCount: 2,
      lastSuccessfulAttempt: new Date().toISOString(),
    };

    // WHEN: Creating error with context
    const error = new TTSError(
      'Synthesis failed with context',
      'CONTEXT_ERROR',
      {
        operation: 'synthesize',
        engine: 'context-adapter',
        requestId: 'req-context',
        context,
      }
    );

    // THEN: Should include context information
    expect(error.context).toBe(context);
    expect(error.context?.voiceId).toBe('en-us-female-1');
    expect(error.context?.textLength).toBe(250);
  });
});

describe('TTSSynthesisError', () => {
  test('should create synthesis-specific error with detailed information', () => {
    // GIVEN: Synthesis failure details
    const synthesisDetails = {
      stage: 'audio-generation' as const,
      partialResult: false,
      processingTime: 2500,
      qualityScore: 0.85,
      engineVersion: '2.1.0',
    };

    // WHEN: Creating synthesis error
    const error = new TTSSynthesisError(
      'Audio synthesis failed',
      'synthesis-adapter',
      'req-synth-001',
      {
        text: 'Test text for synthesis',
        voice: 'en-us-male-1',
        synthesisDetails,
      }
    );

    // THEN: Should include synthesis-specific information
    expect(error).toBeInstanceOf(TTSError);
    expect(error).toBeInstanceOf(TTSSynthesisError);
    expect(error.name).toBe('TTSSynthesisError');
    expect(error.synthesisDetails).toBe(synthesisDetails);
    expect(error.synthesisDetails?.stage).toBe('audio-generation');
    expect(error.synthesisDetails?.partialResult).toBe(false);
    expect(error.text).toBe('Test text for synthesis');
    expect(error.voice).toBe('en-us-male-1');
  });

  test('should handle partial synthesis results', () => {
    // GIVEN: Partial synthesis result
    const partialSynthesisDetails = {
      stage: 'post-processing' as const,
      partialResult: true,
      processedCharacters: 2500,
      totalCharacters: 3000,
      partialAudioAvailable: true,
    };

    // WHEN: Creating error for partial synthesis
    const error = new TTSSynthesisError(
      'Synthesis completed partially',
      'partial-adapter',
      'req-partial',
      {
        text: 'Long text that failed to complete',
        voice: 'es-es-female-1',
        synthesisDetails: partialSynthesisDetails,
      }
    );

    // THEN: Should indicate partial result information
    expect(error.synthesisDetails?.partialResult).toBe(true);
    expect(error.synthesisDetails?.processedCharacters).toBe(2500);
    expect(error.synthesisDetails?.totalCharacters).toBe(3000);
    expect(error.synthesisDetails?.partialAudioAvailable).toBe(true);
  });

  test('should provide recovery suggestions', () => {
    // GIVEN: Error with recovery suggestions
    const recoverySuggestions = [
      'Try reducing text length to under 5000 characters',
      'Use a different voice format',
      'Check network connectivity',
    ];

    // WHEN: Creating error with recovery suggestions
    const error = new TTSSynthesisError(
      'Synthesis failed with suggestions',
      'recovery-adapter',
      'req-recovery',
      {
        text: 'Very long text that exceeds limits',
        voice: 'test-voice',
        recoverySuggestions,
      }
    );

    // THEN: Should include recovery suggestions
    expect(error.recoverySuggestions).toBe(recoverySuggestions);
    expect(error.recoverySuggestions).toContain(
      'Try reducing text length to under 5000 characters'
    );
  });
});

describe('TTSConfigurationError', () => {
  test('should create configuration error with validation details', () => {
    // GIVEN: Configuration error details
    const configDetails = {
      invalidFields: ['apiKey', 'region'],
      missingFields: ['endpoint', 'voiceModel'],
      validationErrors: [
        { field: 'apiKey', message: 'Invalid API key format' },
        { field: 'region', message: 'Unsupported region' },
        { field: 'endpoint', message: 'Missing endpoint URL' },
        { field: 'voiceModel', message: 'Voice model not specified' },
        { field: 'timeout', message: 'Timeout value too low' },
      ],
    };

    // WHEN: Creating configuration error
    const error = new TTSConfigurationError(
      'Configuration validation failed',
      'config-adapter',
      'apiKey',
      'invalid-key',
      'Valid API key string required',
      configDetails
    );

    // THEN: Should include configuration error with validation details
    expect(error.configDetails).toBe(configDetails);
    expect(error.configDetails?.invalidFields).toContain('apiKey');
    expect(error.configDetails?.missingFields).toContain('endpoint');
    expect(error.configDetails?.validationErrors).toHaveLength(5);
  });

  test('should provide configuration fix suggestions', () => {
    // GIVEN: Fix suggestions
    const fixSuggestions = [
      {
        field: 'apiKey',
        action: 'Generate new API key from developer portal',
        priority: 'high' as const,
      },
      {
        field: 'region',
        action: 'Use supported region: us-east-1 or eu-west-1',
        priority: 'medium' as const,
      },
    ];

    // WHEN: Creating error with fix suggestions
    const error = new TTSConfigurationError(
      'Invalid configuration detected',
      'fix-adapter',
      'apiKey',
      undefined,
      undefined,
      undefined,
      fixSuggestions
    );

    // THEN: Should include fix suggestions
    expect(error.fixSuggestions).toBe(fixSuggestions);
    if (error.fixSuggestions && error.fixSuggestions.length > 0) {
      const firstSuggestion = error.fixSuggestions[0];
      if (firstSuggestion) {
        expect(firstSuggestion.field).toBe('apiKey');
        expect(firstSuggestion.action).toContain('Generate new API key');
      }
    }
  });

  test('should handle environment-specific configuration issues', () => {
    // GIVEN: Environment configuration issues
    const envConfigDetails = {
      missingEnvVars: ['TTS_API_KEY', 'TTS_ENDPOINT_URL'],
      invalidConfigFiles: ['.tts-config.yaml', 'config/tts.json'],
    };

    const configDetails = {
      environmentConfig: envConfigDetails,
    };

    // WHEN: Creating error with environment issues
    const error = new TTSConfigurationError(
      'Environment configuration incomplete',
      'env-adapter',
      undefined,
      undefined,
      undefined,
      configDetails
    );

    // THEN: Should include environment-specific information
    expect(error.configDetails?.environmentConfig).toBe(envConfigDetails);
    expect(error.configDetails?.environmentConfig?.missingEnvVars).toContain(
      'TTS_API_KEY'
    );
  });
});

describe('TTSCapabilityError', () => {
  test('should create capability error with unsupported feature details', () => {
    // GIVEN: Capability error details
    const capabilityDetails = {
      requestedCapability: 'SSML-emotion-tagging',
      alternatives: [
        { format: 'basic-ssml', qualityImpact: 'medium' },
        { format: 'text-only', qualityImpact: 'low' },
      ],
      alternativeAdapters: ['advanced-adapter-v2', 'premium-engine'],
    };

    // WHEN: Creating capability error
    const error = new TTSCapabilityError(
      'Requested capability not supported',
      'basic-adapter',
      {
        capability: 'emotion-tagging',
        requestedValue: '<emphasis>text</emphasis>',
        capabilityDetails,
      }
    );

    // THEN: Should include capability error with unsupported feature details
    expect(error.name).toBe('TTSCapabilityError');
    expect(error.capabilityDetails).toBe(capabilityDetails);
    expect(error.capabilityDetails?.requestedCapability).toBe(
      'SSML-emotion-tagging'
    );
    expect(error.capabilityDetails?.alternativeAdapters).toContain(
      'advanced-adapter-v2'
    );
  });

  test('should handle format capability limitations', () => {
    // GIVEN: Format limitation details
    const capabilityDetails = {
      requestedFormat: 'flac',
      alternatives: [
        { format: 'mp3', qualityImpact: 'medium' },
        { format: 'wav', qualityImpact: 'high' },
      ],
    };

    // WHEN: Creating error for format limitation
    const error = new TTSCapabilityError(
      'Requested audio format not supported',
      'format-limited-adapter',
      {
        capability: 'audio-format',
        requestedValue: 'flac',
        capabilityDetails,
      }
    );

    // THEN: Should include format-specific details
    expect(error.capabilityDetails?.requestedFormat).toBe('flac');
    expect(error.capabilityDetails?.alternatives).toHaveLength(2);
    if (
      error.capabilityDetails?.alternatives &&
      error.capabilityDetails.alternatives.length > 1
    ) {
      const secondAlternative = error.capabilityDetails.alternatives[1];
      if (secondAlternative) {
        expect(secondAlternative.qualityImpact).toBe('high');
      }
    }
  });

  test('should provide capability upgrade suggestions', () => {
    // GIVEN: Upgrade information
    const upgradeInfo = {
      recommendedAdapter: 'advanced-adapter-v2',
      benefits: ['SSML support', 'Emotion tagging', 'Multiple formats'],
      cost: 'paid' as const,
      effort: 'medium' as const,
    };

    // WHEN: Creating error with upgrade info
    const error = new TTSCapabilityError(
      'Premium feature required',
      'basic-adapter',
      {
        capability: 'premium-feature',
        upgradeInfo,
      }
    );

    // THEN: Should include upgrade information
    expect(error.upgradeInfo).toBe(upgradeInfo);
    expect(error.upgradeInfo?.recommendedAdapter).toBe('advanced-adapter-v2');
    expect(error.upgradeInfo?.benefits).toContain('SSML support');
  });
});

describe('Error Factory Functions', () => {
  test('should provide factory functions for common error scenarios', () => {
    // GIVEN: Common error scenario
    const property = 'apiKey';

    // WHEN: Using factory function
    const configError = createConfigurationError(
      'API key is required',
      'factory-test-engine',
      property
    );

    // THEN: Should create properly configured error
    expect(configError).toBeInstanceOf(TTSConfigurationError);
    expect(configError.code).toBe('TTS_CONFIGURATION_ERROR');
    expect(configError.configDetails?.invalidFields).toContain('apiKey');
  });
});
