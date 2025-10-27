/**
 * EPUB Parser Input Handler Module
 *
 * Contains input validation and normalization logic.
 */

import { Epub } from '@smoores/epub';
import {
  DocumentParseError,
  EPUBFormatError,
} from '../../../errors/document-parse-error';

// Type alias for better readability
type EpubInput = string | Buffer | ArrayBuffer;

// Constants for error handling
const ERROR_MESSAGE_UNKNOWN = 'Unknown error';

/**
 * Validate input parameter
 * @param input - Input to validate
 * @throws DocumentParseError if input is invalid
 */
export function validateInput(input: EpubInput): void {
  if (!input || (typeof input === 'string' && input.trim().length === 0)) {
    throw new DocumentParseError('Input is required', 'INVALID_INPUT');
  }
}

/**
 * Normalize input to the format expected by Epub.from()
 * @param input - Original input
 * @returns Normalized input for Epub.from()
 */
export function normalizeInputForEpub(input: EpubInput): string | Uint8Array {
  // Handle string input (file path)
  if (typeof input === 'string') {
    return input;
  }

  // Handle ArrayBuffer and Buffer
  if (input instanceof ArrayBuffer || Buffer.isBuffer(input)) {
    return new Uint8Array(input);
  }

  // Type guard to check if input has the custom EpubInput interface structure
  if (isCustomEpubInput(input)) {
    const customInput = input as {
      type: string;
      data: string | Buffer | ArrayBuffer;
    };
    if (customInput.type === 'string') {
      return customInput.data as string;
    } else if (
      (customInput.type === 'buffer' && Buffer.isBuffer(customInput.data)) ||
      (customInput.type === 'arraybuffer' &&
        customInput.data instanceof ArrayBuffer)
    ) {
      return new Uint8Array(customInput.data);
    }
  }

  throw new DocumentParseError(
    'Invalid input type for EPUB parsing',
    'INVALID_INPUT_TYPE'
  );
}

/**
 * Type guard to check if input has the custom EpubInput interface structure
 * @param input - Input to check
 * @returns True if input has type and data properties
 */
function isCustomEpubInput(
  input: unknown
): input is { type: string; data: string | Buffer | ArrayBuffer } {
  return (
    input !== null &&
    typeof input === 'object' &&
    'type' in input &&
    'data' in input
  );
}

/**
 * Create and configure EPUB instance
 * @param input - File path, buffer, or array buffer
 * @returns Configured EPUB instance
 * @throws EPUBFormatError if EPUB creation fails
 */
export async function createEPUBInstance(input: EpubInput): Promise<Epub> {
  try {
    // Convert input to the format expected by Epub.from()
    const normalizedInput = normalizeInputForEpub(input);
    // Use Epub.from() to read existing EPUB files
    return await Epub.from(normalizedInput);
  } catch (error) {
    if (error instanceof DocumentParseError) {
      throw error;
    }
    throw new EPUBFormatError({
      originalError:
        error instanceof Error ? error.message : ERROR_MESSAGE_UNKNOWN,
    });
  }
}
