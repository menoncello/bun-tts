/**
 * EPUB Parser Asset Categorizer
 * Asset categorization utilities for EPUB parsing
 */

import type { EmbeddedAssets } from '../types.js';

/**
 * Adds an image asset to the assets collection
 * @param {{
 *   id: string;
 *   href: string;
 *   mediaType: string;
 *   size: number;
 *   type: string;
 *   properties: string[];
 * }} completeAsset - The complete asset object to add
 * @param {string} completeAsset.id - Unique identifier for the asset
 * @param {string} completeAsset.href - Relative path or URL to the asset
 * @param {string} completeAsset.mediaType - MIME type of the asset
 * @param {number} completeAsset.size - Size of the asset in bytes
 * @param {string} completeAsset.type - Type category of the asset (e.g., 'image')
 * @param {string[]} completeAsset.properties - Array of additional properties associated with the asset
 * @param {any[]} assets - The assets collection to add the image to
 */
function _addImageAsset(
  completeAsset: {
    id: string;
    href: string;
    mediaType: string;
    size: number;
    type: string;
    properties: string[];
  },
  assets: EmbeddedAssets
): void {
  assets.images.push(completeAsset);
}

/**
 * Adds an audio asset to the assets collection
 * @param {{
 *   id: string;
 *   href: string;
 *   mediaType: string;
 *   size: number;
 *   type: string;
 *   properties: string[];
 * }} completeAsset - The complete asset object to add
 * @param {string} completeAsset.id - Unique identifier for the asset
 * @param {string} completeAsset.href - Relative path or URL to the asset
 * @param {string} completeAsset.mediaType - MIME type of the asset
 * @param {number} completeAsset.size - Size of the asset in bytes
 * @param {string} completeAsset.type - Type category of the asset (e.g., 'audio')
 * @param {string[]} completeAsset.properties - Array of additional properties associated with the asset
 * @param {any[]} assets - The assets collection to add the audio to
 */
function _addAudioAsset(
  completeAsset: {
    id: string;
    href: string;
    mediaType: string;
    size: number;
    type: string;
    properties: string[];
  },
  assets: EmbeddedAssets
): void {
  assets.audio.push(completeAsset);
}

/**
 * Adds a video asset to the assets collection
 * @param {{
 *   id: string;
 *   href: string;
 *   mediaType: string;
 *   size: number;
 *   type: string;
 *   properties: string[];
 * }} completeAsset - The complete asset object to add
 * @param {string} completeAsset.id - Unique identifier for the asset
 * @param {string} completeAsset.href - Relative path or URL to the asset
 * @param {string} completeAsset.mediaType - MIME type of the asset
 * @param {number} completeAsset.size - Size of the asset in bytes
 * @param {string} completeAsset.type - Type category of the asset (e.g., 'video')
 * @param {string[]} completeAsset.properties - Array of additional properties associated with the asset
 * @param {any[]} assets - The assets collection to add the video to
 */
function _addVideoAsset(
  completeAsset: {
    id: string;
    href: string;
    mediaType: string;
    size: number;
    type: string;
    properties: string[];
  },
  assets: EmbeddedAssets
): void {
  assets.video.push(completeAsset);
}

/**
 * Adds a font asset to the assets collection
 * @param {{
 *   id: string;
 *   href: string;
 *   mediaType: string;
 *   size: number;
 *   type: string;
 *   properties: string[];
 * }} completeAsset - The complete asset object to add
 * @param {string} completeAsset.id - Unique identifier for the asset
 * @param {string} completeAsset.href - Relative path or URL to the asset
 * @param {string} completeAsset.mediaType - MIME type of the asset
 * @param {number} completeAsset.size - Size of the asset in bytes
 * @param {string} completeAsset.type - Type category of the asset (e.g., 'font')
 * @param {string[]} completeAsset.properties - Array of additional properties associated with the asset
 * @param {any[]} assets - The assets collection to add the font to
 */
function _addFontAsset(
  completeAsset: {
    id: string;
    href: string;
    mediaType: string;
    size: number;
    type: string;
    properties: string[];
  },
  assets: EmbeddedAssets
): void {
  assets.fonts.push(completeAsset);
}

/**
 * Adds a style asset to the assets collection
 * @param {{
 *   id: string;
 *   href: string;
 *   mediaType: string;
 *   size: number;
 *   type: string;
 *   properties: string[];
 * }} completeAsset - The complete asset object to add
 * @param {string} completeAsset.id - Unique identifier for the asset
 * @param {string} completeAsset.href - Relative path or URL to the asset
 * @param {string} completeAsset.mediaType - MIME type of the asset
 * @param {number} completeAsset.size - Size of the asset in bytes
 * @param {string} completeAsset.type - Type category of the asset (e.g., 'style')
 * @param {string[]} completeAsset.properties - Array of additional properties associated with the asset
 * @param {any[]} assets - The assets collection to add the style to
 */
function _addStyleAsset(
  completeAsset: {
    id: string;
    href: string;
    mediaType: string;
    size: number;
    type: string;
    properties: string[];
  },
  assets: EmbeddedAssets
): void {
  assets.styles.push(completeAsset);
}

/**
 * Adds an other type asset to the assets collection
 * @param {{
 *   id: string;
 *   href: string;
 *   mediaType: string;
 *   size: number;
 *   type: string;
 *   properties: string[];
 * }} completeAsset - The complete asset object to add
 * @param {string} completeAsset.id - Unique identifier for the asset
 * @param {string} completeAsset.href - Relative path or URL to the asset
 * @param {string} completeAsset.mediaType - MIME type of the asset
 * @param {number} completeAsset.size - Size of the asset in bytes
 * @param {string} completeAsset.type - Type category of the asset (e.g., 'other')
 * @param {string[]} completeAsset.properties - Array of additional properties associated with the asset
 * @param {any[]} assets - The assets collection to add the other asset to
 */
function _addOtherAsset(
  completeAsset: {
    id: string;
    href: string;
    mediaType: string;
    size: number;
    type: string;
    properties: string[];
  },
  assets: EmbeddedAssets
): void {
  assets.other.push(completeAsset);
}

/**
 * Asset type handler mapping
 */
const ASSET_HANDLERS = {
  image: _addImageAsset,
  audio: _addAudioAsset,
  video: _addVideoAsset,
  font: _addFontAsset,
  style: _addStyleAsset,
} as const;

/**
 * Categorizes and adds an asset to the appropriate collection based on its type
 * @param {{
 *   id: string;
 *   href: string;
 *   mediaType: string;
 *   size: number;
 *   type: string;
 *   properties: string[];
 * }} completeAsset - Complete asset object with type and properties
 * @param {string} completeAsset.id - Unique identifier for the asset
 * @param {string} completeAsset.href - Relative path or URL to the asset
 * @param {string} completeAsset.mediaType - MIME type of the asset
 * @param {number} completeAsset.size - Size of the asset in bytes
 * @param {string} completeAsset.type - Type category of the asset (image, audio, video, font, style, or other)
 * @param {string[]} completeAsset.properties - Array of additional properties associated with the asset
 * @param {any[]} assets - The assets object containing collections for different asset types
 */
function _categorizeAndAddAsset(
  completeAsset: {
    id: string;
    href: string;
    mediaType: string;
    size: number;
    type: string;
    properties: string[];
  },
  assets: EmbeddedAssets
): void {
  const handler =
    ASSET_HANDLERS[completeAsset.type as keyof typeof ASSET_HANDLERS];
  if (handler) {
    handler(completeAsset, assets);
  } else {
    _addOtherAsset(completeAsset, assets);
  }
}
