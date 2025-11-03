/**
 * Profile Factory
 *
 * Factory functions for creating test profile data and configurations.
 * This file provides utilities to generate mock profiles for testing the
 * profile management system, including valid and invalid profiles for
 * testing validation and edge cases.
 *
 * @file Profile factory functions for testing
 * @author Eduardo Menoncello
 * @version 0.1.0
 */

import { faker } from '@faker-js/faker';
import type {
  ProfileData,
  ProfileMetadata,
  CreateProfileData,
} from '../../../src/config/profile-manager.js';
import type { BunTtsConfig } from '../../../src/types/config.js';

/**
 * Options for creating profile data
 */
export interface CreateProfileOptions {
  /**
   * Profile name
   */
  name?: string;

  /**
   * Profile description
   */
  description?: string;

  /**
   * Profile tags
   */
  tags?: string[];

  /**
   * Profile configuration overrides
   */
  config?: Partial<BunTtsConfig>;

  /**
   * Whether the profile should be marked as active
   */
  isActive?: boolean;

  /**
   * Custom metadata
   */
  metadata?: Partial<ProfileMetadata>;
}

/**
 * Options for creating invalid profile data
 */
export interface CreateInvalidProfileOptions extends CreateProfileOptions {
  /**
   * Type of invalidity to introduce
   */
  invalidType?: 'name' | 'description' | 'tags' | 'config' | 'metadata';
}

/**
 * Default profile configuration
 */
const DEFAULT_PROFILE_CONFIG: Partial<BunTtsConfig> = {
  tts: {
    defaultEngine: 'chatterbox',
    speed: 1.0,
    volume: 1.0,
    voice: 'default',
    outputFormat: 'mp3',
    sampleRate: 22050,
    quality: 0.8,
    rate: 1.0,
  },
  output: {
    format: 'mp3',
    quality: 'high',
  },
  logging: {
    level: 'info',
    pretty: true,
    file: false,
  },
  cache: {
    enabled: true,
    maxSize: 1024,
    ttl: 3600,
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
};

/**
 * Generate a valid profile name
 *
 * @param {string} [prefix] - Optional prefix for the name
 * @returns {string} Valid profile name
 */
export function generateValidProfileName(prefix?: string): string {
  const baseName = faker.helpers.arrayElement([
    'novel-project',
    'technical-docs',
    'academic-paper',
    'user-guide',
    'documentation',
    'tutorial',
    'reference',
    'manual',
    'guidebook',
    'handbook',
  ]);

  const suffix = faker.number.int({ min: 1, max: 999 });
  const name = prefix
    ? `${prefix}-${baseName}-${suffix}`
    : `${baseName}-${suffix}`;

  // Ensure name is valid (lowercase, alphanumeric, hyphens, underscores)
  return name
    .toLowerCase()
    .replace(/[^\d_a-z-]/g, '-')
    .replace(/-+/g, '-');
}

/**
 * Generate valid profile tags
 *
 * @param {number} [count] - Number of tags to generate
 * @returns {string[]} Array of valid tags
 */
export function generateValidTags(count?: number): string[] {
  const tagCount = count ?? faker.number.int({ min: 1, max: 5 });
  const validTags = [
    'novel',
    'technical',
    'academic',
    'documentation',
    'tutorial',
    'guide',
    'reference',
    'manual',
    'handbook',
    'educational',
    'professional',
    'personal',
    'work',
    'project',
    'draft',
    'final',
    'published',
    'review',
    'editing',
  ];

  return faker.helpers.arrayElements(validTags, tagCount);
}

/**
 * Generate profile metadata
 *
 * @param {string} name - Profile name
 * @param {string} [description] - Profile description
 * @param {string[]} [tags] - Profile tags
 * @param {Partial<ProfileMetadata>} [overrides] - Metadata overrides
 * @returns {ProfileMetadata} Profile metadata
 */
export function generateProfileMetadata(
  name: string,
  description?: string,
  tags?: string[],
  overrides: Partial<ProfileMetadata> = {}
): ProfileMetadata {
  const now = new Date();
  const createdAt = faker.date.past({ years: 1, refDate: now });
  const updatedAt = faker.date.between({ from: createdAt, to: now });

  return {
    name,
    description: description ?? faker.lorem.sentence(),
    tags: tags ?? generateValidTags(),
    createdAt: createdAt.toISOString(),
    updatedAt: updatedAt.toISOString(),
    isActive: false,
    ...overrides,
  };
}

/**
 * Generate profile configuration
 *
 * @param {Partial<BunTtsConfig>} [overrides] - Configuration overrides
 * @returns {Partial<BunTtsConfig>} Profile configuration
 */
export function generateProfileConfig(
  overrides: Partial<BunTtsConfig> = {}
): Partial<BunTtsConfig> {
  return {
    ...DEFAULT_PROFILE_CONFIG,
    ...overrides,
  };
}

/**
 * Create a valid profile for testing
 *
 * @param {CreateProfileOptions} [options] - Profile creation options
 * @returns {ProfileData} Valid profile data
 */
export function createProfile(options: CreateProfileOptions = {}): ProfileData {
  const name = options.name ?? generateValidProfileName();
  const description = options.description ?? 'Test profile description';
  const tags = options.tags ?? generateValidTags();
  const config = options.config ?? generateProfileConfig();
  const metadata = generateProfileMetadata(name, description, tags, {
    isActive: options.isActive ?? false,
    ...options.metadata,
  });

  return {
    name,
    description,
    tags,
    config,
    metadata,
    isActive: metadata.isActive,
  };
}

/**
 * Create a profile with minimal configuration
 *
 * @param {CreateProfileOptions} [options] - Profile creation options
 * @returns {ProfileData} Minimal profile data
 */
export function createMinimalProfile(
  options: CreateProfileOptions = {}
): ProfileData {
  const name = options.name ?? generateValidProfileName();
  const metadata = generateProfileMetadata(name, undefined, [], {
    isActive: options.isActive ?? false,
    ...options.metadata,
  });

  return {
    name,
    config: {},
    metadata,
    isActive: metadata.isActive,
  };
}

/**
 * Create a profile with extensive configuration
 *
 * @param {CreateProfileOptions} [options] - Profile creation options
 * @returns {ProfileData} Extensive profile data
 */
export function createExtensiveProfile(
  options: CreateProfileOptions = {}
): ProfileData {
  const name = options.name ?? generateValidProfileName('extensive');
  const description = options.description ?? faker.lorem.paragraphs(2);
  const tags =
    options.tags ?? generateValidTags(faker.number.int({ min: 3, max: 10 }));

  const config = generateProfileConfig({
    tts: {
      defaultEngine: faker.helpers.arrayElement(['chatterbox', 'kokoro']),
      speed: faker.number.float({ min: 0.5, max: 2.0, fractionDigits: 1 }),
      volume: faker.number.float({ min: 0.1, max: 1.0, fractionDigits: 1 }),
      voice: faker.helpers.arrayElement([
        'default',
        'male',
        'female',
        'neutral',
      ]),
      outputFormat: faker.helpers.arrayElement(['mp3', 'wav', 'ogg']),
      sampleRate: faker.helpers.arrayElement([22050, 44100, 48000]),
      quality: faker.number.float({ min: 0.1, max: 1.0, fractionDigits: 1 }),
      rate: faker.number.float({ min: 0.5, max: 2.0, fractionDigits: 1 }),
    },
    output: {
      format: faker.helpers.arrayElement(['mp3', 'wav', 'ogg']),
      quality: faker.helpers.arrayElement([
        'low',
        'medium',
        'high',
        'lossless',
      ]),
    },
    logging: {
      level: faker.helpers.arrayElement(['debug', 'info', 'warn', 'error']),
      pretty: faker.datatype.boolean(),
      file: faker.datatype.boolean(),
    },
    cache: {
      enabled: faker.datatype.boolean(),
      maxSize: faker.number.int({ min: 100, max: 2048 }),
      ttl: faker.number.int({ min: 300, max: 86400 }),
    },
    processing: {
      maxFileSize: faker.number.int({ min: 10, max: 500 }),
      parallel: faker.datatype.boolean(),
      maxWorkers: faker.number.int({ min: 1, max: 8 }),
    },
    cli: {
      showProgress: faker.datatype.boolean(),
      colors: faker.datatype.boolean(),
      debug: faker.datatype.boolean(),
    },
  });

  const metadata = generateProfileMetadata(name, description, tags, {
    isActive: options.isActive ?? false,
    ...options.metadata,
  });

  return {
    name,
    description,
    tags,
    config,
    metadata,
    isActive: metadata.isActive,
  };
}

/**
 * Create an active profile
 *
 * @param {CreateProfileOptions} [options] - Profile creation options
 * @returns {ProfileData} Active profile data
 */
export function createActiveProfile(
  options: CreateProfileOptions = {}
): ProfileData {
  return createProfile({
    ...options,
    isActive: true,
  });
}

/**
 * Create profile data for creation (CreateProfileData interface)
 *
 * @param {CreateProfileOptions} [options] - Profile creation options
 * @returns {CreateProfileData} Profile creation data
 */
export function createProfileConfig(
  options: CreateProfileOptions = {}
): CreateProfileData {
  const name = options.name ?? generateValidProfileName();
  const description = options.description ?? 'Test profile description';
  const tags = options.tags ?? generateValidTags();

  // Merge provided config with defaults
  const config = options.config
    ? { ...DEFAULT_PROFILE_CONFIG, ...options.config }
    : generateProfileConfig();

  return {
    name,
    description,
    tags,
    config,
  };
}

/**
 * Create an invalid profile for testing validation
 *
 * @param {CreateInvalidProfileOptions} [options] - Options for creating invalid profile
 * @returns {ProfileData} Invalid profile data
 */
export function createInvalidProfile(
  options: CreateInvalidProfileOptions = {}
): ProfileData {
  const invalidType = options.invalidType ?? 'name';
  const baseOptions = { ...options };
  delete baseOptions.invalidType;

  switch (invalidType) {
    case 'name': {
      const invalidNames = [
        '', // Empty
        ' ', // Just space
        'Invalid Name With Spaces', // Spaces
        'invalid-name!', // Special characters
        'invalid@name', // @ symbol
        'InvalidName', // Uppercase
        '-starts-with-dash', // Starts with dash
        'ends-with-dash-', // Ends with dash
        'a'.repeat(101), // Too long
      ];

      return createProfile({
        ...baseOptions,
        name: faker.helpers.arrayElement(invalidNames),
      });
    }

    case 'description': {
      return createProfile({
        ...baseOptions,
        description: 'x'.repeat(501), // Too long
      });
    }

    case 'tags': {
      const invalidTags = [
        ['invalid tag', 'tag!', 'TagUpper', '', 'tag@name'], // Invalid tag formats
        Array.from({ length: 15 }, (_, i) => `tag${i}`), // Too many tags
        ['x'.repeat(51)], // Tag too long
      ];

      return createProfile({
        ...baseOptions,
        tags: faker.helpers.arrayElement(invalidTags),
      });
    }

    case 'config': {
      return createProfile({
        ...baseOptions,
        config: {
          tts: {
            defaultEngine: 'non-existent-engine',
            speed: -1, // Invalid speed
            volume: 2, // Invalid volume
          },
        } as any,
      });
    }

    case 'metadata': {
      const name = options.name ?? generateValidProfileName();
      return {
        name,
        config: {},
        metadata: {
          name: '',
          createdAt: 'invalid-date',
          updatedAt: 'invalid-date',
        },
        isActive: false,
      };
    }

    default: {
      return createProfile(baseOptions);
    }
  }
}

/**
 * Create an invalid profile configuration (CreateProfileData)
 *
 * @param {CreateInvalidProfileOptions} [options] - Options for creating invalid profile
 * @returns {CreateProfileData} Invalid profile creation data
 */
export function createInvalidProfileConfig(
  options: CreateInvalidProfileOptions = {}
): CreateProfileData {
  const invalidType = options.invalidType ?? 'name';
  const baseOptions = { ...options };
  delete baseOptions.invalidType;

  switch (invalidType) {
    case 'name': {
      const invalidNames = [
        '', // Empty
        ' ', // Just space
        'Invalid Name With Spaces', // Spaces
        'invalid-name!', // Special characters
        'invalid@name', // @ symbol
        'InvalidName', // Uppercase
        '-starts-with-dash', // Starts with dash
        'ends-with-dash-', // Ends with dash
        'a'.repeat(101), // Too long
      ];

      return createProfileConfig({
        ...baseOptions,
        name: faker.helpers.arrayElement(invalidNames),
      });
    }

    case 'description': {
      return createProfileConfig({
        ...baseOptions,
        description: 'x'.repeat(501), // Too long
      });
    }

    case 'tags': {
      const invalidTags = [
        ['invalid tag', 'tag!', 'TagUpper', '', 'tag@name'], // Invalid tag formats
        Array.from({ length: 15 }, (_, i) => `tag${i}`), // Too many tags
        ['x'.repeat(51)], // Tag too long
      ];

      return createProfileConfig({
        ...baseOptions,
        tags: faker.helpers.arrayElement(invalidTags),
      });
    }

    case 'config': {
      return createProfileConfig({
        ...baseOptions,
        config: {
          tts: {
            defaultEngine: 'non-existent-engine',
            speed: -1, // Invalid speed
            volume: 2, // Invalid volume
          },
        } as any,
      });
    }

    default: {
      return createProfileConfig(baseOptions);
    }
  }
}

/**
 * Create multiple profiles for testing
 *
 * @param {number} count - Number of profiles to create
 * @param {CreateProfileOptions} [baseOptions] - Base options for all profiles
 * @param {boolean} [includeActive] - Whether to include an active profile
 * @returns {ProfileData[]} Array of profile data
 */
export function createMultipleProfiles(
  count: number,
  baseOptions: CreateProfileOptions = {},
  includeActive = false
): ProfileData[] {
  const profiles: ProfileData[] = [];

  for (let i = 0; i < count; i++) {
    const isActive = includeActive && i === 0; // First profile is active if requested
    profiles.push(
      createProfile({
        ...baseOptions,
        name: baseOptions.name ? `${baseOptions.name}-${i + 1}` : undefined,
        isActive,
      })
    );
  }

  return profiles;
}

/**
 * Create profiles with different confidence levels for testing
 *
 * @returns {ProfileData[]} Array of profiles with varying confidence
 */
export function createProfilesWithVaryingConfidence(): ProfileData[] {
  return [
    createProfile({
      name: 'high-confidence-profile',
      description: 'Profile with high confidence configuration',
      config: {
        tts: {
          defaultEngine: 'chatterbox',
          outputFormat: 'mp3',
          sampleRate: 22050,
          quality: 0.8,
          rate: 1.0,
          volume: 0.8,
          speed: 1.0,
          voice: 'default',
        },
      },
    }),
    createProfile({
      name: 'medium-confidence-profile',
      description: 'Profile with medium confidence configuration',
      config: {
        tts: {
          defaultEngine: 'chatterbox',
          outputFormat: 'mp3',
          sampleRate: 22050,
          quality: 0.7,
          rate: 1.0,
          volume: 0.8,
          speed: 1.5,
          voice: 'custom',
        },
      },
    }),
    createProfile({
      name: 'low-confidence-profile',
      description: 'Profile with low confidence configuration',
      config: {
        tts: {
          defaultEngine: 'kokoro',
          outputFormat: 'mp3',
          sampleRate: 22050,
          quality: 0.6,
          rate: 1.0,
          volume: 0.8,
          speed: 0.5,
          voice: 'experimental',
        },
      },
    }),
  ];
}

/**
 * Create a profile with a specific configuration override pattern
 *
 * @param {string} pattern - The pattern type ('minimal', ' tts-only', 'output-only', 'complete')
 * @param {CreateProfileOptions} [options] - Additional options
 * @returns {ProfileData} Profile with specific configuration pattern
 */
export function createProfileWithPattern(
  pattern: 'minimal' | 'tts-only' | 'output-only' | 'complete',
  options: CreateProfileOptions = {}
): ProfileData {
  const baseName = options.name ?? generateValidProfileName(pattern);

  switch (pattern) {
    case 'minimal':
      return createMinimalProfile({
        ...options,
        name: baseName,
      });

    case 'tts-only':
      return createProfile({
        ...options,
        name: baseName,
        config: {
          tts: {
            defaultEngine: 'chatterbox',
            outputFormat: 'mp3',
            sampleRate: 22050,
            quality: 0.8,
            rate: 1.0,
            volume: 0.8,
            speed: 1.2,
            voice: 'custom',
          },
        },
      });

    case 'output-only':
      return createProfile({
        ...options,
        name: baseName,
        config: {
          output: {
            format: 'wav',
            quality: 'lossless',
          },
        },
      });

    case 'complete':
      return createExtensiveProfile({
        ...options,
        name: baseName,
      });

    default:
      return createProfile({
        ...options,
        name: baseName,
      });
  }
}

/**
 * Create a profile for specific use cases
 *
 * @param {string} useCase - The use case ('novel', 'technical', 'academic', 'tutorial')
 * @param {CreateProfileOptions} [options] - Additional options
 * @returns {ProfileData} Profile configured for the use case
 */
export function createProfileForUseCase(
  useCase: 'novel' | 'technical' | 'academic' | 'tutorial',
  options: CreateProfileOptions = {}
): ProfileData {
  const baseName = options.name ?? generateValidProfileName(useCase);

  switch (useCase) {
    case 'novel':
      return createProfile({
        ...options,
        name: baseName,
        description: 'Profile optimized for novel narration',
        tags: ['novel', 'storytelling', 'creative'],
        config: {
          tts: {
            defaultEngine: 'chatterbox',
            outputFormat: 'mp3',
            sampleRate: 22050,
            quality: 0.9, // High quality for immersive experience
            rate: 1.0,
            volume: 0.8,
            speed: 0.9, // Slower for storytelling
            voice: 'narrator',
          },
          output: {
            format: 'mp3',
            quality: 'high',
          },
        },
      });

    case 'technical':
      return createProfile({
        ...options,
        name: baseName,
        description: 'Profile optimized for technical documentation',
        tags: ['technical', 'documentation', 'reference'],
        config: {
          tts: {
            defaultEngine: 'chatterbox',
            outputFormat: 'mp3',
            sampleRate: 22050,
            quality: 0.8,
            rate: 1.0,
            volume: 0.8,
            speed: 1.1, // Slightly faster for efficiency
            voice: 'professional',
          },
          output: {
            format: 'mp3',
            quality: 'medium',
          },
          processing: {
            maxFileSize: 200, // Larger files for technical docs
            parallel: true,
            maxWorkers: 6,
          },
        },
      });

    case 'academic':
      return createProfile({
        ...options,
        name: baseName,
        description: 'Profile optimized for academic papers',
        tags: ['academic', 'research', 'educational'],
        config: {
          tts: {
            defaultEngine: 'chatterbox',
            outputFormat: 'mp3',
            sampleRate: 22050,
            quality: 0.95, // Very high quality for precision
            rate: 1.0,
            volume: 0.8,
            speed: 1.0, // Normal speed
            voice: 'academic',
          },
          output: {
            format: 'wav', // Lossless for academic use
            quality: 'lossless',
          },
        },
      });

    case 'tutorial':
      return createProfile({
        ...options,
        name: baseName,
        description: 'Profile optimized for tutorial content',
        tags: ['tutorial', 'educational', 'learning'],
        config: {
          tts: {
            defaultEngine: 'chatterbox',
            outputFormat: 'mp3',
            sampleRate: 22050,
            quality: 0.85,
            rate: 1.0,
            volume: 0.8,
            speed: 0.8, // Slower for learning
            voice: 'instructor',
          },
          output: {
            format: 'mp3',
            quality: 'high',
          },
          cli: {
            showProgress: true,
            colors: true,
            debug: true, // More verbose for tutorials
          },
        },
      });

    default:
      return createProfile({
        ...options,
        name: baseName,
      });
  }
}
