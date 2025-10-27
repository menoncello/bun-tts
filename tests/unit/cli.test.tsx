import { describe, it, expect, beforeEach } from 'bun:test';
import React from 'react';
import { render } from 'ink-testing-library';
import { App } from '../../src/ui/app.js';

// Helper function to strip ANSI color codes from text
const stripAnsiCodes = (text: string): string => {
  // Remove ANSI escape codes (colors, formatting, etc.)
  return text.replace(/\x1b\[[0-9;]*m/g, '');
};

// Helper function to safely get last frame content
const getLastFrameContent = (lastFrame: () => string | undefined): string => {
  const content = lastFrame();
  return content || '';
};

describe('CLI App - Basic Rendering', () => {
  it('should render default greeting with usage hint', () => {
    const { lastFrame } = render(<App flags={{}} input={[]} />);
    const output = stripAnsiCodes(getLastFrameContent(lastFrame));

    expect(output).toContain('Hello, bun-tts');
    expect(output).toContain('Use bun-tts help to see available commands');
  });

  it('should handle empty input with default greeting', () => {
    const { lastFrame } = render(<App flags={{}} input={[]} />);
    const output = stripAnsiCodes(getLastFrameContent(lastFrame));

    expect(output).toContain('Hello, bun-tts');
    expect(output).toContain('Use bun-tts help to see available commands');
  });
});

describe('CLI App - Help Functionality', () => {
  it('should render enhanced help message when help flag is provided', () => {
    const { lastFrame } = render(<App flags={{ help: true }} input={[]} />);

    validateBasicHelpContent(getLastFrameContent(lastFrame));
  });

  it('should render help message when help command is provided', () => {
    const { lastFrame } = render(<App flags={{}} input={['help']} />);

    expect(getLastFrameContent(lastFrame)).toContain(
      'bun-tts - Professional Audiobook Creation Tool'
    );
    expect(getLastFrameContent(lastFrame)).toContain('Show help message and usage information');
  });

  it('should render verbose help when verbose flag is provided with help', () => {
    const { lastFrame } = render(
      <App flags={{ verbose: true, help: true }} input={[]} />
    );

    validateVerboseHelpContent(getLastFrameContent(lastFrame));
  });

  it('should render proper colored output for different sections', () => {
    const { lastFrame } = render(<App flags={{ help: true }} input={[]} />);

    validateColoredOutput(getLastFrameContent(lastFrame));
  });
});

describe('CLI App - Version Information', () => {
  it('should render enhanced version message with build information', () => {
    const { lastFrame } = render(<App flags={{}} input={['version']} />);
    const output = stripAnsiCodes(getLastFrameContent(lastFrame));

    validateBasicVersionInfo(output);
  });

  it('should show detailed version information with technical specs', () => {
    const { lastFrame } = render(<App flags={{}} input={['version']} />);

    validateDetailedVersionInfo(getLastFrameContent(lastFrame));
  });
});

describe('CLI App - Flag Handling', () => {
  it('should handle verbose flag in default greeting', () => {
    const { lastFrame } = render(<App flags={{ verbose: true }} input={[]} />);
    const output = stripAnsiCodes(getLastFrameContent(lastFrame));

    expect(output).toContain('Hello, bun-tts');
    expect(output).toContain('Use bun-tts help to see available commands');
  });

  it('should handle config flag', () => {
    const { lastFrame } = render(
      <App flags={{ config: './config.json' }} input={[]} />
    );
    const output = stripAnsiCodes(getLastFrameContent(lastFrame));

    expect(output).toContain('Hello, bun-tts');
    expect(output).toContain('Use bun-tts help to see available commands');
  });
});

// Helper validation functions
function validateBasicHelpContent(output: string): void {
  expect(output).toContain('bun-tts - Professional Audiobook Creation Tool');
  expect(output).toContain('Usage:');
  expect(output).toContain('Commands:');
  expect(output).toContain('Options:');
  expect(output).toContain('Examples:');
  expect(output).toContain('Configuration:');
}

function validateVerboseHelpContent(output: string): void {
  expect(output).toContain('bun-tts - Professional Audiobook Creation Tool');
  expect(output).toContain('Verbose Information:');
  expect(output).toContain('Environment Variables:');
  expect(output).toContain('BUN_TTS_LOG_LEVEL');
}

function validateColoredOutput(output: string): void {
  // Should contain different colored sections (this is more of a visual test)
  expect(output.length).toBeGreaterThan(100);
  expect(output).toContain('Professional Audiobook Creation Tool');
  expect(output).toContain('Usage:');
  expect(output).toContain('help');
  expect(output).toContain('version');
  expect(output).toContain('convert');
}

function validateBasicVersionInfo(output: string): void {
  expect(output).toContain('bun-tts version 0.1.0');
  expect(output).toContain('Build Information:');
  expect(output).toContain('Features:');
  expect(output).toContain('✓ TypeScript CLI framework');
}

function validateDetailedVersionInfo(output: string): void {
  expect(output).toContain('Node.js:');
  expect(output).toContain('Platform:');
  expect(output).toContain('TypeScript:');
  expect(output).toContain('React:');
  expect(output).toContain('Ink:');
  expect(output).toContain('Dependencies:');
  expect(output).toContain('Bundle size:');
  expect(output).toContain('License: MIT');
}
