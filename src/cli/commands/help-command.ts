import type { Logger } from '../../interfaces/logger.js';
import type { CliContext } from '../../types/index.js';

/**
 * Output writer interface for dependency injection pattern.
 * This allows for better testability and separation of concerns.
 */
export interface OutputWriter {
  /**
   * Writes content to the output stream.
   */
  write: (content: string) => void;
}

/**
 * Console output writer implementation using dependency injection.
 * Provides a clean abstraction over console.log for better testability.
 */
export class ConsoleOutputWriter implements OutputWriter {
  /**
   * Writes content to standard output.
   * @param {string} content - The content to write to output
   */
  public write(content: string): void {
    process.stdout.write(`${content}\n`);
  }
}

/**
 * Help Command - Shows help message and usage information.
 *
 * This command displays comprehensive help information about the bun-tts CLI tool,
 * including available commands, options, examples, and verbose debugging information.
 * Uses dependency injection for logging and output functionality to improve testability
 * and follow SOLID principles.
 */
export class HelpCommand {
  /**
   * Creates a new HelpCommand instance.
   *
   * @param {Logger} logger - Logger instance for structured logging
   * @param {any} outputWriter - Output writer for displaying help content (defaults to ConsoleOutputWriter)
   * @throws {Error} When logger is not provided
   */
  constructor(
    private readonly logger: Logger,
    private readonly outputWriter: OutputWriter = new ConsoleOutputWriter()
  ) {
    if (!logger) {
      throw new Error('Logger is required for HelpCommand');
    }
    if (!outputWriter) {
      throw new Error('OutputWriter is required for HelpCommand');
    }
  }

  /**
   * Executes the help command based on the provided CLI context.
   *
   * Displays help information with optional verbose details based on the
   * verbose flag in the context. Uses dependency injection for output to
   * improve testability and maintainability.
   *
   * @param {any} context - The CLI context containing flags and configuration
   * @returns {Promise<void>} Promise that resolves when help display is complete
   */
  public async execute(context: CliContext): Promise<void> {
    const helpText = this.generateHelpText();

    if (context.flags.verbose) {
      const verboseInfo = this.generateVerboseInfo();
      this.outputWriter.write(helpText.trim() + verboseInfo);
      this.logger.debug('Help command executed with verbose information');
      return;
    }

    this.outputWriter.write(helpText.trim());
    this.logger.info('Help command executed');
  }

  /**
   * Generates the main help text content.
   *
   * @returns {string} Formatted help text string
   */
  private generateHelpText(): string {
    return `
bun-tts - Professional Audiobook Creation Tool

Usage:
  bun-tts [command] [options]
  bun-tts [file] [options]

Commands:
  help       Show help message and usage information
  version    Show version information
  convert    Convert a document to audiobook format

Options:
  -h, --help      Show this help message
  -v, --verbose   Enable verbose logging
  -c, --config    Path to configuration file

Examples:
  bun-tts help                    Show help message
  bun-tts version                 Show version information
  bun-tts convert book.pdf        Convert PDF to audiobook
  bun-tts --verbose convert       Convert with verbose logging
  bun-tts --config cfg.json file  Use custom configuration
`;
  }

  /**
   * Generates verbose debugging information.
   *
   * @returns {string} Formatted verbose information string
   */
  private generateVerboseInfo(): string {
    return `
Verbose Information:
  Debug logging enabled
  Log level set to: debug
  Environment: ${process.env.NODE_ENV || 'development'}
  Process ID: ${process.pid}
  Node.js version: ${process.version}
  Platform: ${process.platform} (${process.arch})
`;
  }
}
