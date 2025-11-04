import { TTSError } from '../../../../../src/core/tts/adapters/errors/index.js';
import type { TtsAdapter } from '../../../../../src/core/tts/adapters/itts-adapter.js';
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
  AudioFormat,
  QualityScore,
} from '../../../../../src/core/tts/adapters/types.js';
import type { Result } from '../../../../../src/errors/result.js';

/**
 * Mock TTS Adapter for testing purposes
 * Implements the TtsAdapter interface with configurable behavior
 */
export class MockTTSAdapter implements TtsAdapter {
  public readonly name: string;
  public readonly version: string;
  public isInitialized = false;
  private _shouldFail = false;
  private _isSlow = false;
  private _isLimited = false;
  private _isHealthy = true;

  constructor(
    name: string,
    version = '1.0.0',
    options: {
      shouldFail?: boolean;
      isSlow?: boolean;
      isLimited?: boolean;
      isHealthy?: boolean;
    } = {}
  ) {
    this.name = name;
    this.version = version;
    this._shouldFail = options.shouldFail ?? false;
    this._isSlow = options.isSlow ?? false;
    this._isLimited = options.isLimited ?? false;
    this._isHealthy = options.isHealthy ?? true;
  }

  async synthesize(
    request: TTSRequest
  ): Promise<Result<TTSResponse, TTSError>> {
    if (this._shouldFail) {
      return {
        success: false,
        error: new TTSError(
          `Mock adapter ${this.name} failed to synthesize`,
          'MOCK_SYNTHESIS_ERROR',
          {
            engine: this.name,
            operation: 'synthesize',
            requestId: request.requestId,
            details: { text: request.text },
          }
        ),
      };
    }

    if (this._isSlow) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    if (this._isLimited && request.text.length > 100) {
      return {
        success: false,
        error: new TTSError(
          'Text too long for limited adapter',
          'TEXT_LIMIT_EXCEEDED',
          {
            engine: this.name,
            operation: 'synthesize',
            requestId: request.requestId,
            details: { maxLength: 100, actualLength: request.text.length },
          }
        ),
      };
    }

    const audioBuffer: AudioBuffer = {
      data: new Float32Array(request.text.length * 100), // Mock audio data
      sampleRate: 22050,
      channels: 1,
      duration: request.text.length * 0.1, // Mock duration
      format: 'PCM16' as AudioFormat,
    };

    const qualityScore: QualityScore = {
      overall: 0.8,
      naturalness: 0.75,
      clarity: 0.85,
      pronunciation: 0.9,
      prosody: 0.7,
      assessedAt: new Date(),
    };

    const response: TTSResponse = {
      success: true,
      audio: audioBuffer,
      quality: qualityScore,
      metadata: {
        synthesisTime: this._isSlow ? 1000 : 100,
        engine: this.name,
        voice: request.voice.id,
        requestId: request.requestId || 'mock-request-id',
      },
    };

    return {
      success: true,
      data: response,
    };
  }

  async getSupportedVoices(): Promise<VoiceInfo[]> {
    const voices: VoiceInfo[] = [
      {
        id: `${this.name}-en-us-male`,
        name: 'Mock US Male',
        language: 'en-US',
        gender: 'male',
        age: 'adult',
        description: `Mock male voice for ${this.name}`,
        isNeural: true,
        sampleRates: [22050, 44100],
        formats: ['PCM16', 'PCM32'],
      },
      {
        id: `${this.name}-en-us-female`,
        name: 'Mock US Female',
        language: 'en-US',
        gender: 'female',
        age: 'adult',
        description: `Mock female voice for ${this.name}`,
        isNeural: true,
        sampleRates: [22050, 44100],
        formats: ['PCM16', 'PCM32'],
      },
      {
        id: `${this.name}-en-gb-female`,
        name: 'Mock UK Female',
        language: 'en-GB',
        gender: 'female',
        age: 'young',
        description: `Mock UK female voice for ${this.name}`,
        isNeural: true,
        sampleRates: [22050],
        formats: ['PCM16'],
      },
    ];

    return voices;
  }

  async getCapabilities(): Promise<TTSCapabilities> {
    const voices = await this.getSupportedVoices();
    const features = this.buildFeatures();
    const performance = this.buildPerformance();
    const quality = this.buildQuality();
    const pricing = this.buildPricing();
    const limitations = this.buildLimitations();

    return {
      engineName: this.name,
      engineVersion: this.version,
      supportedLanguages: ['en-US', 'en-GB'],
      availableVoices: voices,
      supportedFormats: ['PCM16', 'PCM32'] as AudioFormat[],
      supportedSampleRates: [22050, 44100],
      maxTextLength: this.getMaxTextLength(),
      features,
      performance,
      quality,
      pricing,
      limitations,
    };
  }

  private getMaxTextLength(): number {
    return this._isLimited ? 100 : 5000;
  }

  private buildFeatures() {
    return {
      ssml: !this._isLimited,
      voiceCloning: false,
      realtime: !this._isSlow,
      batch: true,
      prosodyControl: !this._isLimited,
      customPronunciation: false,
    };
  }

  private buildPerformance() {
    return {
      synthesisRate: this._isSlow ? 5 : 15,
      maxConcurrentRequests: this._isLimited ? 1 : 10,
      memoryPerRequest: this._isLimited ? 10 : 50,
      initTime: 100,
      averageResponseTime: this._isSlow ? 1000 : 200,
    };
  }

  private buildQuality() {
    return {
      averageScore: this._isLimited ? 0.6 : 0.8,
    };
  }

  private buildPricing() {
    return {
      costPerRequest: this._isLimited ? 0.5 : 1.0,
    };
  }

  private buildLimitations() {
    return {
      maxDuration: this._isLimited ? 30 : 300,
      maxFileSize: this._isLimited ? 1 : 10,
      rateLimit: this._isLimited ? 1 : 100,
    };
  }

  private validateRateOption(rate: number, errors: string[]): void {
    if (rate < 0.25 || rate > 4.0) {
      errors.push('Rate must be between 0.25 and 4.0');
    }
  }

  private validatePitchOption(pitch: number, errors: string[]): void {
    if (pitch < 0.5 || pitch > 2.0) {
      errors.push('Pitch must be between 0.5 and 2.0');
    }
  }

  private validateVolumeOption(volume: number, errors: string[]): void {
    if (volume < 0.0 || volume > 1.0) {
      errors.push('Volume must be between 0.0 and 1.0');
    }
  }

  private validateFormatOption(format: string, errors: string[]): void {
    if (this._isLimited && !['PCM16'].includes(format)) {
      errors.push('Limited adapter only supports PCM16 format');
    }
  }

  private validateSampleRateOption(
    sampleRate: number,
    warnings: string[]
  ): void {
    if (![22050, 44100].includes(sampleRate)) {
      warnings.push('Unsupported sample rate, will use default');
    }
  }

  validateOptions(options: TTSOptions): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (options.rate) {
      this.validateRateOption(options.rate, errors);
    }

    if (options.pitch) {
      this.validatePitchOption(options.pitch, errors);
    }

    if (options.volume) {
      this.validateVolumeOption(options.volume, errors);
    }

    if (options.format) {
      this.validateFormatOption(options.format, errors);
    }

    if (options.sampleRate) {
      this.validateSampleRateOption(options.sampleRate, warnings);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  validateVoice(voice: VoiceConfig): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!voice.id) {
      errors.push('Voice ID is required');
    }

    if (!voice.name) {
      errors.push('Voice name is required');
    }

    if (!voice.language) {
      errors.push('Voice language is required');
    }

    if (!['male', 'female', 'neutral'].includes(voice.gender)) {
      errors.push('Voice gender must be male, female, or neutral');
    }

    if (this._isLimited && !voice.language.startsWith('en')) {
      warnings.push('Limited adapter primarily supports English voices');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  async initialize(_config?: Record<string, unknown>): Promise<void> {
    // Mock initialization
    await new Promise((resolve) => setTimeout(resolve, 10));
    this.isInitialized = true;
  }

  async cleanup(): Promise<void> {
    // Mock cleanup
    await new Promise((resolve) => setTimeout(resolve, 10));
    this.isInitialized = false;
  }

  async healthCheck(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    if (!this._isHealthy) {
      return {
        engine: this.name,
        status: 'unhealthy',
        timestamp: new Date(),
        responseTime: Date.now() - startTime,
        message: 'Mock adapter is in unhealthy state',
      };
    }

    return {
      engine: this.name,
      status: this._isSlow ? 'degraded' : 'healthy',
      timestamp: new Date(),
      responseTime: Date.now() - startTime,
      message: this._isSlow
        ? 'Adapter responding slowly'
        : 'Adapter operating normally',
    };
  }

  async supportsFeature(feature: string): Promise<boolean> {
    const capabilities = await this.getCapabilities();
    const features = capabilities.features;

    const featureMap: Record<string, boolean> = {
      ssml: features.ssml,
      voiceCloning: features.voiceCloning,
      realtime: features.realtime,
      batch: features.batch,
      prosodyControl: features.prosodyControl,
      customPronunciation: features.customPronunciation,
    };

    return featureMap[feature] ?? false;
  }

  async getVoice(query: string): Promise<VoiceInfo | undefined> {
    const voices = await this.getSupportedVoices();
    return voices.find(
      (voice) =>
        voice.id === query || voice.name === query || voice.language === query
    );
  }

  // Helper methods for test configuration
  setShouldFail(shouldFail: boolean): void {
    this._shouldFail = shouldFail;
  }

  setSlow(isSlow: boolean): void {
    this._isSlow = isSlow;
  }

  setLimited(isLimited: boolean): void {
    this._isLimited = isLimited;
  }

  setHealthy(isHealthy: boolean): void {
    this._isHealthy = isHealthy;
  }

  isHealthyAdapter(): boolean {
    return this._isHealthy;
  }
}

/**
 * Factory for creating different types of mock adapters
 */
export class MockAdapterFactory {
  static createGoogleAdapter(): MockTTSAdapter {
    return new MockTTSAdapter('google-tts', '2.1.0');
  }

  static createAzureAdapter(): MockTTSAdapter {
    return new MockTTSAdapter('azure-tts', '1.15.0');
  }

  static createAmazonAdapter(): MockTTSAdapter {
    return new MockTTSAdapter('amazon-polly', '1.0.0');
  }

  static createFailingAdapter(): MockTTSAdapter {
    return new MockTTSAdapter('failing-tts', '0.1.0', { shouldFail: true });
  }

  static createSlowAdapter(): MockTTSAdapter {
    return new MockTTSAdapter('slow-tts', '1.0.0', { isSlow: true });
  }

  static createLimitedAdapter(): MockTTSAdapter {
    return new MockTTSAdapter('limited-tts', '0.5.0', { isLimited: true });
  }

  static createUnhealthyAdapter(): MockTTSAdapter {
    return new MockTTSAdapter('unhealthy-tts', '1.0.0', { isHealthy: false });
  }

  static createCustomAdapter(
    name: string,
    version: string,
    options: {
      shouldFail?: boolean;
      isSlow?: boolean;
      isLimited?: boolean;
      isHealthy?: boolean;
    } = {}
  ): MockTTSAdapter {
    return new MockTTSAdapter(name, version, options);
  }
}
