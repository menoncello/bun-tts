/**
 * Action handling methods for PDF parsing errors
 */

import {
  getStructuralErrorActions,
  getContentErrorActions,
  getProcessingErrorActions,
  getResourceErrorActions,
  getInputErrorActions,
  getDefaultActions,
} from './pdf-parse-error-actions.js';
import type { PdfParseErrorCode } from './pdf-parse-error-codes.js';
import { getErrorDescriptions } from './pdf-parse-error-descriptions.js';
import type { ActionSources } from './pdf-parse-error-types.js';

/**
 * Handler for error action management
 */
export class PdfParseErrorActionHandler {
  /**
   * Get a user-friendly description of this error
   * @param {PdfParseErrorCode} code - Error code
   * @returns {string} User-friendly description of the error
   */
  static getUserDescription(code: PdfParseErrorCode): string {
    const descriptions = this.getDescriptions();
    return descriptions[code] || descriptions.PARSE_FAILED;
  }

  /**
   * Get error descriptions for all error codes
   * @returns {Record<PdfParseErrorCode, string>} Error descriptions mapping
   */
  private static getDescriptions(): Record<PdfParseErrorCode, string> {
    return getErrorDescriptions();
  }

  /**
   * Get suggested actions to resolve this error
   * @param {PdfParseErrorCode} code - Error code
   * @returns {string[]} Array of suggested actions to resolve the error
   */
  static getSuggestedActions(code: PdfParseErrorCode): string[] {
    const actionMap = this.getActionMap();
    return actionMap[code] || actionMap.default;
  }

  /**
   * Get the complete action mapping for all error codes
   * @returns {Record<PdfParseErrorCode | 'default', string[]>} Complete action mapping
   */
  private static getActionMap(): Record<
    PdfParseErrorCode | 'default',
    string[]
  > {
    const actionSources = this.getActionSources();
    const actionMap = this.initializeActionMap(actionSources);
    actionMap.default = getDefaultActions();

    return actionMap;
  }

  /**
   * Get all action sources
   * @returns {ActionSources} All action sources
   */
  private static getActionSources(): ActionSources {
    return {
      structural: getStructuralErrorActions(),
      content: getContentErrorActions(),
      processing: getProcessingErrorActions(),
      resource: getResourceErrorActions(),
      input: getInputErrorActions(),
    };
  }

  /**
   * Initialize action map with all error codes
   * @param {ActionSources} sources - Action sources
   * @returns {Record<PdfParseErrorCode | 'default', string[]>} Initialized action map
   */
  private static initializeActionMap(
    sources: ActionSources
  ): Record<PdfParseErrorCode | 'default', string[]> {
    const actionMap = {} as Record<PdfParseErrorCode | 'default', string[]>;
    const allCodes = this.getAllErrorCodes(sources);

    for (const code of allCodes) {
      actionMap[code] = this.getMergedActionsForCode(code, sources);
    }

    return actionMap;
  }

  /**
   * Get all unique error codes from all sources
   * @param {ActionSources} sources - Action sources
   * @returns {PdfParseErrorCode[]} All error codes
   */
  private static getAllErrorCodes(sources: ActionSources): PdfParseErrorCode[] {
    const codeSet = new Set<PdfParseErrorCode>([
      ...(Object.keys(sources.structural) as PdfParseErrorCode[]),
      ...(Object.keys(sources.content) as PdfParseErrorCode[]),
      ...(Object.keys(sources.processing) as PdfParseErrorCode[]),
      ...(Object.keys(sources.resource) as PdfParseErrorCode[]),
      ...(Object.keys(sources.input) as PdfParseErrorCode[]),
    ]);

    return Array.from(codeSet);
  }

  /**
   * Get merged actions for a specific error code
   * @param {PdfParseErrorCode} code - Error code
   * @param {ActionSources} sources - Action sources
   * @returns {string[]} Merged actions
   */
  private static getMergedActionsForCode(
    code: PdfParseErrorCode,
    sources: ActionSources
  ): string[] {
    const actionArrays = [
      sources.structural[code] || [],
      sources.content[code] || [],
      sources.processing[code] || [],
      sources.resource[code] || [],
      sources.input[code] || [],
    ];

    const nonEmptyActions = actionArrays.find(
      (actions): actions is string[] =>
        Array.isArray(actions) && actions.length > 0
    );

    return nonEmptyActions || [];
  }
}
