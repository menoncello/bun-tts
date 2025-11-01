/**
 * File system operations interface for configuration management
 * Allows dependency injection for testing with mock file systems
 */
export interface FileSystemOperations {
  /**
   * Read file content
   * @param {string} path - File path to read
   * @returns {Promise<string | null>} File content or null if file doesn't exist
   */
  readFile: (path: string) => Promise<string | null>;

  /**
   * Write content to file
   * @param {string} path - File path to write
   * @param {string} content - Content to write
   * @returns {Promise<void>}
   */
  writeFile: (path: string, content: string) => Promise<void>;

  /**
   * Check if file exists
   * @param {string} path - File path to check
   * @returns {Promise<boolean>} True if file exists
   */
  exists: (path: string) => Promise<boolean>;

  /**
   * Delete file
   * @param {string} path - File path to delete
   * @returns {Promise<void>}
   */
  deleteFile: (path: string) => Promise<void>;
}

/**
 * Default file system operations using Node.js fs/promises
 */
export class DefaultFileSystemOperations implements FileSystemOperations {
  async readFile(path: string): Promise<string | null> {
    try {
      const fs = await import('fs/promises');
      return await fs.readFile(path, 'utf-8');
    } catch {
      return null;
    }
  }

  async writeFile(path: string, content: string): Promise<void> {
    const fs = await import('fs/promises');
    await fs.writeFile(path, content, 'utf-8');
  }

  async exists(path: string): Promise<boolean> {
    try {
      const fs = await import('fs/promises');
      await fs.access(path);
      return true;
    } catch {
      return false;
    }
  }

  async deleteFile(path: string): Promise<void> {
    const fs = await import('fs/promises');
    await fs.unlink(path);
  }
}
