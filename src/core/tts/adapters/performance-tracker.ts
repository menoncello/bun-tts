/**
 * Performance Tracker for TTS Adapter System
 * Extracted from performance-tracking.ts to reduce file size
 */

import { TTSError } from './errors/tts-error.js';
import type { SynthesisRequest } from './performance-calculations.js';
import { extendedPerformanceMonitor } from './performance-monitor-wrapper.js';
import type { TTSRequest, TTSResponse } from './types.js';

// Constants
const DEFAULT_QUALITY_SCORE = 0.8;

/**
 * Convert TTSRequest to SynthesisRequest for compatibility
 * @param {TTSRequest} ttsRequest - The original TTS request
 * @returns {SynthesisRequest} Converted synthesis request
 */
function convertTTSRequestToSynthesisRequest(
  ttsRequest: TTSRequest
): SynthesisRequest {
  return {
    text: ttsRequest.text,
    options: ttsRequest.options as Record<string, unknown> | undefined,
  };
}

/**
 * Performance tracking wrapper for TTS synthesis
 */
export class PerformanceTracker {
  /**
   * Wrap TTS synthesis with performance monitoring.
   * @param {string} adapterName - The name of the TTS adapter being used.
   * @param {TTSRequest} request - The TTS request object containing text and options.
   * @param {() => Promise<T>} synthesisFn - The synthesis function to execute.
   * @returns {Promise<T>} The TTS response from the synthesis function.
   * @template {T extends TTSResponse}
   */
  static async trackSynthesis<T extends TTSResponse>(
    adapterName: string,
    request: TTSRequest,
    synthesisFn: () => Promise<T>
  ): Promise<T> {
    const startTime = Date.now();

    try {
      const response = await synthesisFn();
      this.recordSuccessfulSynthesis(adapterName, request, response, startTime);
      return response;
    } catch (error) {
      this.recordFailedSynthesis(
        adapterName,
        request,
        error as Error,
        startTime
      );
      throw error;
    }
  }

  /**
   * Record metrics for successful synthesis.
   * @param {string} adapterName - The name of the adapter.
   * @param {TTSRequest} request - The original request.
   * @param {TTSResponse} response - The successful response.
   * @param {number} startTime - The start timestamp.
   */
  private static recordSuccessfulSynthesis<T extends TTSResponse>(
    adapterName: string,
    request: TTSRequest,
    response: T,
    startTime: number
  ): void {
    const synthesisRequest = convertTTSRequestToSynthesisRequest(request);
    extendedPerformanceMonitor.recordSynthesisMetrics(
      adapterName,
      synthesisRequest,
      response,
      startTime
    );
  }

  /**
   * Record metrics for failed synthesis.
   * @param {string} adapterName - The name of the adapter.
   * @param {TTSRequest} request - The original request.
   * @param {Error} error - The error that occurred.
   * @param {number} startTime - The start timestamp.
   */
  private static recordFailedSynthesis(
    adapterName: string,
    request: TTSRequest,
    error: Error,
    startTime: number
  ): void {
    const failedResponse: TTSResponse = {
      success: false,
      error: this.createTTSError(error),
      metadata: {
        synthesisTime: Date.now() - startTime,
        engine: adapterName,
        voice: request.voice.id,
        requestId: `failed-${Date.now()}`,
      },
    };

    const synthesisRequest = convertTTSRequestToSynthesisRequest(request);
    extendedPerformanceMonitor.recordSynthesisMetrics(
      adapterName,
      synthesisRequest,
      failedResponse,
      startTime
    );
  }

  /**
   * Create a TTSError from a generic Error.
   * @param {Error} error - The original error.
   * @returns {TTSError} A TTSError instance.
   */
  private static createTTSError(error: Error): TTSError {
    return new TTSError(error.message, 'SYNTHESIS_ERROR', {
      operation: 'synthesis',
      cause: error,
    });
  }

  /**
   * Track performance against targets.
   * @param {string} adapterName - The name of the adapter being evaluated.
   * @param {TTSRequest} request - The original TTS request.
   * @param {TTSResponse} response - The TTS response to evaluate.
   * @returns {{meetsTargets: boolean, details: string[], recommendations: string[]}} Performance assessment results.
   */
  static trackPerformanceTargets(
    adapterName: string,
    request: TTSRequest,
    response: TTSResponse
  ): {
    meetsTargets: boolean;
    details: string[];
    recommendations: string[];
  } {
    if (!response.success || !response.metadata?.synthesisTime) {
      return this.createFailedPerformanceResult();
    }

    const performanceMetrics = this.extractPerformanceMetrics(
      request,
      response
    );
    const assessment = extendedPerformanceMonitor.checkPerformanceTargets(
      adapterName,
      performanceMetrics
    );
    const recommendations = this.generateRecommendations(assessment.assessment);

    return {
      meetsTargets: assessment.meetsTargets,
      details: assessment.assessment.details,
      recommendations,
    };
  }

  /**
   * Create a performance result for failed synthesis.
   * @returns {{meetsTargets: boolean, details: string[], recommendations: string[]}} Failed performance result.
   */
  private static createFailedPerformanceResult(): {
    meetsTargets: boolean;
    details: string[];
    recommendations: string[];
  } {
    return {
      meetsTargets: false,
      details: ['Synthesis failed - no performance metrics available'],
      recommendations: ['Check error details and retry synthesis'],
    };
  }

  /**
   * Extract performance metrics from request and response.
   * @param {TTSRequest} request - The TTS request.
   * @param {TTSResponse} response - The TTS response.
   * @returns {{wordCount: number, synthesisTimeMs: number, memoryUsageMB: number, qualityScore: number}} Performance metrics.
   */
  private static extractPerformanceMetrics(
    request: TTSRequest,
    response: TTSResponse
  ): {
    wordCount: number;
    synthesisTimeMs: number;
    memoryUsageMB: number;
    qualityScore: number;
  } {
    return {
      wordCount: request.text.split(' ').length,
      synthesisTimeMs: (response.metadata?.synthesisTime as number) || 0,
      memoryUsageMB: (response.metadata?.memoryUsage as number) || 0,
      qualityScore: response.quality?.overall || DEFAULT_QUALITY_SCORE,
    };
  }

  /**
   * Generate performance recommendations based on assessment.
   * @param {PerformanceAssessment} assessment - The performance assessment object.
   * @returns {string[]} Array of performance recommendations.
   */
  private static generateRecommendations(
    assessment: PerformanceAssessment
  ): string[] {
    const recommendations: string[] = [];

    if (!assessment.synthesis) {
      recommendations.push(...this.getSynthesisRecommendations());
    }

    if (!assessment.responseTime) {
      recommendations.push(...this.getResponseTimeRecommendations());
    }

    if (!assessment.memory) {
      recommendations.push(...this.getMemoryRecommendations());
    }

    if (!assessment.quality) {
      recommendations.push(...this.getQualityRecommendations());
    }

    if (this.allTargetsMet(assessment)) {
      recommendations.push(
        'Performance targets are being met - current configuration is optimal'
      );
    }

    return recommendations;
  }

  /**
   * Get synthesis-related recommendations.
   * @returns {string[]} Synthesis recommendations.
   */
  private static getSynthesisRecommendations(): string[] {
    return [
      'Synthesis rate is below target - consider optimizing text preprocessing',
      'Check system resources and TTS engine performance',
    ];
  }

  /**
   * Get response time-related recommendations.
   * @returns {string[]} Response time recommendations.
   */
  private static getResponseTimeRecommendations(): string[] {
    return [
      'Response time exceeds target - check network connectivity and system load',
      'Consider using shorter text segments for better performance',
    ];
  }

  /**
   * Get memory-related recommendations.
   * @returns {string[]} Memory recommendations.
   */
  private static getMemoryRecommendations(): string[] {
    return [
      'Memory usage is high - monitor for memory leaks',
      'Reduce concurrent request limits',
    ];
  }

  /**
   * Get quality-related recommendations.
   * @returns {string[]} Quality recommendations.
   */
  private static getQualityRecommendations(): string[] {
    return [
      'Quality score is below target - review voice selection and engine capabilities',
      'Check text preprocessing and formatting',
    ];
  }

  /**
   * Check if all performance targets are met.
   * @param {PerformanceAssessment} assessment - The assessment to check.
   * @returns {boolean} True if all targets are met.
   */
  private static allTargetsMet(assessment: PerformanceAssessment): boolean {
    return (
      assessment.synthesis &&
      assessment.responseTime &&
      assessment.memory &&
      assessment.quality
    );
  }
}

/**
 * Helper interface for performance assessment
 */
interface PerformanceAssessment {
  meetsAll: boolean;
  synthesis: boolean;
  responseTime: boolean;
  memory: boolean;
  quality: boolean;
  synthesisRate: number;
  maxResponseTime: number;
  details: string[];
}
