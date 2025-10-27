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

// Polyfill for react-dom/server in Bun environment if needed
if (typeof (globalThis as any).window === 'undefined') {
  // Ensure we have the necessary globals for React testing in Bun
  (globalThis as any).window = {};
}

describe('CLI App Component Tests', () => {
  beforeEach(() => {
    // Reset any global state if needed
  });

  it('should render default greeting with usage hint', () => {
    const { lastFrame } = render(<App flags={{}} input={[]} />);
    const output = stripAnsiCodes(getLastFrameContent(lastFrame));

    expect(output).toContain('Hello, bun-tts');
    expect(output).toContain('Use bun-tts help to see available commands');
  });

  it('should render help message when help flag is provided', () => {
    const { lastFrame } = render(<App flags={{ help: true }} input={[]} />);
    const content = getLastFrameContent(lastFrame);

    expect(content).toContain('bun-tts - Professional Audiobook Creation Tool');
    expect(content).toContain('Usage:');
    expect(content).toContain('Commands:');
  });

  it('should render version message when version command is provided', () => {
    const { lastFrame } = render(<App flags={{}} input={['version']} />);
    const output = stripAnsiCodes(getLastFrameContent(lastFrame));

    expect(output).toContain('bun-tts version 0.1.0');
    expect(output).toContain('Build Information:');
  });

  it('should handle verbose flag correctly', () => {
    const { lastFrame } = render(<App flags={{ verbose: true }} input={[]} />);
    const output = stripAnsiCodes(getLastFrameContent(lastFrame));

    expect(output).toContain('Hello, bun-tts');
    expect(output).toContain('Use bun-tts help to see available commands');
  });

  it('should handle config flag correctly', () => {
    const { lastFrame } = render(
      <App flags={{ config: './config.json' }} input={[]} />
    );
    const output = stripAnsiCodes(getLastFrameContent(lastFrame));

    expect(output).toContain('Hello, bun-tts');
    expect(output).toContain('Use bun-tts help to see available commands');
  });
});
