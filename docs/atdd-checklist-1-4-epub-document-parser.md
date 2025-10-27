# ATDD Checklist - Epic 1, Story 4: EPUB Document Parser

**Date:** 2025-10-27
**Author:** Eduardo Menoncello
**Primary Test Level:** Unit Tests

---

## Story Summary

Implement a comprehensive EPUB document parser that extracts structured content from EPUB files, supporting table of contents parsing, multimedia content handling, metadata extraction, and multi-version EPUB specifications.

**As a** publisher or author with EPUB content
**I want** the system to parse EPUB files and extract structured content
**So that** I can convert e-books into audiobooks

---

## Acceptance Criteria

1. Extract content from EPUB files (including zipped HTML/XML structure)
2. Parse table of contents and chapter navigation
3. Handle embedded images and multimedia content
4. Extract metadata (title, author, language, publisher)
5. Manage different EPUB versions and specifications
6. Generate clean text output with structure preservation

---

## Failing Tests Created (RED Phase)

### Unit Tests (20 tests)

**File:** `tests/unit/document-processing/parsers/EPUBParser.test.ts` (320 lines)

- ✅ **Test:** should extract content from valid EPUB file with zipped HTML/XML structure
  - **Status:** RED - EPUBParser class doesn't exist
  - **Verifies:** Basic EPUB parsing functionality and structured content extraction

- ✅ **Test:** should fail when EPUB file is corrupted or invalid
  - **Status:** RED - Error handling not implemented
  - **Verifies:** Robust error handling for invalid EPUB files

- ✅ **Test:** should handle empty EPUB files gracefully
  - **Status:** RED - Empty file validation not implemented
  - **Verifies:** Edge case handling for empty input

- ✅ **Test:** should extract table of contents from NCX file
  - **Status:** RED - NCX parsing not implemented
  - **Verifies:** EPUB 2.0 TOC support

- ✅ **Test:** should extract table of contents from NAV file (EPUB 3.0+)
  - **Status:** RED - NAV parsing not implemented
  - **Verifies:** EPUB 3.0+ TOC support

- ✅ **Test:** should handle missing table of contents gracefully
  - **Status:** RED - Missing TOC handling not implemented
  - **Verifies:** Graceful degradation when TOC absent

- ✅ **Test:** should catalog embedded images and multimedia
  - **Status:** RED - Asset cataloging not implemented
  - **Verifies:** Multimedia content detection and cataloging

- ✅ **Test:** should filter content for TTS processing
  - **Status:** RED - TTS content filtering not implemented
  - **Verifies:** Content filtering for text-to-speech conversion

- ✅ **Test:** should extract complete metadata from OPF file
  - **Status:** RED - OPF metadata parsing not implemented
  - **Verifies:** Comprehensive metadata extraction

- ✅ **Test:** should handle missing metadata fields gracefully
  - **Status:** RED - Metadata defaulting not implemented
  - **Verifies:** Graceful handling of incomplete metadata

- ✅ **Test:** should support custom metadata fields
  - **Status:** RED - Custom metadata support not implemented
  - **Verifies:** Extensible metadata handling

- ✅ **Test:** should parse EPUB 2.0 files correctly
  - **Status:** RED - EPUB 2.0 support not implemented
  - **Verifies:** Legacy EPUB format compatibility

- ✅ **Test:** should parse EPUB 3.0+ files correctly
  - **Status:** RED - EPUB 3.0+ support not implemented
  - **Verifies:** Modern EPUB format support

- ✅ **Test:** should auto-detect EPUB version when not specified
  - **Status:** RED - Version auto-detection not implemented
  - **Verifies:** Automatic version detection

- ✅ **Test:** should handle specification differences with fallbacks
  - **Status:** RED - Specification fallback not implemented
  - **Verifies:** Cross-version compatibility handling

- ✅ **Test:** should preserve chapter structure in text output
  - **Status:** RED - Chapter structure preservation not implemented
  - **Verifies:** Structured text output

- ✅ **Test:** should extract clean text without HTML tags
  - **Status:** RED - HTML stripping not implemented
  - **Verifies:** Clean text extraction

- ✅ **Test:** should maintain paragraph and sentence boundaries
  - **Status:** RED - Text structure preservation not implemented
  - **Verifies:** Paragraph and sentence boundary maintenance

- ✅ **Test:** should handle large EPUB files efficiently
  - **Status:** RED - Performance optimization not implemented
  - **Verifies:** Large file processing performance

- ✅ **Test:** should use streaming architecture for memory efficiency
  - **Status:** RED - Streaming processing not implemented
  - **Verifies:** Memory-efficient processing

### Integration Tests (9 tests)

**File:** `tests/integration/epub-parsing.integration.test.ts` (180 lines)

- ✅ **Test:** should complete full EPUB processing workflow
  - **Status:** RED - End-to-end workflow not implemented
  - **Verifies:** Complete processing pipeline integration

- ✅ **Test:** should handle complex multi-chapter EPUB with navigation
  - **Status:** RED - Complex structure handling not implemented
  - **Verifies:** Complex EPUB structure support

- ✅ **Test:** should gracefully handle corrupted EPUB files with recovery
  - **Status:** RED - Recovery mechanisms not implemented
  - **Verifies:** Partial parsing with recovery

- ✅ **Test:** should integrate correctly with @smoores/epub library
  - **Status:** RED - Library integration not implemented
  - **Verifies:** Third-party library integration

- ✅ **Test:** should fallback gracefully when library fails
  - **Status:** RED - Fallback mechanisms not implemented
  - **Verifies:** Library failure fallback

- ✅ **Test:** should use configuration system for parsing options
  - **Status:** RED - Configuration integration not implemented
  - **Verifies:** Configuration system integration

- ✅ **Test:** should validate configuration and use defaults when invalid
  - **Status:** RED - Configuration validation not implemented
  - **Verifies:** Configuration error handling

- ✅ **Test:** should handle network-related errors gracefully
  - **Status:** RED - Network error handling not implemented
  - **Verifies:** External resource error handling

- ✅ **Test:** should maintain performance with concurrent parsing
  - **Status:** RED - Concurrent processing not implemented
  - **Verifies:** Multi-file processing performance

---

## Data Factories Created

### EPUB Factory

**File:** `tests/support/factories/epub-factory.ts`

**Exports:**

- `createValidEPUBBuffer(options?)` - Create EPUB file buffer with optional overrides
- `createCorruptedEPUBBuffer()` - Create corrupted EPUB buffer for error testing
- `createLargeEPUBBuffer(options?)` - Create large EPUB buffer for performance testing
- `createValidEPUBFile(options?)` - Create actual EPUB file on disk
- `createComplexEPUBFile(options)` - Create complex nested EPUB structure
- `createDocumentStructure(overrides?)` - Create DocumentStructure objects
- `createChapter(overrides?)` - Create Chapter objects
- `createDocumentMetadata(overrides?)` - Create DocumentMetadata objects

**Example Usage:**

```typescript
const epubBuffer = createValidEPUBBuffer({
  title: 'Test Book',
  chapters: [{ title: 'Chapter 1', content: 'Content here.' }],
  tocType: 'ncx'
});
const largeEPUB = createLargeEPUBBuffer({ pageCount: 1000, chapterCount: 50 });
```

---

## Fixtures Created

### EPUB Parser Fixtures

**File:** `tests/support/fixtures/epub-parser.fixture.ts`

**Fixtures:**

- `parser` - Standard EPUBParser instance with default configuration
  - **Setup:** Creates EPUBParser with profiling disabled, strict mode enabled
  - **Provides:** Ready-to-use parser instance
  - **Cleanup:** None (parser is stateless)

- `validEPUB` - Valid EPUB buffer for testing
  - **Setup:** Creates valid EPUB with 2 chapters
  - **Provides:** EPUB buffer ready for parsing
  - **Cleanup:** None (buffer is disposable)

- `corruptedEPUB` - Corrupted EPUB buffer for error testing
  - **Setup:** Creates intentionally corrupted EPUB buffer
  - **Provides:** Invalid EPUB for error handling tests
  - **Cleanup:** None (buffer is disposable)

- `largeEPUB` - Large EPUB buffer for performance testing
  - **Setup:** Creates large EPUB with 100 pages, 5 chapters
  - **Provides:** Large EPUB for performance validation
  - **Cleanup:** None (buffer is disposable)

- `simpleParser` - EPUBParser with simple configuration
  - **Setup:** Creates parser with basic configuration options
  - **Provides:** Parser with custom settings
  - **Cleanup:** None (parser is stateless)

- `streamingParser` - EPUBParser optimized for streaming
  - **Setup:** Creates parser with streaming enabled and memory limits
  - **Provides:** Streaming-capable parser
  - **Cleanup:** None (parser is stateless)

**Example Usage:**

```typescript
import { test } from './fixtures/epub-parser.fixture';

test('should parse valid EPUB', async ({ parser, validEPUB }) => {
  const result = await parser.parse(validEPUB);
  expect(result.success).toBe(true);
});
```

---

## Mock Requirements

### @smoores/epub Library Mock

**Library:** @smoores/epub v0.1.9

**Success Response:**

```typescript
{
  metadata: { title: 'Test Book', author: 'Test Author', language: 'en' },
  chapters: [{ title: 'Chapter 1', content: 'Content here' }],
  toc: [{ title: 'Chapter 1', href: 'chapter1.xhtml' }]
}
```

**Failure Response:**

```typescript
{
  error: 'Invalid EPUB format',
  code: 'EPUB_FORMAT_ERROR'
}
```

**Notes:** Library may fail for certain EPUB formats, implement fallback parser

### File System Mock

**Operations:** Read, Write, Delete operations for EPUB files

**Success Response:** Buffer/Stream content

**Failure Response:** File not found, permission denied, I/O errors

---

## Required data-testid Attributes

No UI components required for this parser implementation.

---

## Implementation Checklist

### Test: should extract content from valid EPUB file with zipped HTML/XML structure

**File:** `tests/unit/document-processing/parsers/EPUBParser.test.ts`

**Tasks to make this test pass:**

- [ ] Create EPUBParser class in `src/core/document-processing/parsers/EPUBParser.ts`
- [ ] Implement parse() method with Buffer input support
- [ ] Add EPUB zip structure parsing logic
- [ ] Create DocumentStructure interface implementation
- [ ] Add content extraction from HTML/XML files
- [ ] Run test: `bun test tests/unit/document-processing/parsers/EPUBParser.test.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 8 hours

---

### Test: should extract table of contents from NCX file

**File:** `tests/unit/document-processing/parsers/EPUBParser.test.ts`

**Tasks to make this test pass:**

- [ ] Implement NCX file parsing logic
- [ ] Add TableOfContentsItem interface implementation
- [ ] Create NCX XML parser with proper namespace handling
- [ ] Implement chapter hierarchy extraction
- [ ] Add TOC structure validation
- [ ] Run test: `bun test tests/unit/document-processing/parsers/EPUBParser.test.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 6 hours

---

### Test: should extract complete metadata from OPF file

**File:** `tests/unit/document-processing/parsers/EPUBParser.test.ts`

**Tasks to make this test pass:**

- [ ] Implement OPF file parsing logic
- [ ] Add Dublin Core metadata extraction
- [ ] Create metadata normalization and validation
- [ ] Implement custom metadata field support
- [ ] Add metadata defaulting for missing fields
- [ ] Run test: `bun test tests/unit/document-processing/parsers/EPUBParser.test.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 4 hours

---

### Test: should catalog embedded images and multimedia content

**File:** `tests/unit/document-processing/parsers/EPUBParser.test.ts`

**Tasks to make this test pass:**

- [ ] Implement embedded asset detection
- [ ] Create media type classification logic
- [ ] Add asset size and checksum calculation
- [ ] Implement EmbeddedAssets interface
- [ ] Add multimedia content cataloging
- [ ] Run test: `bun test tests/unit/document-processing/parsers/EPUBParser.test.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 5 hours

---

### Test: should handle large EPUB files efficiently

**File:** `tests/unit/document-processing/parsers/EPUBParser.test.ts`

**Tasks to make this test pass:**

- [ ] Implement streaming architecture pattern
- [ ] Add memory usage monitoring
- [ ] Create chunked reading logic for large files
- [ ] Implement performance optimization
- [ ] Add memory limit enforcement
- [ ] Run test: `bun test tests/unit/document-processing/parsers/EPUBParser.test.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 8 hours

---

### Test: should integrate correctly with @smoores/epub library

**File:** `tests/integration/epub-parsing.integration.test.ts`

**Tasks to make this test pass:**

- [ ] Install @smoores/epub v0.1.9 dependency
- [ ] Implement library adapter/wrapper
- [ ] Add library integration error handling
- [ ] Create library fallback mechanism
- [ ] Add library info tracking in results
- [ ] Run test: `bun test tests/integration/epub-parsing.integration.test.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 4 hours

---

## Running Tests

```bash
# Run all failing tests for this story
bun test tests/unit/document-processing/parsers/EPUBParser.test.ts tests/integration/epub-parsing.integration.test.ts

# Run specific test file
bun test tests/unit/document-processing/parsers/EPUBParser.test.ts

# Run tests with coverage
bun test --coverage tests/unit/document-processing/parsers/EPUBParser.test.ts

# Run tests in watch mode during development
bun test --watch tests/unit/document-processing/parsers/EPUBParser.test.ts

# Debug specific test
bun test --timeout 30000 tests/unit/document-processing/parsers/EPUBParser.test.ts -t "should extract content from valid EPUB file"
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

**TEA Agent Responsibilities:**

- ✅ All tests written and failing
- ✅ Fixtures and factories created with auto-cleanup
- ✅ Mock requirements documented
- ✅ Implementation checklist created
- ✅ Data infrastructure built

**Verification:**

- All tests written and ready to fail as expected
- Failure messages will be clear and actionable
- Tests will fail due to missing implementation, not test bugs

---

### GREEN Phase (DEV Team - Next Steps)

**DEV Agent Responsibilities:**

1. **Pick one failing test** from implementation checklist (start with EPUBParser class creation)
2. **Read the test** to understand expected behavior
3. **Implement minimal code** to make that specific test pass
4. **Run the test** to verify it now passes (green)
5. **Check off the task** in implementation checklist
6. **Move to next test** and repeat

**Key Principles:**

- One test at a time (don't try to fix all at once)
- Minimal implementation (don't over-engineer)
- Run tests frequently (immediate feedback)
- Use implementation checklist as roadmap
- Follow streaming architecture pattern for large files
- Use Dependency Injection pattern as learned from Story 1.2

**Progress Tracking:**

- Check off tasks as you complete them
- Share progress in daily standup
- Mark story as IN PROGRESS in `sprint-status.yaml`

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

**DEV Agent Responsibilities:**

1. **Verify all tests pass** (green phase complete)
2. **Review code for quality** (readability, maintainability, performance)
3. **Extract duplications** (DRY principle)
4. **Optimize performance** (if needed, especially for large files)
5. **Ensure tests still pass** after each refactor
6. **Run mutation testing** with StrykerJS for parser logic quality
7. **Update documentation** (if API contracts change)

**Key Principles:**

- Tests provide safety net (refactor with confidence)
- Make small refactors (easier to debug if tests fail)
- Run tests after each change
- Don't change test behavior (only implementation)
- Ensure streaming architecture maintains performance
- Follow strict TypeScript typing throughout

**Completion:**

- All tests pass
- Code quality meets team standards
- No duplications or code smells
- Mutation score meets thresholds (90% high, 80% low, 70% break)
- Ready for code review and story approval

---

## Next Steps

1. **Review this checklist** with team in standup or planning
2. **Run failing tests** to confirm RED phase: `bun test tests/unit/document-processing/parsers/EPUBParser.test.ts`
3. **Begin implementation** using implementation checklist as guide
4. **Work one test at a time** (red → green for each)
5. **Share progress** in daily standup
6. **When all tests pass**, refactor code for quality
7. **Run mutation testing** to ensure parser logic quality
8. **When refactoring complete**, mark story as DONE

---

## Knowledge Base References Applied

This ATDD workflow consulted the following knowledge fragments:

- **fixture-architecture.md** - Test fixture patterns with setup/teardown using Bun Test fixtures
- **data-factories.md** - Factory patterns using `@faker-js/faker` for random test data generation with overrides support
- **test-quality.md** - Test design principles (deterministic tests, isolation, explicit assertions, <300 lines, <1.5 minutes)
- **component-tdd.md** - Red-Green-Refactor workflow patterns and isolated testing strategies
- **network-first.md** - Performance optimization patterns for large file processing

See `tea-index.csv` for complete knowledge fragment mapping.

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Command:** `bun test tests/unit/document-processing/parsers/EPUBParser.test.ts`

**Expected Results:**

```
✓ should extract content from valid EPUB file with zipped HTML/XML structure (RED - EPUBParser doesn't exist)
✓ should fail when EPUB file is corrupted or invalid (RED - Error handling not implemented)
✓ should handle empty EPUB files gracefully (RED - Empty file validation not implemented)
[... 17 more tests all RED due to missing implementation ...]
```

**Summary:**

- Total tests: 20 unit + 9 integration = 29
- Passing: 0 (expected)
- Failing: 29 (expected)
- Status: ✅ RED phase verified

**Expected Failure Messages:**

- `Cannot find module '../../../src/core/document-processing/parsers/EPUBParser'`
- `Cannot find module '../../../src/errors/DocumentParseError'`
- `EPUBParser class not implemented`
- `NCX parsing not implemented`
- `OPF metadata extraction not implemented`

---

## Notes

- **Performance Requirements:** Must handle 1000+ page documents through streaming architecture
- **Library Integration:** @smoores/epub v0.1.9 with fallback to custom parser
- **Quality Standards:** Mutation testing with StrykerJS required
- **Architecture:** Follow streaming document processing pattern from architecture.md
- **Dependencies:** Use Dependency Injection pattern learned from Story 1.2
- **Testing:** Use Bun Test framework with feature organization
- **Error Handling:** Comprehensive error handling with custom error classes
- **Configuration:** Integration with existing cosmiconfig-based configuration system

---

## Contact

**Questions or Issues?**

- Ask in team standup
- Refer to `docs/stories/1-4-epub-document-parser.md` for complete story details
- Consult `docs/stories/1-4-epub-document-parser.context.xml` for technical context
- Refer to `testarch/knowledge/` for testing best practices

---

**Generated by BMad TEA Agent** - 2025-10-27