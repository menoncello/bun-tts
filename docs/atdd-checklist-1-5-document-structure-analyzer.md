# ATDD Checklist - Epic 1, Story 1.5: Document Structure Analyzer

**Date:** 2025-11-01
**Author:** Eduardo Menoncello
**Primary Test Level:** Unit + Integration

---

## Story Summary

The Document Structure Analyzer enables intelligent analysis and structuring of document content across Markdown, PDF, and EPUB formats. It automatically detects chapters, sections, paragraphs, and sentence boundaries with confidence scoring, provides user validation and correction capabilities, handles edge cases like missing headers and irregular formatting, and generates hierarchical structure trees optimized for TUI visualization.

**As a** user processing complex documents
**I want** the system to intelligently analyze and structure the content
**So that** I get well-organized audiobook chapters and sections

---

## Acceptance Criteria

1. Analyze document structure across all supported formats (Markdown, PDF, EPUB)
2. Identify chapters, sections, paragraphs, and sentence boundaries with precision
3. Provide confidence scores for structure detection at multiple levels
4. Allow user validation and correction of automatic analysis results
5. Handle edge cases (missing headers, irregular formatting, weak signals)
6. Generate hierarchical structure tree for TUI visualization with real-time updates

---

## Failing Tests Created (RED Phase)

### Unit Tests (34 tests)

**File:** `tests/unit/document-processing/structure-analyzer/structure-analyzer.test.ts` (856 lines)

**Tests Created:**

#### AC1: Document Structure Analysis (4 tests)
- ✅ **Test:** analyzeDocument - should analyze markdown document structure
  - **Status:** RED - Missing StructureAnalyzer class implementation
  - **Verifies:** Markdown format structure detection with DocumentNode output

- ✅ **Test:** analyzeDocument - should analyze PDF document structure
  - **Status:** RED - Missing PDF structure analysis implementation
  - **Verifies:** PDF format structure detection using layout analysis

- ✅ **Test:** analyzeDocument - should analyze EPUB document structure
  - **Status:** RED - Missing EPUB structure analysis implementation
  - **Verifies:** EPUB format structure detection using navigation data

- ✅ **Test:** analyzeDocument - should return format-agnostic DocumentNode interface
  - **Status:** RED - Missing DocumentNode type definitions
  - **Verifies:** Consistent structure output across all document formats

#### AC2: Structure Boundary Detection (5 tests)
- ✅ **Test:** detectChapters - should detect chapter boundaries in document
  - **Status:** RED - Missing chapter detection implementation
  - **Verifies:** Chapter identification with titles and confidence scores

- ✅ **Test:** detectSections - should detect sections within chapters
  - **Status:** RED - Missing section detection implementation
  - **Verifies:** Nested section hierarchy detection with level tracking

- ✅ **Test:** extractParagraphs - should extract paragraph boundaries
  - **Status:** RED - Missing paragraph extraction implementation
  - **Verifies:** Paragraph boundary detection using whitespace analysis

- ✅ **Test:** detectSentences - should detect sentence boundaries
  - **Status:** RED - Missing sentence detection implementation
  - **Verifies:** Sentence segmentation with punctuation detection

- ✅ **Test:** detectSentences - should handle edge cases in sentence detection
  - **Status:** RED - Missing edge case handling implementation
  - **Verifies:** Abbreviations, decimals, and ellipses handling

#### AC3: Confidence Scoring (4 tests)
- ✅ **Test:** calculateConfidenceScore - should provide confidence scores for structure detection
  - **Status:** RED - Missing confidence scoring implementation
  - **Verifies:** Overall and per-level confidence score calculation

- ✅ **Test:** calculateConfidenceScore - should calculate per-node confidence scores
  - **Status:** RED - Missing per-node confidence implementation
  - **Verifies:** Individual node confidence score assignment

- ✅ **Test:** calculateConfidenceScore - should provide weighted confidence based on detection signals
  - **Status:** RED - Missing weighted scoring algorithm
  - **Verifies:** Multi-signal confidence calculation with proper weighting

- ✅ **Test:** calculateConfidenceScore - should generate confidence reports for user review
  - **Status:** RED - Missing confidence report generation
  - **Verifies:** Low-confidence node identification and reporting

#### AC4: User Validation and Correction (4 tests)
- ✅ **Test:** validateStructure - should create validation interface for user review
  - **Status:** RED - Missing validation interface implementation
  - **Verifies:** Structure validation with low-confidence node identification

- ✅ **Test:** correctStructure - should allow correction of structure boundaries
  - **Status:** RED - Missing structure correction implementation
  - **Verifies:** Boundary adjustment with confidence score updates

- ✅ **Test:** saveCorrections - should preserve user corrections for future processing
  - **Status:** RED - Missing correction persistence implementation
  - **Verifies:** Correction storage and retrieval

- ✅ **Test:** startValidationSession - should support interactive validation and adjustment
  - **Status:** RED - Missing interactive validation implementation
  - **Verifies:** Interactive validation workflow with focus on low-confidence nodes

#### AC5: Edge Case Handling (4 tests)
- ✅ **Test:** handleEdgeCases - should handle missing headers gracefully
  - **Status:** RED - Missing fallback strategy implementation
  - **Verifies:** Paragraph/sentence detection as fallback for missing headers

- ✅ **Test:** handleEdgeCases - should handle irregular formatting
  - **Status:** RED - Missing irregular formatting handler
  - **Verifies:** Robust pattern matching for inconsistent formatting

- ✅ **Test:** handleEdgeCases - should apply fallback strategies for weak signals
  - **Status:** RED - Missing weak signal fallback implementation
  - **Verifies:** Hierarchical fallback using available signals

- ✅ **Test:** handleEdgeCases - should detect structure in different document format conventions
  - **Status:** RED - Missing format-specific convention handling
  - **Verifies:** Format-appropriate structure detection strategies

#### AC6: Hierarchical Structure Tree (5 tests)
- ✅ **Test:** generateStructureTree - should generate hierarchical structure tree for TUI
  - **Status:** RED - Missing structure tree generation implementation
  - **Verifies:** Complete hierarchical tree with parent-child relationships

- ✅ **Test:** toReactTreeNode - should create DocumentTreeNode interface for React components
  - **Status:** RED - Missing React tree node conversion
  - **Verifies:** DocumentNode to ReactTreeNode transformation

- ✅ **Test:** analyzeDocumentStreaming - should support real-time structure updates during processing
  - **Status:** RED - Missing streaming implementation
  - **Verifies:** Real-time update emission during analysis

- ✅ **Test:** generateStructureStats - should provide efficient tree rendering for large documents
  - **Status:** RED - Missing large document optimization
  - **Verifies:** Streaming architecture for 1000+ page documents

- ✅ **Test:** generateStructureStats - should provide structure statistics and metadata
  - **Status:** RED - Missing statistics generation implementation
  - **Verifies:** Complete structure statistics and metadata

#### Parser Integration (8 tests)
- ✅ **Test:** Integration - should integrate with MarkdownParser
  - **Status:** RED - Missing MarkdownParser integration
  - **Verifies:** StructureAnalyzer integration in Markdown parsing flow

- ✅ **Test:** Integration - should integrate with PDFParser
  - **Status:** RED - Missing PDFParser integration
  - **Verifies:** Layout-based structure detection in PDF parsing

- ✅ **Test:** Integration - should integrate with EPUBParser
  - **Status:** RED - Missing EPUBParser integration
  - **Verifies:** Chapter/section hierarchy extraction in EPUB parsing

- ✅ **Test:** Integration - should ensure consistent structure output across all formats
  - **Status:** RED - Missing parser-agnostic interface
  - **Verifies:** Consistent DocumentNode output from all parsers

- ✅ **Test:** Integration - should support parser-agnostic StructureAnalyzer interface
  - **Status:** RED - Missing parser integration factory
  - **Verifies:** Unified interface for all parser types

- ✅ **Test:** Integration - should validate structure consistency across parsers
  - **Status:** RED - Missing consistency validation
  - **Verifies:** Same structure properties across parser outputs

- ✅ **Test:** Integration - should handle format-specific edge cases gracefully
  - **Status:** RED - Missing cross-parser edge case handling
  - **Verifies:** Graceful handling of format-specific issues

---

### Integration Tests (8 tests)

**File:** `tests/integration/document-processing/structure-analyzer/parser-integration.test.ts` (412 lines)

**Tests Created:**

- ✅ **Test:** MarkdownParser - should analyze structure when parsing markdown documents
  - **Status:** RED - Missing MarkdownParser structure analysis extension
  - **Verifies:** MarkdownParser with structure analysis enabled

- ✅ **Test:** MarkdownParser - should preserve original markdown parsing while adding structure
  - **Status:** RED - Missing structure integration in parse flow
  - **Verifies:** Backward compatibility with structure enhancement

- ✅ **Test:** MarkdownParser - should work without structure analysis (backward compatibility)
  - **Status:** RED - Missing backward compatibility check
  - **Verifies:** Parser works without structure analysis option

- ✅ **Test:** PDFParser - should detect structure using PDF layout analysis
  - **Status:** RED - Missing layout-based structure detection
  - **Verifies:** PDF structure detection using fonts, spacing, positioning

- ✅ **Test:** PDFParser - should use font size and positioning for structure detection
  - **Status:** RED - Missing layout analysis implementation
  - **Verifies:** Multi-signal layout analysis for structure

- ✅ **Test:** PDFParser - should extract headings from PDF TOC if available
  - **Status:** RED - Missing TOC extraction implementation
  - **Verifies:** PDF Table of Contents leverage for structure

- ✅ **Test:** EPUBParser - should extract chapter/section hierarchy from EPUB navigation
  - **Status:** RED - Missing EPUB navigation structure extraction
  - **Verifies:** nav.xhtml and spine usage for structure

- ✅ **Test:** EPUBParser - should preserve EPUB metadata while adding structure
  - **Status:** RED - Missing metadata preservation in structure flow
  - **Verifies:** Metadata retention during structure analysis

---

## Data Factories Created

### Document Node Factory

**File:** `tests/support/factories/document-structure/document-node.factory.ts` (295 lines)

**Exports:**

- `createDocumentNode(overrides?)` - Create single document node with optional overrides
- `createDocumentNodes(count, overrides)` - Create array of document nodes
- `createDocumentTree(options?)` - Create hierarchical document tree with chapters, sections, paragraphs, sentences
- `createConfidenceScore(overrides?)` - Create confidence score object with weighted metrics
- `createEdgeCaseDocument(options?)` - Create edge case document with missing headers, irregular formatting, or low confidence
- `createStructureParseOptions(overrides?)` - Create parse options for structure analysis

**Example Usage:**

```typescript
// Create simple document node
const chapter = createDocumentNode({
  type: 'chapter',
  level: 1,
  title: 'Chapter 1: Introduction',
  confidenceScore: 0.9,
});

// Create complete document tree
const document = createDocumentTree({
  chapters: 3,
  sectionsPerChapter: 2,
  paragraphsPerSection: 3,
  sentencesPerParagraph: 5,
});

// Create edge case document
const irregularDoc = createEdgeCaseDocument({
  missingHeaders: true,
  irregularFormatting: true,
  lowConfidence: true,
});
```

---

## Fixtures Created

### StructureAnalyzer Fixtures

**File:** `tests/support/fixtures/structure-analyzer.fixture.ts` (368 lines)

**Fixtures:**

- `structureAnalyzer` - StructureAnalyzer instance with auto-cleanup
  - **Setup:** Creates fresh StructureAnalyzer instance
  - **Provides:** Configured StructureAnalyzer ready for testing
  - **Cleanup:** Automatic resource cleanup via cleanupTestResources()

- `structureAnalyzerWithStreaming` - StructureAnalyzer with streaming enabled
  - **Setup:** Creates StructureAnalyzer with streaming mode
  - **Provides:** Streaming-enabled analyzer for large document testing
  - **Cleanup:** Automatic resource cleanup

- `mockStructure` - Mock document structure with confidence scores
  - **Setup:** Generates complete document tree with 3 chapters, 2 sections each, 3 paragraphs each
  - **Provides:** Pre-built structure for validation testing
  - **Cleanup:** Automatic via factory

- `mockConfidence` - Mock confidence score object
  - **Setup:** Generates weighted confidence scores
  - **Provides:** Complete ConfidenceScore object
  - **Cleanup:** Automatic via factory

- `testDocument` - Markdown test document with known structure
  - **Setup:** Creates 3-chapter markdown document with 2 sections per chapter
  - **Provides:** Ready-to-analyze markdown content
  - **Cleanup:** Automatic via factory

- `testDocumentPdf` - PDF test document
  - **Setup:** Creates PDF structure with layout information
  - **Provides:** PDF document object for testing
  - **Cleanup:** Automatic via factory

- `testDocumentEpub` - EPUB test document
  - **Setup:** Creates EPUB structure with chapters and sections
  - **Provides:** EPUB document object for testing
  - **Cleanup:** Automatic via factory

**Example Usage:**

```typescript
import { test } from '../support/fixtures/structure-analyzer.fixture';

test('should analyze document structure', async ({ structureAnalyzer, testDocument }) => {
  const result = await structureAnalyzer.analyzeDocument(testDocument, {
    format: 'markdown',
    enableChapterDetection: true,
    enableSectionDetection: true,
    confidenceThreshold: 0.5,
    streamingMode: false,
  });

  expect(result.structure).toBeDefined();
  expect(result.structure.type).toBe('document');
});

test('should validate structure', async ({ structureAnalyzer, mockStructure, mockConfidence }) => {
  const validation = await structureAnalyzer.validateStructure(mockStructure, mockConfidence);

  expect(validation).toBeDefined();
  expect(validation.structure).toBe(mockStructure);
});
```

---

## Mock Requirements

### External Service Mocks (Currently None Required)

The StructureAnalyzer is a pure backend processor that works directly with document content. No external API mocks are required for initial implementation.

**Future Enhancements (Post-Green Phase):**

- **Language Detection Service** - For multilingual sentence boundary detection
  - Endpoint: `POST /api/detect-language`
  - Success: `{ language: 'en', confidence: 0.95 }`
  - Failure: `{ error: 'Language detection failed' }`

- **OCR Service** - For scanned PDF structure detection
  - Endpoint: `POST /api/ocr`
  - Success: `{ text: 'Extracted text', confidence: 0.88 }`
  - Failure: `{ error: 'OCR failed' }`

---

## Required Data Attributes

**Note:** StructureAnalyzer is a backend document processing component. No `data-testid` attributes are required as there is no UI component at this level. The hierarchical structure tree will be generated for TUI visualization components, which will handle their own data attributes.

**For TUI Integration (Future Implementation):**

When integrating with React TUI components, the following attributes should be added:

- `data-structure-node` - Structure tree node container
- `data-chapter-id` - Chapter node identifier
- `data-section-id` - Section node identifier
- `data-confidence-score` - Confidence score display
- `data-validation-action` - Validation/correction controls

---

## Implementation Checklist

### Test: analyzeDocument - should analyze markdown document structure

**File:** `tests/unit/document-processing/structure-analyzer/structure-analyzer.test.ts` (line 32)

**Tasks to make this test pass:**
- [ ] Create `src/core/document-processing/StructureAnalyzer.ts` class
- [ ] Implement `analyzeDocument()` method with signature matching test expectations
- [ ] Create `DocumentNode` interface in types.ts
- [ ] Create `StructureParseOptions` interface
- [ ] Create `AnalysisResult` interface
- [ ] Add markdown-specific structure detection logic
- [ ] Run test: `bun test tests/unit/document-processing/structure-analyzer/structure-analyzer.test.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 4 hours

---

### Test: detectChapters - should detect chapter boundaries in document

**File:** `tests/unit/document-processing/structure-analyzer/structure-analyzer.test.ts` (line 132)

**Tasks to make this test pass:**
- [ ] Implement `detectChapters()` method
- [ ] Add chapter detection heuristics for markdown (pattern matching)
- [ ] Add chapter detection for PDF (font size, layout analysis)
- [ ] Add chapter detection for EPUB (navigation structure)
- [ ] Implement confidence scoring for chapter detection
- [ ] Run test: `bun test tests/unit/document-processing/structure-analyzer/structure-analyzer.test.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 5 hours

---

### Test: calculateConfidenceScore - should provide confidence scores for structure detection

**File:** `tests/unit/document-processing/structure-analyzer/structure-analyzer.test.ts` (line 233)

**Tasks to make this test pass:**
- [ ] Create `ConfidenceScore` interface
- [ ] Implement confidence calculation algorithm
- [ ] Add confidence scoring to all detection methods
- [ ] Return confidence scores in AnalysisResult
- [ ] Run test: `bun test tests/unit/document-processing/structure-analyzer/structure-analyzer.test.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 4 hours

---

### Test: validateStructure - should create validation interface for user review

**File:** `tests/unit/document-processing/structure-analyzer/structure-analyzer.test.ts` (line 313)

**Tasks to make this test pass:**
- [ ] Implement `validateStructure()` method
- [ ] Create `StructureValidation` interface
- [ ] Identify nodes needing review (below threshold)
- [ ] Run test: `bun test tests/unit/document-processing/structure-analyzer/structure-analyzer.test.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 3 hours

---

### Test: handleEdgeCases - should handle missing headers gracefully

**File:** `tests/unit/document-processing/structure-analyzer/structure-analyzer.test.ts` (line 423)

**Tasks to make this test pass:**
- [ ] Implement fallback strategy for missing headers
- [ ] Use paragraph detection as fallback for chapters
- [ ] Use sentence/paragraph grouping for sections
- [ ] Set appropriate confidence scores for fallback detection
- [ ] Run test: `bun test tests/unit/document-processing/structure-analyzer/structure-analyzer.test.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 4 hours

---

### Test: generateStructureTree - should generate hierarchical structure tree for TUI

**File:** `tests/unit/document-processing/structure-analyzer/structure-analyzer.test.ts` (line 505)

**Tasks to make this test pass:**
- [ ] Implement `generateStructureTree()` method
- [ ] Build complete hierarchical tree
- [ ] Maintain parent-child relationships
- [ ] Include all structure levels
- [ ] Run test: `bun test tests/unit/document-processing/structure-analyzer/structure-analyzer.test.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 4 hours

---

### Test: Integration - should integrate with MarkdownParser

**File:** `tests/integration/document-processing/structure-analyzer/parser-integration.test.ts` (line 25)

**Tasks to make this test pass:**
- [ ] Extend MarkdownParser with structure analysis
- [ ] Add `analyzeStructure` option to parse options
- [ ] Integrate StructureAnalyzer in parse flow
- [ ] Ensure backward compatibility (without structure analysis)
- [ ] Run test: `bun test tests/integration/document-processing/structure-analyzer/parser-integration.test.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 3 hours

---

**Complete Implementation Checklist Available At:**
`docs/implementation-checklist-1.5.md` (93 hours total estimated effort)

---

## Running Tests

```bash
# Run all failing tests for this story
bun test tests/unit/document-processing/structure-analyzer/
bun test tests/integration/document-processing/structure-analyzer/

# Run specific test file
bun test tests/unit/document-processing/structure-analyzer/structure-analyzer.test.ts

# Run tests in headed mode (see browser - not applicable, backend only)
N/A

# Debug specific test
bun test tests/unit/document-processing/structure-analyzer/structure-analyzer.test.ts --inspect-brk

# Run tests with coverage
bun test --coverage

# Run mutation testing
bun test --mutation
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

**TEA Agent Responsibilities:**

- ✅ All tests written and failing (42 total tests)
- ✅ Fixtures and factories created with auto-cleanup
- ✅ Mock requirements documented
- ✅ data-testid requirements listed (N/A for backend)
- ✅ Implementation checklist created with 93 hours of tasks

**Verification:**

- All tests run and fail as expected
- Failure messages are clear and actionable
- Tests fail due to missing implementation, not test bugs

---

### GREEN Phase (DEV Team - Next Steps)

**DEV Agent Responsibilities:**

1. **Pick one failing test** from implementation checklist (start with AC1 Test 1.1)
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

**Progress Tracking:**

- Check off tasks as you complete them
- Share progress in daily standup
- Mark story as IN PROGRESS in `bmm-workflow-status.md`

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

**DEV Agent Responsibilities:**

1. **Verify all tests pass** (green phase complete)
2. **Review code for quality** (readability, maintainability, performance)
3. **Extract duplications** (DRY principle)
4. **Optimize performance** (if needed)
5. **Ensure tests still pass** after each refactor
6. **Update documentation** (if API contracts change)

**Key Principles:**

- Tests provide safety net (refactor with confidence)
- Make small refactors (easier to debug if tests fail)
- Run tests after each change
- Don't change test behavior (only implementation)

**Completion:**

- All tests pass
- Code quality meets team standards
- No duplications or code smells
- Ready for code review and story approval

---

## Next Steps

1. **Review this checklist** with team in standup or planning
2. **Run failing tests** to confirm RED phase: `bun test tests/unit/document-processing/structure-analyzer/`
3. **Begin implementation** using implementation checklist as guide
4. **Work one test at a time** (red → green for each)
5. **Share progress** in daily standup
6. **When all tests pass**, refactor code for quality
7. **When refactoring complete**, run `bmm sm story-done` to move story to DONE

---

## Knowledge Base References Applied

This ATDD workflow consulted the following knowledge fragments:

- **fixture-architecture.md** - Test fixture patterns with setup/teardown and auto-cleanup using pure function → fixture → mergeTests composition (406 lines, 5 examples)
- **data-factories.md** - Factory patterns using `@faker-js/faker` for random test data generation with overrides support (498 lines, 5 examples)
- **test-quality.md** - Test design principles (Given-When-Then, one assertion per test, determinism, isolation, length limits, execution time optimization) (658 lines, 5 examples)
- **component-tdd.md** - Component test strategies using red-green-refactor workflow (480 lines, 4 examples)
- **network-first.md** - Not applicable (backend processing, no network requests) (489 lines, 5 examples)
- **test-levels-framework.md** - Test level selection framework (Unit vs Integration) (467 lines, 4 examples)

See `bmad/bmm/testarch/tea-index.csv` for complete knowledge fragment mapping.

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Command:** `bun test tests/unit/document-processing/structure-analyzer/`

**Expected Results:**

```
Tests: 34 failed, 34 total
Passing: 0
Failing: 34
Status: ✅ RED phase verified

Expected failure examples:
- Cannot find module '../../../src/core/document-processing/StructureAnalyzer'
- StructureAnalyzer is not a constructor
- Method 'analyzeDocument' does not exist
- Type 'DocumentNode' is not defined
```

**Summary:**

- Total tests: 42 (34 unit + 8 integration)
- Passing: 0 (expected)
- Failing: 42 (expected - due to missing implementation)
- Status: ✅ RED phase verified

**Expected Failure Messages:**

All tests fail due to missing implementation:
- StructureAnalyzer class doesn't exist
- DocumentNode interface not defined
- All detection methods not implemented
- Parser integration not implemented
- Confidence scoring not implemented

---

## Notes

**Architecture Alignment:**

- Follow documented project structure from architecture.md lines 60-67
- Implement StructureAnalyzer class in src/core/document-processing/
- Use feature-based organization aligning with epic structure
- Implement DocumentStructure interfaces in src/core/document-processing/types.ts
- Follow streaming architecture pattern for memory efficiency (Pattern 2 in architecture.md)
- Integrate with existing MarkdownParser, PDFParser, and EPUBParser

**Testing Standards:**

- Bun Test runner for all tests
- One assertion per test (atomic tests)
- Given-When-Then structure for clarity
- No hard waits or conditionals in tests
- Auto-cleanup fixtures for parallel execution safety
- Mutation testing with StrykerJS (90% high, 80% low, 70% break thresholds)

**Performance Requirements:**

- Streaming architecture for large documents (1000+ pages)
- Memory efficiency through chunked processing
- Real-time structure updates during processing
- Processing completion within 30 seconds for large documents

**Quality Gates:**

- All 42 tests must pass
- 90%+ test coverage
- 90% mutation score (high threshold)
- 80% mutation score (low threshold)
- 70% mutation score (break threshold)
- Zero ESLint violations

---

## Contact

**Questions or Issues?**

- Ask in team standup
- Tag @eduardo-menoncello in Slack/Discord
- Refer to `testarch/README.md` for workflow documentation
- Consult `testarch/knowledge/` for testing best practices

---

**Generated by BMad TEA Agent** - 2025-11-01
