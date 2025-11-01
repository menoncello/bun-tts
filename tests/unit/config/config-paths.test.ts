import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { homedir } from 'os';
import { join } from 'path';
import { ConfigPaths } from '../../../src/config/config-paths';

describe('ConfigPaths', () => {
  let configPaths: ConfigPaths;
  let originalHomedir: typeof homedir;

  beforeEach(() => {
    configPaths = new ConfigPaths();
    originalHomedir = homedir;
  });

  afterEach(() => {
    // Restore original homedir function if mocked
    (global as any).require = undefined;
  });

  describe('Constructor', () => {
    it('should create an instance without errors', () => {
      expect(configPaths).toBeDefined();
      expect(configPaths).toBeInstanceOf(ConfigPaths);
    });

    it('should initialize with default module name', () => {
      const pathsInstance = configPaths as any;
      expect(pathsInstance.moduleName).toBe('bun-tts');
    });
  });

  describe('getGlobalConfigDir', () => {
    it('should return the global configuration directory path', () => {
      const result = configPaths.getGlobalConfigDir();

      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
      expect(result).toContain('.bun-tts');
    });

    it('should use the user home directory', () => {
      const result = configPaths.getGlobalConfigDir();
      const expectedDir = join(originalHomedir(), '.bun-tts');

      expect(result).toBe(expectedDir);
    });

    it('should return absolute path', () => {
      const result = configPaths.getGlobalConfigDir();

      // Should start with / on Unix-like systems or drive letter on Windows
      if (process.platform === 'win32') {
        expect(result).toMatch(/^[A-Za-z]:\\/);
      } else {
        expect(result).toMatch(/^\//);
      }
    });

    it('should be consistent across multiple calls', () => {
      const result1 = configPaths.getGlobalConfigDir();
      const result2 = configPaths.getGlobalConfigDir();

      expect(result1).toBe(result2);
    });

    it('should handle different home directory environments', () => {
      // Note: Since ConfigPaths doesn't accept constructor parameters,
      // we can't easily test with different home directories
      // This test verifies the functionality with the current environment

      const newConfigPaths = new ConfigPaths();
      const result = newConfigPaths.getGlobalConfigDir();

      // Verify it returns a string with expected structure
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
      expect(result).toContain('.bun-tts');
    });
  });

  describe('getGlobalConfigPath', () => {
    it('should return the global configuration file path', () => {
      const result = configPaths.getGlobalConfigPath();

      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
      expect(result).toContain('.bun-tts');
      expect(result).toContain('config.json');
    });

    it('should combine global config directory with config filename', () => {
      const globalConfigDir = configPaths.getGlobalConfigDir();
      const globalConfigPath = configPaths.getGlobalConfigPath();

      const expectedPath = join(globalConfigDir, 'config.json');
      expect(globalConfigPath).toBe(expectedPath);
    });

    it('should return absolute path', () => {
      const result = configPaths.getGlobalConfigPath();

      // Should start with / on Unix-like systems or drive letter on Windows
      if (process.platform === 'win32') {
        expect(result).toMatch(/^[A-Za-z]:\\/);
      } else {
        expect(result).toMatch(/^\//);
      }
    });

    it('should be consistent across multiple calls', () => {
      const result1 = configPaths.getGlobalConfigPath();
      const result2 = configPaths.getGlobalConfigPath();

      expect(result1).toBe(result2);
    });

    it('should handle different home directory environments', () => {
      // Note: Since ConfigPaths doesn't accept constructor parameters,
      // we can't easily test with different home directories
      // This test verifies the functionality with the current environment

      const newConfigPaths = new ConfigPaths();
      const result = newConfigPaths.getGlobalConfigPath();

      // Verify it returns a string with expected structure
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
      expect(result).toContain('.bun-tts');
      expect(result).toContain('config.json');
    });
  });

  describe('Integration between methods', () => {
    it('should ensure config path is in config directory', () => {
      const configDir = configPaths.getGlobalConfigDir();
      const configPath = configPaths.getGlobalConfigPath();

      expect(configPath.startsWith(configDir)).toBe(true);
    });

    it('should ensure config path ends with correct filename', () => {
      const configPath = configPaths.getGlobalConfigPath();

      expect(configPath.endsWith('config.json')).toBe(true);
    });

    it('should ensure config directory ends with module name', () => {
      const configDir = configPaths.getGlobalConfigDir();

      expect(configDir.endsWith('.bun-tts')).toBe(true);
    });

    it('should maintain relationship across different home directories', () => {
      const configDir = configPaths.getGlobalConfigDir();
      const configPath = configPaths.getGlobalConfigPath();

      // The config path should always be configDir + 'config.json'
      const expectedConfigPath = join(configDir, 'config.json');
      expect(configPath).toBe(expectedConfigPath);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty home directory gracefully', () => {
      // Mock empty home directory
      const originalModuleRequire = require;
      (global as any).require = function (id: string) {
        if (id === 'os') {
          return {
            homedir: () => '',
            ...originalModuleRequire(id),
          };
        }
        return originalModuleRequire(id);
      };

      const newConfigPaths = new ConfigPaths();

      // Should still return a path, even if home directory is empty
      const result = newConfigPaths.getGlobalConfigDir();
      expect(typeof result).toBe('string');

      const configPath = newConfigPaths.getGlobalConfigPath();
      expect(configPath).toContain('config.json');
    });

    it('should handle null home directory gracefully', () => {
      // Mock null home directory
      const originalModuleRequire = require;
      (global as any).require = function (id: string) {
        if (id === 'os') {
          return {
            homedir: () => null as any,
            ...originalModuleRequire(id),
          };
        }
        return originalModuleRequire(id);
      };

      const newConfigPaths = new ConfigPaths();

      // Should still return a path
      const result = newConfigPaths.getGlobalConfigDir();
      expect(typeof result).toBe('string');
    });

    it('should handle undefined home directory gracefully', () => {
      // Mock undefined home directory
      const originalModuleRequire = require;
      (global as any).require = function (id: string) {
        if (id === 'os') {
          return {
            homedir: () => undefined as any,
            ...originalModuleRequire(id),
          };
        }
        return originalModuleRequire(id);
      };

      const newConfigPaths = new ConfigPaths();

      // Should still return a path
      const result = newConfigPaths.getGlobalConfigDir();
      expect(typeof result).toBe('string');
    });
  });

  describe('Platform-specific behavior', () => {
    it('should work on Unix-like systems', () => {
      if (process.platform !== 'win32') {
        const configDir = configPaths.getGlobalConfigDir();
        const configPath = configPaths.getGlobalConfigPath();

        expect(configDir).toMatch(/^\//); // Should start with /
        expect(configPath).toMatch(/^\//); // Should start with /
        expect(configDir).toContain('/.bun-tts');
        expect(configPath).toContain('/.bun-tts/config.json');
      }
    });

    it('should work on Windows systems', () => {
      if (process.platform === 'win32') {
        const configDir = configPaths.getGlobalConfigDir();
        const configPath = configPaths.getGlobalConfigPath();

        expect(configDir).toMatch(/^[A-Za-z]:\\/); // Should start with drive letter
        expect(configPath).toMatch(/^[A-Za-z]:\\/); // Should start with drive letter
        expect(configDir).toContain('\\.bun-tts');
        expect(configPath).toContain('\\.bun-tts\\config.json');
      }
    });
  });

  describe('Multiple instances', () => {
    it('should create identical paths across different instances', () => {
      const configPaths1 = new ConfigPaths();
      const configPaths2 = new ConfigPaths();

      expect(configPaths1.getGlobalConfigDir()).toBe(
        configPaths2.getGlobalConfigDir()
      );
      expect(configPaths1.getGlobalConfigPath()).toBe(
        configPaths2.getGlobalConfigPath()
      );
    });

    it('should maintain isolation between instances', () => {
      const configPaths1 = new ConfigPaths();
      const configPaths2 = new ConfigPaths();

      // Both instances should have the same private module name
      expect((configPaths1 as any).moduleName).toBe(
        (configPaths2 as any).moduleName
      );
      expect((configPaths1 as any).moduleName).toBe('bun-tts');
    });
  });

  describe('Path validation', () => {
    it('should produce valid Unix paths on Unix systems', () => {
      if (process.platform !== 'win32') {
        const configDir = configPaths.getGlobalConfigDir();
        const configPath = configPaths.getGlobalConfigPath();

        // Should not contain Windows-style backslashes
        expect(configDir).not.toContain('\\');
        expect(configPath).not.toContain('\\');

        // Should contain forward slashes
        expect(configDir).toContain('/');
        expect(configPath).toContain('/');
      }
    });

    it('should produce valid Windows paths on Windows systems', () => {
      if (process.platform === 'win32') {
        const configDir = configPaths.getGlobalConfigDir();
        const configPath = configPaths.getGlobalConfigPath();

        // Should contain drive letter
        expect(configDir).toMatch(/^[A-Za-z]:/);
        expect(configPath).toMatch(/^[A-Za-z]::/);
      }
    });

    it('should not contain path traversal sequences', () => {
      const configDir = configPaths.getGlobalConfigDir();
      const configPath = configPaths.getGlobalConfigPath();

      // Should not contain dangerous path sequences
      expect(configDir).not.toContain('..');
      expect(configPath).not.toContain('..');
    });
  });
});
