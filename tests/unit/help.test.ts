import { describe, it, expect } from 'bun:test';
import { generateHelp, generateVersionInfo } from '../../src/cli/help.js';

function validateHelpStructure(helpText: string): void {
  const lines = helpText.split('\n');

  expect(lines.length).toBeGreaterThan(20);
  expect(lines.some((line) => line.includes('Usage:'))).toBe(true);
  expect(lines.some((line) => line.includes('Commands:'))).toBe(true);
  expect(lines.some((line) => line.includes('Options:'))).toBe(true);
  expect(lines.some((line) => line.includes('Examples:'))).toBe(true);
}

function validateVersionStructure(versionText: string): void {
  const lines = versionText.split('\n');

  expect(lines.length).toBeGreaterThan(15);
  expect(lines.some((line) => line.includes('Build Information:'))).toBe(true);
  expect(lines.some((line) => line.includes('Features:'))).toBe(true);
}

describe('CLI Help Generation', () => {
  it('should generate general help message', () => {
    const helpText = generateHelp();

    expect(helpText).toContain(
      'bun-tts - Professional Audiobook Creation Tool'
    );
    expect(helpText).toContain('Usage:');
    expect(helpText).toContain('Commands:');
    expect(helpText).toContain('Options:');
    expect(helpText).toContain('Examples:');
    expect(helpText).toContain('Configuration:');
  });

  it('should include all commands in help', () => {
    const helpText = generateHelp();

    expect(helpText).toContain('help');
    expect(helpText).toContain('version');
    expect(helpText).toContain('convert');
  });

  it('should include all options', () => {
    const helpText = generateHelp();

    expect(helpText).toContain('-h, --help');
    expect(helpText).toContain('-v, --verbose');
    expect(helpText).toContain('-c, --config');
  });

  it('should include examples', () => {
    const helpText = generateHelp();

    expect(helpText).toContain('bun-tts help');
    expect(helpText).toContain('bun-tts version');
    expect(helpText).toContain('bun-tts convert book.pdf');
  });

  it('should have proper structure and formatting', () => {
    const helpText = generateHelp();
    validateHelpStructure(helpText);
  });
});

describe('CLI Help Command-Specific Features', () => {
  it('should handle command-specific help', () => {
    const helpText = generateHelp({ command: 'version' });

    expect(helpText).toContain('version - Show version information');
    expect(helpText).toContain('Examples:');
  });

  it('should handle unknown command help', () => {
    const helpText = generateHelp({ command: 'unknown' });

    expect(helpText).toContain('Unknown command: unknown');
    expect(helpText).toContain(
      "Run 'bun-tts help' to see available commands"
    );
  });
});

describe('CLI Help Verbose Mode', () => {
  it('should include verbose information when verbose flag is set', () => {
    const helpText = generateHelp({ verbose: true });

    expect(helpText).toContain('Verbose Information:');
    expect(helpText).toContain('Logging level set to DEBUG');
    expect(helpText).toContain('Environment Variables:');
    expect(helpText).toContain('BUN_TTS_LOG_LEVEL');
  });

  it('should not include verbose information by default', () => {
    const helpText = generateHelp();

    expect(helpText).not.toContain('Verbose Information:');
    expect(helpText).not.toContain('Environment Variables:');
  });
});

describe('CLI Version Information Generation', () => {
  it('should generate basic version information', () => {
    const versionText = generateVersionInfo();

    expect(versionText).toContain('bun-tts version 0.1.0');
    expect(versionText).toContain('Build Information:');
    expect(versionText).toContain('Features:');
    expect(versionText).toContain('Dependencies:');
    expect(versionText).toContain('Bundle size:');
    expect(versionText).toContain('License: MIT');
  });

  it('should have proper formatting', () => {
    const versionText = generateVersionInfo();
    validateVersionStructure(versionText);
  });
});

describe('CLI Version Build Information', () => {
  it('should include build environment details', () => {
    const versionText = generateVersionInfo();

    expect(versionText).toContain('Node.js:');
    expect(versionText).toContain('Platform:');
    expect(versionText).toContain('TypeScript:');
    expect(versionText).toContain('React:');
    expect(versionText).toContain('Ink:');
  });

  it('should include technical details', () => {
    const versionText = generateVersionInfo();

    expect(versionText).toContain('Dependencies:');
    expect(versionText).toContain('Bundle size:');
    expect(versionText).toContain('License: MIT');
  });
});

describe('CLI Version Feature Checklist', () => {
  it('should include comprehensive feature list', () => {
    const versionText = generateVersionInfo();

    expect(versionText).toContain('✓ TypeScript CLI framework');
    expect(versionText).toContain('✓ React-based TUI interface');
    expect(versionText).toContain('✓ Structured logging with Pino');
    expect(versionText).toContain('✓ Configuration management');
    expect(versionText).toContain('✓ Error handling framework');
    expect(versionText).toContain('✓ Unit testing with Bun Test');
  });
});
