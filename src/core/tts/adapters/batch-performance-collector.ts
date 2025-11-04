/**
 * Batch Performance Collector for TTS Adapter System
 * Extracted from performance-tracking.ts to reduce file size
 */

/**
 * Performance metrics collector for batch operations
 */
export class BatchPerformanceCollector {
  private metrics: BatchMetrics[] = [];

  /**
   * Start tracking a batch operation.
   * @param {string} adapterName - The name of the adapter for the batch.
   * @param {string[]} _texts - The texts to be processed (unused in current implementation).
   * @returns {string} A unique batch ID for tracking.
   */
  startBatch(adapterName: string, _texts: string[]): string {
    const batchId = `batch-${adapterName}-${Date.now()}`;
    this.initializeBatchMetrics(adapterName, batchId);
    return batchId;
  }

  /**
   * Initialize metrics for a new batch.
   * @param {string} adapterName - The adapter name.
   * @param {string} _batchId - The batch ID (unused in current implementation).
   */
  private initializeBatchMetrics(adapterName: string, _batchId: string): void {
    // Store batch initialization data for future expansion
    this.metrics.push({
      adapterName,
      startTime: Date.now(),
      success: true,
      wordCount: 0,
    });
  }

  /**
   * Complete individual batch items.
   * @param {string} _batchId - The batch ID.
   * @param {number} _itemIndex - The index of the item in the batch.
   * @param {boolean} _success - Whether the item completed successfully.
   * @param {Error} [_error] - The error if the item failed.
   */
  completeBatchItem(
    _batchId: string,
    _itemIndex: number,
    _success: boolean,
    _error?: Error
  ): void {
    // Simplified implementation - metrics tracking can be expanded as needed
  }

  /**
   * Get batch performance summary.
   * @param {string} _batchId - The batch ID to get summary for.
   * @returns {BatchSummary} Performance summary for the batch.
   */
  getBatchSummary(_batchId: string): BatchSummary {
    return this.createEmptyBatchSummary();
  }

  /**
   * Create an empty batch summary.
   * @returns {BatchSummary} Empty batch summary.
   */
  private createEmptyBatchSummary(): BatchSummary {
    return {
      totalItems: 0,
      successfulItems: 0,
      failedItems: 0,
      totalWords: 0,
      averageTimePerItem: 0,
      totalSynthesisRate: 0,
      errors: [],
    };
  }

  /**
   * Clear completed batch metrics.
   * @param {string} _batchId - The batch ID to clear metrics for.
   */
  clearBatch(_batchId: string): void {
    // Simplified implementation - can be expanded to actually clear specific batch metrics
  }

  /**
   * Get all stored metrics (useful for debugging).
   * @returns {BatchMetrics[]} Array of all stored metrics.
   */
  getAllMetrics(): BatchMetrics[] {
    return [...this.metrics];
  }
}

/**
 * Performance metrics interface for batch operations
 */
interface BatchMetrics {
  adapterName: string;
  startTime: number;
  endTime?: number;
  success: boolean;
  wordCount: number;
  error?: Error;
}

/**
 * Batch summary interface for performance reporting
 */
interface BatchSummary {
  totalItems: number;
  successfulItems: number;
  failedItems: number;
  totalWords: number;
  averageTimePerItem: number;
  totalSynthesisRate: number;
  errors: Array<{ index: number; error: string }>;
}
