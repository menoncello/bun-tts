import { describe, it, expect, beforeEach, spyOn } from 'bun:test';
import type { OutputWriter } from '../../src/cli/commands/help-command.js';
import { showVersion } from '../../src/utils/version.js';

describe('showVersion', () => {
  let outputWriter: OutputWriter;
  let writeCalls: string[];

  beforeEach(() => {
    writeCalls = [];
    outputWriter = {
      write: (content: string) => {
        writeCalls.push(content);
      },
    };
  });

  it('should display version from package.json', () => {
    showVersion(outputWriter);

    expect(writeCalls).toHaveLength(1);
    expect(writeCalls[0]).toContain('bun-tts v');
  });

  it('should format version correctly', () => {
    showVersion(outputWriter);

    expect(writeCalls[0]).toMatch(/^bun-tts v\d+\.\d+\.\d+$/);
  });

  it('should work without parameters using stdout', () => {
    const stdoutSpy = spyOn(process.stdout, 'write').mockImplementation(() => {
      // Mock implementation for stdout.write - must return boolean
      return true;
    });

    showVersion();

    expect(stdoutSpy).toHaveBeenCalledTimes(1);
    expect(stdoutSpy).toHaveBeenCalledWith(
      expect.stringMatching(/^bun-tts v\d+\.\d+\.\d+\n$/)
    );

    stdoutSpy.mockRestore();
  });
});
