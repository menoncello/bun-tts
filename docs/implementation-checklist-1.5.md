# Implementation Checklist - Story 1.5: Document Structure Analyzer

**Date:** 2025-11-01
**Author:** Eduardo Menoncello

---

## Implementation Strategy

This checklist maps each failing ATDD test to concrete implementation tasks. Work through tests one at a time, making each pass (RED → GREEN), then refactor.

---

## AC1: Document Structure Analysis Across All Formats

### Test: `structure-analyzer.test.ts - analyzeDocument method`

#### Test 1.1: Markdown Document Analysis
**File:** `tests/unit/document-processing/structure-analyzer/structure-analyzer.test.ts`

**Tasks to make this test pass:**
- [ ] Create `src/core/document-processing/StructureAnalyzer.ts` class
- [ ] Implement `analyzeDocument()` method with signature:
  ```typescript
  async analyzeDocument(
    content: string | object,
    options: StructureParseOptions
  ): Promise<AnalysisResult>
  ```
- [ ] Create `DocumentNode` interface in `src/core/document-processing/types.ts`:
  ```typescript
  interface DocumentNode {
    id: string;
    type: 'document' | 'chapter' | 'section' | 'paragraph' | 'sentence';
    level: number;
    title?: string;
    content: string;
    startPosition: number;
    endPosition: number;
    children: DocumentNode[];
    confidenceScore: number;
    metadata: Record<string, unknown>;
  }
  ```
- [ ] Implement `StructureParseOptions` interface
- [ ] Implement `AnalysisResult` interface
- [ ] Add markdown-specific structure detection logic
- [ ] Add required data-testid attributes: N/A (backend processing)
- [ ] Run test: `bun test tests/unit/document-processing/structure-analyzer/structure-analyzer.test.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 4 hours

---

#### Test 1.2: PDF Document Analysis
**Tasks to make this test pass:**
- [ ] Extend StructureAnalyzer to handle PDF content (object with pages array)
- [ ] Implement PDF-specific content extraction
- [ ] Map PDF structure to DocumentNode format
- [ ] Run test: `bun test tests/unit/document-processing/structure-analyzer/structure-analyzer.test.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 3 hours

---

#### Test 1.3: EPUB Document Analysis
**Tasks to make this test pass:**
- [ ] Extend StructureAnalyzer to handle EPUB content (object with chapters array)
- [ ] Implement EPUB-specific structure extraction
- [ ] Map EPUB navigation structure to DocumentNode format
- [ ] Run test: `bun test tests/unit/document-processing/structure-analyzer/structure-analyzer.test.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 3 hours

---

#### Test 1.4: Format-Agnostic Interface
**Tasks to make this test pass:**
- [ ] Ensure all parsers return same DocumentNode structure
- [ ] Implement consistent type definitions
- [ ] Add format detection logic
- [ ] Run test: `bun test tests/unit/document-processing/structure-analyzer/structure-analyzer.test.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 2 hours

---

## AC2: Structure Boundary Detection

### Test: `structure-analyzer.test.ts - Structure Boundary Detection`

#### Test 2.1: Chapter Boundary Detection
**Tasks to make this test pass:**
- [ ] Implement `detectChapters()` method:
  ```typescript
  async detectChapters(
    content: string,
    options: { format: string; confidenceThreshold: number }
  ): Promise<DocumentNode[]>
  ```
- [ ] Add chapter detection heuristics for markdown (pattern matching)
- [ ] Add chapter detection for PDF (font size, layout analysis)
- [ ] Add chapter detection for EPUB (navigation structure)
- [ ] Implement confidence scoring for chapter detection
- [ ] Run test: `bun test tests/unit/document-processing/structure-analyzer/structure-analyzer.test.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 5 hours

---

#### Test 2.2: Section Detection
**Tasks to make this test pass:**
- [ ] Implement `detectSections()` method:
  ```typescript
  async detectSections(
    content: string,
    options: { format: string; parentLevel: number; confidenceThreshold: number }
  ): Promise<DocumentNode[]>
  ```
- [ ] Add section detection for multiple hierarchy levels
- [ ] Maintain parent-child relationships
- [ ] Implement section detection for all formats
- [ ] Run test: `bun test tests/unit/document-processing/structure-analyzer/structure-analyzer.test.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 4 hours

---

#### Test 2.3: Paragraph Boundary Extraction
**Tasks to make this test pass:**
- [ ] Implement `extractParagraphs()` method:
  ```typescript
  async extractParagraphs(
    content: string,
    options: { confidenceThreshold: number }
  ): Promise<DocumentNode[]>
  ```
- [ ] Implement paragraph boundary detection using whitespace analysis
- [ ] Handle different paragraph formats (markdown, PDF, EPUB)
- [ ] Calculate confidence scores for paragraph detection
- [ ] Run test: `bun test tests/unit/document-processing/structure-analyzer/structure-analyzer.test.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 4 hours

---

#### Test 2.4: Sentence Boundary Detection
**Tasks to make this test pass:**
- [ ] Implement `detectSentences()` method:
  ```typescript
  async detectSentences(
    content: string,
    options: { confidenceThreshold: number; language: string }
  ): Promise<DocumentNode[]>
  ```
- [ ] Implement sentence segmentation with punctuation detection
- [ ] Handle edge cases: abbreviations, decimals, ellipses
- [ ] Support multilingual sentence boundary detection
- [ ] Run test: `bun test tests/unit/document-processing/structure-analyzer/structure-analyzer.test.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 5 hours

---

## AC3: Confidence Scoring System

### Test: `structure-analyzer.test.ts - Confidence Scoring`

#### Test 3.1: Structure Detection Confidence
**Tasks to make this test pass:**
- [ ] Create `ConfidenceScore` interface:
  ```typescript
  interface ConfidenceScore {
    overall: number;
    chapterDetection: number;
    sectionDetection: number;
    paragraphDetection: number;
    sentenceDetection: number;
  }
  ```
- [ ] Implement confidence calculation algorithm
- [ ] Add confidence scoring to all detection methods
- [ ] Return confidence scores in AnalysisResult
- [ ] Run test: `bun test tests/unit/document-processing/structure-analyzer/structure-analyzer.test.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 4 hours

---

#### Test 3.2: Per-Node Confidence Scores
**Tasks to make this test pass:**
- [ ] Add confidenceScore property to DocumentNode
- [ ] Calculate confidence for each detected node
- [ ] Use multiple detection signals for scoring
- [ ] Run test: `bun test tests/unit/document-processing/structure-analyzer/structure-analyzer.test.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 3 hours

---

#### Test 3.3: Weighted Confidence Based on Signals
**Tasks to make this test pass:**
- [ ] Implement weighted scoring algorithm
- [ ] Use multiple signals: pattern matching, formatting, context
- [ ] Weight different signals based on reliability
- [ ] Run test: `bun test tests/unit/document-processing/structure-analyzer/structure-analyzer.test.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 3 hours

---

#### Test 3.4: Confidence Reports for User Review
**Tasks to make this test pass:**
- [ ] Create `ConfidenceReport` interface:
  ```typescript
  interface ConfidenceReport {
    overall: ConfidenceScore;
    lowConfidenceNodes: DocumentNode[];
    recommendations: string[];
  }
  ```
- [ ] Generate confidence report with low-confidence nodes
- [ ] Add recommendations for manual review
- [ ] Include in AnalysisResult
- [ ] Run test: `bun test tests/unit/document-processing/structure-analyzer/structure-analyzer.test.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 2 hours

---

## AC4: User Validation and Correction

### Test: `structure-analyzer.test.ts - User Validation and Correction`

#### Test 4.1: Validation Interface Creation
**Tasks to make this test pass:**
- [ ] Implement `validateStructure()` method:
  ```typescript
  async validateStructure(
    structure: DocumentNode,
    confidence: ConfidenceScore
  ): Promise<StructureValidation>
  ```
- [ ] Create `StructureValidation` interface
- [ ] Identify nodes needing review (below threshold)
- [ ] Run test: `bun test tests/unit/document-processing/structure-analyzer/structure-analyzer.test.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 3 hours

---

#### Test 4.2: Structure Correction
**Tasks to make this test pass:**
- [ ] Implement `correctStructure()` method:
  ```typescript
  async correctStructure(
    structure: DocumentNode,
    corrections: { nodeId: string; updates: StructureUpdate }
  ): Promise<DocumentNode>
  ```
- [ ] Create `StructureUpdate` interface
- [ ] Apply boundary corrections
- [ ] Update confidence scores based on corrections
- [ ] Run test: `bun test tests/unit/document-processing/structure-analyzer/structure-analyzer.test.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 3 hours

---

#### Test 4.3: Save User Corrections
**Tasks to make this test pass:**
- [ ] Implement `saveCorrections()` method
- [ ] Implement `getSavedCorrections()` method
- [ ] Persist corrections for future processing
- [ ] Run test: `bun test tests/unit/document-processing/structure-analyzer/structure-analyzer.test.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 2 hours

---

#### Test 4.4: Interactive Validation Session
**Tasks to make this test pass:**
- [ ] Implement `startValidationSession()` method
- [ ] Create interactive validation workflow
- [ ] Focus on low-confidence nodes
- [ ] Run test: `bun test tests/unit/document-processing/structure-analyzer/structure-analyzer.test.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 3 hours

---

## AC5: Edge Case Handling

### Test: `structure-analyzer.test.ts - Edge Case Handling`

#### Test 5.1: Missing Headers Handling
**Tasks to make this test pass:**
- [ ] Implement fallback strategy for missing headers
- [ ] Use paragraph detection as fallback for chapters
- [ ] Use sentence/paragraph grouping for sections
- [ ] Set appropriate confidence scores for fallback detection
- [ ] Run test: `bun test tests/unit/document-processing/structure-analyzer/structure-analyzer.test.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 4 hours

---

#### Test 5.2: Irregular Formatting Handling
**Tasks to make this test pass:**
- [ ] Implement robust pattern matching
- [ ] Handle missing spaces in headers
- [ ] Normalize whitespace variations
- [ ] Handle inconsistent formatting patterns
- [ ] Run test: `bun test tests/unit/document-processing/structure-analyzer/structure-analyzer.test.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 3 hours

---

#### Test 5.3: Weak Structure Signal Fallback
**Tasks to make this test pass:**
- [ ] Implement hierarchical fallback strategy
- [ ] Use available signals (formatting, context, position)
- [ ] Lower confidence scores appropriately
- [ ] Generate recommendations for manual review
- [ ] Run test: `bun test tests/unit/document-processing/structure-analyzer/structure-analyzer.test.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 3 hours

---

#### Test 5.4: Format-Specific Conventions
**Tasks to make this test pass:**
- [ ] Implement markdown-specific conventions
- [ ] Implement PDF-specific conventions (layout, fonts, TOC)
- [ ] Implement EPUB-specific conventions (navigation, spine)
- [ ] Handle each format's unique structure indicators
- [ ] Run test: `bun test tests/unit/document-processing/structure-analyzer/structure-analyzer.test.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 4 hours

---

## AC6: Hierarchical Structure Tree for TUI

### Test: `structure-analyzer.test.ts - Hierarchical Structure Tree`

#### Test 6.1: Structure Tree Generation
**Tasks to make this test pass:**
- [ ] Implement `generateStructureTree()` method:
  ```typescript
  async generateStructureTree(
    content: string,
    options: StructureParseOptions
  ): Promise<DocumentNode>
  ```
- [ ] Build complete hierarchical tree
- [ ] Maintain parent-child relationships
- [ ] Include all structure levels
- [ ] Run test: `bun test tests/unit/document-processing/structure-analyzer/structure-analyzer.test.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 4 hours

---

#### Test 6.2: React-Compatible Tree Nodes
**Tasks to make this test pass:**
- [ ] Implement `toReactTreeNode()` method:
  ```typescript
  async toReactTreeNode(structure: DocumentNode): Promise<ReactTreeNode>
  ```
- [ ] Create `ReactTreeNode` interface:
  ```typescript
  interface ReactTreeNode {
    id: string;
    label: string;
    type: DocumentNodeType;
    children?: ReactTreeNode[];
    expanded?: boolean;
  }
  ```
- [ ] Convert DocumentNode to React-compatible format
- [ ] Run test: `bun test tests/unit/document-processing/structure-analyzer/structure-analyzer.test.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 3 hours

---

#### Test 6.3: Real-Time Structure Updates
**Tasks to make this test pass:**
- [ ] Implement streaming mode for large documents
- [ ] Implement `analyzeDocumentStreaming()` method:
  ```typescript
  async analyzeDocumentStreaming(
    content: string,
    options: StructureParseOptions,
    onUpdate: (node: DocumentNode) => void
  ): Promise<AnalysisResult>
  ```
- [ ] Emit updates as structure is detected
- [ ] Support progress tracking
- [ ] Run test: `bun test tests/unit/document-processing/structure-analyzer/structure-analyzer.test.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 4 hours

---

#### Test 6.4: Efficient Tree Rendering for Large Documents
**Tasks to make this test pass:**
- [ ] Implement streaming architecture for 1000+ pages
- [ ] Use lazy loading for tree nodes
- [ ] Optimize memory usage
- [ ] Ensure processing completes within time limits
- [ ] Run test: `bun test tests/unit/document-processing/structure-analyzer/structure-analyzer.test.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 5 hours

---

#### Test 6.5: Structure Statistics
**Tasks to make this test pass:**
- [ ] Implement `generateStructureStats()` method:
  ```typescript
  async generateStructureStats(structure: DocumentNode): Promise<StructureStats>
  ```
- [ ] Create `StructureStats` interface:
  ```typescript
  interface StructureStats {
    totalNodes: number;
    chapterCount: number;
    sectionCount: number;
    paragraphCount: number;
    sentenceCount: number;
    averageConfidence: number;
    processingTime: number;
  }
  ```
- [ ] Calculate all statistics
- [ ] Include metadata
- [ ] Run test: `bun test tests/unit/document-processing/structure-analyzer/structure-analyzer.test.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 2 hours

---

## Parser Integration Tasks

### Test: `parser-integration.test.ts`

#### Integration 1: MarkdownParser Extension
**Tasks to make this test pass:**
- [ ] Extend MarkdownParser with structure analysis
- [ ] Add `analyzeStructure` option to parse options
- [ ] Integrate StructureAnalyzer in parse flow
- [ ] Ensure backward compatibility (without structure analysis)
- [ ] Run test: `bun test tests/integration/document-processing/structure-analyzer/parser-integration.test.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 3 hours

---

#### Integration 2: PDFParser Extension
**Tasks to make this test pass:**
- [ ] Extend PDFParser with layout-based structure detection
- [ ] Analyze fonts, spacing, positioning for structure
- [ ] Optionally use PDF TOC for structure
- [ ] Integrate StructureAnalyzer in parse flow
- [ ] Run test: `bun test tests/integration/document-processing/structure-analyzer/parser-integration.test.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 4 hours

---

#### Integration 3: EPUBParser Extension
**Tasks to make this test pass:**
- [ ] Extend EPUBParser with chapter/section hierarchy extraction
- [ ] Use nav.xhtml for structure detection
- [ ] Use spine for reading order
- [ ] Preserve EPUB metadata while adding structure
- [ ] Run test: `bun test tests/integration/document-processing/structure-analyzer/parser-integration.test.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 4 hours

---

#### Integration 4: Parser-Agnostic Interface
**Tasks to make this test pass:**
- [ ] Implement `createParserIntegration()` method
- [ ] Ensure consistent structure output
- [ ] Validate DocumentNode interface compliance
- [ ] Test cross-parser consistency
- [ ] Run test: `bun test tests/integration/document-processing/structure-analyzer/parser-integration.test.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 2 hours

---

## Supporting Infrastructure

### Type Definitions
- [ ] Create/update `src/core/document-processing/types.ts`
- [ ] Add DocumentNode interface
- [ ] Add StructureParseOptions interface
- [ ] Add ConfidenceScore interface
- [ ] Add AnalysisResult interface
- [ ] Add StructureValidation interface
- [ ] Add ReactTreeNode interface
- [ ] Add StructureStats interface

### Error Handling
- [ ] Create structure-analyzer-error.ts with custom error classes
- [ ] Implement Result pattern for error propagation
- [ ] Add structured error messages
- [ ] Add error recovery strategies

### Logging
- [ ] Add Pino logging throughout StructureAnalyzer
- [ ] Log structure detection events
- [ ] Log confidence scores
- [ ] Log processing time for large documents

### Performance
- [ ] Implement streaming architecture for large documents
- [ ] Optimize memory usage
- [ ] Add performance statistics tracking
- [ ] Add resource cleanup for streaming

---

## Testing Requirements

### Unit Tests
- [ ] All unit tests pass
- [ ] Run: `bun test tests/unit/document-processing/structure-analyzer/`

### Integration Tests
- [ ] All integration tests pass
- [ ] Run: `bun test tests/integration/document-processing/structure-analyzer/`

### Mutation Testing
- [ ] Achieve 90% mutation score for high threshold
- [ ] Achieve 80% mutation score for low threshold
- [ ] Achieve 70% mutation score for break threshold
- [ ] Run: `bun test --mutation`

### Test Coverage
- [ ] Achieve >90% code coverage
- [ ] Run: `bun test --coverage`

---

## Total Estimated Effort

**Core Implementation:** 68 hours
**Parser Integration:** 13 hours
**Testing & Validation:** 12 hours

**Total: 93 hours** (approximately 2-3 weeks for a single developer)

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

**TEA Agent Responsibilities:**
- ✅ All tests written and failing
- ✅ Fixtures and factories created with auto-cleanup
- ✅ Mock requirements documented
- ✅ Implementation checklist created

**Verification:**
- All tests run and fail as expected
- Failure messages are clear and actionable
- Tests fail due to missing implementation, not test bugs

---

### GREEN Phase (DEV Team - Next Steps)

**DEV Agent Responsibilities:**

1. **Pick one failing test** from this checklist (start with highest priority - AC1 Test 1.1)
2. **Read the test** to understand expected behavior
3. **Implement minimal code** to make that specific test pass
4. **Run the test** to verify it now passes (green)
5. **Check off the task** in this checklist
6. **Move to next test** and repeat

**Key Principles:**
- One test at a time (don't try to fix all at once)
- Minimal implementation (don't over-engineer)
- Run tests frequently (immediate feedback)
- Use this checklist as roadmap

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

## Running Tests

```bash
# Run all StructureAnalyzer tests
bun test tests/unit/document-processing/structure-analyzer/
bun test tests/integration/document-processing/structure-analyzer/

# Run specific test file
bun test tests/unit/document-processing/structure-analyzer/structure-analyzer.test.ts

# Run with coverage
bun test --coverage

# Run mutation testing
bun test --mutation

# Debug specific test
bun test tests/unit/document-processing/structure-analyzer/structure-analyzer.test.ts --inspect-brk
```

---

## Knowledge Base References Applied

This implementation followed these BMAD knowledge fragments:

- **fixture-architecture.md** - Test fixture patterns with auto-cleanup using pure function → fixture pattern
- **data-factories.md** - Factory patterns using `@faker-js/faker` for random test data generation with overrides support
- **test-quality.md** - Test design principles (Given-When-Then, one assertion per test, determinism, isolation)
- **component-tdd.md** - Component test strategies for validation interfaces
- **network-first.md** - Not applicable (backend processing)
- **test-levels-framework.md** - Test level selection framework (Unit vs Integration)

---

## Next Steps

1. **Review this checklist** with team in standup or planning
2. **Run failing tests** to confirm RED phase: `bun test tests/unit/document-processing/structure-analyzer/`
3. **Begin implementation** using this checklist as guide
4. **Work one test at a time** (red → green for each)
5. **Share progress** in daily standup
6. **When all tests pass**, refactor code for quality
7. **When refactoring complete**, run `bmm sm story-done` to move story to DONE

---

**Generated by BMad TEA Agent** - 2025-11-01
