import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Retrieves the version from package.json
 * @returns The version string from package.json or fallback
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
 * Shows the version information to console
 * @returns void
 */
export function showVersion(): void {
  console.log(`bun-tts v${getVersion()}`);
}
