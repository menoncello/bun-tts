/**
 * Core parser interfaces and base types for document processing functionality.
 * Provides fundamental interfaces for document parsing operations.
 */

/**
 * Generic document parser interface
 */
export interface DocumentParser {
  /** Parser name identifier */
  name: string;
  /** Parser version */
  version: string;
  /**
   * Parse method for document processing
   * @param {input} - Input data to parse
   * @param {any} options - Optional parse configuration
   * @returns {any} Promise resolving to parse result
   */
  parse: (input: unknown, options?: unknown) => Promise<ParseResult>;
  /**
   * Update parser options
   * @param {any} options - Partial options to merge
   */
  setOptions?: (options: Partial<unknown>) => void;
  /**
   * Get parser statistics
   * @returns {any} Parser performance statistics
   */
  getStats?: () => PerformanceStats;
}

/**
 * Generic parse result interface
 */
export interface ParseResult<T = unknown> {
  /** Whether parsing was successful */
  success: boolean;
  /** Parsed document data if successful */
  data?: T;
  /** Error information if parsing failed - can be an Error object or structured error */
  error?:
    | Error
    | {
        /** Error message */
        message: string;
        /** Error code if available */
        code?: string;
        /** Stack trace for debugging */
        stack?: string;
        /** Whether the error is recoverable */
        recoverable?: boolean;
        /** Additional error details */
        details?: Record<string, unknown> | unknown;
        /** Error severity level */
        severity?: string;
        /** Error category */
        category?: string;
        /** Error timestamp */
        timestamp?: string;
        /** Error context */
        context?: Record<string, unknown>;
      };
}

/**
 * Base parse options for all document processors
 */
export interface ParseOptions {
  /** Whether to enable detailed logging */
  verbose?: boolean;
  /** Custom configuration for parsing */
  config?: Record<string, unknown>;
}

/**
 * Performance statistics for parser operations
 */
export interface PerformanceStats {
  // Document content statistics
  totalParagraphs: number;
  totalSentences: number;
  totalWords: number;
  estimatedReadingTime: number;
  chapterCount: number;
  imageCount: number;
  tableCount: number;
  // Performance metrics
  parseTimeMs: number;
  parseTime?: number; // For backward compatibility
  memoryUsageMB: number;
  memoryUsage?: number; // For backward compatibility
  throughputMBs: number;
  validationTimeMs?: number;
  chaptersPerSecond: number;
  cacheHits: number;
  cacheMisses: number;
}
