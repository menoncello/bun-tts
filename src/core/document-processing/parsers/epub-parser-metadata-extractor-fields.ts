/**
 * EPUB Parser Metadata Extractor - Field Extraction
 *
 * Specific field extraction functions
 */

import type { EpubMetadata } from './epub-parser-types.js';

/**
 * Extract publisher from raw metadata
 * @param {EpubMetadata} metadata - Raw EPUB metadata array
 * @returns {string | undefined} Publisher string or undefined if not found
 */
export function extractPublisher(metadata: EpubMetadata): string | undefined {
  const publisherEntry = metadata.find((entry) => entry.type === 'publisher');
  return publisherEntry?.value;
}

/**
 * Extract identifier from raw metadata
 * @param {EpubMetadata} metadata - Raw EPUB metadata array
 * @returns {string | undefined} Identifier string or undefined if not found
 */
export function extractIdentifier(metadata: EpubMetadata): string | undefined {
  const identifierEntry = metadata.find((entry) => entry.type === 'identifier');
  return identifierEntry?.value;
}

/**
 * Extract custom fields from raw metadata
 * @param {EpubMetadata} metadata - Raw EPUB metadata array
 * @returns {Record<string, string>} Object containing custom metadata fields
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
