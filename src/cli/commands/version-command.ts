import type { Logger } from '../../interfaces/logger.js';
import type { CliContext } from '../../types/index.js';

/**
 * Command class responsible for displaying version information for the bun-tts CLI application.
 * This command uses dependency injection pattern for logging functionality and provides
 * detailed build and runtime information when executed.
 */
export class VersionCommand {
  /**
   * Creates a new instance of the VersionCommand.
   *
   * @param logger - The logger instance used for logging command execution details
   */
  constructor(private logger: Logger) {}

  /**
   * Executes the version command, displaying comprehensive version and build information.
   * Shows the application version, Node.js runtime details, platform information,
   * architecture, and build timestamp. Also logs the command execution for monitoring.
   *
   * @param _context - The CLI context (not used in this command but required by interface)
   */
  public async execute(_context: CliContext): Promise<void> {
    const versionText = `bun-tts version 0.1.0

Build Information:
  Node.js: ${process.version}
  Platform: ${process.platform}
  Architecture: ${process.arch}
  Built: ${new Date().toISOString()}`;

    console.log(versionText);
    this.logger.info('Version command executed', {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
    });
  }
}
