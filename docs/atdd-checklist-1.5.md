# ATDD Checklist - Epic 1, Story 1.5: Document Structure Analyzer

**Date:** 2025-11-01
**Author:** Eduardo Menoncello
**Primary Test Level:** Unit + Integration

---

## Story Summary

As a user processing complex documents, I want the system to intelligently analyze and structure the content, so that I get well-organized audiobook chapters and sections.

**As a** user processing complex documents
**I want** the system to intelligently analyze and structure the content
**So that** I get well-organized audiobook chapters and sections

---

## Acceptance Criteria

1. Analyze document structure across all supported formats
2. Identify chapters, sections, paragraphs, and sentence boundaries
3. Provide confidence scores for structure detection
4. Allow user validation and correction of automatic analysis
5. Handle edge cases (missing headers, irregular formatting)
6. Generate hierarchical structure tree for TUI visualization

---

## Failing Tests Created (RED Phase)

### Unit Tests (36 tests)

**File:** `tests/unit/document-processing/structure-analyzer/structure-analyzer-foundation.test.ts` (156 lines)

- ✅ **Test:** 1.5-UNIT-001 - should initialize with all parser types
  - **Status:** RED - StructureAnalyzer class doesn't exist yet
  - **Verifies:** Constructor accepts and registers all three parser types (MarkdownParser, PDFParser, EPUBParser)

- ✅ **Test:** 1.5-UNIT-002 - should create format-agnostic structure detection interface
  - **Status:** RED - analyzeStructure method doesn't exist
  - **Verifies:** Returns consistent DocumentStructure format regardless of input format

- ✅ **Test:** 1.5-UNIT-003 - should generate hierarchical structure tree with DocumentNode interface
  - **Status:** RED - generateStructureTree method doesn't exist
  - **Verifies:** Creates proper parent-child relationships up to 5 levels deep

- ✅ **Test:** 1.5-UNIT-004 - should implement streaming architecture for large documents
  - **Status:** RED - streaming options not implemented
  - **Verifies:** Processes 1000+ page documents without exceeding 512MB memory

- ✅ **Test:** 1.5-UNIT-005 - should integrate with MarkdownParser
  - **Status:** RED - MarkdownParser integration not implemented
  - **Verifies:** Calls parse and extractStructure methods on MarkdownParser

- ✅ **Test:** 1.5-UNIT-006 - should integrate with PDFParser
  - **Status:** RED - PDFParser integration not implemented
  - **Verifies:** Extracts structure from PDF bookmarks and layout

- ✅ **Test:** 1.5-UNIT-007 - should integrate with EPUBParser
  - **Status:** RED - EPUBParser integration not implemented
  - **Verifies:** Uses EPUB navigation document for chapter detection

**File:** `tests/unit/document-processing/structure-analyzer/chapter-section-detection.test.ts` (381 lines)

- ✅ **Test:** 1.5-UNIT-008 - should detect chapter boundaries using heuristic analysis
  - **Status:** RED - Chapter detection algorithm not implemented
  - **Verifies:** Detects chapters with various naming patterns

- ✅ **Test:** 1.5-UNIT-009 - should identify section headers at multiple hierarchy levels
  - **Status:** RED - Section detection not implemented
  - **Verifies:** Detects sections at levels 2-5 with proper nesting

- ✅ **Test:** 1.5-UNIT-010 - should handle missing headers with fallback strategies
  - **Status:** RED - Fallback mechanisms not implemented
  - **Verifies:** Uses paragraph-grouping for unstructured content

- ✅ **Test:** 1.5-UNIT-011 - should implement confidence scoring for detected structures
  - **Status:** RED - Confidence scoring system not implemented
  - **Verifies:** Assigns confidence scores based on header clarity and formatting

- ✅ **Test:** 1.5-UNIT-012 - should support different document format conventions
  - **Status:** RED - Format-specific detection not implemented
  - **Verifies:** Adapts to Markdown headers, PDF bookmarks, EPUB nav docs

- ✅ **Test:** 1.5-UNIT-013 - should detect PDF chapter boundaries from bookmarks
  - **Status:** RED - PDF bookmark extraction not implemented
  - **Verifies:** Creates structure from PDF table of contents

- ✅ **Test:** 1.5-UNIT-014 - should detect EPUB chapter boundaries from navigation document
  - **Status:** RED - EPUB navigation extraction not implemented
  - **Verifies:** Uses nav.xhtml to identify chapter structure

**File:** `tests/unit/document-processing/structure-analyzer/paragraph-sentence-boundaries.test.ts` (412 lines)

- ✅ **Test:** 1.5-UNIT-015 - should extract paragraph boundaries with whitespace analysis
  - **Status:** RED - Paragraph boundary detection not implemented
  - **Verifies:** Identifies paragraphs using double newline patterns

- ✅ **Test:** 1.5-UNIT-016 - should implement sentence-level segmentation with punctuation detection
  - **Status:** RED - Sentence segmentation not implemented
  - **Verifies:** Splits text into sentences using punctuation (. ! ?)

- ✅ **Test:** 1.5-UNIT-017 - should provide confidence scores for each boundary detection
  - **Status:** RED - Boundary confidence scoring not implemented
  - **Verifies:** Assigns confidence to paragraphs and sentences

- ✅ **Test:** 1.5-UNIT-018 - should handle edge cases with abbreviations
  - **Status:** RED - Abbreviation handling not implemented
  - **Verifies:** Doesn't split on Dr., Prof., U.S.A., Jan., etc.

- ✅ **Test:** 1.5-UNIT-019 - should handle edge cases with decimals
  - **Status:** RED - Decimal number handling not implemented
  - **Verifies:** Doesn't split on numbers like 3.14, 2.0

- ✅ **Test:** 1.5-UNIT-020 - should handle edge cases with ellipses
  - **Status:** RED - Ellipsis handling not implemented
  - **Verifies:** Keeps ellipses within sentences

- ✅ **Test:** 1.5-UNIT-021 - should support multilingual sentence boundary detection
  - **Status:** RED - Multilingual support not implemented
  - **Verifies:** Correctly segments sentences in EN, ES, FR, DE

**File:** `tests/unit/document-processing/structure-analyzer/confidence-scoring.test.ts` (319 lines)

- ✅ **Test:** 1.5-UNIT-022 - should calculate structure detection confidence metrics
  - **Status:** RED - Confidence calculation not implemented
  - **Verifies:** Computes weighted confidence from multiple signals

- ✅ **Test:** 1.5-UNIT-023 - should provide confidence levels per chapter, section, paragraph, sentence
  - **Status:** RED - Multi-level confidence not implemented
  - **Verifies:** Assigns confidence at all hierarchy levels

- ✅ **Test:** 1.5-UNIT-024 - should implement weighted scoring based on multiple detection signals
  - **Status:** RED - Weighted scoring not implemented
  - **Verifies:** Applies weights: headerFormat(30%), contentDepth(25%), hierarchy(25%), position(20%)

- ✅ **Test:** 1.5-UNIT-025 - should generate confidence reports for user review
  - **Status:** RED - Confidence reporting not implemented
  - **Verifies:** Creates detailed reports with statistics and recommendations

- ✅ **Test:** 1.5-UNIT-026 - should support threshold-based acceptance criteria
  - **Status:** RED - Threshold validation not implemented
  - **Verifies:** Categorizes nodes: highQuality(≥0.8), acceptable(≥0.5), reviewRequired(<0.5)

**File:** `tests/unit/document-processing/structure-analyzer/validation-interface.test.ts` (354 lines)

- ✅ **Test:** 1.5-UNIT-027 - should create StructureValidation interface for user review
  - **Status:** RED - Validation interface not implemented
  - **Verifies:** Provides editable nodes with status tracking

- ✅ **Test:** 1.5-UNIT-028 - should implement correction mechanisms for structure boundaries
  - **Status:** RED - Correction mechanisms not implemented
  - **Verifies:** Allows modifying titles, confidence, structure

- ✅ **Test:** 1.5-UNIT-029 - should support interactive validation and adjustment
  - **Status:** RED - Interactive validation not implemented
  - **Verifies:** Highlights low-confidence nodes for review

- ✅ **Test:** 1.5-UNIT-030 - should allow manual override of automatic detection
  - **Status:** RED - Manual overrides not implemented
  - **Verifies:** Users can merge, split, reorder nodes

- ✅ **Test:** 1.5-UNIT-031 - should preserve user corrections for future processing
  - **Status:** RED - Correction persistence not implemented
  - **Verifies:** Saves and reapplies user corrections automatically

**File:** `tests/unit/document-processing/structure-analyzer/tui-visualization.test.ts` (403 lines)

- ✅ **Test:** 1.5-UNIT-032 - should generate hierarchical structure tree for TUI components
  - **Status:** RED - TUI tree generation not implemented
  - **Verifies:** Creates renderable tree with parent-child relationships

- ✅ **Test:** 1.5-UNIT-033 - should create DocumentTreeNode interface for React components
  - **Status:** RED - React tree nodes not implemented
  - **Verifies:** Provides React-compatible nodes with key, metadata, display properties

- ✅ **Test:** 1.5-UNIT-034 - should support real-time structure updates during processing
  - **Status:** RED - Real-time updates not implemented
  - **Verifies:** Emits progress events as document is processed

- ✅ **Test:** 1.5-UNIT-035 - should implement efficient tree rendering for large documents
  - **Status:** RED - Efficient rendering not implemented
  - **Verifies:** Uses virtual scrolling and lazy loading for 1000+ nodes

- ✅ **Test:** 1.5-UNIT-036 - should provide structure statistics and metadata
  - **Status:** RED - Statistics not implemented
  - **Verifies:** Calculates counts, depth, word counts, confidence metrics

### Integration Tests

**File:** `tests/integration/document-processing/structure-analyzer/` (to be created)

---

## Data Factories Created

**File:** `tests/support/factories/document-structure-factory.ts` (490 lines)

**Exports:**

- `createDocumentStructure(overrides?)` - Create complete document structure with chapters, paragraphs, sentences
- `createChapter(overrides?)` - Create single chapter with paragraphs
- `createDocumentMetadata(overrides?)` - Create document metadata object
- `createDocumentNode(overrides?)` - Create generic document node (chapter/section/paragraph)
- `createStructureChapter(overrides?)` - Create structure-focused chapter node
- `createStructureSection(overrides?)` - Create structure-focused section node
- `createNestedStructure(options)` - Create nested document with configurable depth
- `createMixedConfidenceStructure(options)` - Create document with varying confidence levels

**Example Usage:**

```typescript
import {
  createNestedStructure,
  createMixedConfidenceStructure,
} from '../support/factories/document-structure-factory';

// Create nested structure with 5 chapters, 3 sections each, 2 subsections each
const structure = createNestedStructure({
  format: 'markdown',
  chapterCount: 5,
  sectionsPerChapter: 3,
  subsectionsPerSection: 2,
});

// Create document with mixed confidence levels
const mixedDoc = createMixedConfidenceStructure({
  format: 'pdf',
  highConfidenceCount: 3,
  mediumConfidenceCount: 3,
  lowConfidenceCount: 2,
});
```

---

## Mock Requirements

### MarkdownParser Mock Requirements

**Methods:**
- `parse(document: Document): Promise<ParsedDocument>`
- `extractStructure(parsed: ParsedDocument): Promise<DocumentStructure>`

**Expected Behavior:**
- Detects headers (# ## ### #### ##### ######)
- Extracts hierarchical structure from header levels
- Returns structure with confidence scores based on formatting quality

### PDFParser Mock Requirements

**Methods:**
- `parse(document: Document): Promise<ParsedPDF>`
- `extractStructure(parsed: ParsedPDF): Promise<DocumentStructure>`

**Expected Behavior:**
- Extracts table of contents/bookmarks
- Uses page numbers for positioning
- Detects headers based on font size/weight (when available)
- Returns structure with page-based positioning

### EPUBParser Mock Requirements

**Methods:**
- `parse(document: Document): Promise<ParsedEPUB>`
- `extractStructure(parsed: ParsedEPUB): Promise<DocumentStructure>`

**Expected Behavior:**
- Reads navigation document (nav.xhtml)
- Extracts chapter structure from linear reading order
- Uses href links for positioning
- Returns structure with EPUB-specific metadata (id, href, order)

---

## Required data-testid Attributes

For TUI visualization components:

**Document Tree Component:**
- `document-tree-root` - Root tree container
- `document-tree-node-{nodeId}` - Individual tree node
- `document-tree-toggle-{nodeId}` - Expand/collapse toggle button
- `document-tree-children-{nodeId}` - Children container

**Validation Interface:**
- `validation-panel` - Validation review panel
- `validation-node-{nodeId}` - Individual node in validation view
- `confidence-indicator-{nodeId}` - Confidence score display
- `correction-button-{nodeId}` - Button to initiate correction

**Statistics Display:**
- `stats-total-chapters` - Total chapter count
- `stats-total-sections` - Total section count
- `stats-average-confidence` - Average confidence score
- `stats-max-depth` - Maximum nesting depth

---

## Implementation Checklist

### Test: StructureAnalyzer Foundation (1.5-UNIT-001 to 1.5-UNIT-007)

**File:** `src/core/document-processing/StructureAnalyzer.ts`

**Tasks to make tests pass:**

- [ ] Create StructureAnalyzer class
- [ ] Implement constructor accepting three parsers (MarkdownParser, PDFParser, EPUBParser)
- [ ] Implement `analyzeStructure()` method with format-agnostic interface
- [ ] Implement `generateStructureTree()` method with DocumentNode hierarchy
- [ ] Add streaming support with chunkSize and memory monitoring
- [ ] Integrate with existing MarkdownParser
- [ ] Integrate with existing PDFParser
- [ ] Integrate with existing EPUBParser
- [ ] Add type definitions in `src/core/document-processing/types.ts`
- [ ] Run tests: `bun test structure-analyzer-foundation.test.ts`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 16 hours

---

### Test: Chapter and Section Detection (1.5-UNIT-008 to 1.5-UNIT-014)

**File:** `src/core/document-processing/structure-analyzer/chapter-section-detector.ts`

**Tasks to make tests pass:**

- [ ] Implement chapter boundary detection using heuristic analysis
- [ ] Support multiple chapter patterns: "Chapter N", "N. Title", "#? title"
- [ ] Implement section detection at multiple hierarchy levels (2-6)
- [ ] Create fallback strategy for missing headers (paragraph-grouping)
- [ ] Implement confidence scoring based on header format and clarity
- [ ] Add format-specific detection: Markdown (# headers), PDF (bookmarks), EPUB (nav doc)
- [ ] Implement PDF bookmark extraction
- [ ] Implement EPUB navigation document parsing
- [ ] Add confidence factors: headerFormat, titleClarity, positionConsistency
- [ ] Run tests: `bun test chapter-section-detection.test.ts`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 20 hours

---

### Test: Paragraph and Sentence Boundaries (1.5-UNIT-015 to 1.5-UNIT-021)

**File:** `src/core/document-processing/structure-analyzer/boundary-detector.ts`

**Tasks to make tests pass:**

- [ ] Implement paragraph boundary detection using whitespace analysis
- [ ] Support multiple blank line patterns (2+ newlines)
- [ ] Implement sentence segmentation with punctuation detection (. ! ?)
- [ ] Add confidence scoring for each boundary detection
- [ ] Implement abbreviation handling (Dr., Prof., Mr., Mrs., U.S.A., Jan., etc.)
- [ ] Implement decimal number handling (3.14, 2.0, 15.99)
- [ ] Implement ellipsis handling (..., …)
- [ ] Add multilingual support (EN, ES, FR, DE sentence patterns)
- [ ] Create boundary detection configuration
- [ ] Run tests: `bun test paragraph-sentence-boundaries.test.ts`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 14 hours

---

### Test: Confidence Scoring System (1.5-UNIT-022 to 1.5-UNIT-026)

**File:** `src/core/document-processing/structure-analyzer/confidence-scorer.ts`

**Tasks to make tests pass:**

- [ ] Implement structure detection confidence metrics
- [ ] Calculate weighted confidence from multiple signals
- [ ] Provide confidence at all hierarchy levels (chapter, section, paragraph, sentence)
- [ ] Implement weighted scoring formula:
  - headerFormat: 30%
  - contentDepth: 25%
  - hierarchicalConsistency: 25%
  - positionPredictability: 20%
- [ ] Generate comprehensive confidence reports
- [ ] Add threshold-based acceptance criteria (≥0.8 high, ≥0.5 medium, <0.5 low)
- [ ] Create confidence visualization
- [ ] Run tests: `bun test confidence-scoring.test.ts`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 12 hours

---

### Test: Validation and Correction Interface (1.5-UNIT-027 to 1.5-UNIT-031)

**File:** `src/core/document-processing/structure-analyzer/validation-interface.ts`

**Tasks to make tests pass:**

- [ ] Create StructureValidation interface
- [ ] Implement correction mechanisms (modify, delete, reorder, merge, split)
- [ ] Support interactive validation with highlighting
- [ ] Implement manual override functionality
- [ ] Add correction persistence for future processing
- [ ] Create correction history tracking
- [ ] Implement auto-correction from saved profiles
- [ ] Add validation session management
- [ ] Run tests: `bun test validation-interface.test.ts`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 16 hours

---

### Test: TUI Visualization Structure Generation (1.5-UNIT-032 to 1.5-UNIT-036)

**File:** `src/core/document-processing/structure-analyzer/tui-generator.ts`

**Tasks to make tests pass:**

- [ ] Generate hierarchical structure tree for TUI
- [ ] Create DocumentTreeNode interface for React components
- [ ] Support real-time structure updates during processing
- [ ] Implement efficient tree rendering with virtual scrolling
- [ ] Add lazy loading for large documents (1000+ nodes)
- [ ] Provide structure statistics and metadata
- [ ] Calculate performance metrics (render time, memory usage)
- [ ] Implement chunk-based rendering strategy
- [ ] Run tests: `bun test tui-visualization.test.ts`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 14 hours

---

## Running Tests

```bash
# Run all failing tests for this story
bun test structure-analyzer

# Run specific test file
bun test structure-analyzer-foundation.test.ts

# Run tests in watch mode (see failures immediately)
bun test --watch structure-analyzer

# Run tests with coverage
bun test --coverage structure-analyzer

# Run mutation testing
bun run test:mutation
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

**TEA Agent Responsibilities:**

- ✅ All 36 tests written and failing
- ✅ Fixtures and factories created with auto-cleanup
- ✅ Mock requirements documented
- ✅ data-testid requirements listed
- ✅ Implementation checklist created

**Verification:**

- All tests run and fail as expected
- Failure messages are clear and actionable
- Tests fail due to missing implementation, not test bugs

---

### GREEN Phase (DEV Team - Next Steps)

**DEV Agent Responsibilities:**

1. **Pick one failing test** from implementation checklist (start with Foundation)
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
4. **Optimize performance** (streaming architecture, memory efficiency)
5. **Ensure tests still pass** after each refactor
6. **Update documentation** (API contracts, type definitions)

**Key Principles:**

- Tests provide safety net (refactor with confidence)
- Make small refactors (easier to debug if tests fail)
- Run tests after each change
- Don't change test behavior (only implementation)

**Completion:**

- All 36 tests pass
- Code quality meets team standards
- No duplications or code smells
- Ready for code review and story approval
- Mutation testing score ≥90%

---

## Next Steps

1. **Review this checklist** with team in standup or planning
2. **Run failing tests** to confirm RED phase: `bun test structure-analyzer`
3. **Begin implementation** using implementation checklist as guide
4. **Work one test at a time** (red → green for each)
5. **Share progress** in daily standup
6. **When all tests pass**, refactor code for quality
7. **When refactoring complete**, run mutation testing to verify quality
8. **When mutation score ≥90%**, run `bmad sm story-done` to move story to DONE

---

## Knowledge Base References Applied

This ATDD workflow consulted the following knowledge fragments:

- **fixture-architecture.md** - Test fixture patterns with setup/teardown and auto-cleanup
- **data-factories.md** - Factory patterns using `@faker-js/faker` for random test data generation with overrides support
- **network-first.md** - Route interception patterns (not applicable for Bun Test, but patterns adapted)
- **test-quality.md** - Test design principles (Given-When-Then, one assertion per test, determinism, isolation)
- **test-levels-framework.md** - Test level selection framework (Unit vs Integration vs E2E)
- **component-tdd.md** - Component test strategies (adapted for Bun Test patterns)

See `tea-index.csv` for complete knowledge fragment mapping.

---

## Contact

**Questions or Issues?**

- Ask in team standup
- Tag @Eduardo Menoncello in Slack/Discord
- Refer to `testarch/README.md` for workflow documentation
- Consult `testarch/knowledge/` for testing best practices

---

**Generated by BMad TEA Agent** - 2025-11-01
