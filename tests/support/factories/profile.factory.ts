/**
 * Profile Factory for generating test data
 *
 * Provides factory functions for creating:
 * - Profile configurations
 * - Profile metadata
 * - Valid and invalid profile data
 */

export interface ProfileConfig {
  name: string;
  description?: string;
  tags?: string[];
  config: {
    tts?: {
      defaultEngine?: string;
      speed?: number;
      voice?: string;
      pitch?: number;
      volume?: number;
      engines?: Record<string, any>;
    };
    output?: {
      format?: string;
      quality?: string;
      directory?: string;
    };
    processing?: {
      chunkSize?: number;
      overlap?: number;
      maxConcurrency?: number;
    };
    logging?: {
      level?: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';
      pretty?: boolean;
      file?: boolean;
      filePath?: string;
    };
    cache?: {
      enabled?: boolean;
      maxSize?: number;
      ttl?: number;
    };
  };
  metadata?: {
    createdAt?: string;
    updatedAt?: string;
    version?: string;
    author?: string;
  };
}

export interface ProfileOverrides {
  name?: string;
  description?: string;
  tags?: string[];
  config?: Partial<ProfileConfig['config']>;
  metadata?: Partial<ProfileConfig['metadata']>;
}

/**
 * Create profile configuration with optional overrides
 */
export const createProfile = (
  overrides: ProfileOverrides = {}
): ProfileConfig => {
  const profile: ProfileConfig = {
    name: overrides.name || 'default-profile',
    description: overrides.description || 'Test profile description',
    tags: overrides.tags || ['test'],
    config: {
      tts: {
        defaultEngine: 'chatterbox',
        speed: 1.0,
        voice: 'default',
        pitch: 50,
        volume: 1.0,
        engines: {
          chatterbox: {
            enabled: true,
            options: {
              rate: 150,
              pitch: 50,
              volume: 80,
            },
          },
        },
      },
      output: {
        format: 'mp3',
        quality: 'high',
        directory: './output',
      },
      processing: {
        chunkSize: 1000,
        overlap: 50,
        maxConcurrency: 4,
      },
      logging: {
        level: 'info',
        pretty: true,
        file: false,
        filePath: './logs/profile.log',
      },
      cache: {
        enabled: true,
        maxSize: 100,
        ttl: 3600,
      },
    },
    metadata: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: '1.0.0',
      author: 'Test Suite',
    },
  };

  // Apply overrides
  if (overrides.name) profile.name = overrides.name;
  if (overrides.description) profile.description = overrides.description;
  if (overrides.tags) profile.tags = overrides.tags;
  if (overrides.config) {
    profile.config = {
      ...profile.config,
      ...overrides.config,
      tts: {
        ...profile.config.tts,
        ...overrides.config.tts,
      },
      output: {
        ...profile.config.output,
        ...overrides.config.output,
      },
      processing: {
        ...profile.config.processing,
        ...overrides.config.processing,
      },
      logging: {
        ...profile.config.logging,
        ...overrides.config.logging,
      },
      cache: {
        ...profile.config.cache,
        ...overrides.config.cache,
      },
    };
  }
  if (overrides.metadata) {
    profile.metadata = {
      ...profile.metadata,
      ...overrides.metadata,
    };
  }

  return profile;
};

/**
 * Create profile with minimal configuration
 */
export const createMinimalProfile = (
  overrides: ProfileOverrides = {}
): ProfileConfig => {
  const minimal: ProfileOverrides = {
    name: 'minimal-profile',
    description: 'Minimal profile for testing',
    config: {
      tts: {
        defaultEngine: 'chatterbox',
      },
    },
  };

  return createProfile({ ...minimal, ...overrides });
};

/**
 * Create profile with complete configuration
 */
export const createCompleteProfile = (
  overrides: ProfileOverrides = {}
): ProfileConfig => {
  const complete: ProfileOverrides = {
    name: 'complete-profile',
    description: 'Complete profile with all options configured',
    tags: ['complete', 'full-config', 'test'],
    config: {
      tts: {
        defaultEngine: 'chatterbox',
        speed: 1.5,
        voice: 'custom-voice',
        pitch: 60,
        volume: 90,
        engines: {
          chatterbox: {
            enabled: true,
            options: {
              rate: 200,
              pitch: 60,
              volume: 90,
            },
          },
        },
      },
      output: {
        format: 'wav',
        quality: 'lossless',
        directory: './custom-output',
      },
      processing: {
        chunkSize: 2000,
        overlap: 100,
        maxConcurrency: 8,
      },
      logging: {
        level: 'debug',
        pretty: true,
        file: false,
        filePath: './logs/profile.log',
      },
      cache: {
        enabled: true,
        maxSize: 500,
        ttl: 7200,
      },
    },
  };

  return createProfile({ ...complete, ...overrides });
};

/**
 * Create profile for specific use case: Novel writing
 */
export const createNovelProfile = (
  overrides: ProfileOverrides = {}
): ProfileConfig => {
  const novel: ProfileOverrides = {
    name: 'novel-project',
    description: 'Profile for novel writing projects',
    tags: ['novel', 'fiction', 'writing'],
    config: {
      tts: {
        defaultEngine: 'chatterbox',
        speed: 0.9, // Slower for narrative
        voice: 'narrator',
        pitch: 45,
        volume: 85,
      },
      output: {
        format: 'mp3',
        quality: 'high',
        directory: './novels',
      },
      processing: {
        chunkSize: 1500,
        overlap: 75,
        maxConcurrency: 2,
      },
      logging: {
        level: 'info',
        pretty: true,
        file: false,
        filePath: './logs/profile.log',
      },
    },
  };

  return createProfile({ ...novel, ...overrides });
};

/**
 * Create profile for specific use case: Technical documentation
 */
export const createTechnicalProfile = (
  overrides: ProfileOverrides = {}
): ProfileConfig => {
  const technical: ProfileOverrides = {
    name: 'technical-docs',
    description: 'Profile for technical documentation',
    tags: ['technical', 'documentation', 'code'],
    config: {
      tts: {
        defaultEngine: 'chatterbox',
        speed: 1.2, // Faster for technical content
        voice: 'technical',
        pitch: 50,
        volume: 80,
      },
      output: {
        format: 'mp3',
        quality: 'standard',
        directory: './docs',
      },
      processing: {
        chunkSize: 800,
        overlap: 40,
        maxConcurrency: 6,
      },
      logging: {
        level: 'warn',
        pretty: true,
        file: false,
        filePath: './logs/profile.log',
      },
    },
  };

  return createProfile({ ...technical, ...overrides });
};

/**
 * Create profile for specific use case: Academic papers
 */
export const createAcademicProfile = (
  overrides: ProfileOverrides = {}
): ProfileConfig => {
  const academic: ProfileOverrides = {
    name: 'academic-paper',
    description: 'Profile for academic papers and research',
    tags: ['academic', 'research', 'paper'],
    config: {
      tts: {
        defaultEngine: 'chatterbox',
        speed: 0.8, // Slow for complex terms
        voice: 'academic',
        pitch: 40,
        volume: 75,
      },
      output: {
        format: 'wav',
        quality: 'lossless',
        directory: './papers',
      },
      processing: {
        chunkSize: 600,
        overlap: 30,
        maxConcurrency: 1,
      },
      logging: {
        level: 'error',
        pretty: true,
        file: false,
        filePath: './logs/profile.log',
      },
    },
  };

  return createProfile({ ...academic, ...overrides });
};

/**
 * Create invalid profile configuration for error testing
 */
export const createInvalidProfileConfig = (
  overrides: ProfileOverrides = {}
): Partial<ProfileConfig> => {
  const invalid: Partial<ProfileConfig> = {
    name: overrides.name || '', // Invalid: empty name
    description: overrides.description || 'Valid description',
    config: {
      tts: {
        defaultEngine: overrides.config?.tts?.defaultEngine || '', // Invalid: empty engine
        speed: overrides.config?.tts?.speed || -1, // Invalid: negative speed
      },
    },
  };

  return invalid;
};

/**
 * Create profile with specific validation errors
 */
export const createProfileWithValidationErrors = (
  errorType: 'name' | 'config' | 'tags'
): Partial<ProfileConfig> => {
  switch (errorType) {
    case 'name':
      return {
        name: 'Invalid Name With Spaces', // Invalid: contains spaces
        description: 'Valid description',
        config: {
          tts: { defaultEngine: 'chatterbox' },
        },
      };

    case 'config':
      return {
        name: 'valid-name',
        description: 'Valid description',
        config: {
          tts: {
            defaultEngine: 'non-existent-engine', // Invalid engine
            speed: -5, // Invalid speed
          },
        },
      };

    case 'tags':
      return {
        name: 'valid-name',
        description: 'Valid description',
        tags: ['valid-tag', 'Invalid Tag With Spaces', 'tag@invalid'], // Invalid tags
        config: {
          tts: { defaultEngine: 'chatterbox' },
        },
      };

    default:
      return createInvalidProfileConfig();
  }
};

/**
 * Factory presets for common test scenarios
 */
export const ProfileFactoryPresets = {
  /**
   * Simple profile with minimal config
   */
  simple: () => createMinimalProfile(),

  /**
   * Complete profile with all options
   */
  complete: () => createCompleteProfile(),

  /**
   * Novel writing profile
   */
  novel: () => createNovelProfile(),

  /**
   * Technical documentation profile
   */
  technical: () => createTechnicalProfile(),

  /**
   * Academic paper profile
   */
  academic: () => createAcademicProfile(),

  /**
   * Profile for testing validation errors
   */
  invalidName: () => createProfileWithValidationErrors('name'),

  /**
   * Profile with invalid configuration
   */
  invalidConfig: () => createProfileWithValidationErrors('config'),

  /**
   * Profile with invalid tags
   */
  invalidTags: () => createProfileWithValidationErrors('tags'),

  /**
   * Multiple profiles for batch testing
   */
  batch: (count: number) =>
    Array.from({ length: count }, (_, i) =>
      createProfile({
        name: `profile-${i + 1}`,
        description: `Profile ${i + 1} for batch testing`,
      })
    ),
};

/**
 * Create profile configuration object (wrapper for backward compatibility)
 */
export const createProfileConfig = (
  overrides: ProfileOverrides = {}
): ProfileConfig => {
  return createProfile(overrides);
};

/**
 * Create invalid profile configuration (wrapper for backward compatibility)
 */
export const createInvalidProfileConfigWrapper = (
  overrides: ProfileOverrides = {}
): Partial<ProfileConfig> => {
  return createInvalidProfileConfig(overrides);
};

/**
 * Type helper for Result pattern testing
 */
export type TestProfileResult<T = ProfileConfig> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error: Error;
    };

/**
 * Create successful profile operation result
 */
export const createSuccessfulProfileResult = <T>(
  data: T
): TestProfileResult<T> => ({
  success: true,
  data,
});

/**
 * Create failed profile operation result
 */
export const createFailedProfileResult = (error: Error): TestProfileResult => ({
  success: false,
  error,
});

/**
 * Create multiple profiles with variations
 */
export const createProfileVariations = () => ({
  fast: createProfile({
    name: 'fast-processing',
    config: { tts: { speed: 2.0 }, processing: { maxConcurrency: 10 } },
  }),
  slow: createProfile({
    name: 'slow-processing',
    config: { tts: { speed: 0.5 }, processing: { maxConcurrency: 1 } },
  }),
  highQuality: createProfile({
    name: 'high-quality',
    config: { output: { quality: 'lossless', format: 'wav' } },
  }),
  lowQuality: createProfile({
    name: 'low-quality',
    config: { output: { quality: 'low', format: 'mp3' } },
  }),
});
