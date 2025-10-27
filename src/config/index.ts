import { cosmiconfig } from 'cosmiconfig';
import { InvalidConfigError, MissingConfigError, success, failure, type Result } from '../errors/index.js';
import type { ConfigOptions } from '../types/index.js';

// Audio configuration constants
const MAX_SPEED_MULTIPLIER = 3;
const MIN_SPEED_MULTIPLIER = 0;
const MAX_PITCH_MULTIPLIER = 2;
const MIN_PITCH_MULTIPLIER = 0;
const MAX_VOLUME_MULTIPLIER = 2;
const MIN_VOLUME_MULTIPLIER = 0;
const MAX_EMOTION_INTENSITY = 1;
const MIN_EMOTION_INTENSITY = 0;

// Channel configuration constants
const MONO_CHANNELS = 1;
const STEREO_CHANNELS = 2;

// Valid TTS engines and output formats
const VALID_TTS_ENGINES = ['kokoro', 'chatterbox'] as const;
const VALID_OUTPUT_FORMATS = ['mp3', 'wav', 'm4a'] as const;
const VALID_EMOTION_ENGINES = ['ai', 'rule-based'] as const;

export interface ConfigManagerOptions {
  configPath?: string;
  defaults?: Partial<ConfigOptions>;
}

/**
 * Configuration manager for bun-tts application.
 * Handles loading, validation, and management of TTS configuration settings.
 * Supports both file-based configuration and programmatic configuration.
 * Uses cosmiconfig for flexible configuration file discovery and parsing.
 */
export class ConfigManager {
  private config: ConfigOptions | null = null;
  private readonly explorer = cosmiconfig('bun-tts');

  /**
   * Loads configuration from file system or uses defaults.
   * Searches for configuration files using cosmiconfig or loads from specified path.
   * Merges configuration with defaults in the correct priority order.
   *
   * @param options - Configuration loading options
   * @param options.configPath - Optional specific path to configuration file
   * @param options.defaults - Optional default values to merge with loaded config
   * @returns Promise resolving to Result containing loaded configuration or error
   */
  public async loadConfig(
    options: ConfigManagerOptions = {}
  ): Promise<Result<ConfigOptions>> {
    try {
      const result = await this.loadConfigFile(options);

      if (result?.config) {
        const validatedConfig = this.validateConfig(result.config);
        this.config = this.mergeConfigurations(validatedConfig, options.defaults);
        return success(this.config);
      }

      // Use defaults if no config found
      this.config = this.mergeConfigurations(undefined, options.defaults);
      return success(this.config);
    } catch (error) {
      return this.handleConfigLoadError(error, options.configPath);
    }
  }

  /**
   * Gets the currently loaded configuration.
   * Returns null if no configuration has been loaded yet.
   *
   * @returns Current configuration or null if not loaded
   */
  public getConfig(): ConfigOptions | null {
    return this.config;
  }

  /**
   * Reloads configuration from file system.
   * Clears the current configuration and loads fresh configuration.
   * Useful for configuration hot-reloading scenarios.
   *
   * @param options - Configuration loading options
   * @returns Promise resolving to Result containing reloaded configuration or error
   */
  public async reloadConfig(
    options: ConfigManagerOptions = {}
  ): Promise<Result<ConfigOptions>> {
    this.config = null;
    return this.loadConfig(options);
  }

  /**
   * Loads configuration file using cosmiconfig.
   * Handles both specific path loading and search-based loading.
   *
   * @param options - Configuration loading options
   * @returns Promise resolving to cosmiconfig result or null
   */
  private async loadConfigFile(options: ConfigManagerOptions): Promise<{ config: unknown } | null> {
    if (options.configPath) {
      return this.explorer.load(options.configPath);
    }
    return this.explorer.search();
  }

  /**
   * Merges configuration with defaults in the correct priority order.
   * Priority order: defaults < loaded config < runtime defaults
   *
   * @param loadedConfig - Configuration loaded from file (optional)
   * @param runtimeDefaults - Runtime default values (optional)
   * @returns Merged configuration object
   */
  private mergeConfigurations(
    loadedConfig?: ConfigOptions,
    runtimeDefaults?: Partial<ConfigOptions>
  ): ConfigOptions {
    return {
      ...this.getDefaultConfig(),
      ...loadedConfig,
      ...runtimeDefaults,
    };
  }

  /**
   * Handles errors that occur during configuration loading.
   * Converts various error types to appropriate Result objects.
   *
   * @param error - The error that occurred
   * @param configPath - Optional configuration path for error context
   * @returns Result containing the appropriate error
   */
  private handleConfigLoadError(
    error: unknown,
    configPath?: string
  ): Result<ConfigOptions> {
    if (error instanceof Error) {
      if (error.message.includes('ENOENT')) {
        return failure(
          new MissingConfigError(configPath || 'default search locations')
        );
      }
      return failure(
        new InvalidConfigError(configPath || 'unknown', error.message)
      );
    }
    return failure(
      new InvalidConfigError(
        configPath || 'unknown',
        'Unknown error occurred'
      )
    );
  }

  /**
   * Gets the default configuration values.
   * Provides sensible defaults for all configuration options.
   *
   * @returns Default configuration object
   */
  private getDefaultConfig(): ConfigOptions {
    return {
      ttsEngine: 'kokoro',
      voiceSettings: {
        speed: 1.0,
        pitch: 1.0,
        volume: 1.0,
        emotion: {
          enabled: false,
          engine: 'ai',
          intensity: 0.5,
        },
      },
      outputFormat: 'mp3',
      sampleRate: 22050,
      channels: 1,
      bitrate: 128,
    };
  }

  /**
   * Validates a configuration object against schema requirements.
   * Ensures all configuration values are within acceptable ranges and types.
   *
   * @param config - Configuration object to validate
   * @returns Validated configuration object
   * @throws Error if configuration is invalid
   */
  private validateConfig(config: unknown): ConfigOptions {
    if (!config || typeof config !== 'object') {
      throw new Error('Configuration must be an object');
    }

    const cfg = config as Record<string, unknown>;

    this.validateTtsEngine(cfg.ttsEngine);
    this.validateOutputFormat(cfg.outputFormat);
    this.validateNumericValues(cfg);
    this.validateVoiceSettings(cfg.voiceSettings);

    return config as ConfigOptions;
  }

  /**
   * Validates the TTS engine configuration.
   * Ensures the specified engine is supported.
   *
   * @param engine - TTS engine to validate
   * @throws Error if engine is invalid
   */
  private validateTtsEngine(engine: unknown): void {
    if (engine && !VALID_TTS_ENGINES.includes(engine as typeof VALID_TTS_ENGINES[number])) {
      throw new Error(
        `Invalid ttsEngine: ${engine}. Must be '${VALID_TTS_ENGINES.join("' or '")}'`
      );
    }
  }

  /**
   * Validates the output format configuration.
   * Ensures the specified format is supported.
   *
   * @param format - Output format to validate
   * @throws Error if format is invalid
   */
  private validateOutputFormat(format: unknown): void {
    if (format && !VALID_OUTPUT_FORMATS.includes(format as typeof VALID_OUTPUT_FORMATS[number])) {
      throw new Error(
        `Invalid outputFormat: ${format}. Must be '${VALID_OUTPUT_FORMATS.join("', '")}'`
      );
    }
  }

  /**
   * Validates numeric configuration values.
   * Ensures sample rate, channels, and bitrate are within acceptable ranges.
   *
   * @param config - Configuration object containing numeric values
   * @throws Error if any numeric value is invalid
   */
  private validateNumericValues(config: Record<string, unknown>): void {
    if (config.sampleRate && (typeof config.sampleRate !== 'number' || config.sampleRate <= 0)) {
      throw new Error('sampleRate must be a positive number');
    }

    if (config.channels && ![MONO_CHANNELS, STEREO_CHANNELS].includes(config.channels as number)) {
      throw new Error(`channels must be ${MONO_CHANNELS} (mono) or ${STEREO_CHANNELS} (stereo)`);
    }

    if (config.bitrate && (typeof config.bitrate !== 'number' || config.bitrate <= 0)) {
      throw new Error('bitrate must be a positive number');
    }
  }

  /**
   * Validates voice settings configuration.
   * Ensures all voice parameters are within acceptable ranges.
   *
   * @param voiceSettings - Voice settings object to validate
   * @throws Error if any voice setting is invalid
   */
  private validateVoiceSettings(voiceSettings: unknown): void {
    if (!voiceSettings || typeof voiceSettings !== 'object') {
      return;
    }

    const voice = voiceSettings as Record<string, unknown>;

    this.validateSpeedSetting(voice.speed);
    this.validatePitchSetting(voice.pitch);
    this.validateVolumeSetting(voice.volume);
    this.validateEmotionSettings(voice.emotion);
  }

  /**
   * Validates the voice speed setting.
   *
   * @param speed - Speed value to validate
   * @throws Error if speed is invalid
   */
  private validateSpeedSetting(speed: unknown): void {
    if (speed && (typeof speed !== 'number' || speed <= MIN_SPEED_MULTIPLIER || speed > MAX_SPEED_MULTIPLIER)) {
      throw new Error(`voiceSettings.speed must be a number between ${MIN_SPEED_MULTIPLIER} and ${MAX_SPEED_MULTIPLIER}`);
    }
  }

  /**
   * Validates the voice pitch setting.
   *
   * @param pitch - Pitch value to validate
   * @throws Error if pitch is invalid
   */
  private validatePitchSetting(pitch: unknown): void {
    if (pitch && (typeof pitch !== 'number' || pitch <= MIN_PITCH_MULTIPLIER || pitch > MAX_PITCH_MULTIPLIER)) {
      throw new Error(`voiceSettings.pitch must be a number between ${MIN_PITCH_MULTIPLIER} and ${MAX_PITCH_MULTIPLIER}`);
    }
  }

  /**
   * Validates the voice volume setting.
   *
   * @param volume - Volume value to validate
   * @throws Error if volume is invalid
   */
  private validateVolumeSetting(volume: unknown): void {
    if (volume && (typeof volume !== 'number' || volume <= MIN_VOLUME_MULTIPLIER || volume > MAX_VOLUME_MULTIPLIER)) {
      throw new Error(`voiceSettings.volume must be a number between ${MIN_VOLUME_MULTIPLIER} and ${MAX_VOLUME_MULTIPLIER}`);
    }
  }

  /**
   * Validates emotion settings configuration.
   * Ensures emotion parameters are within acceptable ranges.
   *
   * @param emotion - Emotion settings object to validate
   * @throws Error if any emotion setting is invalid
   */
  private validateEmotionSettings(emotion: unknown): void {
    if (!emotion || typeof emotion !== 'object') {
      return;
    }

    const emotionSettings = emotion as Record<string, unknown>;

    if (emotionSettings.intensity &&
        (typeof emotionSettings.intensity !== 'number' ||
         emotionSettings.intensity < MIN_EMOTION_INTENSITY ||
         emotionSettings.intensity > MAX_EMOTION_INTENSITY)) {
      throw new Error(
        `voiceSettings.emotion.intensity must be a number between ${MIN_EMOTION_INTENSITY} and ${MAX_EMOTION_INTENSITY}`
      );
    }

    if (emotionSettings.engine &&
        !VALID_EMOTION_ENGINES.includes(emotionSettings.engine as typeof VALID_EMOTION_ENGINES[number])) {
      throw new Error(
        `voiceSettings.emotion.engine must be '${VALID_EMOTION_ENGINES.join("' or '")}'`
      );
    }
  }

  /**
   * Creates a sample configuration file template.
   * Provides a comprehensive example with inline comments explaining each option.
   *
   * @returns YAML formatted configuration template string
   */
  public createSampleConfig(): string {
    return this.generateConfigTemplate();
  }

  /**
   * Generates the complete configuration template string.
   * Includes all available configuration options with descriptive comments.
   *
   * @returns Complete YAML configuration template
   */
  private generateConfigTemplate(): string {
    return [
      this.getTemplateHeader(),
      this.getTtsEngineSection(),
      this.getVoiceSettingsSection(),
      this.getAudioOutputSection(),
    ].join('\n\n');
  }

  /**
   * Gets the template header section with file description.
   *
   * @returns Header comment section
   */
  private getTemplateHeader(): string {
    return `# bun-tts Configuration File
# This file controls the default behavior of the bun-tts CLI tool`;
  }

  /**
   * Gets the TTS engine configuration section.
   *
   * @returns TTS engine configuration with comments
   */
  private getTtsEngineSection(): string {
    return `# TTS engine to use for audio generation
# Options: ${VALID_TTS_ENGINES.join(', ')}
ttsEngine: "kokoro"`;
  }

  /**
   * Gets the voice settings configuration section.
   *
   * @returns Voice settings configuration with comments
   */
  private getVoiceSettingsSection(): string {
    return `# Voice settings for audio generation
voiceSettings:
  # Speech speed (${MIN_SPEED_MULTIPLIER} to ${MAX_SPEED_MULTIPLIER}, where 1.0 is normal speed)
  speed: 1.0

  # Pitch adjustment (${MIN_PITCH_MULTIPLIER} to ${MAX_PITCH_MULTIPLIER}, where 1.0 is normal pitch)
  pitch: 1.0

  # Volume level (${MIN_VOLUME_MULTIPLIER} to ${MAX_VOLUME_MULTIPLIER}, where 1.0 is normal volume)
  volume: 1.0

  # Emotion settings (optional)
  emotion:
    # Enable emotion processing
    enabled: false

    # Emotion detection engine
    # Options: ${VALID_EMOTION_ENGINES.join(', ')}
    engine: "ai"

    # Intensity of emotion expression (${MIN_EMOTION_INTENSITY} to ${MAX_EMOTION_INTENSITY})
    intensity: 0.5`;
  }

  /**
   * Gets the audio output configuration section.
   *
   * @returns Audio output configuration with comments
   */
  private getAudioOutputSection(): string {
    return `# Audio output format
# Options: ${VALID_OUTPUT_FORMATS.join(', ')}
outputFormat: "mp3"

# Audio sample rate in Hz
sampleRate: 22050

# Audio channels
# Options: ${MONO_CHANNELS} (mono), ${STEREO_CHANNELS} (stereo)
channels: ${MONO_CHANNELS}

# Audio bitrate in kbps (for compressed formats)
bitrate: 128`;
  }
}

// Export class for DI container registration
// Note: The ConfigManager class is already exported inline above
// This comment preserves the intent without creating duplicate exports

// Named export for backward compatibility with existing tests
export const configManager = ConfigManager;
