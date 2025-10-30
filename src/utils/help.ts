/**
 * Display comprehensive help information for the CLI application
 *
 * @param {any} cli - CLI object containing help information
 * @param {string} cli.help - The help text to display for the CLI application
 * @returns {void} This function outputs help text to console and returns undefined
 *
 * @example
 * ```typescript
 * showHelp({ help: 'My CLI Application v1.0.0' });
 * // Outputs formatted help text with commands and examples
 * ```
 */
import { logger } from './logger.js';

/**
 * Display help information for the CLI application
 * @param {{help: string}} cli - CLI configuration object
 * @param {string} cli.help - Help text to display
 */
export function showHelp(cli: { help: string }): void {
  logger.info(`
${cli.help}

Available Commands:
  help, --help     Show this help message
  version, --version Show version information

Examples:
  $ bun-tts --name=Jane      Greet the user with name
  $ bun-tts -n John          Short form of name flag
  $ bun-tts help             Show this help
  $ bun-tts version          Show version

For more information, visit: https://github.com/your-username/bun-tts
`);
}
