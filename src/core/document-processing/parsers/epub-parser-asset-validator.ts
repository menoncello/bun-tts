/**
 * EPUB Parser Asset Validator
 * Asset validation utilities for EPUB parsing
 */

import type { EmbeddedAssets } from '../types.js';

// Export functions needed by other modules
export { determineAssetType, validateAssetForCategory };

/**
 * Checks if media type is an image
 * @param {any} mediaType - Asset media type
 * @returns {boolean} True if media type is an image
 */
function _isImageType(mediaType: string): boolean {
  return mediaType.startsWith('image/');
}

/**
 * Checks if media type is an audio
 * @param {any} mediaType - Asset media type
 * @returns {boolean} True if media type is an audio
 */
function _isAudioType(mediaType: string): boolean {
  return mediaType.startsWith('audio/');
}

/**
 * Checks if media type is a video
 * @param {any} mediaType - Asset media type
 * @returns {boolean} True if media type is a video
 */
function _isVideoType(mediaType: string): boolean {
  return mediaType.startsWith('video/');
}

/**
 * Checks if media type is a font
 * @param {any} mediaType - Asset media type
 * @returns {boolean} True if media type is a font
 */
function _isFontType(mediaType: string): boolean {
  return (
    mediaType.startsWith('font/') ||
    mediaType.startsWith('application/font') ||
    mediaType.startsWith('application/x-font')
  );
}

/**
 * Checks if media type is a style
 * @param {any} mediaType - Asset media type
 * @returns {boolean} True if media type is a style
 */
function _isStyleType(mediaType: string): boolean {
  return mediaType === 'text/css' || mediaType === 'application/x-dtbncx+xml';
}

/**
 * Checks if media type is a document
 * @param {any} mediaType - Asset media type
 * @returns {boolean} True if media type is a document
 */
function _isDocumentType(mediaType: string): boolean {
  return mediaType === 'application/xhtml+xml' || mediaType === 'text/html';
}

/**
 * Determines asset type from media type
 * @param {any} mediaType - Asset media type
 * @returns {string} Asset type
 */
function determineAssetType(mediaType: string): string {
  if (_isImageType(mediaType)) {
    return 'image';
  }

  if (_isAudioType(mediaType)) {
    return 'audio';
  }

  if (_isVideoType(mediaType)) {
    return 'video';
  }

  if (_isFontType(mediaType)) {
    return 'font';
  }

  if (_isStyleType(mediaType)) {
    return 'style';
  }

  if (_isDocumentType(mediaType)) {
    return 'document';
  }

  return 'other';
}

/**
 * Validates asset object structure
 * @param {any} asset - Asset to validate
 * @param {unknown} asset.id - Optional unique identifier for the asset
 * @param {unknown} asset.href - Optional relative path or URL to the asset
 * @param {unknown} asset.mediaType - Optional MIME type of the asset
 * @param {unknown} asset.size - Optional size of the asset in bytes
 */
function validateAssetStructure(asset: {
  id?: unknown;
  href?: unknown;
  mediaType?: unknown;
  size?: unknown;
}): void {
  if (!asset || typeof asset !== 'object') {
    throw new Error('Asset must be an object');
  }
}

/**
 * Validates assets object structure
 * @param {any[]} assets - Assets object to validate
 */
function validateAssetsStructure(assets: unknown): void {
  if (!assets || typeof assets !== 'object') {
    throw new Error('Assets must be an object');
  }
}

/**
 * Validates asset ID property
 * @param {any} id - Asset ID to validate
 */
function validateAssetId(id: unknown): void {
  if (!id || typeof id !== 'string') {
    throw new Error('Asset must have a valid id property');
  }
}

/**
 * Validates asset href property
 * @param {any} href - Asset href to validate
 */
function validateAssetHref(href: unknown): void {
  if (!href || typeof href !== 'string') {
    throw new Error('Asset must have a valid href property');
  }
}

/**
 * Validates asset media type property
 * @param {any} mediaType - Asset media type to validate
 */
function validateAssetMediaType(mediaType: unknown): void {
  if (!mediaType || typeof mediaType !== 'string') {
    throw new Error('Asset must have a valid mediaType property');
  }
}

/**
 * Validates asset size property
 * @param {number} size - Asset size to validate
 */
function validateAssetSize(size: unknown): void {
  if (typeof size !== 'number') {
    throw new TypeError('Asset must have a valid size property');
  }
}

/**
 * Validate asset for categorization
 * @param {any} asset - Asset to validate
 * @param {string} asset.id - The unique identifier of the asset
 * @param {string} asset.href - The href path of the asset
 * @param {string} asset.mediaType - The media type of the asset
 * @param {number} asset.size - The size of the asset
 * @param {string} asset.type - The type of the asset
 * @param {string[]} asset.properties - The properties of the asset
 * @param {any[]} assets - Assets object to validate
 */
function validateAssetForCategory(
  asset: {
    id: string;
    href: string;
    mediaType: string;
    size: number;
    type?: string;
    properties?: string[];
  },
  assets: EmbeddedAssets
): void {
  validateAssetStructure(asset);
  validateAssetsStructure(assets);
  validateAssetId(asset.id);
  validateAssetHref(asset.href);
  validateAssetMediaType(asset.mediaType);
  validateAssetSize(asset.size);
}

/**
 * Prepare complete asset with type and properties
 * @param {any} asset - Original asset
 * @param {string} asset.id - The unique identifier of the asset
 * @param {string} asset.href - The href path of the asset
 * @param {string} asset.mediaType - The media type of the asset
 * @param {number} asset.size - The size of the asset
 * @param {string} asset.type - The type of the asset
 * @param {string[]} asset.properties - The properties of the asset
 * @returns {object} Complete asset with type and properties
 */
function _prepareCompleteAsset(asset: {
  id: string;
  href: string;
  mediaType: string;
  size: number;
  type?: string;
  properties?: string[];
}): {
  id: string;
  href: string;
  mediaType: string;
  size: number;
  type: string;
  properties: string[];
} {
  return {
    ...asset,
    type: asset.type || determineAssetType(asset.mediaType),
    properties: asset.properties || [],
  };
}
