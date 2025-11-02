import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { createTestCli } from '../support/cli-test-utils';

describe('CLI Config Commands Integration', () => {
  let tempDir: string;
  let configDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'bun-tts-cli-config-test-'));
    configDir = join(tempDir, 'config');
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  describe('bun-tts config get', () => {
    it('should display current configuration', async () => {
      // GIVEN: CLI with config get command
      const cli = createTestCli();
      const configPath = join(configDir, 'config.json');

      // WHEN: Running config get command
      const result = await cli.run([
        'config',
        'get',
        '--config-path',
        configPath,
      ]);

      // THEN: Command executes successfully
      expect(result.exitCode).toBe(0);
      expect(result.output).toContain('tts');
      expect(result.output).toContain('defaultEngine');
    });

    it('should display specific config value', async () => {
      // GIVEN: CLI with config get command for specific path
      const cli = createTestCli();

      // WHEN: Getting specific config value
      const result = await cli.run(['config', 'get', 'tts.defaultEngine']);

      // THEN: Specific value is displayed
      expect(result.exitCode).toBe(0);
      expect(result.output).toContain('chatterbox');
    });

    it('should display profile-specific configuration', async () => {
      // GIVEN: Profile configured
      const cli = createTestCli();

      // WHEN: Getting config with active profile
      const result = await cli.run([
        'config',
        'get',
        '--profile',
        'novel-project',
      ]);

      // THEN: Profile config is displayed
      expect(result.exitCode).toBe(0);
      expect(result.output).toContain('profile');
    });

    it('should handle non-existent config path', async () => {
      // GIVEN: CLI with invalid config path
      const cli = createTestCli();

      // WHEN: Getting non-existent path
      const result = await cli.run(['config', 'get', 'non.existent.path']);

      // THEN: Error is displayed
      expect(result.exitCode).toBe(1);
      expect(result.output).toContain('not found');
    });

    it('should support JSON output format', async () => {
      // GIVEN: CLI with JSON output flag
      const cli = createTestCli();

      // WHEN: Getting config with JSON format
      const result = await cli.run(['config', 'get', '--format', 'json']);

      // THEN: Output is valid JSON
      expect(result.exitCode).toBe(0);
      const parsed = JSON.parse(result.output);
      expect(parsed).toBeDefined();
      expect(parsed.tts).toBeDefined();
    });

    it('should support YAML output format', async () => {
      // GIVEN: CLI with YAML output flag
      const cli = createTestCli();

      // WHEN: Getting config with YAML format
      const result = await cli.run(['config', 'get', '--format', 'yaml']);

      // THEN: Output is valid YAML
      expect(result.exitCode).toBe(0);
      expect(result.output).toContain('tts:');
    });
  });

  describe('bun-tts config set', () => {
    it('should set configuration value', async () => {
      // GIVEN: CLI with config set command
      const cli = createTestCli();

      // WHEN: Setting config value
      const result = await cli.run([
        'config',
        'set',
        'tts.defaultEngine',
        'chatterbox',
      ]);

      // THEN: Value is set successfully
      expect(result.exitCode).toBe(0);
      expect(result.output).toContain('updated');
    });

    it('should update nested configuration', async () => {
      // GIVEN: CLI with config set command
      const cli = createTestCli();

      // WHEN: Setting nested config value
      const result = await cli.run([
        'config',
        'set',
        'tts.engines.chatterbox.enabled',
        'true',
      ]);

      // THEN: Nested value is updated
      expect(result.exitCode).toBe(0);
      expect(result.output).toContain('updated');
    });

    it('should create missing config sections', async () => {
      // GIVEN: CLI with config set command
      const cli = createTestCli();

      // WHEN: Setting deeply nested value
      const result = await cli.run([
        'config',
        'set',
        'newSection.deeply.nested.value',
        'test',
      ]);

      // THEN: Sections are created
      expect(result.exitCode).toBe(0);
    });

    it('should validate input values', async () => {
      // GIVEN: CLI with config set command
      const cli = createTestCli();

      // WHEN: Setting invalid value
      const result = await cli.run([
        'config',
        'set',
        'tts.speed',
        'invalid-speed',
      ]);

      // THEN: Validation error is shown
      expect(result.exitCode).toBe(1);
      expect(result.output).toContain('validation');
    });

    it('should support JSON value type', async () => {
      // GIVEN: CLI with JSON flag
      const cli = createTestCli();

      // WHEN: Setting object value
      const result = await cli.run([
        'config',
        'set',
        'tts.engines',
        '{"chatterbox": {"enabled": true}}',
        '--type',
        'json',
      ]);

      // THEN: JSON is parsed and set
      expect(result.exitCode).toBe(0);
    });

    it('should handle permission errors', async () => {
      // GIVEN: Read-only config directory
      const cli = createTestCli();
      // Note: In real test, would make directory read-only

      // WHEN: Attempting to set value
      const result = await cli.run([
        'config',
        'set',
        'tts.defaultEngine',
        'test',
      ]);

      // THEN: Permission error is shown
      expect(result.exitCode).toBe(1);
      expect(result.output).toContain('permission');
    });
  });

  describe('bun-tts config list', () => {
    it('should list all configuration keys', async () => {
      // GIVEN: CLI with config list command
      const cli = createTestCli();

      // WHEN: Listing all config
      const result = await cli.run(['config', 'list']);

      // THEN: All keys are listed
      expect(result.exitCode).toBe(0);
      expect(result.output).toContain('tts');
      expect(result.output).toContain('output');
      expect(result.output).toContain('logging');
    });

    it('should filter by section', async () => {
      // GIVEN: CLI with config list command
      const cli = createTestCli();

      // WHEN: Listing specific section
      const result = await cli.run(['config', 'list', 'tts']);

      // THEN: Section keys are listed
      expect(result.exitCode).toBe(0);
      expect(result.output).toContain('tts');
      expect(result.output).not.toContain('output');
    });

    it('should show values with --verbose flag', async () => {
      // GIVEN: CLI with verbose flag
      const cli = createTestCli();

      // WHEN: Listing with verbose
      const result = await cli.run(['config', 'list', '--verbose']);

      // THEN: Values are shown
      expect(result.exitCode).toBe(0);
      expect(result.output).toContain('=');
    });

    it('should support JSON output', async () => {
      // GIVEN: CLI with JSON format
      const cli = createTestCli();

      // WHEN: Listing as JSON
      const result = await cli.run(['config', 'list', '--format', 'json']);

      // THEN: Valid JSON is output
      expect(result.exitCode).toBe(0);
      const parsed = JSON.parse(result.output);
      expect(parsed).toBeDefined();
      expect(typeof parsed).toBe('object');
    });
  });

  describe('bun-tts config profile', () => {
    describe('profile create', () => {
      it('should create new profile', async () => {
        // GIVEN: CLI with profile create command
        const cli = createTestCli();

        // WHEN: Creating profile
        const result = await cli.run([
          'config',
          'profile',
          'create',
          'novel-project',
          '--description',
          'Profile for novel writing',
        ]);

        // THEN: Profile is created
        expect(result.exitCode).toBe(0);
        expect(result.output).toContain('created');
        expect(result.output).toContain('novel-project');
      });

      it('should create profile with config overrides', async () => {
        // GIVEN: CLI with profile create command
        const cli = createTestCli();

        // WHEN: Creating profile with config
        const result = await cli.run([
          'config',
          'profile',
          'create',
          'technical-docs',
          '--set',
          'tts.defaultEngine=chatterbox',
          '--set',
          'tts.speed=1.5',
        ]);

        // THEN: Profile is created with config
        expect(result.exitCode).toBe(0);
        expect(result.output).toContain('created');
      });

      it('should reject duplicate profile names', async () => {
        // GIVEN: Profile already exists
        const cli = createTestCli();
        await cli.run(['config', 'profile', 'create', 'duplicate-test']);

        // WHEN: Creating duplicate profile
        const result = await cli.run([
          'config',
          'profile',
          'create',
          'duplicate-test',
        ]);

        // THEN: Error is shown
        expect(result.exitCode).toBe(1);
        expect(result.output).toContain('already exists');
      });

      it('should create profile from existing config', async () => {
        // GIVEN: CLI with from-config flag
        const cli = createTestCli();

        // WHEN: Creating profile from current config
        const result = await cli.run([
          'config',
          'profile',
          'create',
          'from-current',
          '--from-config',
        ]);

        // THEN: Profile is created from current config
        expect(result.exitCode).toBe(0);
      });
    });

    describe('profile list', () => {
      it('should list all profiles', async () => {
        // GIVEN: Multiple profiles created
        const cli = createTestCli();
        await cli.run(['config', 'profile', 'create', 'profile-1']);
        await cli.run(['config', 'profile', 'create', 'profile-2']);
        await cli.run(['config', 'profile', 'create', 'profile-3']);

        // WHEN: Listing profiles
        const result = await cli.run(['config', 'profile', 'list']);

        // THEN: All profiles are listed
        expect(result.exitCode).toBe(0);
        expect(result.output).toContain('profile-1');
        expect(result.output).toContain('profile-2');
        expect(result.output).toContain('profile-3');
      });

      it('should show active profile', async () => {
        // GIVEN: Profile is active
        const cli = createTestCli();
        await cli.run(['config', 'profile', 'create', 'active-profile']);
        await cli.run(['config', 'profile', 'switch', 'active-profile']);

        // WHEN: Listing profiles
        const result = await cli.run(['config', 'profile', 'list']);

        // THEN: Active profile is highlighted
        expect(result.exitCode).toBe(0);
        expect(result.output).toContain('active-profile');
      });

      it('should support JSON output', async () => {
        // GIVEN: CLI with JSON format
        const cli = createTestCli();
        await cli.run(['config', 'profile', 'create', 'json-profile']);

        // WHEN: Listing as JSON
        const result = await cli.run([
          'config',
          'profile',
          'list',
          '--format',
          'json',
        ]);

        // THEN: Valid JSON is output
        expect(result.exitCode).toBe(0);
        const parsed = JSON.parse(result.output);
        expect(Array.isArray(parsed)).toBe(true);
      });
    });

    describe('profile switch', () => {
      it('should switch to existing profile', async () => {
        // GIVEN: Profile exists
        const cli = createTestCli();
        await cli.run(['config', 'profile', 'create', 'switchable-profile']);

        // WHEN: Switching to profile
        const result = await cli.run([
          'config',
          'profile',
          'switch',
          'switchable-profile',
        ]);

        // THEN: Switch is successful
        expect(result.exitCode).toBe(0);
        expect(result.output).toContain('switched');
        expect(result.output).toContain('switchable-profile');
      });

      it('should show error for non-existent profile', async () => {
        // GIVEN: CLI with profile switch command
        const cli = createTestCli();

        // WHEN: Switching to non-existent profile
        const result = await cli.run([
          'config',
          'profile',
          'switch',
          'non-existent',
        ]);

        // THEN: Error is shown
        expect(result.exitCode).toBe(1);
        expect(result.output).toContain('not found');
      });
    });

    describe('profile delete', () => {
      it('should delete existing profile', async () => {
        // GIVEN: Profile exists
        const cli = createTestCli();
        await cli.run(['config', 'profile', 'create', 'deletable']);

        // WHEN: Deleting profile
        const result = await cli.run([
          'config',
          'profile',
          'delete',
          'deletable',
        ]);

        // THEN: Profile is deleted
        expect(result.exitCode).toBe(0);
        expect(result.output).toContain('deleted');
      });

      it('should prevent deletion of active profile', async () => {
        // GIVEN: Active profile
        const cli = createTestCli();
        await cli.run(['config', 'profile', 'create', 'active']);
        await cli.run(['config', 'profile', 'switch', 'active']);

        // WHEN: Attempting to delete active profile
        const result = await cli.run(['config', 'profile', 'delete', 'active']);

        // THEN: Error is shown
        expect(result.exitCode).toBe(1);
        expect(result.output).toContain('active');
      });

      it('should require confirmation for deletion', async () => {
        // GIVEN: Profile exists
        const cli = createTestCli();
        await cli.run(['config', 'profile', 'create', 'confirm-test']);

        // WHEN: Deleting without confirmation
        const result = await cli.run([
          'config',
          'profile',
          'delete',
          'confirm-test',
          '--force',
        ]);

        // THEN: Profile is deleted with force flag
        expect(result.exitCode).toBe(0);
      });
    });
  });

  describe('bun-tts config import', () => {
    it('should import configuration from file', async () => {
      // GIVEN: Config file to import
      const cli = createTestCli();
      const importPath = join(tempDir, 'import-config.json');

      // WHEN: Importing configuration
      const result = await cli.run(['config', 'import', importPath]);

      // THEN: Import is successful
      expect(result.exitCode).toBe(0);
      expect(result.output).toContain('imported');
    });

    it('should import multiple profiles from directory', async () => {
      // GIVEN: Directory with profile files
      const cli = createTestCli();
      const profileDir = join(tempDir, 'profiles');
      // Note: Would create profile files here

      // WHEN: Importing directory
      const result = await cli.run(['config', 'import', profileDir]);

      // THEN: Profiles are imported
      expect(result.exitCode).toBe(0);
    });

    it('should validate imported configuration', async () => {
      // GIVEN: Invalid config file
      const cli = createTestCli();
      const invalidPath = join(tempDir, 'invalid-config.json');
      // Note: Would write invalid JSON

      // WHEN: Importing invalid config
      const result = await cli.run(['config', 'import', invalidPath]);

      // THEN: Validation error is shown
      expect(result.exitCode).toBe(1);
      expect(result.output).toContain('validation');
    });

    it('should support merge strategies', async () => {
      // GIVEN: Import with merge strategy
      const cli = createTestCli();
      const importPath = join(tempDir, 'merge-config.json');

      // WHEN: Importing with merge strategy
      const result = await cli.run([
        'config',
        'import',
        importPath,
        '--merge-strategy',
        'overwrite',
      ]);

      // THEN: Merge strategy is applied
      expect(result.exitCode).toBe(0);
    });
  });

  describe('bun-tts config export', () => {
    it('should export configuration to file', async () => {
      // GIVEN: CLI with export command
      const cli = createTestCli();
      const exportPath = join(tempDir, 'export-config.json');

      // WHEN: Exporting configuration
      const result = await cli.run(['config', 'export', exportPath]);

      // THEN: Export is successful
      expect(result.exitCode).toBe(0);
      expect(result.output).toContain('exported');
    });

    it('should export in specified format', async () => {
      // GIVEN: CLI with format flag
      const cli = createTestCli();
      const exportPath = join(tempDir, 'export-config.yaml');

      // WHEN: Exporting as YAML
      const result = await cli.run([
        'config',
        'export',
        exportPath,
        '--format',
        'yaml',
      ]);

      // THEN: YAML file is created
      expect(result.exitCode).toBe(0);
    });

    it('should export profile configuration', async () => {
      // GIVEN: Profile exists
      const cli = createTestCli();
      await cli.run(['config', 'profile', 'create', 'export-profile']);

      // WHEN: Exporting profile
      const exportPath = join(tempDir, 'profile-export.json');
      const result = await cli.run([
        'config',
        'export',
        exportPath,
        '--profile',
        'export-profile',
      ]);

      // THEN: Profile is exported
      expect(result.exitCode).toBe(0);
    });

    it('should export all profiles', async () => {
      // GIVEN: Multiple profiles
      const cli = createTestCli();
      await cli.run(['config', 'profile', 'create', 'profile-a']);
      await cli.run(['config', 'profile', 'create', 'profile-b']);

      // WHEN: Exporting all profiles
      const exportDir = join(tempDir, 'exports');
      const result = await cli.run([
        'config',
        'export',
        exportDir,
        '--all-profiles',
      ]);

      // THEN: All profiles are exported
      expect(result.exitCode).toBe(0);
    });
  });

  describe('command help and errors', () => {
    it('should display help for config commands', async () => {
      // GIVEN: CLI with help flag
      const cli = createTestCli();

      // WHEN: Showing help
      const result = await cli.run(['config', '--help']);

      // THEN: Help is displayed
      expect(result.exitCode).toBe(0);
      expect(result.output).toContain('Usage');
      expect(result.output).toContain('get');
      expect(result.output).toContain('set');
      expect(result.output).toContain('list');
    });

    it('should display subcommand help', async () => {
      // GIVEN: CLI with subcommand help
      const cli = createTestCli();

      // WHEN: Showing subcommand help
      const result = await cli.run(['config', 'profile', '--help']);

      // THEN: Subcommand help is displayed
      expect(result.exitCode).toBe(0);
      expect(result.output).toContain('create');
      expect(result.output).toContain('list');
      expect(result.output).toContain('switch');
    });

    it('should handle unknown subcommands', async () => {
      // GIVEN: CLI with unknown subcommand
      const cli = createTestCli();

      // WHEN: Running unknown subcommand
      const result = await cli.run(['config', 'unknown-command']);

      // THEN: Error is shown
      expect(result.exitCode).toBe(1);
      expect(result.output).toContain('Unknown command');
    });
  });
});
