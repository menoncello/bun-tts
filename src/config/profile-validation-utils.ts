import { ConfigurationError } from '../errors/configuration-error.js';
import { Result, Ok, Err } from '../errors/result.js';
import type { Logger } from '../interfaces/logger.js';
import { ConfigMerger } from './config-merger.js';
import { ConfigValidator } from './config-validator.js';
import {
  MINIMUM_NAME_LENGTH,
  MAXIMUM_NAME_LENGTH,
  MAXIMUM_DESCRIPTION_LENGTH,
  MAXIMUM_TAG_COUNT,
  MAXIMUM_TAG_LENGTH,
} from './profile-constants.js';
import type { ProfileData, ProfileMetadata } from './profile-manager.js';

/**
 * Profile validation utility class
 */
export class ProfileValidationUtils {
  private validator: ConfigValidator;
  private merger: ConfigMerger;
  private logger: Logger;

  /**
   * Create a new ProfileValidationUtils instance
   *
   * @param {Logger} logger - Logger instance for recording operations
   */
  constructor(logger: Logger) {
    this.validator = new ConfigValidator();
    this.merger = new ConfigMerger();
    this.logger = logger;
  }

  /**
   * Validate a profile name
   *
   * @param {string} name - The profile name to validate
   * @returns {Result<true, ConfigurationError>} Validation result
   */
  validateProfileName(name: string): Result<true, ConfigurationError> {
    if (!this.isValidProfileNameLength(name)) {
      return this.createLengthError(name);
    }
    if (!this.isValidProfileNameCharacters(name)) {
      return this.createCharacterError(name);
    }
    if (!this.isValidProfileNameSpaces(name)) {
      return this.createSpacesError(name);
    }
    if (!this.isValidProfileNameStartAndEnd(name)) {
      return this.createStartEndError(name);
    }
    return Ok(true);
  }

  /**
   * Validate profile metadata
   *
   * @param {ProfileMetadata} metadata - The metadata to validate
   * @returns {Array<ConfigurationError>} Array of validation errors
   */
  collectMetadataValidationErrors(
    metadata: ProfileMetadata
  ): ConfigurationError[] {
    const errors: ConfigurationError[] = [];

    // Validate name
    const nameValidation = this.validateProfileName(metadata.name);
    if (!nameValidation.success) {
      errors.push(nameValidation.error);
    }

    // Validate description length
    const descriptionError = this.validateDescriptionLength(
      metadata.description
    );
    if (descriptionError) {
      errors.push(descriptionError);
    }

    // Validate tags
    const tagsError = this.validateTagsInMetadata(metadata.tags);
    if (tagsError) {
      errors.push(tagsError);
    }

    return errors;
  }

  /**
   * Validate description length
   *
   * @param {string | undefined} description - The description to validate
   * @returns {ConfigurationError | undefined} Error if validation fails
   */
  validateDescriptionLength(
    description: string | undefined
  ): ConfigurationError | undefined {
    if (description && description.length > MAXIMUM_DESCRIPTION_LENGTH) {
      return new ConfigurationError(
        `Description must be less than ${MAXIMUM_DESCRIPTION_LENGTH} characters`
      );
    }
    return undefined;
  }

  /**
   * Validate tags in metadata
   *
   * @param {string[] | undefined} tags - The tags to validate
   * @returns {ConfigurationError | undefined} Error if validation fails
   */
  validateTagsInMetadata(
    tags: string[] | undefined
  ): ConfigurationError | undefined {
    if (tags) {
      const tagsValidation = this.validateTagsInternal(tags);
      if (!tagsValidation.success) {
        return tagsValidation.error;
      }
    }
    return undefined;
  }

  /**
   * Collect all validation errors for a complete profile
   *
   * @param {ProfileData} profile - The profile to validate
   * @returns {Array<ConfigurationError>} Array of validation errors
   */
  collectProfileValidationErrors(profile: ProfileData): ConfigurationError[] {
    const errors: ConfigurationError[] = [];

    // Validate name
    const nameValidation = this.validateProfileName(profile.name);
    if (!nameValidation.success) {
      errors.push(nameValidation.error);
    }

    // Validate description
    const descriptionError = this.validateDescriptionLength(
      profile.description
    );
    if (descriptionError) {
      errors.push(descriptionError);
    }

    // Validate tags
    const tagsError = this.validateTagsInProfile(profile.tags);
    if (tagsError) {
      errors.push(tagsError);
    }

    // Validate config using ConfigValidator
    const configError = this.validateProfileConfig(profile.config);
    if (configError) {
      errors.push(configError);
    }

    return errors;
  }

  /**
   * Validate tags in profile
   *
   * @param {string[] | undefined} tags - The tags to validate
   * @returns {ConfigurationError | undefined} Error if validation fails
   */
  validateTagsInProfile(
    tags: string[] | undefined
  ): ConfigurationError | undefined {
    return this.validateTagsInMetadata(tags);
  }

  /**
   * Validate profile configuration using ConfigValidator
   *
   * @param {Record<string, unknown>} config - The configuration to validate
   * @returns {ConfigurationError | undefined} Error if validation fails
   */
  validateProfileConfig(
    config: Record<string, unknown>
  ): ConfigurationError | undefined {
    const configValidation = this.validator.validate(config);
    if (!configValidation.success) {
      return (configValidation as { success: false; error: ConfigurationError })
        .error;
    }
    return undefined;
  }

  /**
   * Validate profile tags
   *
   * @param {string[]} tags - The tags to validate
   * @returns {Result<true, ConfigurationError>} Validation result
   */
  validateTags(tags: string[]): Result<true, ConfigurationError> {
    return this.validateTagsInternal(tags);
  }

  /**
   * Internal validation for tags
   *
   * @param {string[]} tags - The tags to validate
   * @returns {Result<true, ConfigurationError>} Validation result
   */
  private validateTagsInternal(
    tags: string[]
  ): Result<true, ConfigurationError> {
    const emptyTagsError = this.validateEmptyTags(tags);
    if (emptyTagsError) return Err(emptyTagsError);

    const countError = this.validateTagCount(tags);
    if (countError) return Err(countError);

    const individualTagErrors = this.validateIndividualTags(tags);
    if (individualTagErrors.length > 0) {
      const firstError = individualTagErrors[0];
      if (firstError) {
        return Err(firstError);
      }
    }

    return Ok(true);
  }

  /**
   * Check if tags array is empty
   *
   * @param {string[]} tags - The tags to validate
   * @returns {ConfigurationError | undefined} Error if validation fails
   */
  private validateEmptyTags(tags: string[]): ConfigurationError | undefined {
    if (tags.length === 0) {
      return new ConfigurationError('Tags array cannot be empty', {
        code: 'EMPTY_TAGS_ARRAY',
      });
    }
    return undefined;
  }

  /**
   * Validate tag count
   *
   * @param {string[]} tags - The tags to validate
   * @returns {ConfigurationError | undefined} Error if validation fails
   */
  private validateTagCount(tags: string[]): ConfigurationError | undefined {
    if (tags.length > MAXIMUM_TAG_COUNT) {
      return new ConfigurationError(
        `Too many tags: maximum is ${MAXIMUM_TAG_COUNT}`,
        {
          code: 'TOO_MANY_TAGS',
          currentCount: tags.length,
          maxCount: MAXIMUM_TAG_COUNT,
        }
      );
    }
    return undefined;
  }

  /**
   * Validate individual tags
   *
   * @param {string[]} tags - The tags to validate
   * @returns {Array<ConfigurationError>} Array of validation errors
   */
  private validateIndividualTags(tags: string[]): ConfigurationError[] {
    const errors: ConfigurationError[] = [];

    for (const tag of tags) {
      const emptyTagError = this.validateTagNotEmpty(tag);
      if (emptyTagError) {
        errors.push(emptyTagError);
        continue;
      }

      const tagLengthError = this.validateTagLength(tag);
      if (tagLengthError) {
        errors.push(tagLengthError);
        continue;
      }

      const tagFormatError = this.validateTagFormat(tag);
      if (tagFormatError) {
        errors.push(tagFormatError);
      }
    }

    return errors;
  }

  /**
   * Validate that a tag is not empty
   *
   * @param {string} tag - The tag to validate
   * @returns {ConfigurationError | undefined} Error if validation fails
   */
  private validateTagNotEmpty(tag: string): ConfigurationError | undefined {
    if (!tag || tag.trim() === '') {
      return new ConfigurationError('Tag cannot be empty', {
        code: 'EMPTY_TAG',
      });
    }
    return undefined;
  }

  /**
   * Validate tag length
   *
   * @param {string} tag - The tag to validate
   * @returns {ConfigurationError | undefined} Error if validation fails
   */
  private validateTagLength(tag: string): ConfigurationError | undefined {
    if (tag.length > MAXIMUM_TAG_LENGTH) {
      return new ConfigurationError(
        `Tag too long: maximum is ${MAXIMUM_TAG_LENGTH} characters`,
        {
          code: 'TAG_TOO_LONG',
          tag,
          maxLength: MAXIMUM_TAG_LENGTH,
        }
      );
    }
    return undefined;
  }

  /**
   * Validate tag format
   *
   * @param {string} tag - The tag to validate
   * @returns {ConfigurationError | undefined} Error if validation fails
   */
  private validateTagFormat(tag: string): ConfigurationError | undefined {
    if (tag.includes(' ') || !/^[\w-]+$/.test(tag)) {
      return new ConfigurationError(
        `Invalid tag format: '${tag}'. Tags can only contain letters, numbers, hyphens, and underscores`,
        {
          code: 'INVALID_TAG_FORMAT',
          tag,
        }
      );
    }
    return undefined;
  }

  /**
   * Check if profile name length is valid
   *
   * @param {string} name - The profile name to check
   * @returns {boolean} True if length is valid
   */
  private isValidProfileNameLength(name: string): boolean {
    return (
      name.length >= MINIMUM_NAME_LENGTH && name.length <= MAXIMUM_NAME_LENGTH
    );
  }

  /**
   * Check if profile name characters are valid
   *
   * @param {string} name - The profile name to check
   * @returns {boolean} True if characters are valid
   */
  private isValidProfileNameCharacters(name: string): boolean {
    return /^[\da-z-]+$/.test(name);
  }

  /**
   * Check if profile name contains valid spaces
   *
   * @param {string} name - The profile name to check
   * @returns {boolean} True if spaces are valid
   */
  private isValidProfileNameSpaces(name: string): boolean {
    return !name.includes(' ');
  }

  /**
   * Create length error for profile name
   *
   * @param {string} name - The profile name that failed validation
   * @returns {Result<never, ConfigurationError>} Error result
   */
  private createLengthError(name: string): Result<never, ConfigurationError> {
    return Err(
      new ConfigurationError(
        `Profile name must be between ${MINIMUM_NAME_LENGTH} and ${MAXIMUM_NAME_LENGTH} characters`,
        {
          code: 'INVALID_NAME_LENGTH',
          name,
          minLength: MINIMUM_NAME_LENGTH,
          maxLength: MAXIMUM_NAME_LENGTH,
        }
      )
    );
  }

  /**
   * Create character error for profile name
   *
   * @param {string} name - The profile name that failed validation
   * @returns {Result<never, ConfigurationError>} Error result
   */
  private createCharacterError(
    name: string
  ): Result<never, ConfigurationError> {
    return Err(
      new ConfigurationError(
        'Profile name can only contain letters, numbers, hyphens, and underscores',
        {
          code: 'INVALID_NAME_CHARACTERS',
          name,
        }
      )
    );
  }

  /**
   * Create spaces error for profile name
   *
   * @param {string} name - The profile name that failed validation
   * @returns {Result<never, ConfigurationError>} Error result
   */
  private createSpacesError(name: string): Result<never, ConfigurationError> {
    return Err(
      new ConfigurationError('Profile name cannot contain spaces', {
        code: 'INVALID_NAME_SPACES',
        name,
      })
    );
  }

  /**
   * Check if profile name starts and ends with valid characters
   *
   * @param {string} name - The profile name to check
   * @returns {boolean} True if start and end characters are valid
   */
  private isValidProfileNameStartAndEnd(name: string): boolean {
    // Profile name cannot start or end with a dash
    return !name.startsWith('-') && !name.endsWith('-');
  }

  /**
   * Create start/end error for profile name
   *
   * @param {string} name - The profile name that failed validation
   * @returns {Result<never, ConfigurationError>} Error result
   */
  private createStartEndError(name: string): Result<never, ConfigurationError> {
    return Err(
      new ConfigurationError('Profile name cannot start or end with a dash', {
        code: 'INVALID_NAME_START_END',
        name,
      })
    );
  }
}
