/**
 * Configuration validation constants
 */
export const VALID_LOG_LEVELS = [
  'trace',
  'debug',
  'info',
  'warn',
  'error',
  'fatal',
] as const;

export const MIN_WORKERS = 1;
export const MAX_WORKERS = 32;
export const MIN_SAMPLE_RATE = 8000;
export const MAX_SAMPLE_RATE = 48000;
export const MIN_QUALITY = Number.EPSILON;
export const MAX_QUALITY = 1;
export const MIN_RATE = 0.1;
export const MAX_RATE = 3.0;
export const MIN_VOLUME = 0;
export const MAX_VOLUME = 2.0;
export const VALID_TTS_ENGINES = ['kokoro', 'chatterbox'] as const;
export const VALID_OUTPUT_FORMATS = ['mp3', 'wav', 'm4a'] as const;
