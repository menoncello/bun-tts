# Decision Architecture - bun-tts

## Executive Summary

bun-tts is a professional CLI/TUI audiobook creation tool that processes multiple document formats (MD, PDF, EPUB) through open-source TTS engines (Kokoro, Chatterbox) with offline-first architecture. The system uses a React-based TUI for real-time visualization and a modular adapter pattern for TTS extensibility, supporting 1000+ page document processing with streaming architecture and comprehensive error handling.

## Project Initialization

First implementation story should execute:

```bash
npx create-ink-app bun-tts --typescript
```

This establishes the base architecture with these decisions:

- React component-based TUI framework via Ink
- TypeScript with full type safety
- Babel configuration for React components in CLI environment
- Basic CLI structure with React rendering

## Decision Summary

| Category                | Decision                           | Version         | Affects Epics | Rationale                                                                  |
| ----------------------- | ---------------------------------- | --------------- | ------------- | -------------------------------------------------------------------------- |
| **CLI Framework**       | Ink + React                        | Latest          | Epic 1, 3     | Component-based TUI with real-time visualization needs                     |
| **CLI Parsing**         | Clack                              | Latest          | Epic 1, 3     | Modern TypeScript-first approach with excellent help generation            |
| **Document Processing** | pdf-parse + @smoores/epub + marked | Latest versions | Epic 1        | JavaScript-native, cross-platform, no native dependencies                  |
| **Audio Processing**    | Custom PCM buffer processing       | Node.js native  | Epic 2, 4     | Complete control over concatenation, cross-fading, quality normalization   |
| **Configuration**       | Cosmiconfig                        | v9.0.0          | Epic 1, 3     | Industry standard, multiple formats (.json, .yml, .js), TypeScript support |
| **Error Handling**      | Custom classes + Result pattern    | Node.js native  | All epics     | Structured error handling + functional error propagation                   |
| **Logging**             | Pino                               | v10.1.0         | All epics     | Ultra-fast performance for large document processing                       |
| **Testing**             | Bun Test                           | Bun native      | All epics     | Native integration, excellent performance, TypeScript support              |
| **Module Organization** | Feature-based                      | Node.js native  | All epics     | Aligns with epic structure, better encapsulation                           |

## Project Structure

```
bun-tts/
├── src/
│   ├── cli/
│   │   ├── commands/
│   │   │   ├── convert.ts          # Main conversion command
│   │   │   ├── config.ts           # Configuration management
│   │   │   └── preview.ts          # Audio preview functionality
│   │   ├── utils/
│   │   │   ├── progress.ts         # Progress tracking
│   │   │   └── validation.ts       # Input validation
│   │   └── index.ts                # CLI entry point
│   ├── ui/
│   │   ├── components/
│   │   │   ├── DocumentTree.tsx    # Document structure visualization
│   │   │   ├── ProgressBar.tsx     # Real-time progress
│   │   │   ├── ConfigPanel.tsx     # Settings interface
│   │   │   └── AudioPlayer.tsx     # Audio preview controls
│   │   ├── hooks/
│   │   │   ├── useProgress.ts      # Progress state management
│   │   │   └── useAudio.ts          # Audio playback state
│   │   └── index.ts                # TUI entry point
│   ├── core/
│   │   ├── document-processing/
│   │   │   ├── parsers/
│   │   │   │   ├── MarkdownParser.ts
│   │   │   │   ├── PDFParser.ts
│   │   │   │   └── EPUBParser.ts
│   │   │   ├── StructureAnalyzer.ts
│   │   │   └── types.ts             # Document structure types
│   │   ├── tts/
│   │   │   ├── adapters/
│   │   │   │   ├── ITTSAdapter.ts   # Adapter interface
│   │   │   │   ├── KokoroAdapter.ts
│   │   │   │   └── ChatterboxAdapter.ts
│   │   │   ├── AudioProcessor.ts    # Concatenation & processing
│   │   │   ├── PronunciationManager.ts
│   │   │   └── types.ts             # TTS-related types
│   │   ├── emotion/
│   │   │   ├── EmotionEngine.ts     # Emotion detection/assignment
│   │   │   └── types.ts
│   │   └── audio/
│   │       ├── PCMAudio.ts          # PCM buffer processing
│   │       ├── AudioExporter.ts     # Multiple format support
│   │       └── types.ts
│   ├── config/
│   │   ├── ConfigManager.ts         # Cosmiconfig wrapper
│   │   ├── defaults.ts             # Default configuration
│   │   └── types.ts                 # Configuration types
│   ├── errors/
│   │   ├── BunTtsError.ts           # Base error class
│   │   ├── DocumentParseError.ts
│   │   ├── TTSError.ts
│   │   └── ConfigurationError.ts
│   ├── utils/
│   │   ├── logger.ts               # Pino configuration
│   │   ├── validation.ts           # Input validation helpers
│   │   └── performance.ts          # Performance monitoring
│   └── types/
│       ├── common.ts               # Shared types
│       └── index.ts
├── tests/
│   ├── unit/                       # Co-located with source files
│   ├── integration/
│   │   ├── document-processing.test.ts
│   │   ├── tts-workflow.test.ts
│   │   └── cli-commands.test.ts
│   └── e2e/
│       ├── full-conversion.test.ts
│       └── tui-interaction.test.ts
├── config/
│   ├── default.json                # Default configuration
│   └── pronunciation.json          # Default pronunciation dictionary
├── docs/
│   ├── architecture.md             # This document
│   ├── API.md                      # API documentation
│   └── user-guide.md               # User guide
├── package.json
├── tsconfig.json
├── bun.lockb
└── README.md
```

## Epic to Architecture Mapping

| Epic                                              | Architecture Component                                     | Directory                                                  | Key Technologies                                                     |
| ------------------------------------------------- | ---------------------------------------------------------- | ---------------------------------------------------------- | -------------------------------------------------------------------- |
| **Epic 1: Core Foundation & Document Processing** | Document parsers, CLI foundation, configuration            | `src/core/document-processing/`, `src/cli/`, `src/config/` | pdf-parse, @smoores/epub, marked, Clack, Cosmiconfig                 |
| **Epic 2: TTS Integration & Audio Generation**    | TTS adapters, audio processing, pronunciation system       | `src/core/tts/`, `src/core/audio/`                         | Custom PCM processing, Kokoro.js, Chatterbox.js                      |
| **Epic 3: User Interface & Experience**           | CLI commands, TUI components, error handling               | `src/cli/`, `src/ui/`, `src/errors/`                       | Ink (React), custom error classes, Pino logging                      |
| **Epic 4: Advanced Features & Optimization**      | Emotion system, performance optimization, batch processing | `src/core/emotion/`, performance optimizations throughout  | AI emotion detection, streaming architecture, performance monitoring |

## Technology Stack Details

### Core Technologies

- **Runtime**: Bun (JavaScript/TypeScript runtime with excellent performance)
- **Language**: TypeScript (full type safety across the entire codebase)
- **TUI Framework**: Ink (React for interactive CLI applications)
- **CLI Parser**: Clack (modern TypeScript-first command-line interface)
- **Configuration**: Cosmiconfig v9.0.0 (multi-format configuration management)
- **Logging**: Pino v10.1.0 (ultra-fast structured JSON logging)
- **Testing**: Bun Test (native testing framework)

### Document Processing Stack

- **Markdown**: marked (high-performance Markdown parser)
- **PDF**: pdf-parse (pure TypeScript, cross-platform PDF text extraction)
- **EPUB**: @smoores/epub v0.1.9 (TypeScript-native EPUB parsing)
- **Structure Analysis**: Custom confidence scoring and validation system

### Audio Processing Stack

- **Audio Manipulation**: Custom PCM buffer processing (no external dependencies)
- **TTS Engines**: Kokoro.js and Chatterbox.js (open-source engines)
- **Audio Formats**: Multiple output formats through buffer-based processing
- **Concatenation**: Custom cross-fading and silence management

### Integration Points

The system integrates through standardized interfaces:

1. **CLI ↔ Core**: Command handlers orchestrate document processing and TTS modules
2. **Document Processing ↔ TTS**: Structured document data flows to TTS adapters
3. **TTS ↔ Audio**: Audio buffers flow from TTS engines to audio processing pipeline
4. **All Modules ↔ Config**: Centralized configuration management with cosmiconfig
5. **All Modules ↔ Logger**: Structured logging with Pino throughout the system

## Novel Architectural Patterns

### Pattern 1: TTS Adapter System

**Purpose**: Unified interface for multiple TTS engines with different capabilities

**Components**:

- `ITTSAdapter` interface with standardized methods
- `TTSAdapterManager` for engine selection and fallback
- Individual adapters for Kokoro and Chatterbox engines

**Data Flow**:

```
Document Text → TTSAdapterManager → Selected Adapter → Audio Buffer → AudioProcessor
```

**Implementation Guide**:
All agents implementing TTS features must use the adapter interface:

```typescript
interface ITTSAdapter {
  synthesize(text: string, options: TTSOptions): Promise<AudioBuffer>;
  getSupportedVoices(): Voice[];
  getCapabilities(): TTSCapabilities;
  validateOptions(options: TTSOptions): ValidationResult;
}
```

**Affects Epics**: Epic 2 (TTS Integration & Audio Generation)

### Pattern 2: Streaming Document Processing

**Purpose**: Process large documents (1000+ pages) without memory issues

**Components**:

- `DocumentStream` for chunked reading
- `StreamingProcessor` for progressive analysis
- Memory-efficient chunk management

**Data Flow**:

```
Large Document → Stream Chunks → Process Chunk → Accumulate Results → Complete Processing
```

**Implementation Guide**:
Use async generators for memory-efficient processing:

```typescript
interface DocumentStream {
  async *chunks(): AsyncGenerator<DocumentChunk>
  async getStructure(): Promise<DocumentStructure>
}
```

**Affects Epics**: Epic 1 (Core Foundation & Document Processing)

### Pattern 3: Progressive Audio Concatenation

**Purpose**: Build complete audiobooks while maintaining processing state and recovery

**Components**:

- `AudioBuilder` for incremental audio assembly
- Checkpoint system for interrupted processing recovery
- Progress tracking with resume capability

**Data Flow**:

```
Audio Segments → AudioBuilder → Checkpoints → Progressive Assembly → Complete Audiobook
```

**Implementation Guide**:
Implement stateful audio building with recovery:

```typescript
class AudioBuilder {
  async addSegment(
    audio: AudioBuffer,
    metadata: SegmentMetadata
  ): Promise<void>;
  async saveCheckpoint(): Promise<Checkpoint>;
  async loadFromCheckpoint(checkpoint: Checkpoint): Promise<void>;
  async finalize(): Promise<CompleteAudiobook>;
}
```

**Affects Epics**: Epic 2 (TTS Integration & Audio Generation), Epic 4 (Advanced Features)

## Implementation Patterns

These patterns ensure consistent implementation across all AI agents:

### Error Handling Pattern

**Custom Error Classes + Result Pattern**

- Custom error hierarchy: `BunTtsError`, `DocumentParseError`, `TTSError`, `ConfigurationError`
- Result pattern for critical operations: `{success: boolean, data?: T, error?: BunTtsError}`
- All agents MUST use this pattern consistently

### Logging Pattern

**Structured Pino Logging**

- Log levels: `error`, `warn`, `info`, `debug`, `trace`
- Structured context: `{document: string, operation: string, duration: number}`
- Error format: `{error: {message, code, stack, context}}`

### Testing Pattern

**Bun Test with Feature Organization**

- Unit tests: `*.test.ts` co-located with source files
- Integration tests: `tests/integration/` for epic-level workflows
- E2E tests: `tests/e2e/` for complete user journeys

## Consistency Rules

### Naming Conventions

- **Files**: `PascalCase.tsx` for React components, `PascalCase.ts` for classes, `camelCase.ts` for utilities
- **Directories**: `kebab-case` for feature directories
- **Functions**: `camelCase` for functions, `PascalCase` for classes
- **Constants**: `UPPER_SNAKE_CASE` for configuration constants

### Code Organization

- **Tests**: Co-locate unit tests as `*.test.ts` next to source files
- **Components**: One component per file with matching `*.test.ts`
- **Types**: Centralize shared types in `src/types/`, feature-specific types co-located

### Error Handling

**Standard Response Format**:

```typescript
// Success Response
{success: true, data: T}

// Error Response
{success: false, error: {code: string, message: string, details?: any}}
```

All internal module boundaries must use this consistent format.

### Logging Strategy

**Structured Logging Pattern**:

```typescript
logger.info({
  operation: 'document-parse',
  document: 'guide.md',
  duration: 1250,
});
logger.error({
  operation: 'tts-synthesis',
  error: { message, code },
  document: 'guide.md',
});
```

## Data Architecture

### Document Structure Model

```typescript
interface DocumentStructure {
  metadata: DocumentMetadata;
  chapters: Chapter[];
  totalParagraphs: number;
  totalSentences: number;
}

interface Chapter {
  id: string;
  title: string;
  paragraphs: Paragraph[];
  startIndex: number;
  endIndex: number;
}
```

### TTS Processing Model

```typescript
interface TTSRequest {
  text: string;
  voice: VoiceConfig;
  emotion?: EmotionConfig;
  options: TTSOptions;
}

interface AudioSegment {
  id: string;
  buffer: ArrayBuffer;
  metadata: SegmentMetadata;
  duration: number;
}
```

### Configuration Model

```typescript
interface BunTTSConfig {
  tts: {
    defaultEngine: 'kokoro' | 'chatterbox';
    voice: VoiceConfig;
    quality: QualityConfig;
  };
  processing: {
    batchSize: number;
    concurrency: boolean;
    cacheEnabled: boolean;
  };
  output: {
    format: 'mp3' | 'wav' | 'm4a';
    quality: AudioQuality;
    chapterFiles: boolean;
  };
}
```

## API Contracts

### Internal Component APIs

All internal module communications use this standardized format:

**Document Parser API**:

```typescript
interface DocumentParser {
  parse(
    input: string | Buffer
  ): Promise<{
    success: boolean;
    data?: DocumentStructure;
    error?: DocumentParseError;
  }>;
  validate(structure: DocumentStructure): Promise<ValidationResult>;
}
```

**TTS Adapter API**:

```typescript
interface ITTSAdapter {
  synthesize(
    request: TTSRequest
  ): Promise<{ success: boolean; data?: AudioBuffer; error?: TTSError }>;
  getCapabilities(): TTSCapabilities;
}
```

**Audio Processor API**:

```typescript
interface AudioProcessor {
  concatenate(
    segments: AudioSegment[]
  ): Promise<{
    success: boolean;
    data?: CompleteAudiobook;
    error?: AudioProcessingError;
  }>;
  normalize(
    audio: ArrayBuffer
  ): Promise<{
    success: boolean;
    data?: ArrayBuffer;
    error?: AudioProcessingError;
  }>;
}
```

## Security Architecture

### Local Processing Security

- **Input Validation**: All file inputs validated before processing
- **Sandboxing**: TTS engines run in controlled environments
- **Resource Limits**: Memory and processing time limits for large documents
- **File Access**: Restricted to user-specified directories only

### Configuration Security

- **Config Validation**: All configuration validated against schemas
- **Secure Defaults**: Secure default settings for all options
- **Path Sanitization**: All file paths sanitized and validated

### Data Protection

- **Local Processing**: All processing happens locally, no external data transmission
- **Temporary Files**: Secure temporary file creation and cleanup
- **Privacy**: No user data sent to external services

## Performance Considerations

### Large Document Processing

- **Streaming Architecture**: Process documents in chunks to handle 1000+ page files
- **Memory Management**: Efficient buffer management and garbage collection
- **Parallel Processing**: Independent sections processed concurrently when possible

### Audio Processing Optimization

- **Buffer Reuse**: Reuse audio buffers to minimize memory allocation
- **Lazy Loading**: Load TTS models only when needed
- **Compression**: Efficient audio compression without quality loss

### TUI Performance

- **Virtual Scrolling**: Handle large document trees efficiently
- **Progressive Updates**: Update UI incrementally during processing
- **Debouncing**: Debounce UI updates to prevent excessive re-renders

## Deployment Architecture

### Cross-Platform Distribution

- **Package Distribution**: Distribute via npm for cross-platform compatibility
- **Binary Generation**: Generate standalone executables for each platform
- **Dependency Management**: Bundle all dependencies for offline installation

### Installation Options

- **NPM Package**: `npm install -g bun-tts`
- **Binary Download**: Platform-specific executables
- **Source Installation**: `bun install` from source for developers

## Development Environment

### Prerequisites

- **Bun Runtime**: Latest version of Bun JavaScript runtime
- **TypeScript**: Global TypeScript installation for type checking
- **Node.js**: For development tools and package management

### Setup Commands

```bash
# Clone and initialize project
git clone <repository-url>
cd bun-tts
bun install

# Initialize TUI framework (if starting from scratch)
npx create-ink-app bun-tts --typescript

# Install TTS engines (these will need to be integrated)
bun add kokoro-js chatterbox-js

# Install document processing libraries
bun add pdf-parse @smoores/epub marked

# Install development dependencies
bun add -D pino prettier @types/node

# Run development server
bun run dev

# Run tests
bun test

# Build for production
bun run build
```

### Development Workflow

- **Feature Development**: Create feature branches aligned with epic structure
- **Testing**: Run unit tests during development, integration tests before commits
- **Code Quality**: Use Prettier for formatting, TypeScript for type safety
- **Documentation**: Update API docs and user guides for new features

## Architecture Decision Records (ADRs)

### ADR-001: React-based TUI Framework

**Decision**: Use Ink (React for CLI) for the terminal user interface
**Status**: Accepted
**Consequences**: Enables component-based architecture, excellent state management, React ecosystem benefits
**Alternatives Considered**: Custom TUI development, other CLI frameworks
**Date**: 2025-10-26

### ADR-002: Custom PCM Audio Processing

**Decision**: Implement custom PCM buffer processing instead of external audio libraries
**Status**: Accepted
**Consequences**: Complete control over audio processing, no external dependencies, optimal performance
**Alternatives Considered**: FFmpeg, Web Audio API, existing audio libraries
**Date**: 2025-10-26

### ADR-003: TTS Adapter Pattern

**Decision**: Implement adapter pattern for multiple TTS engines with unified interface
**Status**: Accepted
**Consequences**: Easy engine switching, extensibility for future engines, consistent API
**Alternatives Considered**: Direct engine integration, factory pattern only
**Date**: 2025-10-26

### ADR-004: Streaming Document Processing

**Decision**: Implement streaming architecture for large document processing
**Status**: Accepted
**Consequences**: Handles 1000+ page documents, memory efficient, supports progress tracking
**Alternatives Considered**: Full document loading, chunked processing without streaming
**Date**: 2025-10-26

---

_Generated by BMAD Decision Architecture Workflow v1.3.2_
_Date: 2025-10-26_
_For: Eduardo Menoncello_
