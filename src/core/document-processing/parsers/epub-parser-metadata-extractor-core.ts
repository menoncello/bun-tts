/**
 * EPUB Parser Metadata Extractor - Core Functions
 *
 * Core metadata extraction and processing functions
 */

import { Epub } from '@smoores/epub';
import { logger } from '../../../utils/logger.js';
import type { DocumentMetadata } from '../types.js';
import {
  extractAuthors,
  formatSubjects,
} from './epub-parser-metadata-extractor-authors.js';
import { createCustomMetadata } from './epub-parser-metadata-extractor-custom.js';
import {
  extractIdentifier,
  extractPublisher,
} from './epub-parser-metadata-extractor-fields.js';
import type { EpubMetadata } from './epub-parser-types.js';
import {
  DEFAULT_LANGUAGE,
  DEFAULT_PUBLISHER,
  DEFAULT_TITLE,
  DEFAULT_AUTHOR,
  DEFAULT_VERSION,
} from './epub-parser-utils.js';

/**
 * Interface for raw EPUB metadata extracted from the file
 */
interface RawEpubMetadata {
  title: string;
  creators: Array<{ name: string; role?: string }>;
  language?: string | unknown;
  publicationDate?: Date;
  subjects: Array<string | { value: string }>;
  type?: { value?: string; type?: string };
  rawMetadata: EpubMetadata;
}

/**
 * Retrieve raw metadata from EPUB
 * @param {Epub} epub - EPUB instance
 * @returns {Promise<RawEpubMetadata>} Raw metadata
 */
async function retrieveRawMetadata(epub: Epub): Promise<RawEpubMetadata> {
  const title = (await epub.getTitle()) || DEFAULT_TITLE;
  const creators = await epub.getCreators();
  const language = await epub.getLanguage();
  const publicationDate = (await epub.getPublicationDate()) || undefined;
  const subjects = await epub.getSubjects();
  const type = (await epub.getType()) || undefined;
  const rawMetadata = await epub.getMetadata();

  return {
    title,
    creators,
    language,
    publicationDate,
    subjects,
    type,
    rawMetadata,
  };
}

/**
 * Assemble document metadata from raw EPUB metadata
 * @param {RawEpubMetadata} raw - Raw metadata
 * @returns {DocumentMetadata} Document metadata
 */
function assembleDocumentMetadata(raw: RawEpubMetadata): DocumentMetadata {
  const formattedAuthors = extractAuthors(raw.creators);
  const customMetadata = buildCustomMetadata(raw);

  return {
    title: raw.title || DEFAULT_TITLE,
    author: formattedAuthors || DEFAULT_AUTHOR,
    language: normalizeLanguage(raw.language),
    publisher: extractPublisher(raw.rawMetadata) || DEFAULT_PUBLISHER,
    identifier: extractIdentifier(raw.rawMetadata) || '',
    date: raw.publicationDate?.toISOString(),
    version: DEFAULT_VERSION,
    wordCount: 0,
    customMetadata,
  };
}

/**
 * Build custom metadata from raw EPUB metadata
 * @param {RawEpubMetadata} raw - Raw metadata
 * @returns {DocumentMetadata['customMetadata']} Custom metadata object
 */
function buildCustomMetadata(
  raw: RawEpubMetadata
): DocumentMetadata['customMetadata'] {
  return {
    ...createCustomMetadata(raw.rawMetadata),
    subject: formatSubjects(raw.subjects),
    type: normalizeType(raw.type),
  };
}

/**
 * Normalize type field from raw metadata
 * @param {string | { value?: string; type?: string } | undefined} type - Type field
 * @returns {string} Normalized type string
 */
function normalizeType(
  type: string | { value?: string; type?: string } | undefined
): string {
  if (typeof type === 'string') {
    return type;
  }
  return type?.value || type?.type || '';
}

/**
 * Normalize language value
 * @param {string | unknown} language - Language value from metadata
 * @returns {string} Normalized language code
 */
function normalizeLanguage(language: string | unknown): string {
  if (typeof language === 'string' && language.length > 0) {
    return language;
  }
  if (
    typeof language === 'object' &&
    language !== null &&
    'value' in language &&
    typeof (language as { value: unknown }).value === 'string'
  ) {
    return (language as { value: string }).value;
  }
  return DEFAULT_LANGUAGE;
}

/**
 * Create fallback metadata when extraction fails
 * @returns {DocumentMetadata} Fallback metadata
 */
function createFallbackMetadata(): DocumentMetadata {
  return {
    title: DEFAULT_TITLE,
    author: DEFAULT_AUTHOR,
    language: DEFAULT_LANGUAGE,
    publisher: DEFAULT_PUBLISHER,
    identifier: '',
    date: undefined,
    version: DEFAULT_VERSION,
    wordCount: 0,
    customMetadata: {},
  };
}

/**
 * Extract metadata from EPUB file
 * @param {Epub} epub - EPUB instance to extract metadata from
 * @returns {Promise<DocumentMetadata>} Promise that resolves to standardized document metadata
 */
export async function extractMetadata(epub: Epub): Promise<DocumentMetadata> {
  try {
    const rawMetadata = await retrieveRawMetadata(epub);
    return assembleDocumentMetadata(rawMetadata);
  } catch (error) {
    logger.warn('Failed to extract metadata, using fallback values', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return createFallbackMetadata();
  }
}

// Re-export author and field extraction functions for backward compatibility
export {
  extractAuthors,
  formatSubjects,
} from './epub-parser-metadata-extractor-authors.js';
export { extractCustomFields } from './epub-parser-metadata-extractor-fields.js';
