import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { showVersion } from '../../src/utils/version.js';
import { mockConsole } from '../utils/testHelpers.js';

describe('showVersion', () => {
  let consoleMock: ReturnType<typeof mockConsole>;

  beforeEach(() => {
    consoleMock = mockConsole();
  });

  afterEach(() => {
    consoleMock.restore();
  });

  it('should display version from package.json', () => {
    showVersion();

    expect(consoleMock.logs).toHaveLength(1);
    expect(consoleMock.logs[0]).toContain('bun-tts v');
  });

  it('should format version correctly', () => {
    showVersion();

    expect(consoleMock.logs[0]).toMatch(/^bun-tts v\d+\.\d+\.\d+$/);
  });
});
