import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import type { OutputWriter } from '../cli/commands/help-command.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Retrieves the version from package.json
 * @returns {any} The version string from package.json or fallback
 */
function getVersion(): string {
  try {
    const packageJsonPath = join(__dirname, '../../package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
    return packageJson.version || '0.0.0';
  } catch {
    return '0.0.0';
  }
}

/**
 * Shows the version information to the provided output writer or stdout
 * @param {OutputWriter} [outputWriter] - Optional output writer for displaying version (defaults to stdout)
 * @returns {void}
 */
export function showVersion(outputWriter?: OutputWriter): void {
  const versionText = `bun-tts v${getVersion()}`;

  if (outputWriter) {
    outputWriter.write(versionText);
  } else {
    // Use process.stdout.write instead of console.log for consistency
    process.stdout.write(`${versionText}\n`);
  }
}
