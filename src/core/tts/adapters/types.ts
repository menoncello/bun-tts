import type { TTSError } from './errors/tts-error.js';

/**
 * Audio buffer containing synthesized speech data
 */
export interface AudioBuffer {
  /** Raw PCM audio data */
  data: Float32Array;
  /** Sample rate in Hz */
  sampleRate: number;
  /** Number of audio channels */
  channels: number;
  /** Duration in seconds */
  duration: number;
  /** Audio format (PCM16, PCM32, etc.) */
  format: AudioFormat;
}

/**
 * Supported audio formats
 */
export type AudioFormat = 'PCM16' | 'PCM32' | 'F32';

/**
 * Voice configuration for TTS synthesis
 */
export interface VoiceConfig {
  /** Unique voice identifier */
  id: string;
  /** Voice name for display */
  name: string;
  /** Language code (e.g., 'en-US', 'en-GB') */
  language: string;
  /** Voice gender */
  gender: 'male' | 'female' | 'neutral';
  /** Voice age category */
  age?: 'child' | 'young' | 'adult' | 'elderly';
  /** Voice accent or regional variant */
  accent?: string;
  /** Engine-specific voice metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Information about available voices
 */
export interface VoiceInfo extends VoiceConfig {
  /** Voice description */
  description?: string;
  /** Whether voice is neural/conversional */
  isNeural?: boolean;
  /** Supported sample rates */
  sampleRates: number[];
  /** Supported audio formats */
  formats: AudioFormat[];
}

/**
 * TTS synthesis request
 */
export interface TTSRequest {
  /** Text to synthesize */
  text: string;
  /** Voice configuration */
  voice: VoiceConfig;
  /** Synthesis options */
  options?: TTSOptions;
  /** Request identifier for tracking */
  requestId?: string;
}

/**
 * TTS synthesis options
 */
export interface TTSOptions {
  /** Speech rate multiplier (1.0 = normal) */
  rate?: number;
  /** Voice pitch multiplier (1.0 = normal) */
  pitch?: number;
  /** Volume multiplier (1.0 = normal) */
  volume?: number;
  /** Target sample rate */
  sampleRate?: number;
  /** Target audio format */
  format?: AudioFormat;
  /** Maximum synthesis duration in seconds */
  maxDuration?: number;
  /** Enable/disable prosody control */
  enableProsody?: boolean;
  /** Engine-specific options */
  engineOptions?: Record<string, unknown>;
}

/**
 * Quality metrics for synthesized audio
 */
export interface QualityScore {
  /** Overall quality score (0.0 to 1.0) */
  overall: number;
  /** Naturalness score (0.0 to 1.0) */
  naturalness: number;
  /** Clarity score (0.0 to 1.0) */
  clarity: number;
  /** Pronunciation accuracy (0.0 to 1.0) */
  pronunciation: number;
  /** Prosody quality (0.0 to 1.0) */
  prosody: number;
  /** Quality assessment timestamp */
  assessedAt: Date;
}

/**
 * TTS engine capabilities
 */
export interface TTSCapabilities {
  /** Engine name and version */
  engineName: string;
  engineVersion: string;
  /** Supported languages */
  supportedLanguages: string[];
  /** Available voices */
  availableVoices: VoiceInfo[];
  /** Supported audio formats */
  supportedFormats: AudioFormat[];
  /** Supported sample rates */
  supportedSampleRates: number[];
  /** Maximum text length per request */
  maxTextLength: number;
  /** Supported features */
  features: {
    /** SSML support */
    ssml: boolean;
    /** Voice cloning support */
    voiceCloning: boolean;
    /** Real-time synthesis */
    realtime: boolean;
    /** Batch synthesis */
    batch: boolean;
    /** Prosody control */
    prosodyControl: boolean;
    /** Custom pronunciation */
    customPronunciation: boolean;
  };
  /** Performance characteristics */
  performance: {
    /** Words per second synthesis rate */
    synthesisRate: number;
    /** Maximum concurrent requests */
    maxConcurrentRequests: number;
    /** Memory usage per request in MB */
    memoryPerRequest: number;
    /** Initialization time in milliseconds */
    initTime: number;
    /** Average response time in milliseconds */
    averageResponseTime: number;
  };
  /** Quality characteristics */
  quality: {
    /** Overall quality score (0.0 to 1.0) */
    averageScore: number;
  };
  /** Pricing characteristics */
  pricing: {
    /** Cost per request in credits or currency units */
    costPerRequest: number;
  };
  /** Engine-specific limitations */
  limitations: {
    /** Maximum audio duration per request */
    maxDuration: number;
    /** Maximum file size for output */
    maxFileSize: number;
    /** Rate limiting requests per second */
    rateLimit: number;
  };
}

/**
 * Validation result
 */
export interface ValidationResult {
  /** Whether validation passed */
  isValid: boolean;
  /** Validation errors, if any */
  errors: string[];
  /** Validation warnings, if any */
  warnings: string[];
}

/**
 * TTSError type reference
 */
export type { TTSError } from './errors/tts-error.js';

/**
 * TTS synthesis response
 */
export interface TTSResponse {
  /** Whether synthesis was successful */
  success: boolean;
  /** Synthesized audio data */
  audio?: AudioBuffer;
  /** Quality metrics */
  quality?: QualityScore;
  /** Synthesis metadata */
  metadata?: {
    /** Time taken for synthesis in milliseconds */
    synthesisTime: number;
    /** Engine used */
    engine: string;
    /** Voice used */
    voice: string;
    /** Request identifier */
    requestId: string;
    /** Additional metadata */
    [key: string]: unknown;
  };
  /** Error information, if synthesis failed */
  error?: TTSError;
}

/**
 * TTS performance metrics
 */
export interface TTSMetrics {
  /** Request identifier */
  requestId: string;
  /** Engine name */
  engine: string;
  /** Timestamp */
  timestamp: Date;
  /** Text length */
  textLength: number;
  /** Synthesis time in milliseconds */
  synthesisTime: number;
  /** Audio duration in seconds */
  audioDuration: number;
  /** Real-time factor (synthesis time / audio duration) */
  realTimeFactor: number;
  /** Quality score */
  quality?: QualityScore;
  /** Memory usage in MB */
  memoryUsage: number;
  /** Success status */
  success: boolean;
  /** Error information, if any */
  error?: string;
}

/**
 * Health check result for TTS engines
 */
export interface HealthCheckResult {
  /** Engine name */
  engine: string;
  /** Health status */
  status: 'healthy' | 'degraded' | 'unhealthy';
  /** Check timestamp */
  timestamp: Date;
  /** Response time in milliseconds */
  responseTime: number;
  /** Health status message */
  message?: string;
  /** Additional health metrics */
  metrics?: Record<string, unknown>;
}

/**
 * Engine selection criteria
 */
export interface EngineSelectionCriteria {
  /** Preferred engine name */
  preferredEngine?: string;
  /** Required language */
  language?: string;
  /** Required features */
  requiredFeatures?: Array<keyof TTSCapabilities['features']>;
  /** Performance requirements */
  performanceRequirements?: {
    /** Minimum synthesis rate (words/sec) */
    minSynthesisRate?: number;
    /** Maximum initialization time (ms) */
    maxInitTime?: number;
    /** Maximum memory usage (MB) */
    maxMemoryUsage?: number;
  };
  /** Quality requirements */
  qualityRequirements?: {
    /** Minimum quality score */
    minOverallQuality?: number;
    /** Minimum naturalness score */
    minNaturalness?: number;
  };
}
