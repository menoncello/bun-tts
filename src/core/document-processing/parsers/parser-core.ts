/**
 * Core parser functionality for Markdown processing.
 * Contains fundamental parsing utilities and token processing.
 */

import type { Logger } from '../../../interfaces/logger.js';
import type { MarkdownParserConfig } from '../config/markdown-parser-config.js';
import { MarkdownParseError } from '../errors/markdown-parse-error.js';
import type { DocumentStructure } from '../types.js';
import { buildDocumentStructure } from './document-builder.js';
import { validateConfidenceThreshold } from './parser-config.js';
import { tokenizeMarkdown, type ParsedToken } from './token-processing.js';

export {
  loadConfiguration,
  configureMarked,
  validateInput,
  checkFileSize,
  validateConfidenceThreshold,
} from './parser-config.js';

export {
  tokenizeMarkdown,
  type ParsedToken as Token,
  type ParsedToken,
} from './token-processing.js';

export { buildDocumentStructure } from './document-builder.js';

/**
 * Main parsing orchestration function
 * @param content - The markdown content to parse
 * @param config - Parser configuration
 * @param logger - Logger instance
 * @param chapterExtractor - Function to extract chapters from tokens
 * @returns Promise<Document structure or error>
 */
export const parseMarkdownDocument = async (
  content: string,
  config: MarkdownParserConfig,
  logger: Logger,
  chapterExtractor: (
    tokens: ParsedToken[]
  ) => DocumentStructure['chapters'] | Promise<DocumentStructure['chapters']>
): Promise<DocumentStructure | MarkdownParseError> => {
  const startTime = new Date();

  // Tokenize content
  const tokens = tokenizeMarkdown(content);
  if (tokens instanceof MarkdownParseError) {
    return tokens;
  }

  // Build document structure
  const structure = await buildDocumentStructure(
    content,
    tokens,
    startTime,
    chapterExtractor
  );
  if (structure instanceof MarkdownParseError) {
    return structure;
  }

  // Validate confidence threshold
  return validateConfidenceThreshold(structure, config);
};
