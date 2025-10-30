import { homedir } from 'os';
import { join } from 'path';

/**
 * Configuration path utilities for bun-tts
 *
 * Provides methods for generating configuration file paths and directories,
 * supporting both global and local configuration locations.
 */
export class ConfigPaths {
  private readonly moduleName = 'bun-tts';

  /**
   * Get global configuration directory
   *
   * Returns the path to the global configuration directory in the user's home directory.
   *
   * @returns {string} The absolute path to the global config directory
   */
  getGlobalConfigDir(): string {
    return join(homedir(), '.bun-tts');
  }

  /**
   * Get global configuration file path
   *
   * Returns the full path to the global configuration file.
   *
   * @returns {string} The absolute path to the global config file
   */
  getGlobalConfigPath(): string {
    return join(this.getGlobalConfigDir(), 'config.json');
  }
}
