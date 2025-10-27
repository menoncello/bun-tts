/**
 * EPUB Parser Metadata Extractor
 *
 * Handles extraction and processing of EPUB metadata
 */

import { Epub } from '@smoores/epub';
import { logger } from '../../../utils/logger';
import type { DocumentMetadata } from '../types';
import type { EpubMetadata } from './epub-parser-types';
import {
  DEFAULT_LANGUAGE,
  DEFAULT_PUBLISHER,
  DEFAULT_TITLE,
  DEFAULT_AUTHOR,
  DEFAULT_VERSION,
} from './epub-parser-utils';

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
 * Extract metadata from EPUB file
 * @param epub - EPUB instance to extract metadata from
 * @returns Standardized document metadata
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

/**
 * Retrieve raw metadata from EPUB instance
 * @param epub - EPUB instance to extract metadata from
 * @returns Raw metadata object
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
 * Assemble standardized document metadata from raw metadata
 * @param raw - Raw EPUB metadata
 * @returns Standardized document metadata
 */
function assembleDocumentMetadata(raw: RawEpubMetadata): DocumentMetadata {
  const customFields = extractCustomFields(raw.rawMetadata);

  return {
    title: raw.title,
    author: extractAuthors(raw.creators),
    language: raw.language?.toString() || DEFAULT_LANGUAGE,
    publisher: extractPublisher(raw.rawMetadata) || DEFAULT_PUBLISHER,
    identifier: extractIdentifier(raw.rawMetadata) || '',
    date: raw.publicationDate?.toISOString(),
    version: DEFAULT_VERSION,
    customFields: {
      ...customFields,
      subject: formatSubjects(raw.subjects),
      type: raw.type?.value || raw.type?.type || '',
    },
  };
}

/**
 * Create fallback metadata when extraction fails
 * @returns Default metadata object
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
    customFields: {},
  };
}

/**
 * Extract and format authors from creators
 * @param creators - Array of creator objects
 * @returns Comma-separated author string or fallback
 */
export function extractAuthors(
  creators: Array<{ name: string; role?: string }>
): string {
  if (!creators || creators.length === 0) {
    return DEFAULT_AUTHOR;
  }

  return creators.map((creator) => creator.name).join(', ');
}

/**
 * Extract publisher from raw metadata
 * @param metadata - Raw EPUB metadata array
 * @returns Publisher string or undefined
 */
function extractPublisher(metadata: EpubMetadata): string | undefined {
  const publisherEntry = metadata.find((entry) => entry.type === 'publisher');
  return publisherEntry?.value;
}

/**
 * Extract identifier from raw metadata
 * @param metadata - Raw EPUB metadata array
 * @returns Identifier string or undefined
 */
function extractIdentifier(metadata: EpubMetadata): string | undefined {
  const identifierEntry = metadata.find((entry) => entry.type === 'identifier');
  return identifierEntry?.value;
}

/**
 * Extract custom fields from raw metadata
 * @param metadata - Raw EPUB metadata array
 * @returns Object containing custom metadata fields
 */
export function extractCustomFields(
  metadata: EpubMetadata
): Record<string, string> {
  const descriptionEntry = metadata.find(
    (entry) => entry.type === 'description'
  );
  const rightsEntry = metadata.find((entry) => entry.type === 'rights');
  const formatEntry = metadata.find((entry) => entry.type === 'format');

  return {
    description: descriptionEntry?.value || '',
    rights: rightsEntry?.value || '',
    format: formatEntry?.value || '',
  };
}

/**
 * Format subjects array into string
 * @param subjects - Array of subjects (strings or DcSubject objects)
 * @returns Formatted subject string
 */
function formatSubjects(subjects: Array<string | { value: string }>): string {
  if (!subjects || subjects.length === 0) {
    return '';
  }

  return subjects
    .map((subject) => (typeof subject === 'string' ? subject : subject.value))
    .join(', ');
}
