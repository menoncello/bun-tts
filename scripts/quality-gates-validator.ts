#!/usr/bin/env bun
/**
 * Quality Gates Validator - MANDATORY ENFORCEMENT
 * ================================================
 *
 * CRITICAL: This script validates ALL quality gates
 * ANY failure = AUTOMATIC BLOCK of story completion
 * NO exceptions, NO workarounds, NO manual overrides
 *
 * Usage: bun run scripts/quality-gates-validator.ts
 * Exit codes:
 *   0 = ALL quality gates passed
 *   1 = Quality gate failure - BLOCK completion
 */

// Using Bun's built-in safe execution utilities
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

interface QualityGateResult {
  name: string;
  passed: boolean;
  exitCode: number;
  output: string;
  error: string;
  blocking: boolean;
}

interface ValidationResult {
  success: boolean;
  totalGates: number;
  passedGates: number;
  failedGates: number;
  results: QualityGateResult[];
  summary: string;
}

// Quality gates configuration - MANDATORY REQUIREMENTS
const QUALITY_GATES = [
  {
    name: 'typescript_compilation',
    description: 'TypeScript strict mode compilation - ZERO errors permitted',
    command: 'bun',
    args: ['run', 'build'],
    expectedExitCode: 0,
    blocking: true,
    errorMessage: '🚨 BLOCKED: TypeScript compilation failed - Fix ALL TypeScript errors before proceeding'
  },
  {
    name: 'eslint_compliance',
    description: 'ESLint strict compliance - ZERO errors permitted',
    command: 'bun',
    args: ['run', 'lint'],
    expectedExitCode: 0,
    blocking: true,
    errorMessage: '🚨 BLOCKED: ESLint errors detected - Fix ALL ESLint issues. NO eslint-disable allowed!'
  },
  {
    name: 'test_execution',
    description: 'All tests must pass - ZERO test failures permitted',
    command: 'bun',
    args: ['test'],
    expectedExitCode: 0,
    blocking: true,
    errorMessage: '🚨 BLOCKED: Test failures detected - ALL tests must pass before proceeding'
  },
  {
    name: 'dependency_security',
    description: 'Security vulnerability scan',
    command: 'bun',
    args: ['audit'],
    expectedExitCode: 0,
    blocking: true,
    errorMessage: '🚨 BLOCKED: Security vulnerabilities detected - Update dependencies before proceeding'
  }
];

// Forbidden patterns - INSTANT REJECTION
const FORBIDDEN_PATTERNS = [
  {
    pattern: /eslint-disable/g,
    description: 'ESLint disables are forbidden - Fix the root cause instead',
    blocking: true,
    errorMessage: '🚨 BLOCKED: eslint-disable found in code - Remove all eslint-disable comments'
  },
  {
    pattern: /@ts-ignore/g,
    description: 'TypeScript ignores are forbidden - Fix the type issue instead',
    blocking: true,
    errorMessage: '🚨 BLOCKED: @ts-ignore found in code - Remove all @ts-ignore comments'
  }
];

async function executeQualityGate(gate: typeof QUALITY_GATES[0]): Promise<QualityGateResult> {
  console.log(`\n🔍 Running quality gate: ${gate.name}`);
  console.log(`📝 ${gate.description}`);

  try {
    // Use Bun's built-in safe execution
    const process = Bun.spawn([gate.command, ...gate.args], {
      stdout: 'pipe',
      stderr: 'pipe',
      stdin: 'inherit'
    });

    const stdout = await new Response(process.stdout).text();
    const stderr = await new Response(process.stderr).text();
    const exitCode = await process.exited;

    return {
      name: gate.name,
      passed: exitCode === 0,
      exitCode: exitCode,
      output: stdout,
      error: stderr,
      blocking: gate.blocking
    };
  } catch (error: any) {
    return {
      name: gate.name,
      passed: false,
      exitCode: 1,
      output: '',
      error: error.message,
      blocking: gate.blocking
    };
  }
}

async function checkForbiddenPatterns(): Promise<QualityGateResult[]> {
  console.log('\n🔍 Checking forbidden patterns in source code...');

  const results: QualityGateResult[] = [];

  for (const forbidden of FORBIDDEN_PATTERNS) {
    console.log(`\n📝 Checking for: ${forbidden.description}`);

    try {
      // Use glob patterns to find TypeScript files
      const files = [
        ...Array.from(new Bun.Glob('**/*.ts').scanSync({ cwd: 'src' })),
        ...Array.from(new Bun.Glob('**/*.tsx').scanSync({ cwd: 'src' })),
        ...Array.from(new Bun.Glob('**/*.ts').scanSync({ cwd: 'tests' })),
        ...Array.from(new Bun.Glob('**/*.tsx').scanSync({ cwd: 'tests' }))
      ].map(file => file.startsWith('src/') ? file : `tests/${file}`);

      let foundPattern = false;
      let foundFiles: string[] = [];

      for (const file of files) {
        if (existsSync(file)) {
          const content = readFileSync(file, 'utf8');
          if (forbidden.pattern.test(content)) {
            foundPattern = true;
            foundFiles.push(file);
          }
        }
      }

      if (foundPattern) {
        results.push({
          name: `forbidden_pattern_${forbidden.pattern.source}`,
          passed: false,
          exitCode: 1,
          output: '',
          error: `Forbidden pattern found in files: ${foundFiles.join(', ')}`,
          blocking: forbidden.blocking
        });
      } else {
        results.push({
          name: `forbidden_pattern_${forbidden.pattern.source}`,
          passed: true,
          exitCode: 0,
          output: 'No forbidden patterns found',
          error: '',
          blocking: forbidden.blocking
        });
      }
    } catch (error: any) {
      results.push({
        name: `forbidden_pattern_${forbidden.pattern.source}`,
        passed: false,
        exitCode: 1,
        output: '',
        error: `Error checking forbidden patterns: ${error.message}`,
        blocking: forbidden.blocking
      });
    }
  }

  return results;
}

async function validateQualityGates(): Promise<ValidationResult> {
  console.log('🚀 QUALITY GATES VALIDATION - MANDATORY ENFORCEMENT');
  console.log('===================================================');
  console.log('⚠️  ANY failure will BLOCK story completion');
  console.log('⚠️  NO exceptions, NO workarounds permitted\n');

  const results: QualityGateResult[] = [];
  let passedCount = 0;
  let failedCount = 0;

  // Execute mandatory quality gates
  for (const gate of QUALITY_GATES) {
    const result = await executeQualityGate(gate);
    results.push(result);

    if (result.passed) {
      console.log(`✅ ${gate.name}: PASSED`);
      passedCount++;
    } else {
      console.log(`❌ ${gate.name}: FAILED`);
      console.log(`🚨 ${gate.errorMessage}`);
      console.log(`📋 Error: ${result.error}`);
      failedCount++;
    }
  }

  // Check forbidden patterns
  const forbiddenResults = await checkForbiddenPatterns();
  results.push(...forbiddenResults);

  for (const result of forbiddenResults) {
    if (result.passed) {
      console.log(`✅ Forbidden patterns check: PASSED`);
      passedCount++;
    } else {
      console.log(`❌ Forbidden patterns check: FAILED`);
      console.log(`🚨 ${result.error}`);
      failedCount++;
    }
  }

  const blockingFailures = results.filter(r => !r.passed && r.blocking).length;
  const success = blockingFailures === 0;

  // Generate summary
  const totalGates = results.length;
  const summary = success
    ? `🎉 ALL ${totalGates} quality gates PASSED - Story completion approved`
    : `🚨 ${failedCount} of ${totalGates} quality gates FAILED - Story completion BLOCKED`;

  return {
    success,
    totalGates,
    passedGates: passedCount,
    failedGates: failedCount,
    results,
    summary
  };
}

async function main(): Promise<void> {
  const result = await validateQualityGates();

  console.log('\n' + '='.repeat(60));
  console.log('QUALITY GATES VALIDATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`📊 Total gates: ${result.totalGates}`);
  console.log(`✅ Passed: ${result.passedGates}`);
  console.log(`❌ Failed: ${result.failedGates}`);
  console.log(`🎯 Success rate: ${((result.passedGates / result.totalGates) * 100).toFixed(1)}%`);
  console.log(`\n${result.summary}`);

  if (!result.success) {
    console.log('\n🚨 QUALITY GATES FAILED - STORY COMPLETION BLOCKED');
    console.log('================================================');
    console.log('Action required:');
    console.log('1. Fix ALL failing quality gates');
    console.log('2. Remove ALL forbidden patterns');
    console.log('3. Re-run validation when issues are resolved');
    console.log('4. NO manual overrides permitted');

    // List specific failures
    const failures = result.results.filter(r => !r.passed);
    if (failures.length > 0) {
      console.log('\n📋 Specific failures to address:');
      failures.forEach(failure => {
        console.log(`  • ${failure.name}: ${failure.error}`);
      });
    }

    process.exit(1); // Block completion
  } else {
    console.log('\n🎉 ALL QUALITY GATES PASSED - PROCEED TO COMPLETION');
    console.log('==================================================');
    process.exit(0); // Allow completion
  }
}

// Execute if run directly
if (import.meta.main) {
  main().catch(error => {
    console.error('💥 Quality gates validator crashed:', error);
    process.exit(1);
  });
}

export { validateQualityGates, QualityGateResult, ValidationResult };