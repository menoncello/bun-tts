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
  cache: {
    enabled: true,
    maxSize: 1024,
    ttl: 3600,
  },
};
