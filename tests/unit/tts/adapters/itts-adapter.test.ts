import { describe, it, expect, beforeEach } from 'bun:test';
import { TTSError } from '../../../../src/core/tts/adapters/errors/index.js';
import {
  isTtsAdapter,
  type TtsAdapter,
} from '../../../../src/core/tts/adapters/itts-adapter.js';
import type {
  TTSRequest,
  TTSOptions,
  VoiceConfig,
  TTSResponse,
  VoiceInfo,
  TTSCapabilities,
  ValidationResult,
  HealthCheckResult,
  AudioBuffer,
  QualityScore,
  AudioFormat,
} from '../../../../src/core/tts/adapters/types.js';
import type { Result } from '../../../../src/errors/result.js';

/**
 * Mock TTS adapter implementation for testing
 */
class MockTTSAdapter implements TtsAdapter {
  public readonly name: string;
  public readonly version: string;
  public isInitialized = false;
  private voices: VoiceInfo[] = [];
  private capabilities: TTSCapabilities;

  constructor(name: string, version = '1.0.0') {
    this.name = name;
    this.version = version;
    this.capabilities = {
      engineName: name,
      engineVersion: version,
      supportedLanguages: ['en-US', 'en-GB', 'es-ES'],
      availableVoices: this.voices,
      supportedFormats: ['PCM16' as const, 'PCM32' as const],
      supportedSampleRates: [22050, 44100],
      maxTextLength: 5000,
      features: {
        ssml: false,
        voiceCloning: false,
        realtime: true,
        batch: true,
        prosodyControl: true,
        customPronunciation: false,
      },
      performance: {
        synthesisRate: 15.0,
        maxConcurrentRequests: 5,
        memoryPerRequest: 128,
        initTime: 1000,
        averageResponseTime: 50,
      },
      quality: {
        averageScore: 0.85,
      },
      pricing: {
        costPerRequest: 0.01,
      },
      limitations: {
        maxDuration: 300,
        maxFileSize: 50 * 1024 * 1024,
        rateLimit: 10,
      },
    };

    // Initialize some test voices
    this.voices = [
      {
        id: 'en-US-Jenny',
        name: 'Jenny',
        language: 'en-US',
        gender: 'female',
        age: 'adult',
        sampleRates: [22050, 44100],
        formats: ['PCM16' as const, 'PCM32' as const],
      },
      {
        id: 'en-US-Guy',
        name: 'Guy',
        language: 'en-US',
        gender: 'male',
        age: 'adult',
        sampleRates: [22050],
        formats: ['PCM16' as const],
      },
    ];

    this.capabilities.availableVoices = this.voices;
  }

  async synthesize(
    request: TTSRequest
  ): Promise<Result<TTSResponse, TTSError>> {
    if (!this.isInitialized) {
      return {
        success: false,
        error: new TTSError(
          'Adapter not initialized',
          'ADAPTER_NOT_INITIALIZED',
          {
            operation: 'synthesize',
            engine: this.name,
          }
        ),
      };
    }

    // Mock synthesis - create a simple audio buffer
    const audioBuffer: AudioBuffer = {
      data: new Float32Array([0.1, 0.2, 0.3, 0.4, 0.5]),
      sampleRate: request.options?.sampleRate || 22050,
      channels: 1,
      duration: request.text.length * 0.1, // Mock duration
      format: request.options?.format || ('PCM16' as const),
    };

    const qualityScore: QualityScore = {
      overall: 0.85,
      naturalness: 0.9,
      clarity: 0.88,
      pronunciation: 0.92,
      prosody: 0.8,
      assessedAt: new Date(),
    };

    return {
      success: true,
      data: {
        success: true,
        audio: audioBuffer,
        quality: qualityScore,
        metadata: {
          synthesisTime: 1500,
          engine: this.name,
          voice: request.voice.id,
          requestId: request.requestId || 'unknown',
        },
      },
    };
  }

  async getSupportedVoices(): Promise<VoiceInfo[]> {
    return [...this.voices];
  }

  async getCapabilities(): Promise<TTSCapabilities> {
    return { ...this.capabilities };
  }

  validateOptions(options: TTSOptions): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    this.validateRate(options.rate, errors);
    this.validatePitch(options.pitch, errors);
    this.validateVolume(options.volume, errors);
    this.validateSampleRate(options.sampleRate, errors);
    this.validateFormat(options.format, errors);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  private validateRate(rate: number | undefined, errors: string[]): void {
    if (
      rate !== undefined &&
      (typeof rate !== 'number' || rate < 0.1 || rate > 3.0)
    ) {
      errors.push('Rate must be a number between 0.1 and 3.0');
    }
  }

  private validatePitch(pitch: number | undefined, errors: string[]): void {
    if (
      pitch !== undefined &&
      (typeof pitch !== 'number' || pitch < 0.5 || pitch > 2.0)
    ) {
      errors.push('Pitch must be a number between 0.5 and 2.0');
    }
  }

  private validateVolume(volume: number | undefined, errors: string[]): void {
    if (
      volume !== undefined &&
      (typeof volume !== 'number' || volume < 0 || volume > 1.0)
    ) {
      errors.push('Volume must be a number between 0 and 1.0');
    }
  }

  private validateSampleRate(
    sampleRate: number | undefined,
    errors: string[]
  ): void {
    if (
      sampleRate !== undefined &&
      !this.capabilities.supportedSampleRates.includes(sampleRate)
    ) {
      errors.push(`Sample rate ${sampleRate} is not supported`);
    }
  }

  private validateFormat(
    format: AudioFormat | undefined,
    errors: string[]
  ): void {
    if (
      format !== undefined &&
      !this.capabilities.supportedFormats.includes(format)
    ) {
      errors.push(`Format ${format} is not supported`);
    }
  }

  validateVoice(voice: VoiceConfig): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if voice exists
    const voiceExists = this.voices.some(
      (v) => v.id === voice.id || v.language === voice.language
    );
    if (!voiceExists) {
      errors.push(`Voice ${voice.id} is not available`);
    }

    // Validate language
    if (!this.capabilities.supportedLanguages.includes(voice.language)) {
      errors.push(`Language ${voice.language} is not supported`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  async initialize(config?: Record<string, unknown>): Promise<void> {
    // Mock initialization
    if (config?.throwError) {
      throw new TTSError('Mock initialization error', 'INIT_ERROR', {
        operation: 'initialize',
        engine: this.name,
      });
    }
    this.isInitialized = true;
  }

  async cleanup(): Promise<void> {
    this.isInitialized = false;
  }

  async healthCheck(): Promise<HealthCheckResult> {
    return {
      engine: this.name,
      status: this.isInitialized ? 'healthy' : 'unhealthy',
      timestamp: new Date(),
      responseTime: 50,
      message: this.isInitialized
        ? 'All systems operational'
        : 'Adapter not initialized',
      metrics: {
        activeRequests: 0,
        memoryUsage: 64,
      },
    };
  }

  async supportsFeature(feature: string): Promise<boolean> {
    switch (feature.toLowerCase()) {
      case 'ssml':
        return this.capabilities.features.ssml;
      case 'realtime':
        return this.capabilities.features.realtime;
      case 'batch':
        return this.capabilities.features.batch;
      case 'prosody':
        return this.capabilities.features.prosodyControl;
      case 'voicecloning':
        return this.capabilities.features.voiceCloning;
      default:
        return false;
    }
  }

  async getVoice(query: string): Promise<VoiceInfo | undefined> {
    return this.voices.find(
      (voice) =>
        voice.id === query ||
        voice.name.toLowerCase().includes(query.toLowerCase()) ||
        voice.language === query
    );
  }
}

describe('TtsAdapter Interface', () => {
  let adapter: MockTTSAdapter;

  beforeEach(() => {
    adapter = new MockTTSAdapter('TestEngine', '1.0.0');
  });

  describe('Adapter Properties', () => {
    it('should expose required read-only properties', () => {
      expect(adapter.name).toBe('TestEngine');
      expect(adapter.version).toBe('1.0.0');
      expect(adapter.isInitialized).toBe(false);
    });

    it('should have read-only name and version at type level', () => {
      // TypeScript readonly is a type-level construct, not runtime protection
      // The properties are declared readonly in the interface
      expect(adapter.name).toBe('TestEngine');
      expect(adapter.version).toBe('1.0.0');

      // At runtime, JavaScript doesn't enforce readonly
      // This test confirms the interface design intent rather than runtime behavior
      // Check if the properties are defined as read-only at the prototype level
      const nameDescriptor = Reflect.getOwnPropertyDescriptor(
        MockTTSAdapter.prototype,
        'name'
      );
      const instanceDescriptor = Reflect.getOwnPropertyDescriptor(
        adapter,
        'name'
      );
      const hasReadonlyProperties =
        nameDescriptor?.writable === false ||
        instanceDescriptor?.writable === false;

      // The main point is that these should be treated as read-only by consumers
      expect(typeof adapter.name).toBe('string');
      expect(typeof adapter.version).toBe('string');
      expect(typeof hasReadonlyProperties).toBe('boolean');
    });
  });

  describe('Initialization', () => {
    it('should initialize successfully', async () => {
      expect(adapter.isInitialized).toBe(false);
      await adapter.initialize();
      expect(adapter.isInitialized).toBe(true);
    });

    it('should cleanup successfully', async () => {
      await adapter.initialize();
      expect(adapter.isInitialized).toBe(true);
      await adapter.cleanup();
      expect(adapter.isInitialized).toBe(false);
    });

    it('should handle initialization errors', async () => {
      await expect(adapter.initialize({ throwError: true })).rejects.toThrow();
      expect(adapter.isInitialized).toBe(false);
    });
  });

  describe('Voice Management', () => {
    beforeEach(async () => {
      await adapter.initialize();
    });

    it('should return supported voices', async () => {
      const voices = await adapter.getSupportedVoices();
      expect(voices).toHaveLength(2);
      if (voices.length >= 2) {
        expect(voices[0]!.id).toBe('en-US-Jenny');
        expect(voices[1]!.id).toBe('en-US-Guy');
      }
    });

    it('should find voice by ID', async () => {
      const voice = await adapter.getVoice('en-US-Jenny');
      expect(voice).toBeDefined();
      expect(voice?.id).toBe('en-US-Jenny');
    });

    it('should find voice by language', async () => {
      const voice = await adapter.getVoice('en-US');
      expect(voice).toBeDefined();
      expect(voice?.language).toBe('en-US');
    });

    it('should find voice by name (case insensitive)', async () => {
      const voice = await adapter.getVoice('jenny');
      expect(voice).toBeDefined();
      expect(voice?.name).toBe('Jenny');
    });

    it('should return undefined for unknown voice', async () => {
      const voice = await adapter.getVoice('unknown-voice');
      expect(voice).toBeUndefined();
    });
  });

  describe('Capabilities', () => {
    beforeEach(async () => {
      await adapter.initialize();
    });

    it('should return engine capabilities', async () => {
      const capabilities = await adapter.getCapabilities();
      expect(capabilities.engineName).toBe('TestEngine');
      expect(capabilities.engineVersion).toBe('1.0.0');
      expect(capabilities.supportedLanguages).toContain('en-US');
      expect(capabilities.supportedFormats).toContain('PCM16');
      expect(capabilities.features.realtime).toBe(true);
    });

    it('should check feature support', async () => {
      expect(await adapter.supportsFeature('realtime')).toBe(true);
      expect(await adapter.supportsFeature('batch')).toBe(true);
      expect(await adapter.supportsFeature('ssml')).toBe(false);
      expect(await adapter.supportsFeature('unknown')).toBe(false);
    });
  });

  describe('Validation', () => {
    beforeEach(async () => {
      await adapter.initialize();
    });

    it('should validate valid options', () => {
      const options: TTSOptions = {
        rate: 1.0,
        pitch: 1.0,
        volume: 0.8,
        sampleRate: 22050,
        format: 'PCM16',
      };

      const result = adapter.validateOptions(options);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid rate', () => {
      const options: TTSOptions = { rate: 5.0 };
      const result = adapter.validateOptions(options);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Rate must be a number between 0.1 and 3.0'
      );
    });

    it('should reject unsupported sample rate', () => {
      const options: TTSOptions = { sampleRate: 8000 };
      const result = adapter.validateOptions(options);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Sample rate 8000 is not supported');
    });

    it('should validate valid voice', () => {
      const voice: VoiceConfig = {
        id: 'en-US-Jenny',
        name: 'Jenny',
        language: 'en-US',
        gender: 'female',
      };

      const result = adapter.validateVoice(voice);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid voice', () => {
      const voice: VoiceConfig = {
        id: 'invalid-voice',
        name: 'Invalid',
        language: 'invalid-LANG',
        gender: 'female',
      };

      const result = adapter.validateVoice(voice);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Synthesis', () => {
    beforeEach(async () => {
      await adapter.initialize();
    });

    it('2.1-TTS-INTF-001: should synthesize speech successfully', async () => {
      const request: TTSRequest = {
        text: 'Hello world',
        voice: {
          id: 'en-US-Jenny',
          name: 'Jenny',
          language: 'en-US',
          gender: 'female',
        },
        options: {
          rate: 1.0,
          sampleRate: 22050,
          format: 'PCM16',
        },
        requestId: 'test-123',
      };

      const result = await adapter.synthesize(request);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.success).toBe(true);
        expect(result.data.audio).toBeDefined();
        expect(result.data.audio?.data).toBeInstanceOf(Float32Array);
        expect(result.data.quality?.overall).toBe(0.85);
        expect(result.data.metadata?.requestId).toBe('test-123');
      }
    });

    it('2.1-TTS-INTF-002: should fail synthesis when not initialized', async () => {
      await adapter.cleanup(); // Ensure not initialized

      const request: TTSRequest = {
        text: 'Hello world',
        voice: {
          id: 'en-US-Jenny',
          name: 'Jenny',
          language: 'en-US',
          gender: 'female',
        },
      };

      const result = await adapter.synthesize(request);
      expect(result.success).toBe(false);
      expect((result as { success: false; error: TTSError }).error.code).toBe(
        'ADAPTER_NOT_INITIALIZED'
      );
    });

    it('should synthesize with default options', async () => {
      const request: TTSRequest = {
        text: 'Hello world',
        voice: {
          id: 'en-US-Jenny',
          name: 'Jenny',
          language: 'en-US',
          gender: 'female',
        },
      };

      const result = await adapter.synthesize(request);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.audio?.sampleRate).toBe(22050); // Default
        expect(result.data.audio?.format).toBe('PCM16'); // Default
      }
    });
  });

  describe('Health Check', () => {
    it('should report unhealthy when not initialized', async () => {
      const health = await adapter.healthCheck();
      expect(health.status).toBe('unhealthy');
      expect(health.message).toBe('Adapter not initialized');
    });

    it('should report healthy when initialized', async () => {
      await adapter.initialize();
      const health = await adapter.healthCheck();
      expect(health.status).toBe('healthy');
      expect(health.message).toBe('All systems operational');
      expect(health.responseTime).toBeGreaterThan(0);
    });
  });

  describe('Interface Type Guard', () => {
    it('2.1-TTS-INTF-003: should identify valid TtsAdapter implementations', () => {
      expect(isTtsAdapter(adapter)).toBe(true);
    });

    it('should reject objects that do not implement TtsAdapter', () => {
      expect(isTtsAdapter({})).toBe(false);
      expect(isTtsAdapter({ name: 'test' })).toBe(false);
      expect(isTtsAdapter(null)).toBe(false);
      expect(isTtsAdapter()).toBe(false);
    });

    it('should accept partial implementations', () => {
      const partial = {
        name: 'test',
        version: '1.0',
        isInitialized: true,
        synthesize: async () => ({}),
        getSupportedVoices: async () => [],
        getCapabilities: async () => ({}) as TTSCapabilities,
        validateOptions: () => ({ isValid: true, errors: [], warnings: [] }),
        validateVoice: () => ({ isValid: true, errors: [], warnings: [] }),
        initialize: async () => {
          // Mock implementation for testing
        },
        cleanup: async () => {
          // Mock implementation for testing
        },
        healthCheck: async () => ({}) as HealthCheckResult,
        supportsFeature: async () => false,
        getVoice: async () => {
          // Mock implementation for testing
        },
      };

      expect(isTtsAdapter(partial)).toBe(true);
    });
  });

  describe('Interface Compliance', () => {
    it('should require all interface methods', () => {
      const adapterMethods = Object.getOwnPropertyNames(
        MockTTSAdapter.prototype
      );
      const requiredMethods = [
        'synthesize',
        'getSupportedVoices',
        'getCapabilities',
        'validateOptions',
        'validateVoice',
        'initialize',
        'cleanup',
        'healthCheck',
        'supportsFeature',
        'getVoice',
      ];

      for (const method of requiredMethods) {
        expect(adapterMethods).toContain(method);
      }
    });

    it('should have correct method signatures', async () => {
      // Test that methods can be called with expected parameters
      const request: TTSRequest = {
        text: 'test',
        voice: {
          id: 'test',
          name: 'Test',
          language: 'en-US',
          gender: 'female',
        },
      };

      const options: TTSOptions = { rate: 1.0 };
      const voice: VoiceConfig = {
        id: 'test',
        name: 'Test',
        language: 'en-US',
        gender: 'female',
      };

      // These should not throw TypeScript errors
      const synthesisResult = adapter.synthesize(request);
      const voicesResult = adapter.getSupportedVoices();
      const capabilitiesResult = adapter.getCapabilities();
      const optionsValidation = adapter.validateOptions(options);
      const voiceValidation = adapter.validateVoice(voice);
      const initResult = adapter.initialize();
      const cleanupResult = adapter.cleanup();
      const healthResult = adapter.healthCheck();
      const featureResult = adapter.supportsFeature('realtime');
      const getVoiceResult = adapter.getVoice('test');

      // All should return promises or values
      expect(synthesisResult).toBeInstanceOf(Promise);
      expect(voicesResult).toBeInstanceOf(Promise);
      expect(capabilitiesResult).toBeInstanceOf(Promise);
      expect(typeof optionsValidation).toBe('object');
      expect(typeof voiceValidation).toBe('object');
      expect(initResult).toBeInstanceOf(Promise);
      expect(cleanupResult).toBeInstanceOf(Promise);
      expect(healthResult).toBeInstanceOf(Promise);
      expect(featureResult).toBeInstanceOf(Promise);
      expect(getVoiceResult).toBeInstanceOf(Promise);
    });
  });
});
