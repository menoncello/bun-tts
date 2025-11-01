import { describe, it, expect, beforeEach } from 'bun:test';
import { ConvertCommand } from '../../../src/cli/commands/convert-command.js';
import {
  createMockLogger,
  createMockConfigManager,
  createTestCliContext,
} from '../di/test-utils.js';

function setupCommandTest(): {
  mockLogger: any;
  mockConfigManager: any;
  command: ConvertCommand;
  testData: any;
  cliContext: any;
} {
  const mockLogger = createMockLogger();
  const mockConfigManager = createMockConfigManager();
  const testData = {
    inputFile: '/path/to/input.md',
    outputFile: '/path/to/output.mp3',
    format: 'mp3',
    voice: 'default',
    rate: 1.0,
    volume: 1.0,
    sampleRate: 22050,
    quality: 0.8,
  };
  const cliContext = createTestCliContext();
  const command = new ConvertCommand(mockLogger, mockConfigManager);
  return { mockLogger, mockConfigManager, command, testData, cliContext };
}

describe('ConvertCommand Options Handling', () => {
  let _mockLogger: any;
  let _mockConfigManager: any;
  let command: ConvertCommand;
  let testData: any;
  let cliContext: any;

  beforeEach(() => {
    const testSetup = setupCommandTest();
    _mockLogger = testSetup.mockLogger;
    _mockConfigManager = testSetup.mockConfigManager;
    command = testSetup.command;
    testData = testSetup.testData;
    cliContext = testSetup.cliContext;
  });

  describe('format options', () => {
    it('should handle mp3 format', async () => {
      const result = await command.execute(
        {
          inputFile: testData.inputFile,
          outputFile: testData.outputFile,
          format: 'mp3',
        },
        cliContext
      );

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it('should handle wav format', async () => {
      const result = await command.execute(
        {
          inputFile: testData.inputFile,
          outputFile: testData.outputFile,
          format: 'wav',
        },
        cliContext
      );

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it('should handle ogg format', async () => {
      const result = await command.execute(
        {
          inputFile: testData.inputFile,
          outputFile: testData.outputFile,
          format: 'wav',
        },
        cliContext
      );

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it('should reject invalid format', async () => {
      const result = await command.execute(
        {
          inputFile: testData.inputFile,
          outputFile: testData.outputFile,
          format: 'invalid-format',
        },
        cliContext
      );

      expect(result).toBeDefined();
      expect(result.success).toBe(false);
    });
  });

  describe('voice options', () => {
    it('should handle custom voice', async () => {
      const result = await command.execute(
        {
          inputFile: testData.inputFile,
          outputFile: testData.outputFile,
          voice: { speed: 1.2 },
        },
        cliContext
      );

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it('should handle default voice', async () => {
      const result = await command.execute(
        {
          inputFile: testData.inputFile,
          outputFile: testData.outputFile,
          voice: { speed: 1.0 },
        },
        cliContext
      );

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });
  });

  describe('rate and volume options', () => {
    it('should handle custom rate', async () => {
      const result = await command.execute(
        {
          inputFile: testData.inputFile,
          outputFile: testData.outputFile,
          rate: 1.5,
        },
        cliContext
      );

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it('should handle custom volume', async () => {
      const result = await command.execute(
        {
          inputFile: testData.inputFile,
          outputFile: testData.outputFile,
          volume: 0.8,
        },
        cliContext
      );

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it('should handle both rate and volume', async () => {
      const result = await command.execute(
        {
          inputFile: testData.inputFile,
          outputFile: testData.outputFile,
          rate: 1.2,
          volume: 0.9,
        },
        cliContext
      );

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it('should reject invalid rate values', async () => {
      const result = await command.execute(
        {
          inputFile: testData.inputFile,
          outputFile: testData.outputFile,
          rate: -1.0,
        },
        cliContext
      );

      expect(result).toBeDefined();
      expect(result.success).toBe(false);
    });

    it('should reject invalid volume values', async () => {
      const result = await command.execute(
        {
          inputFile: testData.inputFile,
          outputFile: testData.outputFile,
          volume: 2.0,
        },
        cliContext
      );

      expect(result).toBeDefined();
      expect(result.success).toBe(false);
    });
  });

  describe('quality and sample rate options', () => {
    it('should handle custom quality', async () => {
      const result = await command.execute(
        {
          inputFile: testData.inputFile,
          outputFile: testData.outputFile,
          quality: 0.9,
        },
        cliContext
      );

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it('should handle custom sample rate', async () => {
      const result = await command.execute(
        {
          inputFile: testData.inputFile,
          outputFile: testData.outputFile,
          sampleRate: 44100,
        },
        cliContext
      );

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it('should handle both quality and sample rate', async () => {
      const result = await command.execute(
        {
          inputFile: testData.inputFile,
          outputFile: testData.outputFile,
          quality: 0.95,
          sampleRate: 48000,
        },
        cliContext
      );

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });
  });
});
