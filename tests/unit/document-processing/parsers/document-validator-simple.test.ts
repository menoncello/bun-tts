/**
 * Comprehensive tests for document-validator.ts
 * Tests document validation utilities with high coverage
 * Simplified version that matches actual implementation behavior
 */

import { describe, it, expect, beforeEach, mock } from 'bun:test';
import type { MarkdownParserConfig } from '../../../../src/core/document-processing/config/markdown-parser-config';
import { MarkdownParseError } from '../../../../src/core/document-processing/errors/markdown-parse-error';
import { MarkdownParseErrorCodeEnum } from '../../../../src/core/document-processing/errors/markdown-parse-error-types';
import {
  validateAndPrepareInput,
  handleParsingError,
} from '../../../../src/core/document-processing/parsers/document-validator';
import type { Logger } from '../../../../src/interfaces/index';

describe('Document Validator [Priority: CRITICAL]', () => {
  let mockLogger: Logger;
  let mockConfig: MarkdownParserConfig;

  beforeEach(() => {
    mockLogger = {
      error: mock((_msg: string) => {
        /* Mock implementation */
      }),
      info: mock((_msg: string) => {
        /* Mock implementation */
      }),
      warn: mock((_msg: string) => {
        /* Mock implementation */
      }),
      debug: mock((_msg: string) => {
        /* Mock implementation */
      }),
    } as any;

    mockConfig = {
      maxFileSize: 1, // 1MB
      allowedEncodings: ['utf-8', 'utf-16'],
      maxLineLength: 1000,
      validationOptions: {
        strictMode: false,
        allowUnknownHeaders: true,
      },
    } as any;
  });

  describe('validateAndPrepareInput', () => {
    describe('Valid Input Handling', () => {
      it('should validate and return valid string content', () => {
        const input = 'Valid markdown content';
        const result = validateAndPrepareInput(input, mockConfig);

        expect(result).toBe(input);
      });

      it('should handle normal size string content', () => {
        const input = 'A'.repeat(100); // Small content
        const result = validateAndPrepareInput(input, mockConfig);

        expect(result).toBe(input);
      });

      it('should handle string with special characters', () => {
        const input = 'Content with émojis 🎉 and special chars æøå';
        const result = validateAndPrepareInput(input, mockConfig);

        expect(result).toBe(input);
      });

      it('should handle string with newlines and formatting', () => {
        const input =
          '# Title\n\nSome **bold** text and *italic* text.\n\n- List item 1\n- List item 2';
        const result = validateAndPrepareInput(input, mockConfig);

        expect(result).toBe(input);
      });

      it('should validate and convert valid UTF-8 buffer to string', () => {
        const input = Buffer.from('Valid buffer content', 'utf-8');
        const result = validateAndPrepareInput(input, mockConfig);

        expect(result).toBe('Valid buffer content');
      });

      it('should handle buffer with special characters', () => {
        const content = 'Buffer with special chars: 你好, 🌍';
        const input = Buffer.from(content, 'utf-8');
        const result = validateAndPrepareInput(input, mockConfig);

        expect(result).toBe(content);
      });

      it('should handle large buffer within size limit', () => {
        const content = 'A'.repeat(500000); // 500KB
        const input = Buffer.from(content, 'utf-8');
        const result = validateAndPrepareInput(input, mockConfig);

        expect(result).toBe(content);
      });
    });

    describe('Invalid Input Handling', () => {
      it('should handle empty string input', () => {
        const input = '';
        const result = validateAndPrepareInput(input, mockConfig);

        expect(result).toBeInstanceOf(MarkdownParseError);
        expect((result as MarkdownParseError).code).toBe(
          MarkdownParseErrorCodeEnum.INVALID_SYNTAX
        );
      });

      it('should handle whitespace-only string input', () => {
        const input = '   \n\n\t   \n\n   ';
        const result = validateAndPrepareInput(input, mockConfig);

        expect(result).toBeInstanceOf(MarkdownParseError);
        expect((result as MarkdownParseError).code).toBe(
          MarkdownParseErrorCodeEnum.INVALID_SYNTAX
        );
      });

      it('should handle empty buffer', () => {
        const input = Buffer.alloc(0);
        const result = validateAndPrepareInput(input, mockConfig);

        expect(result).toBeInstanceOf(MarkdownParseError);
        expect((result as MarkdownParseError).code).toBe(
          MarkdownParseErrorCodeEnum.INVALID_SYNTAX
        );
      });

      it('should handle null input', () => {
        const result = validateAndPrepareInput(null as any, mockConfig);

        expect(result).toBeInstanceOf(MarkdownParseError);
        expect((result as MarkdownParseError).code).toBe(
          MarkdownParseErrorCodeEnum.INVALID_INPUT
        );
      });

      it('should handle undefined input', () => {
        const result = validateAndPrepareInput(undefined as any, mockConfig);

        expect(result).toBeInstanceOf(MarkdownParseError);
        expect((result as MarkdownParseError).code).toBe(
          MarkdownParseErrorCodeEnum.INVALID_INPUT
        );
      });

      it('should handle invalid input types', () => {
        const invalidInputs = [123, {}, [], true, Symbol('test')];

        for (const input of invalidInputs) {
          const result = validateAndPrepareInput(input as any, mockConfig);
          expect(result).toBeInstanceOf(MarkdownParseError);
          expect((result as MarkdownParseError).code).toBe(
            MarkdownParseErrorCodeEnum.INVALID_INPUT
          );
        }
      });
    });

    describe('File Size Validation', () => {
      it('should reject content that exceeds max file size', () => {
        // Create content larger than 1MB (1024 * 1024 bytes)
        const largeContent = 'A'.repeat(1024 * 1024 + 1);
        const result = validateAndPrepareInput(largeContent, mockConfig);

        expect(result).toBeInstanceOf(MarkdownParseError);
        expect((result as MarkdownParseError).code).toBe(
          MarkdownParseErrorCodeEnum.FILE_TOO_LARGE
        );
      });

      it('should accept content exactly at max file size', () => {
        const content = 'A'.repeat(1024 * 1024); // Exactly 1MB
        const result = validateAndPrepareInput(content, mockConfig);

        expect(result).toBe(content);
      });

      it('should reject buffer that exceeds max file size', () => {
        const largeBuffer = Buffer.alloc(1024 * 1024 + 100); // > 1MB
        const result = validateAndPrepareInput(largeBuffer, mockConfig);

        expect(result).toBeInstanceOf(MarkdownParseError);
        expect((result as MarkdownParseError).code).toBe(
          MarkdownParseErrorCodeEnum.FILE_TOO_LARGE
        );
      });

      it('should accept buffer exactly at max file size', () => {
        const buffer = Buffer.alloc(1024 * 1024); // Exactly 1MB
        const result = validateAndPrepareInput(buffer, mockConfig);

        expect(typeof result).toBe('string');
      });
    });

    describe('Configuration Variations', () => {
      it('should respect different max file sizes', () => {
        const smallConfig = { ...mockConfig, maxFileSize: 0.0001 }; // Very small ~100 bytes
        const content = 'A'.repeat(150);

        const result = validateAndPrepareInput(content, smallConfig);
        expect(result).toBeInstanceOf(MarkdownParseError);
        expect((result as MarkdownParseError).code).toBe(
          MarkdownParseErrorCodeEnum.FILE_TOO_LARGE
        );
      });

      it('should handle zero max file size', () => {
        const zeroConfig = { ...mockConfig, maxFileSize: 0 };
        const result = validateAndPrepareInput('any content', zeroConfig);

        expect(result).toBeInstanceOf(MarkdownParseError);
        expect((result as MarkdownParseError).code).toBe(
          MarkdownParseErrorCodeEnum.FILE_TOO_LARGE
        );
      });

      it('should handle very large max file size', () => {
        const largeConfig = { ...mockConfig, maxFileSize: 1000 }; // 1000MB
        const content = 'A'.repeat(1000000); // 1MB

        const result = validateAndPrepareInput(content, largeConfig);
        expect(result).toBe(content);
      });
    });
  });

  describe('handleParsingError', () => {
    describe('Error Types', () => {
      it('should handle standard Error objects', () => {
        const error = new Error('Parsing failed');
        const startTime = new Date();

        const result = handleParsingError(error, startTime, mockLogger);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBeInstanceOf(MarkdownParseError);
          expect(result.error.code).toBe(
            MarkdownParseErrorCodeEnum.PARSE_FAILED
          );
          expect(result.error.message).toContain('Parsing failed');
          expect(result.error.cause).toBe(error);
        }
        expect(mockLogger.error).toHaveBeenCalledWith(
          'Markdown parsing failed',
          expect.objectContaining({
            error: expect.stringContaining('Parsing failed'),
            duration: expect.any(Number),
          })
        );
      });

      it('should handle string errors', () => {
        const error = 'String error message';
        const startTime = new Date();

        const result = handleParsingError(error, startTime, mockLogger);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBeInstanceOf(MarkdownParseError);
          expect(result.error.code).toBe(
            MarkdownParseErrorCodeEnum.PARSE_FAILED
          );
          expect(result.error.message).toContain('String error message');
          expect(result.error.cause).toBeUndefined();
        }
      });

      it('should handle number errors', () => {
        const error = 404;
        const startTime = new Date();

        const result = handleParsingError(error, startTime, mockLogger);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.message).toContain('Unknown error');
          expect(result.error.cause).toBeUndefined();
        }
      });

      it('should handle object errors', () => {
        const error = { message: 'Object error', code: 'CUSTOM_ERROR' };
        const startTime = new Date();

        const result = handleParsingError(error, startTime, mockLogger);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.message).toContain('Unknown error');
          expect(result.error.cause).toBeUndefined();
        }
      });

      it('should handle null/undefined errors', () => {
        const startTime = new Date();

        const result1 = handleParsingError(null, startTime, mockLogger);
        const result2 = handleParsingError(undefined, startTime, mockLogger);

        expect(result1.success).toBe(false);
        if (!result1.success) {
          expect(result1.error.message).toContain('Unknown error');
        }
        expect(result2.success).toBe(false);
        if (!result2.success) {
          expect(result2.error.message).toContain('Unknown error');
        }
      });

      it('should handle MarkdownParseError instances', () => {
        const originalError = MarkdownParseError.invalidInput(
          'Invalid markdown',
          'string'
        );
        const startTime = new Date();

        const result = handleParsingError(originalError, startTime, mockLogger);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBeInstanceOf(MarkdownParseError);
          expect(result.error.code).toBe(
            MarkdownParseErrorCodeEnum.PARSE_FAILED
          );
          expect(result.error.message).toContain('Invalid markdown');
          expect(result.error.cause).toBe(originalError);
        }
      });
    });

    describe('Timing and Logging', () => {
      it('should calculate accurate duration', () => {
        const error = new Error('Test error');
        const startTime = new Date();

        handleParsingError(error, startTime, mockLogger);

        expect(mockLogger.error).toHaveBeenCalledWith(
          'Markdown parsing failed',
          expect.objectContaining({
            error: expect.stringContaining('Test error'),
            duration: expect.any(Number),
          })
        );

        const loggedCall = (mockLogger.error as any).mock.calls[0];
        const duration = loggedCall[1].duration;
        expect(duration).toBeGreaterThanOrEqual(0);
        expect(duration).toBeLessThan(100); // Should be very fast
      });

      it('should handle different start times', () => {
        const error = new Error('Test error');
        const pastTime = new Date(Date.now() - 1000); // 1 second ago

        handleParsingError(error, pastTime, mockLogger);

        expect(mockLogger.error).toHaveBeenCalledWith(
          'Markdown parsing failed',
          expect.objectContaining({
            error: expect.stringContaining('Test error'),
            duration: expect.any(Number),
          })
        );

        const loggedCall = (mockLogger.error as any).mock.calls[0];
        const duration = loggedCall[1].duration;
        expect(duration).toBeGreaterThanOrEqual(1000); // At least 1 second
      });

      it('should log error details correctly', () => {
        const error = new Error('Detailed parsing error');
        const startTime = new Date();

        handleParsingError(error, startTime, mockLogger);

        expect(mockLogger.error).toHaveBeenCalledTimes(1);
        expect(mockLogger.error).toHaveBeenCalledWith(
          'Markdown parsing failed',
          expect.objectContaining({
            error: expect.stringContaining('Detailed parsing error'),
            duration: expect.any(Number),
          })
        );
      });

      it('should not log other methods', () => {
        const error = new Error('Test error');
        const startTime = new Date();

        handleParsingError(error, startTime, mockLogger);

        expect(mockLogger.info).not.toHaveBeenCalled();
        expect(mockLogger.warn).not.toHaveBeenCalled();
        expect(mockLogger.debug).not.toHaveBeenCalled();
      });
    });

    describe('Result Structure', () => {
      it('should return proper Result structure for error', () => {
        const error = new Error('Test error');
        const startTime = new Date();

        const result = handleParsingError(error, startTime, mockLogger);

        expect(result).toHaveProperty('success', false);
        expect(result).toHaveProperty('error');
        expect(result).not.toHaveProperty('data');

        if (!result.success) {
          expect(result.error).toBeInstanceOf(MarkdownParseError);
          expect(result.error).toHaveProperty('code');
          expect(result.error).toHaveProperty('message');
          expect(result.error).toHaveProperty('timestamp');
        }
      });

      it('should include timestamp in error', () => {
        const error = new Error('Test error');
        const startTime = new Date();

        const result = handleParsingError(error, startTime, mockLogger);

        if (!result.success) {
          expect(result.error.timestamp).toBeInstanceOf(Date);
          expect(result.error.timestamp.getTime()).toBeCloseTo(Date.now(), -2); // Within 100ms
        }
      });

      it('should preserve error chain', () => {
        const originalError = new Error('Root cause');
        const wrappedError = new Error('Wrapper');
        wrappedError.cause = originalError;

        const startTime = new Date();
        const result = handleParsingError(wrappedError, startTime, mockLogger);

        if (!result.success) {
          expect(result.error.cause).toBe(wrappedError);
          expect((result.error.cause as Error).cause).toBe(originalError);
        }
      });
    });

    describe('Edge Cases', () => {
      it('should handle errors with circular references', () => {
        const error: any = new Error('Circular error');
        error.self = error; // Create circular reference

        const startTime = new Date();

        expect(() => {
          handleParsingError(error, startTime, mockLogger);
        }).not.toThrow();

        const result = handleParsingError(error, startTime, mockLogger);
        expect(result.success).toBe(false);
      });

      it('should handle very long error messages', () => {
        const longMessage = 'A'.repeat(10000);
        const error = new Error(longMessage);
        const startTime = new Date();

        const result = handleParsingError(error, startTime, mockLogger);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.message).toContain('A'.repeat(100)); // Should contain part of the long message
        }
      });

      it('should handle errors with special characters', () => {
        const error = new Error(
          'Error with émojis 🎉 and special chars æøå\n\t"quotes"'
        );
        const startTime = new Date();

        const result = handleParsingError(error, startTime, mockLogger);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.message).toContain('émojis');
          expect(result.error.message).toContain('🎉');
        }
      });

      it('should handle errors with minimal message', () => {
        const error = new Error('Minimal error message');
        const startTime = new Date();

        const result = handleParsingError(error, startTime, mockLogger);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.message).toContain('Parse failed: ');
        }
      });
    });
  });

  describe('Integration Tests', () => {
    it('should handle validation then error flow', () => {
      // First validate input
      const validInput = 'Valid content';
      const validationResult = validateAndPrepareInput(validInput, mockConfig);

      expect(typeof validationResult).toBe('string');

      // Then handle a parsing error
      const parseError = new Error('Parse failed');
      const startTime = new Date();
      const errorResult = handleParsingError(parseError, startTime, mockLogger);

      expect(errorResult.success).toBe(false);
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should handle validation error flow', () => {
      const invalidInput = 'A'.repeat(1024 * 1024 + 1); // > 1MB
      const validationResult = validateAndPrepareInput(
        invalidInput,
        mockConfig
      );

      expect(validationResult).toBeInstanceOf(MarkdownParseError);
      expect((validationResult as MarkdownParseError).code).toBe(
        MarkdownParseErrorCodeEnum.FILE_TOO_LARGE
      );
    });

    it('should maintain error information through the flow', () => {
      const error = new Error('Context error');
      const startTime = new Date();
      const result = handleParsingError(error, startTime, mockLogger);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(MarkdownParseError);
        expect(result.error.message).toContain('Context error');
        expect(result.error.cause).toBe(error);
      }
    });
  });
});
