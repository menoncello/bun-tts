import { MARKDOWN_PARSE_ERROR_CODES } from './markdown-parse-error-types';

/**
 * Get a user-friendly description for an error code
 *
 * @param {string} code - Error code to get description for
 * @returns {string} User-friendly error description
 */
export function getErrorDescription(code: string): string {
  const descriptions = getErrorDescriptions();
  const fallbackDescription =
    'An unknown error occurred while parsing the Markdown document.';

  return (
    descriptions[code] ??
    descriptions[MARKDOWN_PARSE_ERROR_CODES.PARSE_FAILED] ??
    fallbackDescription
  );
}

/**
 * Get suggested actions for an error code
 *
 * @param {string} code - Error code to get suggested actions for
 * @returns {string[]} Array of suggested actions
 */
export function getSuggestedActions(code: string): string[] {
  const actionMap = getActionMap();
  return (
    actionMap[code] ??
    actionMap.default ?? ['Please check the error details and try again.']
  );
}

/**
 * Get the complete error descriptions mapping
 *
 * @returns {Record<string, string>} Record mapping error codes to their descriptions
 */
function getErrorDescriptions(): Record<string, string> {
  const syntaxDescriptions = getSyntaxErrorDescriptions();
  const resourceDescriptions = getResourceErrorDescriptions();
  const generalDescriptions = getGeneralErrorDescriptions();

  return {
    ...syntaxDescriptions,
    ...resourceDescriptions,
    ...generalDescriptions,
  };
}

/**
 * Get syntax-related error descriptions
 *
 * @returns {Record<string, string>} Record of syntax error descriptions
 */
function getSyntaxErrorDescriptions(): Record<string, string> {
  return {
    [MARKDOWN_PARSE_ERROR_CODES.INVALID_SYNTAX]:
      'The Markdown file contains invalid syntax that cannot be parsed.',
    [MARKDOWN_PARSE_ERROR_CODES.MALFORMED_HEADER]:
      'A chapter header is malformed and cannot be recognized.',
    [MARKDOWN_PARSE_ERROR_CODES.UNCLOSED_CODE_BLOCK]:
      'A code block was opened but never properly closed.',
    [MARKDOWN_PARSE_ERROR_CODES.INVALID_TABLE]:
      'A table has formatting errors that prevent proper parsing.',
    [MARKDOWN_PARSE_ERROR_CODES.MALFORMED_LIST]:
      'A list has formatting errors that prevent proper parsing.',
    [MARKDOWN_PARSE_ERROR_CODES.NESTING_TOO_DEEP]:
      'The document has too many nested levels to process safely.',
  };
}

/**
 * Get resource-related error descriptions
 *
 * @returns {Record<string, string>} Record of resource error descriptions
 */
function getResourceErrorDescriptions(): Record<string, string> {
  return {
    [MARKDOWN_PARSE_ERROR_CODES.FILE_TOO_LARGE]:
      'The file is too large to process efficiently.',
    [MARKDOWN_PARSE_ERROR_CODES.ENCODING_ERROR]:
      'The file has encoding issues that prevent proper reading.',
    [MARKDOWN_PARSE_ERROR_CODES.MEMORY_ERROR]:
      'There was insufficient memory to process the document.',
  };
}

/**
 * Get general error descriptions
 *
 * @returns {Record<string, string>} Record of general error descriptions
 */
function getGeneralErrorDescriptions(): Record<string, string> {
  return {
    [MARKDOWN_PARSE_ERROR_CODES.LOW_CONFIDENCE]:
      'The parser is not confident about the document structure.',
    [MARKDOWN_PARSE_ERROR_CODES.INVALID_INPUT]:
      'The input provided to the parser is invalid.',
    [MARKDOWN_PARSE_ERROR_CODES.PARSE_FAILED]:
      'An error occurred while parsing the Markdown document.',
  };
}

/**
 * Get the complete action mapping for all error codes
 *
 * @returns {Record<string, string[]>} Record mapping error codes to their suggested actions
 */
function getActionMap(): Record<string, string[]> {
  const syntaxActions = getSyntaxActions();
  const actionMap: Record<string, string[]> = {
    [MARKDOWN_PARSE_ERROR_CODES.INVALID_SYNTAX]: syntaxActions,
    [MARKDOWN_PARSE_ERROR_CODES.MALFORMED_HEADER]: syntaxActions,
    [MARKDOWN_PARSE_ERROR_CODES.INVALID_TABLE]: syntaxActions,
    [MARKDOWN_PARSE_ERROR_CODES.MALFORMED_LIST]: syntaxActions,
    default: getDefaultActions(),
  };

  // Add specialized actions for specific error codes
  actionMap[MARKDOWN_PARSE_ERROR_CODES.UNCLOSED_CODE_BLOCK] =
    getCodeBlockActions();
  actionMap[MARKDOWN_PARSE_ERROR_CODES.NESTING_TOO_DEEP] = getNestingActions();
  actionMap[MARKDOWN_PARSE_ERROR_CODES.FILE_TOO_LARGE] = getFileActions();
  actionMap[MARKDOWN_PARSE_ERROR_CODES.LOW_CONFIDENCE] = getConfidenceActions();
  actionMap[MARKDOWN_PARSE_ERROR_CODES.ENCODING_ERROR] = getEncodingActions();
  actionMap[MARKDOWN_PARSE_ERROR_CODES.MEMORY_ERROR] = getDefaultActions();
  actionMap[MARKDOWN_PARSE_ERROR_CODES.PARSE_FAILED] = getDefaultActions();
  actionMap[MARKDOWN_PARSE_ERROR_CODES.INVALID_INPUT] = getDefaultActions();

  return actionMap;
}

/**
 * Get syntax-related error actions
 *
 * @returns {string[]} Array of syntax-related actions
 */
function getSyntaxActions(): string[] {
  return [
    'Check the Markdown syntax at the specified location',
    'Validate the file with a Markdown linter',
    'Fix any formatting issues manually',
  ];
}

/**
 * Get code block error actions
 *
 * @returns {string[]} Array of code block-related actions
 */
function getCodeBlockActions(): string[] {
  return [
    'Add proper closing code block markers (```)',
    'Check for missing backticks',
    'Ensure code blocks are properly nested',
  ];
}

/**
 * Get nesting error actions
 *
 * @returns {string[]} Array of nesting-related actions
 */
function getNestingActions(): string[] {
  return [
    'Simplify the document structure',
    'Reduce nesting levels',
    'Break into smaller documents',
  ];
}

/**
 * Get file-related error actions
 *
 * @returns {string[]} Array of file-related actions
 */
function getFileActions(): string[] {
  return [
    'Split the document into smaller files',
    'Enable streaming mode if available',
    'Reduce file size by removing unnecessary content',
  ];
}

/**
 * Get confidence error actions
 *
 * @returns {string[]} Array of confidence-related actions
 */
function getConfidenceActions(): string[] {
  return [
    'Improve document structure and formatting',
    'Add clear chapter headers',
    'Use consistent Markdown formatting',
  ];
}

/**
 * Get encoding error actions
 *
 * @returns {string[]} Array of encoding-related actions
 */
function getEncodingActions(): string[] {
  return [
    'Check file encoding (should be UTF-8)',
    'Convert file to proper encoding',
    'Remove special characters if necessary',
  ];
}

/**
 * Get default error actions
 *
 * @returns {string[]} Array of default actions
 */
function getDefaultActions(): string[] {
  return [
    'Check the input file format',
    'Try with a simpler document',
    'Report the issue if it persists',
  ];
}
