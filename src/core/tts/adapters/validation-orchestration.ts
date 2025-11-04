import {
  BasicValidationParams,
  FeatureValidationParams,
  ValidationState,
  validatePreferredEngineForAdapter,
  validateLanguageSupportForAdapter,
  validateRequiredFeaturesForAdapter,
  validatePerformanceRequirementsForAdapter,
} from './validation-functions.js';

/**
 * Runs basic validation checks (preferred engine and language support)
 *
 * @param {BasicValidationParams} params - Basic validation parameters
 * @param {ValidationState} state - Current validation state
 * @returns {Promise<ValidationState>} Updated validation state
 */
export async function runBasicValidations(
  params: BasicValidationParams,
  state: ValidationState
): Promise<ValidationState> {
  // Validate preferred engine
  const engineState = await validatePreferredEngineForAdapter(params, state);
  if (!engineState.isSuitable) {
    return engineState;
  }

  // Validate language support
  return validateLanguageSupportForAdapter(params, engineState);
}

/**
 * Runs feature and performance validation checks
 *
 * @param {FeatureValidationParams} params - Feature validation parameters
 * @param {ValidationState} state - Current validation state
 * @returns {Promise<ValidationState>} Updated validation state
 */
export async function runFeatureAndPerformanceValidations(
  params: FeatureValidationParams,
  state: ValidationState
): Promise<ValidationState> {
  // Validate required features
  const featuresState = await validateRequiredFeaturesForAdapter(params, state);
  if (!featuresState.isSuitable) {
    return featuresState;
  }

  // Validate performance requirements
  return validatePerformanceRequirementsForAdapter(params, featuresState);
}

/**
 * Runs all validation checks for adapter suitability
 *
 * @param {import('./itts-adapter.js').TtsAdapter} adapter - Adapter to check
 * @param {string} adapterName - Name of the adapter
 * @param {import('./types.js').TTSRequest} request - The synthesis request
 * @param {import('./types.js').EngineSelectionCriteria} criteria - Selection criteria
 * @returns {Promise<{ isSuitable: boolean; validationErrors: string[] }>} Validation results
 */
export async function runAllValidationChecks(
  adapter: import('./itts-adapter.js').TtsAdapter,
  adapterName: string,
  request: import('./types.js').TTSRequest,
  criteria: import('./types.js').EngineSelectionCriteria
): Promise<{ isSuitable: boolean; validationErrors: string[] }> {
  const initialState: ValidationState = {
    validationErrors: [],
    isSuitable: true,
  };

  // Run basic validations first
  const basicParams: BasicValidationParams = {
    adapter,
    adapterName,
    request,
    criteria,
  };
  const basicResults = await runBasicValidations(basicParams, initialState);

  // Run feature and performance validations
  const featureParams: FeatureValidationParams = {
    adapter,
    criteria,
  };
  const advancedResults = await runFeatureAndPerformanceValidations(
    featureParams,
    basicResults
  );

  return {
    isSuitable: advancedResults.isSuitable,
    validationErrors: advancedResults.validationErrors,
  };
}

// Re-export SuitabilityResult for use in other modules
export type { SuitabilityResult } from './validation-functions.js';
