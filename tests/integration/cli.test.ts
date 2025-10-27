import { spawn } from 'child_process';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { describe, it, expect } from 'bun:test';

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '..');

describe('CLI Integration Tests', () => {
  const cliPath = join(__dirname, '../../src/cli/index.tsx');

  it('should show help when called with --help flag', async () => {
    const result = await Bun.$`bun run ${cliPath} --help`.text();

    // Check that help content is present (ignore any log output)
    expect(result).toContain('bun-tts - Professional Audiobook Creation Tool');
    expect(result).toContain('Usage:');
    expect(result).toContain('Commands:');
    expect(result).toContain('Options:');
  });

  it('should show help when called with help command', async () => {
    const result = await Bun.$`bun run ${cliPath} help`.text();

    // Check that help content is present (ignore any log output)
    expect(result).toContain('bun-tts - Professional Audiobook Creation Tool');
    expect(result).toContain('Usage:');
    expect(result).toContain('Commands:');
    expect(result).toContain('Options:');
  });

  it('should show version when called with version command', async () => {
    const result = await Bun.$`bun run ${cliPath} version`.text();

    expect(result).toContain('bun-tts version 0.1.0');
    expect(result).toContain('Build Information:');
  });

  it('should show version when called with --version flag', async () => {
    const result = await Bun.$`bun run ${cliPath} --version`.text();

    expect(result).toContain('bun-tts version 0.1.0');
    expect(result).toContain('Build Information:');
  });

  it('should handle unknown command gracefully', async () => {
    try {
      await Bun.$`bun run ${cliPath} unknown-command`.text();
    } catch (error: any) {
      expect(error.stderr?.toString()).toContain('Unknown command');
    }
  });

  it('should handle no arguments gracefully', async () => {
    const result = await Bun.$`bun run ${cliPath}`.text();

    expect(result).toContain('Hello, bun-tts');
    expect(result).toContain('Use bun-tts help to see available commands');
  });

  it('should support verbose flag', async () => {
    const result = await Bun.$`bun run ${cliPath} --verbose help`.text();

    expect(result).toContain('bun-tts - Professional Audiobook Creation Tool');
    expect(result).toContain('Verbose Information:');
  });

  it('should support config flag', async () => {
    // Test with non-existent config file - should not crash
    const result =
      await Bun.$`bun run ${cliPath} --config /non/existent/config.json help`.text();

    expect(result).toContain('bun-tts - Professional Audiobook Creation Tool');
  });
});
