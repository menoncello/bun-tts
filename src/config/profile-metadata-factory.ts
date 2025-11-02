import type { ProfileMetadata } from './profile-manager.js';

/**
 * Profile metadata factory
 */
export class ProfileMetadataFactory {
  /**
   * Create profile metadata from creation data
   *
   * @param {string} name - The profile name
   * @param {string | undefined} description - The profile description
   * @param {string[] | undefined} tags - The profile tags
   * @returns {ProfileMetadata} The created metadata
   */
  static createMetadata(
    name: string,
    description?: string,
    tags?: string[]
  ): ProfileMetadata {
    const now = new Date().toISOString();

    return {
      name,
      description,
      tags: tags || [],
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * Update existing profile metadata
   *
   * @param {ProfileMetadata} existingMetadata - The existing metadata
   * @param {string | undefined} description - The updated description
   * @param {string[] | undefined} tags - The updated tags
   * @returns {ProfileMetadata} The updated metadata
   */
  static updateMetadata(
    existingMetadata: ProfileMetadata,
    description?: string,
    tags?: string[]
  ): ProfileMetadata {
    return {
      ...existingMetadata,
      description,
      tags: tags || [],
      updatedAt: new Date().toISOString(),
    };
  }
}
