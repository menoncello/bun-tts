/**
 * Individual engine configuration options
 */
export interface EngineOptions {
  /**
   * Speech rate
   */
  rate?: number;
  /**
   * Voice pitch
   */
  pitch?: number;
  /**
   * Volume level
   */
  volume?: number;
  /**
   * Voice selection
   */
  voice?: string;
  /**
   * Custom engine-specific options
   */
  [key: string]: unknown;
}

/**
 * Individual engine configuration
 */
export interface EngineConfig {
  /**
   * Whether the engine is enabled
   */
  enabled: boolean;
  /**
   * Engine-specific options
   */
  options?: EngineOptions;
}

/**
 * TTS engines configuration
 */
export interface TtsEngines {
  /**
   * Engine-specific configurations
   */
  [engineName: string]: EngineConfig;
}

/**
 * Profile configuration interface
 */
export interface ProfileConfig {
  /**
   * Active profile name
   */
  active?: string;
  /**
   * List of profiles
   */
  list?: Array<{
    name: string;
    description?: string;
    config: Record<string, unknown>;
  }>;
}

/**
 * Base configuration interface for bun-tts
 */
export interface BunTtsConfig {
  /**
   * Application logging configuration
   */
  logging: {
    /**
     * Log level: trace, debug, info, warn, error, fatal
     */
    level: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';
    /**
     * Whether to use pretty formatting in development
     */
    pretty: boolean;
    /**
     * Whether to log to file
     */
    file: boolean;
    /**
     * Log file path (when file logging is enabled)
     */
    filePath?: string;
  };

  /**
   * TTS engine configuration
   */
  tts: {
    /**
     * Default TTS engine to use
     */
    defaultEngine: 'kokoro' | 'chatterbox';
    /**
     * Audio output format
     */
    outputFormat: 'mp3' | 'wav' | 'ogg';
    /**
     * Audio sample rate
     */
    sampleRate: number;
    /**
     * Audio quality (0.0 to 1.0)
     */
    quality: number;
    /**
     * Default voice model
     */
    defaultVoice?: string;
    /**
     * Speech rate multiplier
     */
    rate: number;
    /**
     * Volume multiplier
     */
    volume: number;
    /**
     * Speed multiplier (alias for rate)
     */
    speed?: number;
    /**
     * Voice selection
     */
    voice?: string;
    /**
     * Engine configurations
     */
    engines?: TtsEngines;
  };

  /**
   * Processing configuration
   */
  processing: {
    /**
     * Maximum file size for document processing (in MB)
     */
    maxFileSize: number;
    /**
     * Whether to process documents in parallel
     */
    parallel: boolean;
    /**
     * Number of parallel workers (when parallel is true)
     */
    maxWorkers: number;
    /**
     * Temporary directory for processing
     */
    tempDir?: string;
    /**
     * Chunk size for processing
     */
    chunkSize?: number;
    /**
     * Overlap between chunks
     */
    overlap?: number;
    /**
     * Maximum concurrency
     */
    maxConcurrency?: number;
  };

  /**
   * CLI configuration
   */
  cli: {
    /**
     * Whether to show progress indicators
     */
    showProgress: boolean;
    /**
     * Whether to use colors in output
     */
    colors: boolean;
    /**
     * Whether to show debug information
     */
    debug: boolean;
  };

  /**
   * Output configuration
   */
  output: {
    /**
     * Output format
     */
    format: 'mp3' | 'wav' | 'm4a' | 'ogg';
    /**
     * Output quality
     */
    quality: 'low' | 'medium' | 'high' | 'lossless';
    /**
     * Output directory
     */
    directory?: string;
  };

  /**
   * Cache configuration
   */
  cache: {
    /**
     * Whether to enable caching
     */
    enabled: boolean;
    /**
     * Cache directory
     */
    dir?: string;
    /**
     * Maximum cache size (in MB)
     */
    maxSize: number;
    /**
     * Cache TTL in seconds
     */
    ttl: number;
  };

  /**
   * Profile configuration
   */
  profiles?: ProfileConfig;
}

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG: BunTtsConfig = {
  logging: {
    level: 'info',
    pretty: true,
    file: false,
  },
  tts: {
    defaultEngine: 'kokoro',
    outputFormat: 'mp3',
    sampleRate: 22050,
    quality: 0.8,
    rate: 1.0,
    volume: 1.0,
  },
  processing: {
    maxFileSize: 100,
    parallel: true,
    maxWorkers: 4,
  },
  cli: {
    showProgress: true,
    colors: true,
    debug: false,
  },
  output: {
    format: 'mp3',
    quality: 'high',
    directory: './output',
  },
  cache: {
    enabled: true,
    maxSize: 1024,
    ttl: 3600,
  },
};
