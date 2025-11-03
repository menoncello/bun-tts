/**
 * Import options interface
 */
export type MergeStrategy = 'overwrite' | 'skip' | 'merge';

/**
 * Import options interface
 */
export interface ImportOptions {
  mergeStrategy?: MergeStrategy;
}

/**
 * Import/export statistics interface
 */
export interface ImportExportStats {
  importedCount: number;
  failedCount: number;
  errors: Array<{ file: string; error: string }>;
}

/**
 * Profile import parameters interface
 */
export interface ProfileImportParams {
  entry: string;
  filePath: string;
  profileName: string;
  mergeStrategy: MergeStrategy;
  importStats: ImportExportStats;
}
