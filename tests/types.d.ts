/**
 * Global type definitions for Bun test framework
 * Provides proper TypeScript support for describe, test, expect, and other test functions
 */

// Global augmentation for Bun test framework
declare global {
  // Test functions from Bun test framework
  const describe: (name: string, fn: () => void) => void;
  const test: (name: string, fn: () => void | Promise<void>) => void;
  const it: (name: string, fn: () => void | Promise<void>) => void;
  const expect: {
    <T>(actual: T): {
      toBe: (expected: T) => void;
      toEqual: (expected: T) => void;
      toHaveLength: (expected: number) => void;
      toContain: (expected: T) => void;
      toBeDefined: () => void;
      toBeUndefined: () => void;
      toBeNull: () => void;
      toBeNullish: () => void;
      toBeTruthy: () => void;
      toBeFalsy: () => void;
      toBeGreaterThan: (expected: T) => void;
      toBeGreaterThanOrEqual: (expected: T) => void;
      toBeLessThan: (expected: T) => void;
      toBeLessThanOrEqual: (expected: T) => void;
      toMatch: (expected: RegExp | string) => void;
      toThrow: (expected?: RegExp | string | Error) => void;
      toThrowError: (expected?: RegExp | string | Error) => void;
      not: {
        toBe: (expected: T) => void;
        toEqual: (expected: T) => void;
        toHaveLength: (expected: number) => void;
        toContain: (expected: T) => void;
        toBeDefined: () => void;
        toBeUndefined: () => void;
        toBeNull: () => void;
        toBeNullish: () => void;
        toBeTruthy: () => void;
        toBeFalsy: () => void;
        toBeGreaterThan: (expected: T) => void;
        toBeGreaterThanOrEqual: (expected: T) => void;
        toBeLessThan: (expected: T) => void;
        toBeLessThanOrEqual: (expected: T) => void;
        toMatch: (expected: RegExp | string) => void;
        toThrow: (expected?: RegExp | string | Error) => void;
        toThrowError: (expected?: RegExp | string | Error) => void;
      };
      resolves: {
        toBe: (expected: T) => Promise<void>;
        toEqual: (expected: T) => Promise<void>;
        toHaveLength: (expected: number) => Promise<void>;
        toContain: (expected: T) => Promise<void>;
        toBeDefined: () => Promise<void>;
        toBeUndefined: () => Promise<void>;
        toBeNull: () => Promise<void>;
        toBeNullish: () => Promise<void>;
        toBeTruthy: () => Promise<void>;
        toBeFalsy: () => Promise<void>;
        toMatch: (expected: RegExp | string) => Promise<void>;
        toThrow: (expected?: RegExp | string | Error) => Promise<void>;
        toThrowError: (expected?: RegExp | string | Error) => Promise<void>;
      };
      rejects: {
        toBe: (expected: T) => Promise<void>;
        toEqual: (expected: T) => Promise<void>;
        toHaveLength: (expected: number) => Promise<void>;
        toContain: (expected: T) => Promise<void>;
        toMatch: (expected: RegExp | string) => Promise<void>;
        toThrow: (expected?: RegExp | string | Error) => Promise<void>;
        toThrowError: (expected?: RegExp | string | Error) => Promise<void>;
      };
    };
    <T>(actual: Promise<T>): {
      resolves: {
        toBe: (expected: T) => Promise<void>;
        toEqual: (expected: T) => Promise<void>;
        toHaveLength: (expected: number) => Promise<void>;
        toContain: (expected: T) => Promise<void>;
        toBeDefined: () => Promise<void>;
        toBeUndefined: () => Promise<void>;
        toBeNull: () => Promise<void>;
        toBeNullish: () => Promise<void>;
        toBeTruthy: () => Promise<void>;
        toBeFalsy: () => Promise<void>;
        toMatch: (expected: RegExp | string) => Promise<void>;
        toThrow: (expected?: RegExp | string | Error) => Promise<void>;
        toThrowError: (expected?: RegExp | string | Error) => Promise<void>;
      };
      rejects: {
        toBe: (expected: T) => Promise<void>;
        toEqual: (expected: T) => Promise<void>;
        toHaveLength: (expected: number) => Promise<void>;
        toContain: (expected: T) => Promise<void>;
        toMatch: (expected: RegExp | string) => Promise<void>;
        toThrow: (expected?: RegExp | string | Error) => Promise<void>;
        toThrowError: (expected?: RegExp | string | Error) => Promise<void>;
      };
    };
  };

  // Additional test functions
  const beforeEach: (fn: () => void | Promise<void>) => void;
  const afterEach: (fn: () => void | Promise<void>) => void;
  const beforeAll: (fn: () => void | Promise<void>) => void;
  const afterAll: (fn: () => void | Promise<void>) => void;
}

export {};
