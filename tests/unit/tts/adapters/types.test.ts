import { describe, it, expect } from 'bun:test';
import type {
  AudioBuffer,
  VoiceConfig,
  VoiceInfo,
  TTSRequest,
  TTSOptions,
  QualityScore,
  TTSCapabilities,
  ValidationResult,
  TTSResponse,
  TTSMetrics,
  HealthCheckResult,
  EngineSelectionCriteria,
  AudioFormat,
} from '../../../../src/core/tts/adapters/types.js';

// Helper function to validate quality score ranges
const validateScore = (score: number) => {
  expect(score).toBeGreaterThanOrEqual(0.0);
  expect(score).toBeLessThanOrEqual(1.0);
};

describe('TTS Adapter Types', () => {
  describe('AudioBuffer', () => {
    it('should create a valid audio buffer', () => {
      const audioBuffer: AudioBuffer = {
        data: new Float32Array([0.1, 0.2, 0.3]),
        sampleRate: 22050,
        channels: 1,
        duration: 3.0,
        format: 'PCM16',
      };

      expect(audioBuffer.data).toBeInstanceOf(Float32Array);
      expect(audioBuffer.sampleRate).toBe(22050);
      expect(audioBuffer.channels).toBe(1);
      expect(audioBuffer.duration).toBe(3.0);
      expect(audioBuffer.format).toBe('PCM16');
    });
  });

  describe('VoiceConfig', () => {
    it('should create a valid voice configuration', () => {
      const voiceConfig: VoiceConfig = {
        id: 'en-US-Jenny',
        name: 'Jenny',
        language: 'en-US',
        gender: 'female',
        age: 'adult',
        accent: 'neutral',
      };

      expect(voiceConfig.id).toBe('en-US-Jenny');
      expect(voiceConfig.name).toBe('Jenny');
      expect(voiceConfig.language).toBe('en-US');
      expect(voiceConfig.gender).toBe('female');
      expect(voiceConfig.age).toBe('adult');
      expect(voiceConfig.accent).toBe('neutral');
    });
  });

  describe('VoiceInfo', () => {
    it('should create valid voice information', () => {
      const voiceInfo: VoiceInfo = {
        id: 'en-US-Jenny',
        name: 'Jenny',
        language: 'en-US',
        gender: 'female',
        age: 'adult',
        description: 'Natural female voice',
        isNeural: true,
        sampleRates: [22050, 44100],
        formats: ['PCM16', 'PCM32'],
      };

      expect(voiceInfo.id).toBe('en-US-Jenny');
      expect(voiceInfo.name).toBe('Jenny');
      expect(voiceInfo.language).toBe('en-US');
      expect(voiceInfo.gender).toBe('female');
      expect(voiceInfo.age).toBe('adult');
      expect(voiceInfo.description).toBe('Natural female voice');
      expect(voiceInfo.isNeural).toBe(true);
      expect(voiceInfo.sampleRates).toEqual([22050, 44100]);
      expect(voiceInfo.formats).toEqual(['PCM16', 'PCM32']);
    });
  });

  describe('TTSRequest', () => {
    it('should create a valid TTS request', () => {
      const voiceConfig: VoiceConfig = {
        id: 'en-US-Jenny',
        name: 'Jenny',
        language: 'en-US',
        gender: 'female',
      };

      const options: TTSOptions = {
        rate: 1.0,
        pitch: 1.0,
        volume: 1.0,
        sampleRate: 22050,
        format: 'PCM16',
      };

      const request: TTSRequest = {
        text: 'Hello, world!',
        voice: voiceConfig,
        options: options,
        requestId: 'req-123',
      };

      expect(request.text).toBe('Hello, world!');
      expect(request.voice.id).toBe('en-US-Jenny');
      expect(request.options?.rate).toBe(1.0);
      expect(request.requestId).toBe('req-123');
    });

    it('should create request without optional fields', () => {
      const request: TTSRequest = {
        text: 'Hello, world!',
        voice: {
          id: 'en-US-Jenny',
          name: 'Jenny',
          language: 'en-US',
          gender: 'female',
        },
      };

      expect(request.text).toBe('Hello, world!');
      expect(request.voice.id).toBe('en-US-Jenny');
      expect(request.voice.name).toBe('Jenny');
      expect(request.voice.language).toBe('en-US');
      expect(request.voice.gender).toBe('female');
      expect(request.options).toBeUndefined();
      expect(request.requestId).toBeUndefined();
    });
  });

  describe('TTSOptions', () => {
    it('should create valid TTS options', () => {
      const options: TTSOptions = {
        rate: 1.2,
        pitch: 0.9,
        volume: 0.8,
        sampleRate: 44100,
        format: 'PCM32',
        maxDuration: 300,
        enableProsody: true,
        engineOptions: {
          customParam: 'value',
        },
      };

      expect(options.rate).toBe(1.2);
      expect(options.pitch).toBe(0.9);
      expect(options.volume).toBe(0.8);
      expect(options.sampleRate).toBe(44100);
      expect(options.format).toBe('PCM32');
      expect(options.maxDuration).toBe(300);
      expect(options.enableProsody).toBe(true);
      expect(options.engineOptions?.customParam).toBe('value');
    });
  });

  describe('QualityScore', () => {
    it('should create valid quality score', () => {
      const qualityScore: QualityScore = {
        overall: 0.85,
        naturalness: 0.9,
        clarity: 0.88,
        pronunciation: 0.92,
        prosody: 0.8,
        assessedAt: new Date('2025-11-03T10:00:00Z'),
      };

      expect(qualityScore.overall).toBe(0.85);
      expect(qualityScore.naturalness).toBe(0.9);
      expect(qualityScore.clarity).toBe(0.88);
      expect(qualityScore.pronunciation).toBe(0.92);
      expect(qualityScore.prosody).toBe(0.8);
      expect(qualityScore.assessedAt).toBeInstanceOf(Date);
    });

    it('should validate quality score ranges', () => {
      const qualityScore: QualityScore = {
        overall: 0.75,
        naturalness: 0.8,
        clarity: 0.85,
        pronunciation: 0.9,
        prosody: 0.7,
        assessedAt: new Date(),
      };

      validateScore(qualityScore.overall);
      validateScore(qualityScore.naturalness);
      validateScore(qualityScore.clarity);
      validateScore(qualityScore.pronunciation);
      validateScore(qualityScore.prosody);
      expect(qualityScore.assessedAt).toBeInstanceOf(Date);
    });
  });

  describe('TTSCapabilities', () => {
    it('should create valid TTS capabilities', () => {
      const capabilities: TTSCapabilities = {
        engineName: 'TestEngine',
        engineVersion: '1.0.0',
        supportedLanguages: ['en-US', 'en-GB', 'es-ES'],
        availableVoices: [],
        supportedFormats: ['PCM16', 'PCM32'],
        supportedSampleRates: [22050, 44100],
        maxTextLength: 5000,
        features: {
          ssml: true,
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
          initTime: 2000,
          averageResponseTime: 150,
        },
        quality: {
          averageScore: 0.85,
        },
        pricing: {
          costPerRequest: 0.01,
        },
        limitations: {
          maxDuration: 600,
          maxFileSize: 50 * 1024 * 1024, // 50MB
          rateLimit: 10,
        },
      };

      expect(capabilities.engineName).toBe('TestEngine');
      expect(capabilities.engineVersion).toBe('1.0.0');
      expect(capabilities.supportedLanguages).toContain('en-US');
      expect(capabilities.availableVoices).toEqual([]);
      expect(capabilities.supportedFormats).toEqual(['PCM16', 'PCM32']);
      expect(capabilities.supportedSampleRates).toEqual([22050, 44100]);
      expect(capabilities.maxTextLength).toBe(5000);
      expect(capabilities.features.ssml).toBe(true);
      expect(capabilities.features.voiceCloning).toBe(false);
      expect(capabilities.features.realtime).toBe(true);
      expect(capabilities.features.batch).toBe(true);
      expect(capabilities.features.prosodyControl).toBe(true);
      expect(capabilities.features.customPronunciation).toBe(false);
      expect(capabilities.performance.synthesisRate).toBe(15.0);
      expect(capabilities.performance.maxConcurrentRequests).toBe(5);
      expect(capabilities.performance.memoryPerRequest).toBe(128);
      expect(capabilities.performance.initTime).toBe(2000);
      expect(capabilities.performance.averageResponseTime).toBe(150);
      expect(capabilities.quality.averageScore).toBe(0.85);
      expect(capabilities.pricing.costPerRequest).toBe(0.01);
      expect(capabilities.limitations.maxDuration).toBe(600);
      expect(capabilities.limitations.maxFileSize).toBe(50 * 1024 * 1024);
      expect(capabilities.limitations.rateLimit).toBe(10);
    });
  });

  describe('ValidationResult', () => {
    it('should create valid validation result', () => {
      const validationResult: ValidationResult = {
        isValid: true,
        errors: [],
        warnings: [],
      };

      expect(validationResult.isValid).toBe(true);
      expect(validationResult.errors).toEqual([]);
      expect(validationResult.warnings).toEqual([]);
    });

    it('should create invalid validation result with errors and warnings', () => {
      const validationResult: ValidationResult = {
        isValid: false,
        errors: ['Invalid rate value', 'Unsupported format'],
        warnings: ['Voice quality may be degraded'],
      };

      expect(validationResult.isValid).toBe(false);
      expect(validationResult.errors).toHaveLength(2);
      expect(validationResult.warnings).toHaveLength(1);
      expect(validationResult.errors[0]).toBe('Invalid rate value');
    });
  });

  describe('TTSResponse', () => {
    it('should create successful TTS response', () => {
      const audioBuffer: AudioBuffer = {
        data: new Float32Array([0.1, 0.2, 0.3]),
        sampleRate: 22050,
        channels: 1,
        duration: 3.0,
        format: 'PCM16',
      };

      const qualityScore: QualityScore = {
        overall: 0.85,
        naturalness: 0.9,
        clarity: 0.88,
        pronunciation: 0.92,
        prosody: 0.8,
        assessedAt: new Date(),
      };

      const response: TTSResponse = {
        success: true,
        audio: audioBuffer,
        quality: qualityScore,
        metadata: {
          synthesisTime: 1500,
          engine: 'TestEngine',
          voice: 'en-US-Jenny',
          requestId: 'req-123',
        },
      };

      expect(response.success).toBe(true);
      expect(response.audio?.data).toBeInstanceOf(Float32Array);
      expect(response.quality?.overall).toBe(0.85);
      expect(response.metadata?.synthesisTime).toBe(1500);
      expect(response.metadata?.engine).toBe('TestEngine');
      expect(response.metadata?.voice).toBe('en-US-Jenny');
      expect(response.metadata?.requestId).toBe('req-123');
      expect(response.error).toBeUndefined();
    });

    it('should create failed TTS response', () => {
      const response: TTSResponse = {
        success: false,
        error: {
          name: 'TTSError',
          message: 'Synthesis failed',
          code: 'TTS_SYNTHESIS_ERROR',
          category: 'tts',
          recoverable: true,
        } as any,
      };

      expect(response.success).toBe(false);
      expect(response.audio).toBeUndefined();
      expect(response.quality).toBeUndefined();
      expect(response.error?.message).toBe('Synthesis failed');
    });
  });

  describe('TTSMetrics', () => {
    it('should create valid TTS metrics', () => {
      const metrics: TTSMetrics = {
        requestId: 'req-123',
        engine: 'TestEngine',
        timestamp: new Date(),
        textLength: 100,
        synthesisTime: 2000,
        audioDuration: 10.0,
        realTimeFactor: 0.2,
        quality: {
          overall: 0.85,
          naturalness: 0.9,
          clarity: 0.88,
          pronunciation: 0.92,
          prosody: 0.8,
          assessedAt: new Date(),
        },
        memoryUsage: 64,
        success: true,
      };

      expect(metrics.requestId).toBe('req-123');
      expect(metrics.engine).toBe('TestEngine');
      expect(metrics.timestamp).toBeInstanceOf(Date);
      expect(metrics.textLength).toBe(100);
      expect(metrics.synthesisTime).toBe(2000);
      expect(metrics.audioDuration).toBe(10.0);
      expect(metrics.realTimeFactor).toBe(0.2);
      expect(metrics.memoryUsage).toBe(64);
      expect(metrics.success).toBe(true);
      expect(metrics.quality?.overall).toBe(0.85);
      expect(metrics.quality?.naturalness).toBe(0.9);
      expect(metrics.quality?.clarity).toBe(0.88);
      expect(metrics.quality?.pronunciation).toBe(0.92);
      expect(metrics.quality?.prosody).toBe(0.8);
      expect(metrics.quality?.assessedAt).toBeInstanceOf(Date);
    });
  });

  describe('HealthCheckResult', () => {
    it('should create healthy status', () => {
      const healthResult: HealthCheckResult = {
        engine: 'TestEngine',
        status: 'healthy',
        timestamp: new Date(),
        responseTime: 150,
        message: 'All systems operational',
        metrics: {
          uptime: 3600,
          activeRequests: 2,
        },
      };

      expect(healthResult.engine).toBe('TestEngine');
      expect(healthResult.status).toBe('healthy');
      expect(healthResult.timestamp).toBeInstanceOf(Date);
      expect(healthResult.responseTime).toBe(150);
      expect(healthResult.message).toBe('All systems operational');
      expect(healthResult.metrics?.uptime).toBe(3600);
      expect(healthResult.metrics?.activeRequests).toBe(2);
    });
  });

  describe('EngineSelectionCriteria', () => {
    it('should create valid selection criteria', () => {
      const criteria: EngineSelectionCriteria = {
        preferredEngine: 'TestEngine',
        language: 'en-US',
        requiredFeatures: ['ssml', 'realtime'],
        performanceRequirements: {
          minSynthesisRate: 10.0,
          maxInitTime: 3000,
          maxMemoryUsage: 256,
        },
        qualityRequirements: {
          minOverallQuality: 0.8,
          minNaturalness: 0.85,
        },
      };

      expect(criteria.preferredEngine).toBe('TestEngine');
      expect(criteria.language).toBe('en-US');
      expect(criteria.requiredFeatures).toContain('ssml');
      expect(criteria.requiredFeatures).toContain('realtime');
      expect(criteria.performanceRequirements?.minSynthesisRate).toBe(10.0);
      expect(criteria.performanceRequirements?.maxInitTime).toBe(3000);
      expect(criteria.performanceRequirements?.maxMemoryUsage).toBe(256);
      expect(criteria.qualityRequirements?.minOverallQuality).toBe(0.8);
      expect(criteria.qualityRequirements?.minNaturalness).toBe(0.85);
    });
  });

  describe('AudioFormat', () => {
    it('should accept valid audio formats', () => {
      const validFormats: AudioFormat[] = ['PCM16', 'PCM32', 'F32'];

      for (const format of validFormats) {
        expect(['PCM16', 'PCM32', 'F32']).toContain(format);
      }
    });
  });
});
