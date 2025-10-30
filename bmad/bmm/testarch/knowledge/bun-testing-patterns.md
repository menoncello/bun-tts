# Bun Testing Patterns

## Basic Test Structure

```typescript
import { describe, it, expect } from 'bun:test';

describe('EPUBParser', () => {
  it('should parse valid EPUB file', async () => {
    // Given
    const epubBuffer = createTestEPUB();
    const parser = new EPUBParser();

    // When
    const result = await parser.parse(epubBuffer);

    // Then
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.chapters.length).toBeGreaterThan(0);
  });
});
```

## Async Testing

```typescript
it('should handle async operations', async () => {
  const result = await someAsyncFunction();
  expect(result).toBeDefined();
});

it('should handle async errors', async () => {
  // Given
  const mockError = new Error('Async operation failed');
  jest.spyOn(asyncModule, 'operation').mockRejectedValue(mockError);

  // When/Then
  await expect(someAsyncFunction()).rejects.toThrow('Async operation failed');
});
```

## Mock Patterns

```typescript
it('should handle file system errors', async () => {
  // Mock file system error
  const mockError = new Error('File not found');
  jest.spyOn(fs, 'readFile').mockRejectedValue(mockError);

  const parser = new EPUBParser();
  const result = await parser.parse('invalid-file.epub');

  expect(result.success).toBe(false);
  expect(result.error?.code).toBe('FILE_NOT_FOUND');
});

it('should mock EPUB library methods', async () => {
  // Mock @smoores/epub library
  const mockEPUB = {
    getMetadata: jest.fn().mockResolvedValue({ title: 'Test Book' }),
    getSpineItems: jest.fn().mockResolvedValue([{ id: 'chapter1' }]),
    readXhtmlItemContents: jest.fn().mockResolvedValue('<p>Chapter content</p>'),
    close: jest.fn().mockResolvedValue()
  };

  jest.mock('@smoores/epub', () => ({
    default: jest.fn().mockResolvedValue(mockEPUB)
  }));
});
```

## Error Handling Tests

```typescript
describe('Error handling', () => {
  it('should handle invalid input types', () => {
    const parser = new EPUBParser();

    // Test with invalid inputs
    expect(parser.parse(null)).rejects.toMatchObject({
      success: false,
      error: expect.objectContaining({
        code: 'INVALID_INPUT_TYPE'
      })
    });

    expect(parser.parse(undefined)).rejects.toMatchObject({
      success: false,
      error: expect.objectContaining({
        code: 'INVALID_INPUT'
      })
    });
  });

  it('should handle corrupted EPUB files', async () => {
    const corruptedBuffer = Buffer.from('not-an-epub');
    const parser = new EPUBParser();

    const result = await parser.parse(corruptedBuffer);

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('EPUB_FORMAT_ERROR');
  });
});
```

## Performance Testing

```typescript
it('should handle large EPUB files efficiently', async () => {
  const largeEPUB = createLargeTestEPUB(1000); // 1000 chapters
  const parser = new EPUBParser();

  const startTime = Date.now();
  const result = await parser.parse(largeEPUB);
  const endTime = Date.now();

  expect(result.success).toBe(true);
  expect(endTime - startTime).toBeLessThan(5000); // Should complete in < 5 seconds
});
```

## Integration Testing

```typescript
describe('Integration tests', () => {
  it('should work with real EPUB files', async () => {
    const realEPUB = fs.readFileSync('./test-assets/sample.epub');
    const parser = new EPUBParser();

    const result = await parser.parse(realEPUB);

    expect(result.success).toBe(true);
    expect(result.data?.metadata.title).toBeTruthy();
    expect(result.data?.chapters.length).toBeGreaterThan(0);
  });
});
```

## Mutation Testing Guidelines

- Write tests that actually test behavior (not just implementation)
- Use boundary values and edge cases
- Test error paths and null checks
- Avoid trivial assertions that don't kill mutants

### Good Mutation-Resistant Test

```typescript
it('should validate chapter boundaries correctly', () => {
  // Test boundary conditions
  expect(validateChapterBoundary(-1)).toBe(false);
  expect(validateChapterBoundary(0)).toBe(true);
  expect(validateChapterBoundary(999999)).toBe(false);

  // Test error conditions
  expect(() => validateChapterBoundary(null)).toThrow();
  expect(() => validateChapterBoundary(undefined)).toThrow();

  // Test actual behavior
  const validChapters = [1, 2, 3];
  expect(validateChapterBoundary(2, validChapters)).toBe(true);
});
```

### Bad Mutation-Vulnerable Test

```typescript
// AVOID: This only tests implementation details
it('should call parser.parse', () => {
  const mockParse = jest.fn();
  parser.parse = mockParse;

  parser.someMethod();

  expect(mockParse).toHaveBeenCalled(); // Easy to mutate, no behavior test
});
```

## Bun Test Specific Features

```typescript
// Using test.each for data-driven tests
describe.each([
  ['valid.epub', true],
  ['invalid.txt', false],
  ['corrupted.epub', false]
])('EPUB validation for %s', (filename, expected) => {
  it(`should return ${expected}`, async () => {
    const buffer = fs.readFileSync(`./test-assets/${filename}`);
    const parser = new EPUBParser();

    const result = await parser.parse(buffer);

    expect(result.success).toBe(expected);
  });
});

// Using describe.only for focused testing
describe.only('Critical path', () => {
  // Only these tests will run
});

// Using test.skip for pending tests
test.skip('expensive test - implement later', () => {
  // Test will be skipped
});
```

## File System Testing

```typescript
import { tmpdir } from 'os';
import { join } from 'path';
import { mkdtempSync, rmSync, writeFileSync } from 'fs';

describe('File operations', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'bun-tts-test-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('should handle file operations', async () => {
    const testFile = join(tempDir, 'test.epub');
    writeFileSync(testFile, createTestEPUBBuffer());

    const parser = new EPUBParser();
    const result = await parser.parse(testFile);

    expect(result.success).toBe(true);
  });
});
```

## CLI Testing

```typescript
import { spawn } from 'child_process';

describe('CLI integration', () => {
  it('should handle CLI commands', async () => {
    const process = spawn(['bun', 'run', 'cli', 'convert', 'test.epub']);

    const output = await new Promise<string>((resolve) => {
      let output = '';
      process.stdout.on('data', (data) => output += data.toString());
      process.on('close', () => resolve(output));
    });

    expect(output).toContain('Conversion completed');
    expect(process.exitCode).toBe(0);
  });
});
```

---

*Last updated: 2025-10-30*
*Project: bun-tts*