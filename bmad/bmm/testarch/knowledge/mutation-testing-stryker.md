# Mutation Testing with Stryker

## Configuration

Project uses Stryker with these thresholds:
- **High**: 90%
- **Low**: 80%
- **Break**: 70%

## Running Tests

```bash
bun run test:mutation
```

## Configuration File

```json
{
  "$schema": "./node_modules/@stryker-mutator/core/schema/stryker-schema.json",
  "testRunner": "command",
  "commandRunner": {
    "command": "bun test --cwd='../../'"
  },
  "coverageAnalysis": "perTest",
  "mutate": [
    "src/**/*.ts",
    "src/**/*.tsx",
    "!src/**/*.test.ts",
    "!src/**/*.test.tsx"
  ],
  "thresholds": {
    "high": 90,
    "low": 80,
    "break": 70
  },
  "reporters": ["progress", "clear-text", "html"],
  "concurrency": 2
}
```

## Understanding Mutation Scores

- **High Score (90%)**: Most mutants killed, excellent test coverage
- **Low Score (80%)**: Good coverage, some mutants survived
- **Break Threshold (70%)**: Minimum acceptable quality

## What are Mutants?

Mutants are small changes to your source code that test whether your tests would catch bugs:

```typescript
// Original code
if (isValid) {
  return result;
}

// Mutant 1: Change condition
if (!isValid) {  // Mutated!
  return result;
}

// Mutant 2: Remove condition
// if (isValid) {  // Removed!
  return result;
// }

// Mutant 3: Change return value
return null;  // Mutated!
```

If tests still pass after mutation, the test suite needs improvement.

## Writing Mutation-Resistant Tests

### DO: Test Actual Behavior

```typescript
// GOOD: Tests what the function does
it('should validate EPUB structure', () => {
  const validEPUB = createValidEPUB();
  const result = validateStructure(validEPUB);

  expect(result.isValid).toBe(true);
  expect(result.chapters.length).toBeGreaterThan(0);
});
```

### DON'T: Test Implementation Details

```typescript
// BAD: Only tests implementation
it('should call parseStructure', () => {
  const mockParse = jest.fn();
  parser.parseStructure = mockParse;

  parser.validate(validEPUB);

  expect(mockParse).toHaveBeenCalled(); // Easy to mutate, no real test
});
```

### DO: Use Boundary Values

```typescript
// GOOD: Tests edge cases
describe('Chapter boundary validation', () => {
  it('should handle boundary conditions', () => {
    expect(validateChapterIndex(-1)).toBe(false);
    expect(validateChapterIndex(0)).toBe(true);
    expect(validateChapterIndex(MAX_CHAPTERS)).toBe(false);
    expect(validateChapterIndex(MAX_CHAPTERS - 1)).toBe(true);
  });
});
```

### DO: Test Error Conditions

```typescript
// GOOD: Tests error paths
it('should handle missing metadata gracefully', () => {
  const epUBWithoutMetadata = createEPUBWithoutMetadata();

  expect(() => extractMetadata(epUBWithoutMetadata)).toThrow('Metadata required');
});

it('should return empty chapters for empty spine', () => {
  const epubWithEmptySpine = createEPUBWithEmptySpine();
  const chapters = extractChapters(epubWithEmptySpine);

  expect(chapters).toEqual([]);
});
```

### DO: Test Different Data Types

```typescript
// GOOD: Tests type handling
it('should handle various input types', () => {
  const parser = new EPUBParser();

  // Test buffer input
  const bufferResult = await parser.parse(validBuffer);
  expect(bufferResult.success).toBe(true);

  // Test string path input
  const pathResult = await parser.parse(validPath);
  expect(pathResult.success).toBe(true);

  // Test array buffer input
  const arrayBufferResult = await parser.parse(validArrayBuffer);
  expect(arrayBufferResult.success).toBe(true);
});
```

### DON'T: Use Trivial Assertions

```typescript
// BAD: Easy to mutate, no real testing
it('should return something', () => {
  const result = someFunction();
  expect(result).toBeDefined(); // Survives most mutations
});

it('should not throw', () => {
  expect(() => someFunction()).not.toThrow(); // Too generic
});
```

## Common Mutation Patterns and How to Kill Them

### 1. Conditional Mutations

```typescript
// Original
if (error) {
  throw new Error(error.message);
}

// Mutant
if (!error) {  // Negated condition
  throw new Error(error.message);
}

// Kill it by testing both cases
it('should throw when error exists', () => {
  expect(() => handleError(new Error('test'))).toThrow('test');
});

it('should not throw when no error', () => {
  expect(() => handleError(null)).not.toThrow();
});
```

### 2. Logical Operator Mutations

```typescript
// Original
return isValid && hasContent;

// Mutants
return isValid || hasContent;  // Changed &&
return !isValid && hasContent;  // Negated first operand
return isValid && !hasContent;  // Negated second operand

// Kill them by testing all combinations
describe('validation logic', () => {
  it('should return true when both are true', () => {
    expect(validate(true, true)).toBe(true);
  });

  it('should return false when first is false', () => {
    expect(validate(false, true)).toBe(false);
  });

  it('should return false when second is false', () => {
    expect(validate(true, false)).toBe(false);
  });

  it('should return false when both are false', () => {
    expect(validate(false, false)).toBe(false);
  });
});
```

### 3. Arithmetic Mutations

```typescript
// Original
return index + 1;

// Mutants
return index - 1;  // Changed +
return index * 1;  // Changed +
return index / 1;  // Changed +
return index + 0;  // Changed 1

// Kill with boundary tests
it('should increment index correctly', () => {
  expect(nextIndex(0)).toBe(1);
  expect(nextIndex(5)).toBe(6);
  expect(nextIndex(-1)).toBe(0); // Edge case
});
```

### 4. String Mutations

```typescript
// Original
return text.trim();

// Mutants
return text;              // Removed trim()
return text.trim() + ' ';  // Added space
return ' ' + text.trim();  // Added space
return text.toUpperCase(); // Changed method

// Kill with different inputs
it('should trim whitespace correctly', () => {
  expect(trimText('  hello  ')).toBe('hello');
  expect(trimText('\t\nhello\n\t')).toBe('hello');
  expect(trimText('')).toBe('');
  expect(trimText('   ')).toBe('');
});
```

## Improving Low Mutation Scores

### 1. Add Missing Test Cases

```typescript
// If mutant survives, add test case
it('should handle null input', () => {
  expect(() => processInput(null)).toThrow();
});
```

### 2. Test Error Paths

```typescript
// Test what happens when things go wrong
it('should handle network errors', async () => {
  jest.spyOn(fetch, 'mockRejectedValueOnce(new Error('Network error')));

  await expect(downloadFile('url')).rejects.toThrow('Network error');
});
```

### 3. Use Meaningful Assertions

```typescript
// Instead of generic assertions
expect(result).toBeDefined();

// Use specific assertions
expect(result).toEqual({
  success: true,
  data: expect.objectContaining({
    chapters: expect.arrayContaining([
      expect.objectContaining({ title: 'Chapter 1' })
    ])
  })
});
```

## Running Stryker with Options

```bash
# Run with specific timeout
bun run test:mutation --timeoutMs 300000

# Run only specific files
bun run test:mutation --mutate "src/core/document-processing/**/*.ts"

# Run with specific reporters
bun run test:mutation --reporters html,progress

# Run with higher concurrency (if your machine can handle it)
bun run test:mutation --concurrency 4
```

## Interpreting Reports

### HTML Report
- Open `reports/mutation/html/index.html` in browser
- Green = killed mutant (good)
- Red = survived mutant (needs better test)
- Yellow = timeout mutant (possible performance issue)

### Text Report
- Look for "Survived mutants" section
- Focus on high-impact code areas first
- Prioritize mutants in critical business logic

## Best Practices

1. **Write tests first** (TDD) - ensures testable code
2. **Test behavior, not implementation** - more robust to refactoring
3. **Use boundary values** - catches edge cases
4. **Test error conditions** - important for robustness
5. **Review survived mutants** - indicates test gaps
6. **Aim for 90%+ score** - indicates comprehensive testing

## Example Mutation-Resistant Test Suite

```typescript
describe('EPUBParser mutation-resistant tests', () => {
  let parser: EPUBParser;

  beforeEach(() => {
    parser = new EPUBParser();
  });

  describe('parse method', () => {
    it('should handle valid EPUB input', async () => {
      const validEPUB = createTestEPUB();
      const result = await parser.parse(validEPUB);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.chapters.length).toBeGreaterThan(0);
      expect(result.data?.metadata.title).toBeTruthy();
    });

    it('should reject null input', async () => {
      const result = await parser.parse(null);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_INPUT');
    });

    it('should reject undefined input', async () => {
      const result = await parser.parse(undefined);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_INPUT');
    });

    it('should reject empty string', async () => {
      const result = await parser.parse('');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_INPUT');
    });

    it('should reject invalid file types', async () => {
      const result = await parser.parse('not-an-epub.txt');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_INPUT_TYPE');
    });

    it('should handle corrupted EPUB structure', async () => {
      const corruptedBuffer = Buffer.from('corrupted-data');
      const result = await parser.parse(corruptedBuffer);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('EPUB_FORMAT_ERROR');
    });
  });
});
```

---

*Last updated: 2025-10-30*
*Project: bun-tts*