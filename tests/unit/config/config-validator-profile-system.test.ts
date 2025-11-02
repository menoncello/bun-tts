import { describe, it, expect, beforeEach } from 'bun:test';
import { ConfigValidator } from '../../../src/config/config-validator.js';
import { ProfileManager } from '../../../src/config/profile-manager.js';
import {
  createProfileConfig,
  createInvalidProfileConfig,
} from '../../support/factories/profile.factory.js';

describe('Configuration Validation - Profile System', () => {
  let configValidator: ConfigValidator;
  let profileValidator: ProfileManager;

  beforeEach(() => {
    configValidator = new ConfigValidator();
    profileValidator = new ProfileManager();
  });

  describe('ProfileValidator', () => {
    describe('profile name validation', () => {
      it('should validate correct profile names', () => {
        // GIVEN: Valid profile names
        const validNames = [
          'novel-project',
          'technical-docs',
          'academic-paper',
          'user123',
          'test-profile-2024',
        ];

        // WHEN: Validating each name
        const results = validNames.map((name) =>
          profileValidator.validateProfileName(name)
        );

        // THEN: All names are valid
        for (const result of results) {
          expect(result.valid).toBe(true);
        }
      });

      it('should reject invalid profile names', () => {
        // GIVEN: Invalid profile names
        const invalidNames = [
          '', // Empty
          ' ', // Just space
          'invalid name', // Spaces
          'invalid-name!', // Special characters
          'invalid@name', // @ symbol
          'InvalidName', // Uppercase
          '-starts-with-dash', // Starts with dash
          'ends-with-dash-', // Ends with dash
          'a'.repeat(101), // Too long
        ];

        // WHEN: Validating each name
        const results = invalidNames.map((name) =>
          profileValidator.validateProfileName(name)
        );

        // THEN: All names are invalid with reasons
        for (const result of results) {
          expect(result.valid).toBe(false);
          expect(result.error).toBeDefined();
          expect(result.error?.message).toContain('name');
        }
      });
    });

    describe('profile metadata validation', () => {
      it('should validate correct metadata', () => {
        // GIVEN: Valid metadata
        const metadata = {
          name: 'valid-profile',
          description: 'A valid profile description',
          tags: ['tag1', 'tag2', 'tag3'],
          createdAt: '2025-11-01T00:00:00Z',
          updatedAt: '2025-11-01T00:00:00Z',
        };

        // WHEN: Validating metadata
        const result = profileValidator.validateMetadata(metadata);

        // THEN: Metadata is valid
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should validate metadata constraints', () => {
        // GIVEN: Metadata with constraints
        const metadata = {
          name: 'valid-profile',
          description: 'x'.repeat(501), // Too long
          tags: [
            'tag1',
            'tag2',
            'tag3',
            'tag4',
            'tag5',
            'tag6',
            'tag7',
            'tag8',
            'tag9',
            'tag10',
            'tag11',
          ], // Too many
          createdAt: '2025-11-01T00:00:00Z',
          updatedAt: '2025-11-01T00:00:00Z',
        };

        // WHEN: Validating metadata
        const result = profileValidator.validateMetadata(metadata);

        // THEN: Validation fails with constraint errors
        expect(result.valid).toBe(false);
        const messages = result.errors?.map((e) => e.message) || [];
        expect(messages.some((m) => m.includes('Description'))).toBe(true);
        expect(messages.some((m) => m.includes('tags'))).toBe(true);
      });
    });

    describe('profile configuration validation', () => {
      it('should validate complete profile configuration', () => {
        // GIVEN: Valid profile configuration
        const profileConfig = createProfileConfig({
          name: 'test-profile',
          config: {
            tts: {
              defaultEngine: 'chatterbox',
              speed: 1.0,
              voice: 'default',
            },
            output: {
              format: 'mp3',
              quality: 'high',
            },
          },
        });

        // WHEN: Validating profile
        const result = profileValidator.validateProfile(profileConfig as any);

        // THEN: Profile is valid
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should validate profile with partial config', () => {
        // GIVEN: Profile with minimal config
        const profileConfig = createProfileConfig({
          name: 'minimal-profile',
          config: {
            tts: {
              defaultEngine: 'chatterbox',
              speed: 1.0,
              volume: 1.0,
            },
          },
        });

        // WHEN: Validating profile
        const result = profileValidator.validateProfile(profileConfig as any);

        // THEN: Profile is valid (defaults are merged)
        expect(result.valid).toBe(true);
      });

      it('should reject invalid profile configuration', () => {
        // GIVEN: Invalid profile configuration
        const invalidConfig = createInvalidProfileConfig({
          // Don't override name to keep it invalid (empty)
        });

        // WHEN: Validating profile
        const result = profileValidator.validateProfile(invalidConfig as any);

        // THEN: Validation fails with errors
        expect(result.valid).toBe(false);
        expect(result.errors?.length).toBeGreaterThan(0);
      });
    });

    describe('profile tag validation', () => {
      it('should validate correct tags', () => {
        // GIVEN: Valid tags
        const validTags = [
          'novel',
          'technical',
          'academic',
          'user-123',
          'tag_test',
        ];

        // WHEN: Validating tags
        const result = profileValidator.validateTags(validTags);

        // THEN: Tags are valid
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should reject invalid tags', () => {
        // GIVEN: Invalid tags
        const invalidTags = ['invalid tag', 'tag!', 'TagUpper', '', 'tag@name'];

        // WHEN: Validating tags
        const result = profileValidator.validateTags(invalidTags);

        // THEN: Tags are invalid
        expect(result.valid).toBe(false);
        expect(result.errors?.length).toBeGreaterThan(0);
      });

      it('should enforce tag constraints', () => {
        // GIVEN: Tags exceeding constraints
        const tooManyTags = Array.from({ length: 20 }, (_, i) => `tag${i}`);
        const tooLongTag = 'x'.repeat(51);

        // WHEN: Validating tags
        const result1 = profileValidator.validateTags(tooManyTags);
        const result2 = profileValidator.validateTags([tooLongTag]);

        // THEN: Constraints are enforced
        expect(result1.valid).toBe(false);
        expect(result1.errors?.some((e) => e.code === 'TOO_MANY_TAGS')).toBe(
          true
        );

        expect(result2.valid).toBe(false);
        expect(result2.errors?.some((e) => e.code === 'TAG_TOO_LONG')).toBe(
          true
        );
      });
    });
  });

  describe('ConfigValidator integration', () => {
    describe('full configuration validation', () => {
      it('should validate configuration with profile sections', () => {
        // GIVEN: Configuration with profile data
        const config = {
          profiles: {
            active: 'novel-project',
            list: [
              {
                name: 'novel-project',
                description: 'Profile for novels',
                config: {
                  tts: {
                    defaultEngine: 'chatterbox',
                    outputFormat: 'mp3',
                    sampleRate: 22050,
                    quality: 0.8,
                    rate: 1.0,
                    volume: 1.0,
                  },
                },
              },
            ],
          },
          tts: {
            defaultEngine: 'chatterbox',
            outputFormat: 'mp3',
            sampleRate: 22050,
            quality: 0.8,
            rate: 1.0,
            volume: 1.0,
          },
          logging: {
            level: 'info',
            pretty: true,
            file: false,
          },
        };

        // WHEN: Validating configuration
        const result = configValidator.validate(config as any);

        // THEN: Configuration is valid
        expect(result.success).toBe(true);
      });

      it('should validate profile references', () => {
        // GIVEN: Configuration with profile reference
        const config = {
          profiles: {
            active: 'existing-profile',
          },
          tts: {
            defaultEngine: 'chatterbox',
            outputFormat: 'mp3',
            sampleRate: 22050,
            quality: 0.8,
            rate: 1.0,
            volume: 1.0,
          },
          logging: {
            level: 'info',
            pretty: true,
            file: false,
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
          },
          cache: {
            enabled: true,
            maxSize: 1024,
            ttl: 3600,
          },
        };

        // WHEN: Validating with profile context
        const result = configValidator.validate(config as any, {
          existingProfiles: ['existing-profile'],
        });

        // THEN: Reference is valid
        expect(result.success).toBe(true);
      });

      it('should reject references to non-existent profiles', () => {
        // GIVEN: Configuration with invalid profile reference
        const config = {
          profiles: {
            active: 'non-existent-profile',
          },
          tts: {
            defaultEngine: 'chatterbox',
          },
        };

        // WHEN: Validating with profile context
        const result = configValidator.validate(config as any, {
          existingProfiles: ['existing-profile'],
        });

        // THEN: Reference is invalid
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.path?.includes('profiles.active')).toBe(true);
        }
      });
    });

    describe('nested configuration validation', () => {
      it('should validate deeply nested config structures', () => {
        // GIVEN: Complex nested configuration
        const config = {
          tts: {
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
            defaultEngine: 'chatterbox',
          },
          profiles: {
            active: 'test',
            list: [
              {
                name: 'test',
                config: {
                  tts: {
                    engines: {
                      chatterbox: {
                        enabled: true,
                        options: {
                          rate: 200,
                        },
                      },
                    },
                  },
                },
              },
            ],
          },
        };

        // WHEN: Validating configuration
        const result = configValidator.validate(config as any);

        // THEN: Nested structure is valid
        expect(result.success).toBe(true);
      });

      it('should validate type guards for runtime checking', () => {
        // GIVEN: Configuration object
        const config = {
          tts: {
            defaultEngine: 'chatterbox',
            speed: 1.0,
          },
        };

        // WHEN: Using type guards
        const isValidConfig = configValidator.isValidConfig(config as any);
        const isValidProfileConfig = configValidator.isValidProfileConfig(
          config as any
        );

        // THEN: Type guards work correctly
        expect(isValidConfig).toBe(true);
        expect(isValidProfileConfig).toBe(true);
      });
    });

    describe('error reporting', () => {
      it('should provide detailed error messages', () => {
        // GIVEN: Invalid configuration
        const invalidConfig = {
          tts: {
            // Missing defaultEngine
            rate: -1, // Invalid rate
          },
          output: {
            format: 'invalid-format', // Invalid format
          },
        };

        // WHEN: Validating configuration
        const result = configValidator.validate(invalidConfig as any);

        // THEN: Detailed errors are provided
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.message).toBeDefined();
          expect(result.error.path).toBeDefined();
          expect(result.error.code).toBeDefined();
        }
      });

      it('should provide actionable error messages', () => {
        // GIVEN: Configuration with actionable errors
        const config = {
          tts: {
            defaultEngine: 'non-existent-engine',
          },
        };

        // WHEN: Validating configuration
        const result = configValidator.validate(config as any);

        // THEN: Errors are actionable
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.message).toContain('chatterbox');
          expect(result.error.suggestions?.includes('chatterbox')).toBe(true);
        }
      });
    });

    describe('validation before save', () => {
      it('should validate configuration before saving', async () => {
        // GIVEN: ConfigValidator instance
        const config = {
          tts: { defaultEngine: 'chatterbox' },
          invalidField: 'should be rejected', // Unknown field
        };

        // WHEN: Validating for save
        const result = await configValidator.validateBeforeSave(config as any);

        // THEN: Unknown fields are rejected
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error?.code === 'UNKNOWN_FIELD').toBe(true);
        }
      });

      it('should allow unknown fields in read-only mode', async () => {
        // GIVEN: ConfigValidator in read-only mode
        const config = {
          tts: { defaultEngine: 'chatterbox' },
          unknownField: 'value',
        };

        // WHEN: Validating for save with readOnly option
        const result = await configValidator.validateBeforeSave(config as any, {
          allowUnknownFields: true,
        });

        // THEN: Unknown fields are allowed
        expect(result.success).toBe(true);
      });
    });

    describe('import validation', () => {
      it('should validate imported configuration', async () => {
        // GIVEN: Imported configuration
        const importedConfig = {
          tts: {
            defaultEngine: 'chatterbox',
            speed: 1.5,
          },
          _metadata: {
            importedAt: '2025-11-01T00:00:00Z',
            source: 'external',
          },
        };

        // WHEN: Validating for import
        const result = await configValidator.validateForImport(
          importedConfig as any
        );

        // THEN: Configuration is valid for import
        expect(result.success).toBe(true);
      });

      it('should handle validation of imported configuration with schema version', async () => {
        // GIVEN: Old version configuration
        const oldConfig = {
          _schemaVersion: '0.9.0',
          tts: {
            defaultEngine: 'chatterbox',
          },
        };

        // WHEN: Validating old version
        const result = await configValidator.validateForImport(
          oldConfig as any
        );

        // THEN: Migration warning is provided
        expect(result.success).toBe(true);
        if (result.success) {
          expect(
            result.data.warnings?.some((w: any) => w.code === 'SCHEMA_VERSION')
          ).toBe(true);
        }
      });
    });
  });

  describe('mutation testing resilience', () => {
    it('should catch configuration logic errors', () => {
      // GIVEN: Valid configuration
      const config = {
        tts: { defaultEngine: 'chatterbox', speed: 1.0 },
      };

      // WHEN: Validating configuration multiple times
      const results = Array.from({ length: 5 }, () =>
        configValidator.validate(config as any)
      );

      // THEN: Results are consistent
      for (const result of results) {
        expect(result.success).toBe(true);
      }
    });

    it('should handle edge cases in validation logic', () => {
      // GIVEN: Edge case configurations
      const edgeCases = [
        {}, // Empty config
        { tts: null }, // Null values
        { tts: { defaultEngine: '' } }, // Empty string
        { tts: { defaultEngine: 'CHATTERBOX' } }, // Wrong case
        { tts: { defaultEngine: 'chatterbox', speed: 0 } }, // Zero speed
        { tts: { defaultEngine: 'chatterbox', speed: 10 } }, // High speed
      ];

      // WHEN: Validating edge cases
      const results = edgeCases.map((config) =>
        configValidator.validate(config as any)
      );

      // THEN: All edge cases handled without crashes
      for (const result of results) {
        expect(result).toBeDefined();
        expect(typeof result.success).toBe('boolean');
        if (!result.success) {
          expect(result.error).toBeDefined();
        }
      }
    });
  });
});
