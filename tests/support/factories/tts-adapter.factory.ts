import { faker } from '@faker-js/faker';
import {
  TTSError,
  TTSSynthesisError,
  TTSConfigurationError,
  TTSCapabilityError,
} from '../../../src/core/tts/adapters/errors/index.js';
import type {
  TTSRequest,
  VoiceConfig,
  VoiceInfo,
  TTSOptions,
  TTSCapabilities,
  QualityScore,
} from '../../../src/core/tts/adapters/types.js';

/**
 * Factory for creating TTS Request objects with realistic data
 */
export const createTTSRequest = (
  overrides: Partial<TTSRequest> = {}
): TTSRequest => ({
  text: faker.lorem.paragraphs(3),
  voice: createVoiceConfig(),
  options: createTTSOptions(),
  requestId: `req-${faker.string.uuid()}`,
  ...overrides,
});

/**
 * Factory for creating TTS Options with realistic values
 */
export const createTTSOptions = (
  overrides: Partial<TTSOptions> = {}
): TTSOptions => ({
  format: faker.helpers.arrayElement(['PCM16', 'PCM32', 'F32']),
  rate: Math.round(faker.number.float({ min: 0.5, max: 2.0 }) * 10) / 10,
  pitch: Math.round(faker.number.float({ min: 0.5, max: 1.5 }) * 10) / 10,
  volume: Math.round(faker.number.float({ min: 0.1, max: 1.0 }) * 10) / 10,
  sampleRate: faker.helpers.arrayElement([16000, 22050, 44100, 48000]),
  maxDuration: faker.number.int({ min: 60, max: 600 }),
  enableProsody: faker.datatype.boolean(),
  engineOptions: {
    customParam: faker.lorem.word(),
  },
  ...overrides,
});

/**
 * Factory for creating Voice Config objects with comprehensive data
 */
export const createVoiceConfig = (
  overrides: Partial<VoiceConfig> = {}
): VoiceConfig => ({
  id: `voice-${faker.string.alphanumeric(8)}`,
  name: `${faker.helpers.arrayElement(['Premium', 'Standard', 'Neural', 'WaveNet'])} ${faker.helpers.arrayElement(['American', 'British', 'Australian'])} ${faker.helpers.arrayElement(['Male', 'Female', 'Neutral'])} Voice`,
  language: faker.helpers.arrayElement([
    'en-US',
    'en-GB',
    'es-ES',
    'fr-FR',
    'de-DE',
    'it-IT',
    'pt-BR',
    'ja-JP',
  ]),
  gender: faker.helpers.arrayElement(['male', 'female', 'neutral']),
  age: faker.helpers.arrayElement(['child', 'young', 'adult', 'elderly']),
  accent: faker.helpers.arrayElement([
    'neutral',
    'regional',
    'international',
    'native',
  ]),
  metadata: {
    description: `${faker.helpers.arrayElement(['Professional', 'Natural', 'Clear', 'Warm', 'Energetic'])} voice suitable for ${faker.helpers.arrayElement(['narration', 'assistant', 'audiobook', 'presentation'])}`,
    sampleRate: faker.helpers.arrayElement([16000, 22050, 24000, 44100, 48000]),
    ...overrides.metadata,
  },
  ...overrides,
});

/**
 * Factory for creating Voice Info objects with comprehensive data
 */
export const createVoiceInfo = (
  overrides: Partial<VoiceInfo> = {}
): VoiceInfo => {
  const voiceConfig = createVoiceConfig(overrides);
  return {
    ...voiceConfig,
    description: `${faker.helpers.arrayElement(['Professional', 'Natural', 'Clear', 'Warm', 'Energetic'])} voice suitable for ${faker.helpers.arrayElement(['narration', 'assistant', 'audiobook', 'presentation'])}`,
    isNeural: faker.datatype.boolean(),
    sampleRates: faker.helpers.arrayElements(
      [16000, 22050, 24000, 44100, 48000],
      { min: 2, max: 4 }
    ),
    formats: faker.helpers.arrayElements(['PCM16', 'PCM32', 'F32'], {
      min: 1,
      max: 3,
    }),
    ...overrides,
  };
};

/**
 * Factory for creating TTS Capabilities objects
 */
export const createTTSCapabilities = (
  overrides: Partial<TTSCapabilities> = {}
): TTSCapabilities => ({
  engineName: `${faker.helpers.arrayElement(['Google', 'Azure', 'Amazon', 'IBM'])} TTS Engine`,
  engineVersion: `${faker.number.int({ min: 1, max: 5 })}.${faker.number.int({ min: 0, max: 9 })}.${faker.number.int({ min: 0, max: 9 })}`,
  supportedLanguages: faker.helpers.arrayElements(
    [
      'en-US',
      'en-GB',
      'es-ES',
      'fr-FR',
      'de-DE',
      'it-IT',
      'pt-BR',
      'ja-JP',
      'ko-KR',
      'zh-CN',
    ],
    { min: 3, max: 8 }
  ),
  availableVoices: Array.from(
    { length: faker.number.int({ min: 5, max: 20 }) },
    () => createVoiceInfo()
  ),
  supportedFormats: faker.helpers.arrayElements(['PCM16', 'PCM32', 'F32'], {
    min: 2,
    max: 3,
  }),
  supportedSampleRates: faker.helpers.arrayElements(
    [16000, 22050, 44100, 48000],
    { min: 2, max: 4 }
  ),
  maxTextLength: faker.number.int({ min: 1000, max: 20000 }),
  features: {
    ssml: faker.datatype.boolean(),
    voiceCloning: faker.datatype.boolean(),
    realtime: faker.datatype.boolean(),
    batch: faker.datatype.boolean(),
    prosodyControl: faker.datatype.boolean(),
    customPronunciation: faker.datatype.boolean(),
  },
  performance: {
    synthesisRate:
      Math.round(faker.number.float({ min: 10, max: 50 }) * 10) / 10,
    maxConcurrentRequests: faker.number.int({ min: 5, max: 100 }),
    memoryPerRequest: faker.number.int({ min: 64, max: 512 }),
    initTime: faker.number.int({ min: 1000, max: 10000 }),
    averageResponseTime: faker.number.int({ min: 100, max: 2000 }),
  },
  quality: {
    averageScore:
      Math.round(faker.number.float({ min: 0.7, max: 0.95 }) * 100) / 100,
  },
  pricing: {
    costPerRequest:
      Math.round(faker.number.float({ min: 0.001, max: 0.1 }) * 1000) / 1000,
  },
  limitations: {
    maxDuration: faker.number.int({ min: 300, max: 3600 }),
    maxFileSize: faker.number.int({ min: 1024 * 1024, max: 100 * 1024 * 1024 }),
    rateLimit: faker.number.int({ min: 5, max: 100 }),
  },
  ...overrides,
});

/**
 * Factory for creating Quality Score objects
 */
export const createQualityScore = (
  overrides: Partial<QualityScore> = {}
): QualityScore => ({
  overall: Math.round(faker.number.float({ min: 0.6, max: 0.98 }) * 100) / 100,
  naturalness:
    Math.round(faker.number.float({ min: 0.5, max: 0.95 }) * 100) / 100,
  clarity: Math.round(faker.number.float({ min: 0.7, max: 0.99 }) * 100) / 100,
  pronunciation:
    Math.round(faker.number.float({ min: 0.7, max: 0.98 }) * 100) / 100,
  prosody: Math.round(faker.number.float({ min: 0.6, max: 0.95 }) * 100) / 100,
  assessedAt: faker.date.recent(),
  ...overrides,
});

/**
 * Factory for creating TTSError objects
 */
export const createTTSError = (
  overrides: Partial<{
    message?: string;
    code?: string;
    engine?: string;
    requestId?: string;
  }> = {}
): TTSError => {
  const message =
    overrides.message ||
    faker.helpers.arrayElement([
      'TTS service unavailable',
      'Invalid voice configuration',
      'Synthesis request timeout',
      'Rate limit exceeded',
      'Authentication failed',
    ]);

  const code =
    overrides.code ||
    faker.helpers.arrayElement([
      'TTS_SERVICE_ERROR',
      'INVALID_VOICE_CONFIG',
      'SYNTHESIS_TIMEOUT',
      'RATE_LIMIT_EXCEEDED',
      'AUTH_FAILED',
    ]);

  const engine =
    overrides.engine ||
    faker.helpers.arrayElement(['Google', 'Azure', 'Amazon', 'IBM']);
  const requestId = overrides.requestId || `req-${faker.string.uuid()}`;

  return new TTSError(message, code, {
    engine,
    requestId,
    context: {
      voiceId: `voice-${faker.string.alphanumeric(8)}`,
      textLength: faker.number.int({ min: 50, max: 5000 }),
      format: faker.helpers.arrayElement(['PCM16', 'PCM32', 'F32']),
      retryCount: faker.number.int({ min: 0, max: 3 }),
      lastSuccessfulAttempt: faker.date.recent().toISOString(),
    },
  });
};

/**
 * Factory for creating TTSSynthesisError objects
 */
export const createTTSSynthesisError = (
  overrides: Partial<{
    message?: string;
    engine?: string;
    requestId?: string;
    text?: string;
    voice?: string;
  }> = {}
): TTSSynthesisError => {
  const message =
    overrides.message ||
    faker.helpers.arrayElement([
      'Audio synthesis failed',
      'Voice processing error',
      'Text processing error',
      'Audio generation error',
    ]);

  const engine =
    overrides.engine ||
    faker.helpers.arrayElement(['Google', 'Azure', 'Amazon', 'IBM']);
  const requestId = overrides.requestId || `req-${faker.string.uuid()}`;
  const text = overrides.text || faker.lorem.paragraph();
  const voice = overrides.voice || `voice-${faker.string.alphanumeric(8)}`;

  return new TTSSynthesisError(message, engine, requestId, {
    text,
    voice,
    synthesisDetails: {
      stage: faker.helpers.arrayElement([
        'validation',
        'processing',
        'audio-generation',
        'post-processing',
      ]),
      partialResult: faker.datatype.boolean(),
      processedCharacters: faker.number.int({ min: 0, max: text.length }),
      totalCharacters: text.length,
      partialAudioAvailable: faker.datatype.boolean(),
      qualityScore:
        Math.round(faker.number.float({ min: 0.5, max: 0.9 }) * 100) / 100,
      engineVersion: `${faker.number.int({ min: 1, max: 5 })}.${faker.number.int({ min: 0, max: 9 })}.${faker.number.int({ min: 0, max: 9 })}`,
    },
    recoverySuggestions: faker.helpers.arrayElements(
      [
        'Try reducing text length',
        'Use a different voice',
        'Check internet connection',
        'Try different audio format',
        'Wait and retry later',
      ],
      { min: 1, max: 3 }
    ),
  });
};

/**
 * Factory for creating TTSConfigurationError objects
 */
export const createTTSConfigurationError = (
  overrides: Partial<{
    message?: string;
    engine?: string;
    property?: string;
  }> = {}
): TTSConfigurationError => {
  const message =
    overrides.message ||
    faker.helpers.arrayElement([
      'Invalid configuration',
      'Missing required field',
      'Configuration validation failed',
      'Environment configuration error',
    ]);

  const engine =
    overrides.engine ||
    faker.helpers.arrayElement(['Google', 'Azure', 'Amazon', 'IBM']);
  const property =
    overrides.property ||
    faker.helpers.arrayElement(['apiKey', 'endpoint', 'timeout', 'region']);

  return new TTSConfigurationError(message, { engine, property });
};

/**
 * Factory for creating TTSCapabilityError objects
 */
export const createTTSCapabilityError = (
  overrides: Partial<{
    message?: string;
    engine?: string;
    capability?: string;
  }> = {}
): TTSCapabilityError => {
  const message =
    overrides.message ||
    faker.helpers.arrayElement([
      'Capability not supported',
      'Format not supported',
      'Feature not available',
      'Upgrade required',
    ]);

  const engine =
    overrides.engine ||
    faker.helpers.arrayElement(['Google', 'Azure', 'Amazon', 'IBM']);
  const capability =
    overrides.capability ||
    faker.helpers.arrayElement([
      'SSML-emotion-tagging',
      'audio-format-flac',
      'neural-voice-synthesis',
      'real-time-streaming',
      'custom-voice-training',
    ]);

  return new TTSCapabilityError(message, engine, {
    capability,
    alternatives: faker.helpers.arrayElements(
      [
        'text-to-speech',
        'basic-SSML',
        'prosody-control',
        'voice-cloning-basic',
      ],
      { min: 1, max: 3 }
    ),
    upgradeInfo: {
      recommendedAdapter: faker.helpers.arrayElement([
        'advanced-adapter-v2',
        'enterprise-adapter',
        'neural-adapter-pro',
      ]),
      benefits: faker.helpers.arrayElements(
        [
          'SSML support',
          'Higher quality voices',
          'More format options',
          'Better performance',
          'Advanced features',
        ],
        { min: 2, max: 4 }
      ),
      cost: faker.helpers.arrayElement(['free', 'paid', 'freemium']),
      effort: faker.helpers.arrayElement(['low', 'medium', 'high']),
    },
  });
};

/**
 * Specialized factories for common test scenarios
 */

export const createLongTextRequest = (length = 15000): TTSRequest =>
  createTTSRequest({
    text: 'a'.repeat(length),
  });

export const createHighQualityRequest = (): TTSRequest =>
  createTTSRequest({
    options: createTTSOptions({
      format: 'PCM32',
      sampleRate: 48000,
      enableProsody: true,
    }),
  });

export const createMultiLanguageRequest = (language: string): TTSRequest =>
  createTTSRequest({
    voice: createVoiceConfig({
      language,
      id: `voice-${language}-${faker.helpers.arrayElement(['male', 'female'])}`,
    }),
  });

export const createSSMLRequest = (): TTSRequest =>
  createTTSRequest({
    text: `<speak>
      <p>
        <s>This is a test of <emphasis level="strong">SSML support</emphasis>.</s>
        <s>Testing <prosody rate="slow">slow speech</prosody> and <prosody rate="fast">fast speech</prosody>.</s>
        <s>Testing different <break time="500ms"/>pauses and intonation.</s>
      </p>
    </speak>`,
    options: createTTSOptions({
      format: 'PCM16',
    }),
  });

/**
 * Batch creation functions for performance testing
 */

export const createMultipleTTSRequests = (count: number): TTSRequest[] =>
  Array.from({ length: count }, () => createTTSRequest());

export const createVoiceConfigSet = (
  count: number,
  languages?: string[]
): VoiceConfig[] =>
  Array.from({ length: count }, (_, index) =>
    createVoiceConfig({
      id: `voice-${index + 1}`,
      language: languages ? languages[index % languages.length] : undefined,
    })
  );

/**
 * Helper functions for specific adapter testing scenarios
 */

export const createGoogleAdapterRequest = (): TTSRequest =>
  createTTSRequest({
    voice: createVoiceConfig({
      id: `google-${faker.helpers.arrayElement(['en-US', 'es-ES', 'fr-FR'])}-${faker.helpers.arrayElement(['Wavenet', 'Neural2', 'Standard'])}-${faker.helpers.arrayElement(['A', 'B', 'C', 'D'])}`,
      name: `Google ${faker.helpers.arrayElement(['Wavenet', 'Neural2', 'Standard'])} ${faker.helpers.arrayElement(['A', 'B', 'C', 'D'])}`,
    }),
  });

export const createAzureAdapterRequest = (): TTSRequest =>
  createTTSRequest({
    voice: createVoiceConfig({
      id: `azure-${faker.helpers.arrayElement(['en-US', 'es-ES', 'fr-FR'])}-${faker.helpers.arrayElement(['Neural', 'Standard'])}-${faker.helpers.arrayElement(['Aria', 'Jenny', 'Guy', 'Davis'])}`,
      name: `Azure ${faker.helpers.arrayElement(['Neural', 'Standard'])} ${faker.helpers.arrayElement(['Aria', 'Jenny', 'Guy', 'Davis'])}`,
    }),
  });

export const createAmazonAdapterRequest = (): TTSRequest =>
  createTTSRequest({
    voice: createVoiceConfig({
      id: `amazon-${faker.helpers.arrayElement(['en-US', 'es-ES', 'fr-FR'])}-${faker.helpers.arrayElement(['Joanna', 'Matthew', 'Lupe', 'Celine'])}`,
      name: `Amazon ${faker.helpers.arrayElement(['Joanna', 'Matthew', 'Lupe', 'Celine'])}`,
    }),
  });
