/**
 * Types and interfaces for PDF parsing errors
 */

import type { PdfParseErrorCode } from './pdf-parse-error-codes.js';

/**
 * Location where parsing error occurred
 */
export interface ErrorLocation {
  /** Page number where error occurred */
  page?: number;
  /** Line number where error occurred */
  line?: number;
  /** Column number where error occurred */
  column?: number;
  /** Optional context information about the error */
  context?: string;
}

/**
 * Configuration for PdfParseError
 */
export interface PdfParseErrorConfig {
  /** Location where error occurred */
  location?: ErrorLocation;
  /** Confidence score (0-1) */
  confidence?: number;
  /** Original error that caused this failure */
  cause?: Error;
  /** PDF stream information if relevant */
  streamInfo?: {
    streamId?: string;
    streamType?: string;
  };
}

/**
 * Type for action sources
 */
export interface ActionSources {
  structural: Record<PdfParseErrorCode, string[]>;
  content: Record<PdfParseErrorCode, string[]>;
  processing: Record<PdfParseErrorCode, string[]>;
  resource: Record<PdfParseErrorCode, string[]>;
  input: Record<PdfParseErrorCode, string[]>;
}
