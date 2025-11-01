import { describe, it, expect } from 'bun:test';
import {
  PdfParseError,
  PDF_PARSE_ERROR_CODES,
  type PdfParseErrorCode,
} from '../../../src/errors/pdf-parse-error';

describe('PDF_PARSE_ERROR_CODES Constants', () => {
  it('should contain all expected error codes', () => {
    const expectedCodes = [
      'INVALID_PDF',
      'PASSWORD_PROTECTED',
      'ENCRYPTED_CONTENT',
      'UNSUPPORTED_VERSION',
      'MALFORMED_STRUCTURE',
      'MISSING_OBJECTS',
      'INVALID_XREF',
      'STREAM_EXTRACTION_FAILED',
      'FONT_RENDERING_ERROR',
      'TEXT_ENCODING_ERROR',
      'IMAGE_EXTRACTION_FAILED',
      'TABLE_DETECTION_FAILED',
      'OCR_PROCESSING_FAILED',
      'MEMORY_ERROR',
      'FILE_TOO_LARGE',
      'IO_ERROR',
      'PARSE_FAILED',
      'LOW_CONFIDENCE',
      'INVALID_INPUT',
    ];

    for (const code of expectedCodes) {
      expect(Object.values(PDF_PARSE_ERROR_CODES)).toContain(
        code as PdfParseErrorCode
      );
    }
  });

  it('should have unique values for all error codes', () => {
    const codes = Object.values(PDF_PARSE_ERROR_CODES);
    const uniqueCodes = [...new Set(codes)];
    expect(codes).toHaveLength(uniqueCodes.length);
  });

  it('should contain string values', () => {
    for (const code of Object.values(PDF_PARSE_ERROR_CODES)) {
      expect(typeof code).toBe('string');
    }
  });
});

describe('PdfParseError Class', () => {
  describe('Constructor', () => {
    it('should create PdfParseError with required parameters', () => {
      const error = new PdfParseError(
        PDF_PARSE_ERROR_CODES.INVALID_PDF,
        'PDF file is corrupted'
      );

      expect(error).toBeInstanceOf(PdfParseError);
      expect(error.name).toBe('PdfParseError');
      expect(error.code).toBe(PDF_PARSE_ERROR_CODES.INVALID_PDF);
      expect(error.message).toBe('PDF file is corrupted');
      expect(error.category).toBe('parsing');
      expect(error.confidence).toBe(1.0);
    });

    it('should create PdfParseError with location config', () => {
      const location = {
        page: 5,
        line: 10,
        column: 25,
        context: 'Sample context',
      };

      const error = new PdfParseError(
        PDF_PARSE_ERROR_CODES.MALFORMED_STRUCTURE,
        'Invalid PDF structure on page 5',
        { location }
      );

      expect(error.location).toEqual(location);
      expect(error.message).toBe(
        'Invalid PDF structure on page 5 (Page 5, Line 10, Column 25)'
      );
    });

    it('should create PdfParseError with confidence config', () => {
      const error = new PdfParseError(
        PDF_PARSE_ERROR_CODES.LOW_CONFIDENCE,
        'Low confidence text extraction',
        { confidence: 0.75 }
      );

      expect(error.confidence).toBe(0.75);
    });

    it('should create PdfParseError with cause config', () => {
      const cause = new Error('Original error');
      const error = new PdfParseError(
        PDF_PARSE_ERROR_CODES.PARSE_FAILED,
        'Parsing failed',
        { cause }
      );

      expect(error.cause).toBe(cause);
    });

    it('should create PdfParseError with streamInfo config', () => {
      const streamInfo = {
        streamId: 'stream-123',
        streamType: 'content',
      };

      const error = new PdfParseError(
        PDF_PARSE_ERROR_CODES.STREAM_EXTRACTION_FAILED,
        'Failed to extract stream',
        { streamInfo }
      );

      expect(error.streamInfo).toEqual(streamInfo);
    });

    it('should clamp confidence values to 0-1 range', () => {
      const highConfidence = new PdfParseError(
        PDF_PARSE_ERROR_CODES.PARSE_FAILED,
        'Test',
        { confidence: 1.5 }
      );
      const lowConfidence = new PdfParseError(
        PDF_PARSE_ERROR_CODES.PARSE_FAILED,
        'Test',
        { confidence: -0.5 }
      );

      expect(highConfidence.confidence).toBe(1.0);
      expect(lowConfidence.confidence).toBe(0.0);
    });
  });

  describe('Static Factory Methods', () => {
    it('should create invalidPdf error', () => {
      const error = PdfParseError.invalidPdf('File header is missing', {
        page: 1,
        line: 1,
      });

      expect(error).toBeInstanceOf(PdfParseError);
      expect(error.code).toBe(PDF_PARSE_ERROR_CODES.INVALID_PDF);
      expect(error.message).toBe(
        'Invalid PDF format: File header is missing (Page 1, Line 1)'
      );
      expect(error.category).toBe('parsing');
    });

    it('should create passwordProtected error', () => {
      const error = PdfParseError.passwordProtected({ page: 1 });

      expect(error.code).toBe(PDF_PARSE_ERROR_CODES.PASSWORD_PROTECTED);
      expect(error.message).toBe(
        'PDF is password-protected and cannot be processed (Page 1)'
      );
    });

    it('should create encryptedContent error', () => {
      const error = PdfParseError.encryptedContent();

      expect(error.code).toBe(PDF_PARSE_ERROR_CODES.ENCRYPTED_CONTENT);
      expect(error.message).toBe(
        'PDF content is encrypted and cannot be extracted'
      );
    });

    it('should create unsupportedVersion error', () => {
      const error = PdfParseError.unsupportedVersion('1.0');

      expect(error.code).toBe(PDF_PARSE_ERROR_CODES.UNSUPPORTED_VERSION);
      expect(error.message).toBe('Unsupported PDF version: 1.0');
    });

    it('should create malformedStructure error', () => {
      const cause = new Error('Malformed xref table');
      const error = PdfParseError.malformedStructure(
        'XRef table corrupted',
        { page: 1 },
        cause
      );

      expect(error.code).toBe(PDF_PARSE_ERROR_CODES.MALFORMED_STRUCTURE);
      expect(error.message).toBe(
        'Malformed PDF structure: XRef table corrupted (Page 1)'
      );
      expect(error.cause).toBe(cause);
    });

    it('should create missingObjects error', () => {
      const error = PdfParseError.missingObjects(['catalog', 'pages']);

      expect(error.code).toBe(PDF_PARSE_ERROR_CODES.MISSING_OBJECTS);
      expect(error.message).toBe(
        'Missing required PDF objects: catalog, pages'
      );
    });

    it('should create invalidXref error', () => {
      const cause = new Error('Invalid xref format');
      const error = PdfParseError.invalidXref(undefined, cause);

      expect(error.code).toBe(PDF_PARSE_ERROR_CODES.INVALID_XREF);
      expect(error.message).toBe('Invalid cross-reference table');
      expect(error.cause).toBe(cause);
    });

    it('should create streamExtractionFailed error', () => {
      const streamInfo = { streamId: 'stream-1', streamType: 'content' };
      const error = PdfParseError.streamExtractionFailed(
        'content',
        { page: 1 },
        streamInfo
      );

      expect(error.code).toBe(PDF_PARSE_ERROR_CODES.STREAM_EXTRACTION_FAILED);
      expect(error.message).toBe('Failed to extract content stream (Page 1)');
      expect(error.streamInfo).toEqual(streamInfo);
    });

    it('should create fontRenderingError error', () => {
      const error = PdfParseError.fontRenderingError('Font not found', {
        page: 2,
      });

      expect(error.code).toBe(PDF_PARSE_ERROR_CODES.FONT_RENDERING_ERROR);
      expect(error.message).toBe(
        'Font rendering error: Font not found (Page 2)'
      );
    });

    it('should create textEncodingError error', () => {
      const cause = new Error('Invalid UTF-8 sequence');
      const error = PdfParseError.textEncodingError(
        'Invalid encoding',
        { page: 3 },
        cause
      );

      expect(error.code).toBe(PDF_PARSE_ERROR_CODES.TEXT_ENCODING_ERROR);
      expect(error.message).toBe(
        'Text encoding error: Invalid encoding (Page 3)'
      );
      expect(error.cause).toBe(cause);
    });

    it('should create imageExtractionFailed error', () => {
      const error = PdfParseError.imageExtractionFailed(
        'Invalid image format',
        { page: 5 }
      );

      expect(error.code).toBe(PDF_PARSE_ERROR_CODES.IMAGE_EXTRACTION_FAILED);
      expect(error.message).toBe(
        'Image extraction failed: Invalid image format (Page 5)'
      );
    });

    it('should create tableDetectionFailed error', () => {
      const error = PdfParseError.tableDetectionFailed(
        'Complex table structure',
        { page: 10 }
      );

      expect(error.code).toBe(PDF_PARSE_ERROR_CODES.TABLE_DETECTION_FAILED);
      expect(error.message).toBe(
        'Table detection failed: Complex table structure (Page 10)'
      );
    });

    it('should create ocrProcessingFailed error', () => {
      const cause = new Error('OCR service unavailable');
      const error = PdfParseError.ocrProcessingFailed(
        'OCR service down',
        { page: 7 },
        cause
      );

      expect(error.code).toBe(PDF_PARSE_ERROR_CODES.OCR_PROCESSING_FAILED);
      expect(error.message).toBe(
        'OCR processing failed: OCR service down (Page 7)'
      );
      expect(error.cause).toBe(cause);
    });

    it('should create memoryError error', () => {
      const cause = new Error('Out of memory');
      const error = PdfParseError.memoryError('Cannot allocate buffer', cause);

      expect(error.code).toBe(PDF_PARSE_ERROR_CODES.MEMORY_ERROR);
      expect(error.message).toBe('Memory error: Cannot allocate buffer');
      expect(error.cause).toBe(cause);
    });

    it('should create fileTooLarge error', () => {
      const error = PdfParseError.fileTooLarge(500000000, 100000000);

      expect(error.code).toBe(PDF_PARSE_ERROR_CODES.FILE_TOO_LARGE);
      expect(error.message).toBe(
        'File too large: 500000000 bytes (max: 100000000 bytes)'
      );
    });

    it('should create ioError error', () => {
      const cause = new Error('Permission denied');
      const error = PdfParseError.ioError('Cannot read file', cause);

      expect(error.code).toBe(PDF_PARSE_ERROR_CODES.IO_ERROR);
      expect(error.message).toBe('I/O error: Cannot read file');
      expect(error.cause).toBe(cause);
    });

    it('should create parseFailed error', () => {
      const cause = new Error('Syntax error');
      const error = PdfParseError.parseFailed('Unexpected token', cause);

      expect(error.code).toBe(PDF_PARSE_ERROR_CODES.PARSE_FAILED);
      expect(error.message).toBe('PDF parse failed: Unexpected token');
      expect(error.cause).toBe(cause);
    });

    it('should create lowConfidence error', () => {
      const error = PdfParseError.lowConfidence(0.65, 0.8, { page: 15 });

      expect(error.code).toBe(PDF_PARSE_ERROR_CODES.LOW_CONFIDENCE);
      expect(error.message).toBe(
        'Low confidence in text extraction: 0.65 (threshold: 0.8) (Page 15)'
      );
      expect(error.confidence).toBe(0.65);
    });

    it('should create invalidInput error', () => {
      const error = PdfParseError.invalidInput('string', 'Buffer');

      expect(error.code).toBe(PDF_PARSE_ERROR_CODES.INVALID_INPUT);
      expect(error.message).toBe(
        'Invalid input type: string (expected: Buffer)'
      );
    });
  });

  describe('Properties', () => {
    it('should set correct error properties', () => {
      const location = { page: 1, line: 5 };
      const streamInfo = { streamId: 'test-stream', streamType: 'test' };
      const cause = new Error('Test cause');

      const error = new PdfParseError(
        PDF_PARSE_ERROR_CODES.FILE_TOO_LARGE,
        'File exceeds maximum size limit',
        { location, confidence: 0.9, cause, streamInfo }
      );

      expect(error.name).toBe('PdfParseError');
      expect(error.code).toBe(PDF_PARSE_ERROR_CODES.FILE_TOO_LARGE);
      expect(error.message).toBe(
        'File exceeds maximum size limit (Page 1, Line 5)'
      );
      expect(error.category).toBe('parsing');
      expect(error.confidence).toBe(0.9);
      expect(error.location).toEqual(location);
      expect(error.streamInfo).toEqual(streamInfo);
      expect(error.cause).toBe(cause);
    });
  });

  describe('Error Inheritance', () => {
    it('should be instanceof Error', () => {
      const error = new PdfParseError(
        PDF_PARSE_ERROR_CODES.INVALID_PDF,
        'Test error'
      );

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(PdfParseError);
    });

    it('should have proper error stack', () => {
      const error = new PdfParseError(
        PDF_PARSE_ERROR_CODES.PARSE_FAILED,
        'Test stack trace'
      );

      expect(error.stack).toBeDefined();
      expect(typeof error.stack).toBe('string');
      expect(error.stack).toContain('PdfParseError');
      expect(error.stack).toContain('Test stack trace');
    });
  });

  describe('User Methods', () => {
    it('should return user-friendly description', () => {
      const error = new PdfParseError(
        PDF_PARSE_ERROR_CODES.PASSWORD_PROTECTED,
        'PDF is password protected'
      );

      const description = error.getUserDescription();
      expect(typeof description).toBe('string');
      expect(description.length).toBeGreaterThan(0);
    });

    it('should return suggested actions', () => {
      const error = new PdfParseError(
        PDF_PARSE_ERROR_CODES.INVALID_PDF,
        'Invalid PDF format'
      );

      const actions = error.getSuggestedActions();
      expect(Array.isArray(actions)).toBe(true);
      expect(actions.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty message', () => {
      const error = new PdfParseError(PDF_PARSE_ERROR_CODES.PARSE_FAILED, '');

      expect(error.message).toBe('');
    });

    it('should handle very long message', () => {
      const longMessage = 'A'.repeat(1000);
      const error = new PdfParseError(
        PDF_PARSE_ERROR_CODES.PARSE_FAILED,
        longMessage
      );

      expect(error.message).toBe(longMessage);
    });

    it('should handle undefined config', () => {
      const error = new PdfParseError(
        PDF_PARSE_ERROR_CODES.IO_ERROR,
        'I/O error',
        undefined
      );

      expect(error.location).toBeUndefined();
      expect(error.confidence).toBe(1.0);
      expect(error.streamInfo).toBeUndefined();
      expect(error.cause).toBeUndefined();
    });

    it('should handle null config', () => {
      const error = new PdfParseError(
        PDF_PARSE_ERROR_CODES.MEMORY_ERROR,
        'Memory error',
        null as any
      );

      expect(error.location).toBeUndefined();
      expect(error.confidence).toBe(1.0);
    });
  });
});
