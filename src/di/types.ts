/**
 * Dependency Injection Type Definitions
 *
 * This file defines the shape of dependencies available through the DI container.
 * It provides TypeScript safety for dependency resolution.
 */

import { ConfigCommand } from '../cli/commands/config-command.js';
import { ConvertCommand } from '../cli/commands/convert-command.js';
import {
  HelpCommand,
  ConsoleOutputWriter,
} from '../cli/commands/help-command.js';
import { VersionCommand } from '../cli/commands/version-command.js';
import { ConfigManager } from '../config/index.js';
import type { Logger } from '../interfaces/logger.js';

/**
 * DI Container Interface (Current Dependencies)
 *
 * Defines dependencies currently available through the container.
 * This will be expanded as new modules are implemented.
 */
export interface DIContainer {
  // Configuration and Logging Services
  configManager: ConfigManager;
  logger: Logger;

  // Output Services
  outputWriter: ConsoleOutputWriter;

  // CLI Commands
  helpCommand: HelpCommand;
  versionCommand: VersionCommand;
  convertCommand: ConvertCommand;
  configCommand: ConfigCommand;

  // Future dependencies will be added here as modules are implemented:
  // ttsAdapterFactory: TTSAdapterFactory;
  // markdownParser: MarkdownParser;
  // pdfParser: PDFParser;
  // epubParser: EPUBParser;
  // documentProcessor: DocumentProcessor;
  // audioProcessor: AudioProcessor;
}

/**
 * Current Dependency Keys
 *
 * String literals for dependency names to avoid magic strings.
 */
export const DEPENDENCIES = {
  CONFIG_MANAGER: 'configManager',
  LOGGER: 'logger',
  OUTPUT_WRITER: 'outputWriter',
  HELP_COMMAND: 'helpCommand',
  VERSION_COMMAND: 'versionCommand',
  CONVERT_COMMAND: 'convertCommand',
  CONFIG_COMMAND: 'configCommand',

  // Future dependencies will be added as modules are implemented:
  // TTS_ADAPTER_FACTORY: 'ttsAdapterFactory',
  // MARKDOWN_PARSER: 'markdownParser',
  // PDF_PARSER: 'pdfParser',
  // EPUB_PARSER: 'epubParser',
  // DOCUMENT_PROCESSOR: 'documentProcessor',
  // AUDIO_PROCESSOR: 'audioProcessor'
} as const;

/**
 * Type for dependency keys
 */
export type DependencyKey = (typeof DEPENDENCIES)[keyof typeof DEPENDENCIES];

/**
 * Helper function to get dependency type
 */
export type DependencyType<T extends DependencyKey> = DIContainer[T];

/**
 * Service lifecycle definitions
 */
export enum ServiceLifetime {
  SINGLETON = 'singleton',
  TRANSIENT = 'transient',
  SCOPED = 'scoped',
}

/**
 * Service metadata for container registration
 */
export interface ServiceMetadata {
  name: DependencyKey;
  lifetime: ServiceLifetime;
  description: string;
}

/**
 * Registry of all services with their metadata
 */
export const SERVICE_REGISTRY: Record<DependencyKey, ServiceMetadata> = {
  configManager: {
    name: DEPENDENCIES.CONFIG_MANAGER,
    lifetime: ServiceLifetime.SINGLETON,
    description: 'Configuration management service with persistent settings',
  },
  logger: {
    name: DEPENDENCIES.LOGGER,
    lifetime: ServiceLifetime.SINGLETON,
    description: 'Structured logging service for application events',
  },
  outputWriter: {
    name: DEPENDENCIES.OUTPUT_WRITER,
    lifetime: ServiceLifetime.SINGLETON,
    description: 'Output writer service for displaying content to console',
  },
  helpCommand: {
    name: DEPENDENCIES.HELP_COMMAND,
    lifetime: ServiceLifetime.TRANSIENT,
    description: 'CLI command for displaying help and usage information',
  },
  versionCommand: {
    name: DEPENDENCIES.VERSION_COMMAND,
    lifetime: ServiceLifetime.TRANSIENT,
    description: 'CLI command for displaying version information',
  },
  convertCommand: {
    name: DEPENDENCIES.CONVERT_COMMAND,
    lifetime: ServiceLifetime.TRANSIENT,
    description: 'CLI command for document to audiobook conversion',
  },
  configCommand: {
    name: DEPENDENCIES.CONFIG_COMMAND,
    lifetime: ServiceLifetime.TRANSIENT,
    description: 'CLI command for configuration management',
  },
  // Future services will be added here as modules are implemented:
  // ttsAdapterFactory: {
  //   name: DEPENDENCIES.TTS_ADAPTER_FACTORY,
  //   lifetime: ServiceLifetime.SINGLETON,
  //   description: 'Factory for creating and managing TTS adapter instances'
  // },
  // markdownParser: {
  //   name: DEPENDENCIES.MARKDOWN_PARSER,
  //   lifetime: ServiceLifetime.TRANSIENT,
  //   description: 'Parser for Markdown document files'
  // },
  // pdfParser: {
  //   name: DEPENDENCIES.PDF_PARSER,
  //   lifetime: ServiceLifetime.TRANSIENT,
  //   description: 'Parser for PDF document files'
  // },
  // epubParser: {
  //   name: DEPENDENCIES.EPUB_PARSER,
  //   lifetime: ServiceLifetime.TRANSIENT,
  //   description: 'Parser for EPUB document files'
  // },
  // documentProcessor: {
  //   name: DEPENDENCIES.DOCUMENT_PROCESSOR,
  //   lifetime: ServiceLifetime.TRANSIENT,
  //   description: 'Service for processing and analyzing document structures'
  // },
  // audioProcessor: {
  //   name: DEPENDENCIES.AUDIO_PROCESSOR,
  //   lifetime: ServiceLifetime.TRANSIENT,
  //   description: 'Service for audio processing and concatenation'
  // }
} as const;
