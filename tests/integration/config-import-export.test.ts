import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import {
  mkdtempSync,
  rmSync,
  writeFileSync,
  readFileSync,
  mkdirSync,
} from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { ConfigManager } from '../../src/config/config-manager';
import { ProfileManager } from '../../src/config/profile-manager';
import { createMockLogger } from '../unit/config/config-manager-test-helpers';

describe('Configuration Import/Export Integration', () => {
  let tempDir: string;
  let profilesDir: string;
  let exportDir: string;
  let configManager: ConfigManager;
  let profileManager: ProfileManager;
  let mockLogger: ReturnType<typeof createMockLogger>;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'bun-tts-import-export-test-'));
    profilesDir = join(tempDir, 'profiles');
    exportDir = join(tempDir, 'exports');
    mockLogger = createMockLogger();
    configManager = new ConfigManager();
    profileManager = new ProfileManager(profilesDir, mockLogger);
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  describe('export configuration to JSON', () => {
    it('should export single configuration to JSON file', async () => {
      // GIVEN: ConfigManager with configuration
      const config = {
        tts: {
          defaultEngine: 'test-engine',
          speed: 1.0,
          voice: 'test-voice',
        },
        logging: {
          level: 'info',
        },
      };

      const exportPath = join(exportDir, 'single-config.json');

      // WHEN: Exporting configuration to JSON
      const exportResult = await configManager.export(
        config,
        exportPath,
        'json'
      );

      // THEN: Export is successful
      expect(exportResult.success).toBe(true);

      // AND: File is created with correct content
      const fileContent = readFileSync(exportPath, 'utf-8');
      const exportedConfig = JSON.parse(fileContent);
      expect(exportedConfig.tts.defaultEngine).toBe('test-engine');
      expect(exportedConfig.tts.speed).toBe(1.0);
    });

    it('should export configuration with metadata', async () => {
      // GIVEN: ConfigManager with configuration and metadata
      const config = {
        tts: {
          defaultEngine: 'metadata-test',
        },
        _metadata: {
          exportedAt: '2025-11-01T00:00:00Z',
          version: '1.0.0',
          source: 'bun-tts',
        },
      };

      const exportPath = join(exportDir, 'metadata-config.json');

      // WHEN: Exporting configuration
      const exportResult = await configManager.export(
        config,
        exportPath,
        'json'
      );

      // THEN: Metadata is included in export
      expect(exportResult.success).toBe(true);
      const fileContent = readFileSync(exportPath, 'utf-8');
      const exportedConfig = JSON.parse(fileContent);
      expect(exportedConfig._metadata.exportedAt).toBeDefined();
      expect(exportedConfig._metadata.version).toBeDefined();
    });
  });

  describe('export profiles', () => {
    it('should export all profiles to directory', async () => {
      // GIVEN: Multiple profiles created
      await profileManager.create({ name: 'novel' });
      await profileManager.create({ name: 'technical' });
      await profileManager.create({ name: 'academic' });

      // WHEN: Exporting all profiles
      const exportResult = await profileManager.export(profilesDir, exportDir);

      // THEN: Export is successful
      expect(exportResult.success).toBe(true);

      // AND: Each profile is exported to separate file
      expect(
        readFileSync(join(exportDir, 'novel.json'), 'utf-8')
      ).toBeDefined();
      expect(
        readFileSync(join(exportDir, 'technical.json'), 'utf-8')
      ).toBeDefined();
      expect(
        readFileSync(join(exportDir, 'academic.json'), 'utf-8')
      ).toBeDefined();
    });
  });

  describe('import configuration from JSON', () => {
    it('should import configuration from JSON file', async () => {
      // GIVEN: JSON config file exists
      const importPath = join(tempDir, 'import-config.json');
      const configData = {
        tts: {
          defaultEngine: 'kokoro',
          speed: 2.0,
        },
        output: {
          format: 'mp3',
        },
      };
      writeFileSync(importPath, JSON.stringify(configData, null, 2));

      // WHEN: Importing configuration from JSON
      const importResult = await configManager.import(importPath);

      // THEN: Configuration is imported successfully
      expect(importResult.success).toBe(true);
      if (importResult.success) {
        const data = importResult.data as {
          tts?: { defaultEngine?: string; speed?: number };
          output?: { format?: string };
        };
        expect(data.tts?.defaultEngine).toBe('kokoro');
        expect(data.tts?.speed).toBe(2.0);
        expect(data.output?.format).toBe('mp3');
      }
    });

    it('should validate configuration during import', async () => {
      // GIVEN: Invalid config file
      const importPath = join(tempDir, 'invalid-config.json');
      const invalidData = {
        tts: {
          defaultEngine: 'invalid-engine-name',
        },
        output: {
          format: 'invalid-format',
        },
      };
      writeFileSync(importPath, JSON.stringify(invalidData, null, 2));

      // WHEN: Importing invalid configuration
      const importResult = await configManager.import(importPath);

      // THEN: Import fails with validation error
      expect(importResult.success).toBe(false);
      if (!importResult.success) {
        const error = (importResult as { success: false; error: Error }).error;
        expect(error.message).toContain('Invalid TTS engine');
      }
    });
  });

  describe('import profiles from directory', () => {
    it('should import all profiles from directory', async () => {
      // GIVEN: Profile export files in directory
      const exportFilesDir = join(tempDir, 'exports');
      const profile1Data = {
        name: 'import-1',
        description: 'Test profile 1',
        tags: ['test'],
        config: { tts: { defaultEngine: 'engine-1' } },
      };
      const profile2Data = {
        name: 'import-2',
        description: 'Test profile 2',
        tags: ['test'],
        config: { tts: { defaultEngine: 'engine-2' } },
      };

      // Ensure export directory exists
      mkdirSync(exportFilesDir, { recursive: true });
      writeFileSync(
        join(exportFilesDir, 'import-1.json'),
        JSON.stringify(profile1Data, null, 2)
      );
      writeFileSync(
        join(exportFilesDir, 'import-2.json'),
        JSON.stringify(profile2Data, null, 2)
      );

      // WHEN: Importing profiles from directory
      const importResult = await profileManager.import(exportFilesDir);

      // THEN: All profiles are imported
      expect(importResult.success).toBe(true);
      if (importResult.success) {
        expect(importResult.data.importedCount).toBe(2);
        expect(importResult.data.failedCount).toBe(0);
      }

      // AND: Profiles can be listed
      const listResult = await profileManager.list();
      expect(listResult.success).toBe(true);
      if (listResult.success) {
        expect(listResult.data).toHaveLength(2);
      }
    });

    it('should handle import with merge strategy', async () => {
      // GIVEN: Existing profile and imported profile with same name
      await profileManager.create({
        name: 'merge-test',
        config: {
          logging: { level: 'info', pretty: true, file: false },
          tts: {
            defaultEngine: 'chatterbox',
            outputFormat: 'mp3',
            sampleRate: 22050,
            quality: 0.9,
            rate: 1.0,
            volume: 1.0,
          },
          processing: {
            maxFileSize: 100,
            parallel: false,
            maxWorkers: 2,
            tempDir: tempDir,
          },
          cli: { showProgress: true, colors: true, debug: false },
          cache: {
            enabled: false,
            dir: join(tempDir, 'cache'),
            maxSize: 1000,
            ttl: 3600,
          },
        },
      });

      const exportFilesDir = join(tempDir, 'exports');
      const updatedProfile = {
        name: 'merge-test',
        description: 'Updated profile',
        tags: ['test'],
        config: {
          logging: { level: 'info', pretty: true, file: false },
          tts: {
            defaultEngine: 'kokoro',
            outputFormat: 'mp3',
            sampleRate: 22050,
            quality: 0.9,
            rate: 1.0,
            volume: 1.0,
          },
          processing: {
            maxFileSize: 100,
            parallel: false,
            maxWorkers: 2,
            tempDir: tempDir,
          },
          cli: { showProgress: true, colors: true, debug: false },
          cache: {
            enabled: false,
            dir: join(tempDir, 'cache'),
            maxSize: 1000,
            ttl: 3600,
          },
        },
      };
      // Ensure export directory exists
      mkdirSync(exportFilesDir, { recursive: true });
      writeFileSync(
        join(exportFilesDir, 'merge-test.json'),
        JSON.stringify(updatedProfile, null, 2)
      );

      // WHEN: Importing with merge strategy
      const importResult = await profileManager.import(exportFilesDir, {
        mergeStrategy: 'overwrite',
      });

      // THEN: Profile is merged/overwritten
      expect(importResult.success).toBe(true);
      const getResult = await profileManager.get('merge-test');
      if (getResult.success) {
        const config = getResult.data.config as {
          tts?: { defaultEngine?: string };
        };
        expect(config.tts?.defaultEngine).toBe('kokoro');
      }
    });

    it('should report failed imports', async () => {
      // GIVEN: Mix of valid and invalid profile files
      const exportFilesDir = join(tempDir, 'exports');
      const validProfile = {
        name: 'valid',
        description: 'Valid profile',
        tags: ['test'],
        config: { tts: { defaultEngine: 'valid' } },
      };
      const invalidProfile = {
        name: '', // Invalid: empty name
        description: 'Invalid profile',
      };

      // Ensure export directory exists
      mkdirSync(exportFilesDir, { recursive: true });
      writeFileSync(
        join(exportFilesDir, 'valid.json'),
        JSON.stringify(validProfile, null, 2)
      );
      writeFileSync(
        join(exportFilesDir, 'invalid.json'),
        JSON.stringify(invalidProfile, null, 2)
      );

      // WHEN: Importing profiles
      const importResult = await profileManager.import(exportFilesDir);

      // THEN: Report shows failures
      expect(importResult.success).toBe(true);
      if (importResult.success) {
        expect(importResult.data.importedCount).toBe(1);
        expect(importResult.data.failedCount).toBe(1);
        expect(importResult.data.errors).toHaveLength(1);
      }
    });
  });

  describe('batch import/export', () => {
    it('should export multiple configurations in batch', async () => {
      // GIVEN: Multiple configurations
      const configs = [
        { name: 'config-1', data: { tts: { defaultEngine: 'engine-1' } } },
        { name: 'config-2', data: { tts: { defaultEngine: 'engine-2' } } },
        { name: 'config-3', data: { tts: { defaultEngine: 'engine-3' } } },
      ];

      // WHEN: Exporting configs in batch
      const exportResult = await configManager.exportBatch(configs, exportDir);

      // THEN: All configs are exported
      expect(exportResult.success).toBe(true);
      if (exportResult.success) {
        expect(exportResult.data.successful).toBe(3);
        expect(exportResult.data.failed).toBe(0);
      }

      // AND: Files are created
      for (const config of configs) {
        const filePath = join(exportDir, `${config.name}.json`);
        expect(readFileSync(filePath, 'utf-8')).toBeDefined();
      }
    });

    it('should handle batch export with partial failures', async () => {
      // GIVEN: Configs with one invalid
      const configs = [
        { name: 'valid-1', data: { tts: { defaultEngine: 'engine-1' } } },
        { name: 'valid-2', data: { tts: { defaultEngine: 'engine-2' } } },
        { name: '', data: { tts: { defaultEngine: 'invalid' } } }, // Empty name will fail
      ];

      // WHEN: Exporting batch
      const exportResult = await configManager.exportBatch(configs, exportDir);

      // THEN: Report partial success
      expect(exportResult.success).toBe(true);
      if (exportResult.success) {
        expect(exportResult.data.successful).toBe(2);
        expect(exportResult.data.failed).toBe(1);
        expect(exportResult.data.errors).toHaveLength(1);
      }
    });
  });

  describe('merge strategies', () => {
    it('should support merge strategy for imports', async () => {
      // GIVEN: Existing profile
      await profileManager.create({
        name: 'merge-strategy-test',
        config: {
          logging: { level: 'info', pretty: true, file: false },
          tts: {
            defaultEngine: 'chatterbox',
            outputFormat: 'mp3',
            sampleRate: 22050,
            quality: 0.9,
            rate: 1.0,
            volume: 1.0,
          },
          processing: {
            maxFileSize: 100,
            parallel: false,
            maxWorkers: 2,
            tempDir: tempDir,
          },
          cli: { showProgress: true, colors: true, debug: false },
          cache: {
            enabled: false,
            dir: join(tempDir, 'cache'),
            maxSize: 1000,
            ttl: 3600,
          },
        },
      });

      const exportFilesDir = join(tempDir, 'exports');
      const updatedProfile = {
        name: 'merge-strategy-test',
        description: 'Updated profile',
        tags: ['test'],
        config: {
          logging: { level: 'info', pretty: true, file: false },
          tts: {
            defaultEngine: 'kokoro',
            outputFormat: 'mp3',
            sampleRate: 22050,
            quality: 0.9,
            rate: 1.0,
            volume: 1.0,
          },
          processing: {
            maxFileSize: 100,
            parallel: false,
            maxWorkers: 2,
            tempDir: tempDir,
          },
          cli: { showProgress: true, colors: true, debug: false },
          cache: {
            enabled: false,
            dir: join(tempDir, 'cache'),
            maxSize: 1000,
            ttl: 3600,
          },
        },
      };
      // Ensure export directory exists
      mkdirSync(exportFilesDir, { recursive: true });
      writeFileSync(
        join(exportFilesDir, 'merge-strategy-test.json'),
        JSON.stringify(updatedProfile, null, 2)
      );

      // WHEN: Importing with skip strategy
      await profileManager.import(exportFilesDir, {
        mergeStrategy: 'skip',
      });

      // THEN: Existing profile is preserved
      const getResult = await profileManager.get('merge-strategy-test');
      if (getResult.success) {
        const config = getResult.data.config as {
          tts?: { defaultEngine?: string };
        };
        expect(config.tts?.defaultEngine).toBe('chatterbox');
      }
    });
  });

  describe('file format detection', () => {
    it('should auto-detect JSON format', async () => {
      // GIVEN: File with .json extension
      const importPath = join(tempDir, 'auto-detect.json');
      writeFileSync(
        importPath,
        JSON.stringify({ tts: { defaultEngine: 'chatterbox' } })
      );

      // WHEN: Importing without format specified
      const importResult = await configManager.import(importPath);

      // THEN: Format is auto-detected
      expect(importResult.success).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should handle missing import file', async () => {
      // GIVEN: Non-existent file path
      const importPath = join(tempDir, 'non-existent.json');

      // WHEN: Attempting to import
      const importResult = await configManager.import(importPath);

      // THEN: Error is returned
      expect(importResult.success).toBe(false);
      if (!importResult.success) {
        const error = (importResult as { success: false; error: Error }).error;
        expect(error.message).toContain('not found');
      }
    });

    it('should handle invalid file format', async () => {
      // GIVEN: File with invalid content
      const importPath = join(tempDir, 'invalid-format.json');
      writeFileSync(importPath, '{ invalid json content }');

      // WHEN: Attempting to import
      const importResult = await configManager.import(importPath);

      // THEN: Parse error is returned
      expect(importResult.success).toBe(false);
      if (!importResult.success) {
        const error = (importResult as { success: false; error: Error }).error;
        expect(error.message).toContain('parse');
      }
    });

    it('should handle permission errors during export', async () => {
      // GIVEN: Invalid export path that will cause permission error
      // Using a system directory that typically requires elevated permissions
      const testDir = '/root/bun-tts-test-export'; // This should fail on most Unix systems
      const testPath = join(testDir, 'config.json');

      // WHEN: Attempting to export to system directory
      const exportResult = await configManager.export(
        { tts: { defaultEngine: 'kokoro' } },
        testPath,
        'json'
      );

      // THEN: Error is returned due to permission issues
      expect(exportResult.success).toBe(false);
      if (!exportResult.success) {
        const error = (exportResult as { success: false; error: Error }).error;
        expect(error.message).toBeDefined();
        // Should contain permission-related error message
        expect(
          error.message.toLowerCase().includes('permission') ||
            error.message.toLowerCase().includes('eacces') ||
            error.message.toLowerCase().includes('denied') ||
            error.message.toLowerCase().includes('erofs') ||
            error.message.toLowerCase().includes('read-only')
        ).toBe(true);
      }
    });
  });
});
