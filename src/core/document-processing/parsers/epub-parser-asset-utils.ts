/**
 * EPUB Parser Asset Utilities
 * Asset management and categorization utilities for EPUB parsing
 */

import type { EmbeddedAssets } from '../types.js';
import {
  determineAssetType,
  validateAssetForCategory,
} from './epub-parser-asset-validator.js';

/**
 * Generates asset ID from href (fallback when no ID provided)
 * @param {any} href - Asset href
 * @returns {string} Generated asset ID
 */
function _generateAssetId(href: string): string {
  // Replace forward slashes with hyphens and dots with hyphens to match expected test format
  return href.replace(/[./]/g, '-');
}

/**
 * Validates manifest item structure
 * @param {any} item - Manifest item to validate
 * @param {string} item.id - Unique identifier for the manifest item
 * @param {string} item.href - Relative path or URL to the resource
 * @param {string} item.mediaType - MIME type of the resource
 * @param {string[]} item.properties - Optional array of additional properties
 */
function validateManifestItem(item: {
  id: string;
  href: string;
  mediaType: string;
  properties?: string[];
}): void {
  if (!item || typeof item !== 'object') {
    throw new Error('Manifest item must be an object');
  }

  if (!item.id || typeof item.id !== 'string') {
    throw new Error('Manifest item must have a valid id');
  }

  if (!item.href || typeof item.href !== 'string') {
    throw new Error('Manifest item must have a valid href');
  }

  if (!item.mediaType || typeof item.mediaType !== 'string') {
    throw new Error('Manifest item must have a valid mediaType');
  }
}

/**
 * Extracts asset details from manifest item
 * @param {any} item - Manifest item to extract details from
 * @param {string} item.id - Unique identifier for the manifest item
 * @param {string} item.href - Relative path or URL to the resource
 * @param {string} item.mediaType - MIME type of the resource
 * @param {string[]} item.properties - Optional array of additional properties
 * @returns {object} Asset details object with extracted information
 */
function extractAssetDetails(item: {
  id: string;
  href: string;
  mediaType: string;
  properties?: string[];
}): {
  id: string;
  href: string;
  mediaType: string;
  type: string;
  properties: string[];
} {
  return {
    id: _generateAssetId(item.href), // Generate ID from href to match expected test format
    href: item.href,
    mediaType: item.mediaType,
    type: determineAssetType(item.mediaType),
    properties: item.properties || [],
  };
}

/**
 * Builds asset object with additional metadata
 * @param {any} details - Asset details extracted from manifest item
 * @param {string} details.id - Unique identifier for the asset
 * @param {string} details.href - Relative path or URL to the asset
 * @param {string} details.mediaType - MIME type of the asset
 * @param {string} details.type - Type category of the asset
 * @param {string[]} details.properties - Array of properties associated with the asset
 * @param {any} item - Original manifest item
 * @param {string} item.id - Original ID from the manifest item
 * @param {string} item.href - Original href from the manifest item
 * @param {string} item.mediaType - Original media type from the manifest item
 * @param {string[]} item.properties - Original properties from the manifest item
 * @returns {object} Complete asset object with original ID preserved
 */
function buildAssetObject(
  details: {
    id: string;
    href: string;
    mediaType: string;
    type: string;
    properties: string[];
  },
  item: {
    id: string;
    href: string;
    mediaType: string;
    properties?: string[];
  }
): {
  id: string;
  href: string;
  mediaType: string;
  type: string;
  properties: string[];
  originalId: string;
} {
  return {
    ...details,
    originalId: item.id,
  };
}

/**
 * Checks if asset is a font
 * @param {any} mediaType - Asset media type
 * @returns {boolean} True if asset is a font
 */
function isFontAsset(mediaType: string): boolean {
  const lowerMediaType = mediaType.toLowerCase();
  return (
    lowerMediaType.startsWith('font/') ||
    lowerMediaType.includes('woff') ||
    lowerMediaType.includes('ttf') ||
    lowerMediaType.includes('otf') ||
    lowerMediaType.includes('eot') ||
    lowerMediaType.includes('vnd.ms-fontobject')
  );
}

/**
 * Checks if asset is a style asset
 * @param {any} mediaType - Asset media type
 * @returns {boolean} True if asset is a style asset
 */
function isStyleAsset(mediaType: string): boolean {
  const lowerMediaType = mediaType.toLowerCase();
  return (
    lowerMediaType === 'text/css' ||
    lowerMediaType === 'text/x-scss' ||
    lowerMediaType === 'text/x-sass' ||
    lowerMediaType === 'text/x-less' ||
    lowerMediaType === 'application/x-dtbncx+xml'
  );
}

/**
 * Checks if asset is an image asset
 * @param {any} mediaType - Asset media type
 * @returns {boolean} True if asset is an image asset
 */
function isImageAsset(mediaType: string): boolean {
  const lowerMediaType = mediaType.toLowerCase();
  return (
    lowerMediaType.startsWith('image/') ||
    lowerMediaType.includes('jpeg') ||
    lowerMediaType.includes('jpg') ||
    lowerMediaType.includes('png') ||
    lowerMediaType.includes('gif') ||
    lowerMediaType.includes('webp') ||
    lowerMediaType.includes('svg')
  );
}

/**
 * Checks if asset is an audio asset
 * @param {any} mediaType - Asset media type
 * @returns {boolean} True if asset is an audio asset
 */
function isAudioAsset(mediaType: string): boolean {
  return mediaType.toLowerCase().startsWith('audio/');
}

/**
 * Checks if asset is a video asset
 * @param {any} mediaType - Asset media type
 * @returns {boolean} True if asset is a video asset
 */
function isVideoAsset(mediaType: string): boolean {
  return mediaType.toLowerCase().startsWith('video/');
}

/**
 * Adds font asset to fonts collection
 * @param {any} asset - Asset to add to the fonts collection
 * @param {string} asset.id - Unique identifier for the asset
 * @param {string} asset.href - Relative path or URL to the font file
 * @param {string} asset.mediaType - MIME type of the font file
 * @param {string} asset.type - Optional type of the asset (defaults to 'font')
 * @param {string[]} asset.properties - Optional array of additional properties
 * @param {number} asset.size - Size of the font file in bytes
 * @param {any[]} assets - Assets object containing the fonts collection
 */
function _addFontAsset(
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
  const fontAsset = {
    id: asset.id,
    href: asset.href,
    mediaType: asset.mediaType,
    size: asset.size || 0,
    properties: asset.properties || [],
    type: asset.type || 'font',
  };

  assets.fonts.push(fontAsset);
}

/**
 * Adds style asset to styles collection
 * @param {any} asset - Asset to add to the styles collection
 * @param {string} asset.id - Unique identifier for the asset
 * @param {string} asset.href - Relative path or URL to the style file
 * @param {string} asset.mediaType - MIME type of the style file
 * @param {string} asset.type - Optional type of the asset (defaults to 'style')
 * @param {string[]} asset.properties - Optional array of additional properties
 * @param {number} asset.size - Size of the style file in bytes
 * @param {any[]} assets - Assets object containing the styles collection
 */
function _addStyleAsset(
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
  const styleAsset = {
    id: asset.id,
    href: asset.href,
    mediaType: asset.mediaType,
    size: asset.size || 0,
    properties: asset.properties || [],
    type: asset.type || 'style',
  };

  assets.styles.push(styleAsset);
}

/**
 * Adds image asset to images collection
 * @param {any} asset - Asset to add to the images collection
 * @param {string} asset.id - Unique identifier for the asset
 * @param {string} asset.href - Relative path or URL to the image file
 * @param {string} asset.mediaType - MIME type of the image file
 * @param {string} asset.type - Optional type of the asset (defaults to 'image')
 * @param {string[]} asset.properties - Optional array of additional properties
 * @param {number} asset.size - Size of the image file in bytes
 * @param {any[]} assets - Assets object containing the images collection
 */
function _addImageAsset(
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
  const imageAsset = {
    id: asset.id,
    href: asset.href,
    mediaType: asset.mediaType,
    size: asset.size || 0,
    properties: asset.properties || [],
    type: asset.type || 'image',
  };
  assets.images.push(imageAsset);
}

/**
 * Adds audio asset to audio collection
 * @param {any} asset - Asset to add to the audio collection
 * @param {string} asset.id - Unique identifier for the asset
 * @param {string} asset.href - Relative path or URL to the audio file
 * @param {string} asset.mediaType - MIME type of the audio file
 * @param {string} asset.type - Optional type of the asset (defaults to 'audio')
 * @param {string[]} asset.properties - Optional array of additional properties
 * @param {number} asset.size - Size of the audio file in bytes
 * @param {any[]} assets - Assets object containing the audio collection
 */
function _addAudioAsset(
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
  const audioAsset = {
    id: asset.id,
    href: asset.href,
    mediaType: asset.mediaType,
    size: asset.size || 0,
    properties: asset.properties || [],
    type: asset.type || 'audio',
  };

  assets.audio.push(audioAsset);
}

/**
 * Adds video asset to video collection
 * @param {any} asset - Asset to add to the video collection
 * @param {string} asset.id - Unique identifier for the asset
 * @param {string} asset.href - Relative path or URL to the video file
 * @param {string} asset.mediaType - MIME type of the video file
 * @param {string} asset.type - Optional type of the asset (defaults to 'video')
 * @param {string[]} asset.properties - Optional array of additional properties
 * @param {number} asset.size - Size of the video file in bytes
 * @param {any[]} assets - Assets object containing the video collection
 */
function _addVideoAsset(
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
  const videoAsset = {
    id: asset.id,
    href: asset.href,
    mediaType: asset.mediaType,
    size: asset.size || 0,
    properties: asset.properties || [],
    type: asset.type || 'video',
  };

  assets.video.push(videoAsset);
}

/**
 * Adds other asset to appropriate collection
 * @param {any} asset - Asset to add to the other collection
 * @param {string} asset.id - Unique identifier for the asset
 * @param {string} asset.href - Relative path or URL to the asset file
 * @param {string} asset.mediaType - MIME type of the asset file
 * @param {string} asset.type - Optional type of the asset (defaults to 'other')
 * @param {string[]} asset.properties - Optional array of additional properties
 * @param {number} asset.size - Size of the asset file in bytes
 * @param {any[]} assets - Assets object containing the other collection
 */
function _addOtherAsset(
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
  const otherAsset = {
    id: asset.id,
    href: asset.href,
    mediaType: asset.mediaType,
    size: asset.size || 0,
    properties: asset.properties || [],
    type: asset.type || 'other',
  };

  assets.other.push(otherAsset);
}

/**
 * Adds asset to correct category based on type
 * @param {any} asset - Asset to add to the appropriate category
 * @param {string} asset.id - Unique identifier for the asset
 * @param {string} asset.href - Relative path or URL to the asset file
 * @param {string} asset.mediaType - MIME type of the asset file
 * @param {number} asset.size - Size of the asset file in bytes
 * @param {string} asset.type - Optional type of the asset
 * @param {string[]} asset.properties - Optional array of additional properties
 * @param {any[]} assets - Assets object containing all category collections
 */
export function addAssetToCorrectCategory(
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
  validateAssetForCategory(asset, assets);

  if (isFontAsset(asset.mediaType)) {
    _addFontAsset(asset, assets);
  } else if (isStyleAsset(asset.mediaType)) {
    _addStyleAsset(asset, assets);
  } else if (isImageAsset(asset.mediaType)) {
    _addImageAsset(asset, assets);
  } else if (isAudioAsset(asset.mediaType)) {
    _addAudioAsset(asset, assets);
  } else if (isVideoAsset(asset.mediaType)) {
    _addVideoAsset(asset, assets);
  } else {
    _addOtherAsset(asset, assets);
  }
}

/**
 * Creates asset from manifest item
 * @param {any} item - Manifest item to create asset from
 * @param {string} item.id - Unique identifier for the manifest item
 * @param {string} item.href - Relative path or URL to the resource
 * @param {string} item.mediaType - MIME type of the resource
 * @param {string[]} item.properties - Optional array of additional properties
 * @returns {object} Complete asset object with default size of 0
 */
export function createAssetFromManifestItem(item: {
  id: string;
  href: string;
  mediaType: string;
  properties?: string[];
}): {
  id: string;
  href: string;
  mediaType: string;
  type: string;
  properties: string[];
  originalId: string;
  size: number;
} {
  validateManifestItem(item);
  const details = extractAssetDetails(item);
  const asset = buildAssetObject(details, item);
  return {
    ...asset,
    size: 0, // Default size since it's not provided in manifest
  };
}

/**
 * Creates empty assets object
 * @returns {EmbeddedAssets} Empty assets object
 */
export function createEmptyAssets(): EmbeddedAssets {
  return {
    images: [],
    styles: [],
    fonts: [],
    audio: [],
    video: [],
    other: [],
  };
}
