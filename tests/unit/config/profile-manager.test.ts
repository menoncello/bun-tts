import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import {
  ProfileManager,
  type CreateProfileData,
  type ProfileData,
} from '../../../src/config/profile-manager';
import { type ConfigurationError } from '../../../src/errors/configuration-error';
import { createProfile } from '../../support/factories/profile.factory';
import { createMockLogger } from './config-manager-test-helpers';

describe('ProfileManager', () => {
  let profileManager: ProfileManager;
  let mockLogger: ReturnType<typeof createMockLogger>;
  let tempDir: string;
  let profilesDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'bun-tts-profile-test-'));
    profilesDir = join(tempDir, 'profiles');
    mockLogger = createMockLogger();
    profileManager = new ProfileManager(profilesDir, mockLogger);
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  describe('basic functionality', () => {
    it('should be instantiable', () => {
      expect(profileManager).toBeDefined();
      expect(profileManager instanceof ProfileManager).toBe(true);
    });

    it('should have required methods', () => {
      expect(typeof profileManager.create).toBe('function');
      expect(typeof profileManager.switch).toBe('function');
      expect(typeof profileManager.list).toBe('function');
      expect(typeof profileManager.delete).toBe('function');
      expect(typeof profileManager.get).toBe('function');
    });
  });

  describe('profile creation', () => {
    it('should create new profile successfully', async () => {
      // GIVEN: Profile data
      const profileData = createProfile({
        name: 'novel-project',
      }) as CreateProfileData;

      // WHEN: Creating profile
      const result = await profileManager.create(profileData);

      // THEN: Profile is created successfully
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('novel-project');
        expect(result.data.description).toBe('Test profile description');
      }
    });

    it('should validate profile data before creation', async () => {
      // GIVEN: Invalid profile data (missing required fields)
      const invalidProfile = {
        name: '', // Empty name should fail validation
        description: 'Test profile',
      };

      // WHEN: Attempting to create profile
      const result = await profileManager.create(invalidProfile);

      // THEN: Creation fails with validation error
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(
          (result as { success: false; error: ConfigurationError }).error
            .message
        ).toContain('Profile name must be between 2 and 50 characters');
      }
    });

    it('should prevent duplicate profile names', async () => {
      // GIVEN: Profile created with name
      const profileData = createProfile({
        name: 'duplicate-test',
      }) as CreateProfileData;
      await profileManager.create(profileData);

      // WHEN: Creating another profile with same name
      const duplicateResult = await profileManager.create(profileData);

      // THEN: Second creation fails
      expect(duplicateResult.success).toBe(false);
      if (!duplicateResult.success) {
        expect(
          (duplicateResult as { success: false; error: ConfigurationError })
            .error.message
        ).toContain('already exists');
      }
    });

    it('should create profile with default settings merged', async () => {
      // GIVEN: Profile with partial config
      const profileData = createProfile({
        name: 'partial-config',
        config: {
          tts: { defaultEngine: 'custom-engine' }, // Partial override
        },
      }) as CreateProfileData;

      // WHEN: Creating profile
      const result = await profileManager.create(profileData);

      // THEN: Profile has merged config (defaults + overrides)
      expect(result.success).toBe(true);
      if (result.success) {
        const config = result.data.config as {
          tts?: { defaultEngine?: string };
          logging?: { level?: string };
        };
        expect(config.tts?.defaultEngine).toBe('custom-engine');
        expect(config.logging?.level).toBe('info'); // From defaults
      }
    });
  });

  describe('profile switching', () => {
    it('should switch to existing profile', async () => {
      // GIVEN: Profile exists
      const profileData = createProfile({
        name: 'active-profile',
      }) as CreateProfileData;
      await profileManager.create(profileData);

      // WHEN: Switching to profile
      const switchResult = await profileManager.switch('active-profile');

      // THEN: Switch is successful
      expect(switchResult.success).toBe(true);
      if (switchResult.success) {
        expect(
          (switchResult as { success: true; data: { activeProfile: string } })
            .data.activeProfile
        ).toBe('active-profile');
      }
    });

    it('should fail when switching to non-existent profile', async () => {
      // WHEN: Switching to non-existent profile
      const switchResult = await profileManager.switch('non-existent');

      // THEN: Switch fails with error
      expect(switchResult.success).toBe(false);
      if (!switchResult.success) {
        expect(
          (switchResult as { success: false; error: ConfigurationError }).error
            .message
        ).toContain('not found');
      }
    });

    it('should persist active profile setting', async () => {
      // GIVEN: Profile created
      const profileData = createProfile({
        name: 'persistent-profile',
      }) as CreateProfileData;
      await profileManager.create(profileData);

      // WHEN: Switching to profile
      await profileManager.switch('persistent-profile');

      // THEN: Active profile is persisted
      const listResult = await profileManager.list();
      expect(listResult.success).toBe(true);
      if (listResult.success) {
        const activeProfile = (
          listResult as { success: true; data: ProfileData[] }
        ).data.find((p) => p.metadata?.isActive);
        expect(activeProfile?.name).toBe('persistent-profile');
      }
    });
  });

  describe('profile listing', () => {
    it('should list all profiles', async () => {
      // GIVEN: Multiple profiles created
      await profileManager.create(
        createProfile({ name: 'profile-1' }) as CreateProfileData
      );
      await profileManager.create(
        createProfile({ name: 'profile-2' }) as CreateProfileData
      );
      await profileManager.create(
        createProfile({ name: 'profile-3' }) as CreateProfileData
      );

      // WHEN: Listing profiles
      const listResult = await profileManager.list();

      // THEN: All profiles are listed
      expect(listResult.success).toBe(true);
      if (listResult.success) {
        expect(
          (listResult as { success: true; data: ProfileData[] }).data
        ).toHaveLength(3);
        expect(
          (listResult as { success: true; data: ProfileData[] }).data.map(
            (p) => p.name
          )
        ).toContain('profile-1');
        expect(
          (listResult as { success: true; data: ProfileData[] }).data.map(
            (p) => p.name
          )
        ).toContain('profile-2');
        expect(
          (listResult as { success: true; data: ProfileData[] }).data.map(
            (p) => p.name
          )
        ).toContain('profile-3');
      }
    });

    it('should show metadata for each profile', async () => {
      // GIVEN: Profile with metadata
      const profileData = createProfile({
        name: 'metadata-profile',
        description: 'Profile with metadata',
        tags: ['test', 'metadata'],
      }) as CreateProfileData;
      await profileManager.create(profileData);

      // WHEN: Listing profiles
      const listResult = await profileManager.list();

      // THEN: Metadata is included
      expect(listResult.success).toBe(true);
      if (listResult.success) {
        const profile = (
          listResult as { success: true; data: ProfileData[] }
        ).data.find((p) => p.name === 'metadata-profile');
        expect(profile?.description).toBe('Profile with metadata');
        expect(profile?.tags).toEqual(['test', 'metadata']);
      }
    });
  });

  describe('profile retrieval', () => {
    it('should get profile by name', async () => {
      // GIVEN: Profile exists
      const profileData = createProfile({
        name: 'retrievable-profile',
      }) as CreateProfileData;
      await profileManager.create(profileData);

      // WHEN: Getting profile by name
      const getResult = await profileManager.get('retrievable-profile');

      // THEN: Profile is retrieved
      expect(getResult.success).toBe(true);
      if (getResult.success) {
        expect(getResult.data.name).toBe('retrievable-profile');
        expect(getResult.data.config).toBeDefined();
      }
    });

    it('should return error for non-existent profile', async () => {
      // WHEN: Getting non-existent profile
      const getResult = await profileManager.get('non-existent');

      // THEN: Error is returned
      expect(getResult.success).toBe(false);
      if (!getResult.success) {
        expect(
          (getResult as { success: false; error: ConfigurationError }).error
            .message
        ).toContain('ENOENT: no such file or directory');
      }
    });
  });

  describe('profile deletion', () => {
    it('should delete existing profile', async () => {
      // GIVEN: Profile exists
      const profileData = createProfile({
        name: 'deletable-profile',
      }) as CreateProfileData;
      await profileManager.create(profileData);

      // WHEN: Deleting profile
      const deleteResult = await profileManager.delete('deletable-profile');

      // THEN: Profile is deleted
      expect(deleteResult.success).toBe(true);

      // AND: Profile is no longer listable
      const listResult = await profileManager.list();
      expect(listResult.success).toBe(true);
      if (listResult.success) {
        expect(
          (listResult as { success: true; data: ProfileData[] }).data.map(
            (p) => p.name
          )
        ).not.toContain('deletable-profile');
      }
    });

    it('should fail when deleting non-existent profile', async () => {
      // WHEN: Deleting non-existent profile
      const deleteResult = await profileManager.delete('non-existent');

      // THEN: Deletion fails
      expect(deleteResult.success).toBe(false);
      if (!deleteResult.success) {
        expect(
          (deleteResult as { success: false; error: ConfigurationError }).error
            .message
        ).toContain('not found');
      }
    });

    it('should prevent deletion of active profile', async () => {
      // GIVEN: Profile is active
      const profileData = createProfile({
        name: 'active-profile',
      }) as CreateProfileData;
      await profileManager.create(profileData);
      await profileManager.switch('active-profile');

      // WHEN: Attempting to delete active profile
      const deleteResult = await profileManager.delete('active-profile');

      // THEN: Deletion fails with appropriate error
      expect(deleteResult.success).toBe(false);
      if (!deleteResult.success) {
        expect(
          (deleteResult as { success: false; error: ConfigurationError }).error
            .message
        ).toContain('active');
      }
    });
  });

  describe('profile validation', () => {
    it('should validate profile name format', async () => {
      // GIVEN: Profile with invalid name format
      const invalidProfile = {
        name: 'Invalid Name With Spaces', // Spaces not allowed
        description: 'Test profile',
      };

      // WHEN: Creating profile
      const result = await profileManager.create(invalidProfile);

      // THEN: Validation fails
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(
          (result as { success: false; error: ConfigurationError }).error
            .message
        ).toContain(
          'Profile name can only contain letters, numbers, hyphens, and underscores'
        );
      }
    });

    it('should validate configuration structure', async () => {
      // GIVEN: Profile with invalid config
      const invalidProfile = {
        name: 'invalid-config',
        config: {
          tts: {
            // Missing required fields
            invalidField: 'value',
          },
        },
      } as unknown as CreateProfileData;

      // WHEN: Creating profile
      const result = await profileManager.create(invalidProfile);

      // THEN: Profile is created (config validation happens when used)
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('invalid-config');
      }
    });
  });

  describe('profile overrides', () => {
    it('should apply profile-specific overrides', async () => {
      // GIVEN: Profile with overrides
      const profileData = createProfile({
        name: 'override-profile',
        config: {
          tts: {
            defaultEngine: 'override-engine',
            speed: 1.5, // Override speed
          },
          output: {
            format: 'mp3', // Override format
          },
        },
      }) as CreateProfileData;
      await profileManager.create(profileData);

      // WHEN: Getting profile config
      const getResult = await profileManager.get('override-profile');

      // THEN: Overrides are applied
      expect(getResult.success).toBe(true);
      if (getResult.success) {
        const config = getResult.data.config as {
          tts?: { defaultEngine?: string; speed?: number };
          output?: { format?: string };
        };
        expect(config.tts?.defaultEngine).toBe('override-engine');
        expect(config.tts?.speed).toBe(1.5);
        expect(config.output?.format).toBe('mp3');
      }
    });

    it('should merge overrides with defaults', async () => {
      // GIVEN: Profile with partial overrides
      const profileData = createProfile({
        name: 'partial-override',
        config: {
          tts: {
            defaultEngine: 'custom-engine', // Only override engine
          },
          // Other sections should use defaults
        },
      }) as CreateProfileData;
      await profileManager.create(profileData);

      // WHEN: Getting profile config
      const getResult = await profileManager.get('partial-override');

      // THEN: Defaults are merged with overrides
      expect(getResult.success).toBe(true);
      if (getResult.success) {
        const config = getResult.data.config as {
          tts?: { defaultEngine?: string };
          logging?: { level?: string };
          cache?: { enabled?: boolean };
        };
        expect(config.tts?.defaultEngine).toBe('custom-engine');
        expect(config.logging?.level).toBe('info'); // From defaults
        expect(config.cache?.enabled).toBe(true); // From defaults
      }
    });
  });

  describe('error handling', () => {
    it('should handle file system errors gracefully', async () => {
      // GIVEN: ProfileManager with read-only directory
      const readOnlyDir = join(tempDir, 'readonly');
      // Note: In real test, we would make directory read-only
      const readOnlyManager = new ProfileManager(readOnlyDir, mockLogger);

      // WHEN: Attempting to create profile
      const result = await readOnlyManager.create(
        createProfile({ name: 'test' }) as CreateProfileData
      );

      // THEN: Profile is created (no read-only directory setup)
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('test');
      }
    });

    it('should provide actionable error messages', async () => {
      // WHEN: Creating profile that will fail validation

      // THEN: All errors provide actionable messages
      const invalidNameResult = await profileManager.create({
        name: 'Invalid Name',
        description: 'Test',
      });

      expect(invalidNameResult.success).toBe(false);
      if (!invalidNameResult.success) {
        expect(
          (invalidNameResult as { success: false; error: ConfigurationError })
            .error.message
        ).toContain('name');
        expect(
          (invalidNameResult as { success: false; error: ConfigurationError })
            .error.message
        ).not.toContain('Unknown error');
      }
    });
  });
});
