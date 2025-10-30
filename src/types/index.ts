// Core types for bun-tts application

/** Audio channel constants */
export const AUDIO_CHANNELS = {
  MONO: 1,
  STEREO: 2,
} as const;

/**
 * Configuration options for the bun-tts application.
 * Defines the text-to-speech engine, voice settings, and audio output parameters.
 */
export interface ConfigOptions {
  /** The text-to-speech engine to use for audio generation */
  ttsEngine: 'kokoro' | 'chatterbox';
  /** Voice settings including speed, pitch, and volume */
  voiceSettings: VoiceSettings;
  /** Audio output format */
  outputFormat: 'mp3' | 'wav' | 'm4a';
  /** Sample rate in Hz for audio output */
  sampleRate: number;
  /** Number of audio channels (1 for mono, 2 for stereo) */
  channels: typeof AUDIO_CHANNELS.MONO | typeof AUDIO_CHANNELS.STEREO;
  /** Optional bitrate for compressed audio formats */
  bitrate?: number;
}

/**
 * Voice settings for text-to-speech synthesis.
 * Controls the audio characteristics of the generated speech.
 */
export interface VoiceSettings {
  /** Speech speed multiplier (1.0 is normal speed) */
  speed: number;
  /** Pitch adjustment in semitones (0 is normal pitch) */
  pitch: number;
  /** Volume level from 0.0 to 1.0 (1.0 is maximum volume) */
  volume: number;
  /** Optional emotion settings for expressive speech */
  emotion?: EmotionSettings;
}

/**
 * Emotion settings for expressive text-to-speech synthesis.
 * Configures how emotions are applied to the generated speech.
 */
export interface EmotionSettings {
  /** Whether emotion processing is enabled */
  enabled: boolean;
  /** The emotion processing engine to use */
  engine: 'ai' | 'rule-based';
  /** Emotion intensity level from 0.0 to 1.0 */
  intensity: number;
}

/**
 * Complete document structure for audiobook generation.
 * Represents the hierarchical organization of content with chapters and metadata.
 */
export interface DocumentStructure {
  /** The main title of the document */
  title: string;
  /** Array of chapters in the document */
  chapters: Chapter[];
  /** Document metadata including author and statistics */
  metadata: DocumentMetadata;
}

/**
 * Individual chapter within a document.
 * Contains the chapter content and optional sections for further organization.
 */
export interface Chapter {
  /** Unique identifier for the chapter */
  id: string;
  /** Chapter title */
  title: string;
  /** Main content text of the chapter */
  content: string;
  /** Sequential order of the chapter in the document */
  order: number;
  /** Optional subsections within the chapter */
  sections?: Section[];
}

/**
 * Individual section within a chapter.
 * Represents a logical division of content with specific types.
 */
export interface Section {
  /** Unique identifier for the section */
  id: string;
  /** Section title */
  title: string;
  /** Content text of the section */
  content: string;
  /** Sequential order within the parent chapter */
  order: number;
  /** Type of content for processing and formatting */
  type: 'paragraph' | 'heading' | 'dialogue' | 'metadata';
}

/**
 * Metadata information about the document.
 * Contains authorship, content statistics, and classification information.
 */
export interface DocumentMetadata {
  /** Optional author name */
  author?: string;
  /** Primary language code (e.g., 'en', 'es', 'fr') */
  language: string;
  /** Optional genre classification */
  genre?: string;
  /** Total word count in the document */
  totalWords: number;
  /** Estimated reading time in minutes */
  estimatedReadingTime: number;
}

/**
 * Options for audio generation process.
 * Controls how the text is converted to audio files.
 */
export interface AudioGenerationOptions {
  /** Output directory or file path for generated audio */
  outputPath: string;
  /** Audio output format */
  format: 'mp3' | 'wav' | 'm4a';
  /** Audio quality setting affecting file size and clarity */
  quality: 'low' | 'medium' | 'high';
  /** Whether to split output into separate files per chapter */
  splitByChapter?: boolean;
  /** Whether to embed metadata in audio files */
  includeMetadata?: boolean;
}

/**
 * Generic result wrapper for processing operations.
 * Contains success status, data, error information, and optional metadata.
 *
 * @template T - Type of the data returned on success
 */
export interface ProcessingResult<T = unknown> {
  /** Whether the processing operation completed successfully */
  success: boolean;
  /** The processed data returned on successful operations */
  data?: T;
  /** Error information if the operation failed */
  error?: BunTtsError;
  /** Additional metadata about the processing operation */
  metadata?: Record<string, unknown>;
}

// Error types

/**
 * Custom error type for bun-tts application errors.
 * Provides structured error information with categorization and recovery options.
 */
export interface BunTtsError extends Error {
  /** Unique error code for programmatic handling */
  code: string;
  /** Error category for routing and handling decisions */
  category: 'configuration' | 'parsing' | 'tts' | 'file' | 'validation';
  /** Additional error context and debugging information */
  details?: Record<string, unknown>;
  /** Whether the operation can be retried or recovered from */
  recoverable: boolean;
}

// CLI types

/**
 * Interface defining the structure of a CLI command.
 * Commands are registered in the command registry and provide
 * a consistent interface for CLI operations.
 */
export interface Command {
  /** Unique identifier for the command */
  name: string;
  /** Human-readable description of what the command does */
  description: string;
  /** Async function that executes the command logic */
  handler: (context: CliContext) => Promise<void>;
  /** Optional array of usage examples for the command */
  examples?: string[];
}

/**
 * Command-line interface flags and options.
 * Represents parsed command-line arguments from the CLI tool.
 */
export interface CliFlags {
  /** Path to configuration file */
  config?: string;
  /** Enable verbose logging output */
  verbose?: boolean;
  /** Display help information */
  help?: boolean;
  /** Output file or directory path */
  output?: string;
  /** Audio format specification */
  format?: string;
  /** TTS engine selection */
  engine?: string;
  /** Display version information */
  version?: boolean;
  /** Allow additional properties from meow CLI parser */
  [key: string]: unknown;
}

/**
 * Complete context for CLI operations.
 * Contains parsed flags, input arguments, configuration, and logging settings.
 */
export interface CliContext {
  /** Parsed command-line flags */
  flags: CliFlags;
  /** Additional command-line input arguments */
  input: string[];
  /** Loaded configuration options */
  config?: ConfigOptions;
  /** Current logging level for the CLI operation */
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}
