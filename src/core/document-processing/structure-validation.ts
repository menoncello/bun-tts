import type { Logger } from '../../interfaces/logger';
import { StructureValidationCore } from './structure-validation.core';
import type { DocumentStructure } from './types';
import type {
  StructureValidatorOptions,
  StructureCorrection,
  StructureCorrectionResult,
} from './types/structure-analyzer-types';
import { StructureValidationResult } from './validation-constants';

/** StructureValidation wrapper class */
export class StructureValidation {
  private readonly core: StructureValidationCore;

  /**
   * Creates a new instance of StructureValidation.
   * @param {Logger} logger - The logger instance to use for validation operations
   */
  constructor(logger: Logger) {
    this.core = new StructureValidationCore(logger);
  }

  /**
   * Validates document structure according to predefined rules and constraints.
   * @param {DocumentStructure} structure - The document structure to validate
   * @param {StructureValidatorOptions} [options] - Optional validation configuration parameters
   * @returns {Promise<StructureValidationResult>} Promise resolving to validation result with details on any issues found
   */
  async validateStructure(
    structure: DocumentStructure,
    options?: StructureValidatorOptions
  ): Promise<StructureValidationResult> {
    return this.core.validateStructure(structure, options);
  }

  /**
   * Applies automated corrections to fix detected structure issues.
   * @param {DocumentStructure} structure - The document structure to apply corrections to
   * @param {StructureCorrection[]} corrections - Array of structure corrections to apply
   * @returns {Promise<StructureCorrectionResult>} Promise resolving to result of the correction operation with updated structure
   */
  async applyCorrections(
    structure: DocumentStructure,
    corrections: StructureCorrection[]
  ): Promise<StructureCorrectionResult> {
    return this.core.applyCorrections(structure, corrections);
  }

  /**
   * Registers a custom validation rule to extend default validation capabilities.
   * @param {string} name - Unique identifier for the custom validation rule
   * @param {unknown} rule - The validation rule implementation to register
   */
  registerRule(name: string, rule: unknown): void {
    this.core.registerRule(name, rule);
  }

  /**
   * Removes a previously registered validation rule from the validator.
   * @param {string} name - Identifier of the validation rule to remove
   */
  unregisterRule(name: string): void {
    this.core.unregisterRule(name);
  }
}
