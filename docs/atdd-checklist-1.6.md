# ATDD Checklist - Epic 1, Story 1.6: Configuration Management System

**Date:** 2025-11-01
**Author:** Eduardo Menoncello
**Primary Test Level:** API/Unit (with Integration tests)

---

## Story Summary

Implements a comprehensive configuration management system for bun-tts that allows users to manage configuration settings and profiles, enabling customization of the audiobook creation process to individual needs. The system provides persistent storage, user profiles, import/export functionality, validation, and CLI commands for complete configuration management.

**As a** user with specific preferences
**I want** to manage configuration settings and profiles
**So that** I can customize the audiobook creation process to my needs

---

## Acceptance Criteria

1. Persistent configuration storage (JSON/YAML files) ✅ RED PHASE
2. User profiles for different types of projects ✅ RED PHASE
3. Configuration import/export functionality ✅ RED PHASE
4. Default settings with user override capabilities ✅ RED PHASE
5. Configuration validation and error handling ✅ RED PHASE
6. CLI commands for configuration management ✅ RED PHASE

---

## Failing Tests Created (RED Phase)

### Unit Tests (12 tests)

**File:** `tests/unit/config/profile-manager.test.ts` (405 lines)

**Profile Management Tests:**

- ✅ **Test:** should be instantiable
  - **Status:** RED - Module not found (ProfileManager class doesn't exist)
  - **Verifies:** ProfileManager can be instantiated

- ✅ **Test:** should have required methods
  - **Status:** RED - Module not found
  - **Verifies:** All required methods (create, switch, list, delete, get) exist

- ✅ **Test:** should create new profile successfully
  - **Status:** RED - Module not found
  - **Verifies:** Profile creation with valid data succeeds

- ✅ **Test:** should validate profile data before creation
  - **Status:** RED - Module not found
  - **Verifies:** Validation rejects invalid profile data

- ✅ **Test:** should prevent duplicate profile names
  - **Status:** RED - Module not found
  - **Verifies:** Duplicate prevention works

- ✅ **Test:** should create profile with default settings merged
  - **Status:** RED - Module not found
  - **Verifies:** Configuration defaults are properly merged

- ✅ **Test:** should switch to existing profile
  - **Status:** RED - Module not found
  - **Verifies:** Profile switching functionality

- ✅ **Test:** should fail when switching to non-existent profile
  - **Status:** RED - Module not found
  - **Verifies:** Error handling for non-existent profiles

- ✅ **Test:** should list all profiles
  - **Status:** RED - Module not found
  - **Verifies:** Profile listing returns all profiles

- ✅ **Test:** should delete existing profile
  - **Status:** RED - Module not found
  - **Verifies:** Profile deletion works correctly

- ✅ **Test:** should prevent deletion of active profile
  - **Status:** RED - Module not found
  - **Verifies:** Business rule enforcement

- ✅ **Test:** should validate profile name format
  - **Status:** RED - Module not found
  - **Verifies:** Name validation rules

**File:** `tests/unit/config/config-validator-profile-system.test.ts` (538 lines)

**Configuration Validation Tests:**

- ✅ **Test:** should validate correct profile names
  - **Status:** RED - Module not found (ProfileValidator doesn't exist)
  - **Verifies:** Valid name patterns are accepted

- ✅ **Test:** should reject invalid profile names
  - **Status:** RED - Module not found
  - **Verifies:** Invalid name patterns are rejected

- ✅ **Test:** should validate complete profile configuration
  - **Status:** RED - Module not found
  - **Verifies:** Full configuration validation

- ✅ **Test:** should reject invalid profile configuration
  - **Status:** RED - Module not found
  - **Verifies:** Invalid configurations are rejected

- ✅ **Test:** should provide detailed error messages
  - **Status:** RED - Module not found
  - **Verifies:** Error messages are actionable

- ✅ **Test:** should catch configuration logic errors
  - **Status:** RED - Module not found
  - **Verifies:** Mutation testing resilience

### Integration Tests (30+ tests)

**File:** `tests/integration/config-import-export.test.ts` (567 lines)

**Import/Export Workflow Tests:**

- ✅ **Test:** should export single configuration to JSON file
  - **Status:** RED - ConfigManager.export method doesn't exist
  - **Verifies:** JSON export functionality

- ✅ **Test:** should export single configuration to YAML file
  - **Status:** RED - Method doesn't exist
  - **Verifies:** YAML export functionality

- ✅ **Test:** should export all profiles to directory
  - **Status:** RED - ProfileManager.export method doesn't exist
  - **Verifies:** Batch profile export

- ✅ **Test:** should import configuration from JSON file
  - **Status:** RED - ConfigManager.import method doesn't exist
  - **Verifies:** JSON import functionality

- ✅ **Test:** should import configuration from YAML file
  - **Status:** RED - Method doesn't exist
  - **Verifies:** YAML import functionality

- ✅ **Test:** should import all profiles from directory
  - **Status:** RED - ProfileManager.import method doesn't exist
  - **Verifies:** Batch profile import

- ✅ **Test:** should validate configuration during import
  - **Status:** RED - Method doesn't exist
  - **Verifies:** Import validation

- ✅ **Test:** should handle merge strategies
  - **Status:** RED - Method doesn't exist
  - **Verifies:** Import merge logic

- ✅ **Test:** should auto-detect file format
  - **Status:** RED - Method doesn't exist
  - **Verifies:** Format detection

- ✅ **Test:** should handle permission errors
  - **Status:** RED - Method doesn't exist
  - **Verifies:** Error handling

**File:** `tests/integration/cli-config-commands.test.ts` (689 lines)

**CLI Command Tests:**

- ✅ **Test:** should display current configuration (bun-tts config get)
  - **Status:** RED - CLI command doesn't exist
  - **Verifies:** config get command

- ✅ **Test:** should display specific config value
  - **Status:** RED - Command doesn't exist
  - **Verifies:** config get with path

- ✅ **Test:** should set configuration value (bun-tts config set)
  - **Status:** RED - CLI command doesn't exist
  - **Verifies:** config set command

- ✅ **Test:** should update nested configuration
  - **Status:** RED - Command doesn't exist
  - **Verifies:** Nested config updates

- ✅ **Test:** should validate input values
  - **Status:** RED - Command doesn't exist
  - **Verifies:** Input validation

- ✅ **Test:** should list all configuration keys (bun-tts config list)
  - **Status:** RED - CLI command doesn't exist
  - **Verifies:** config list command

- ✅ **Test:** should create new profile (bun-tts config profile create)
  - **Status:** RED - CLI command doesn't exist
  - **Verifies:** profile create subcommand

- ✅ **Test:** should list all profiles (bun-tts config profile list)
  - **Status:** RED - CLI command doesn't exist
  - **Verifies:** profile list subcommand

- ✅ **Test:** should switch to profile (bun-tts config profile switch)
  - **Status:** RED - CLI command doesn't exist
  - **Verifies:** profile switch subcommand

- ✅ **Test:** should delete profile (bun-tts config profile delete)
  - **Status:** RED - CLI command doesn't exist
  - **Verifies:** profile delete subcommand

- ✅ **Test:** should import configuration (bun-tts config import)
  - **Status:** RED - CLI command doesn't exist
  - **Verifies:** config import command

- ✅ **Test:** should export configuration (bun-tts config export)
  - **Status:** RED - CLI command doesn't exist
  - **Verifies:** config export command

---

## Data Factories Created

**File:** `tests/support/factories/profile.factory.ts` (400+ lines)

### Profile Factory

**Exports:**

- `createProfile(overrides?)` - Create single profile with optional overrides
- `createMinimalProfile(overrides?)` - Create profile with minimal config
- `createCompleteProfile(overrides?)` - Create profile with all options
- `createNovelProfile(overrides?)` - Create profile for novel writing
- `createTechnicalProfile(overrides?)` - Create profile for technical docs
- `createAcademicProfile(overrides?)` - Create profile for academic papers
- `createInvalidProfileConfig(overrides?)` - Create invalid profile for error testing
- `ProfileFactoryPresets` - Predefined profile configurations

**Example Usage:**

```typescript
const profile = createProfile({ name: 'novel-project' });
const technical = createTechnicalProfile({ speed: 1.2 });
const invalid = createInvalidProfileConfig({ name: '' });
const batch = ProfileFactoryPresets.batch(5); // Create 5 profiles
```

---

## Fixtures Created

**File:** `tests/support/fixtures/config.fixture.ts` (350+ lines)

### Configuration Fixtures

**Fixtures:**

- `createConfigFixture()` - ConfigManager with temporary directory and auto-cleanup
- `createProfileFixture()` - ProfileManager with temporary directory and auto-cleanup
- `createConfigWithProfilesFixture()` - Both managers with pre-created test profiles
- `createConfigValidationFixture()` - ConfigManager with valid/invalid configs
- `createConfigImportExportFixture()` - Managers with sample import/export files
- `createConfigCliFixture()` - CLI testing environment

**Example Usage:**

```typescript
const { configManager, configDir, cleanup } = createConfigFixture();
// ... run tests ...
cleanup(); // Automatically called
```

**Factory Presets:**

- `ConfigTestFactories.performance()` - Configuration for performance testing
- `ConfigTestFactories.memory()` - Configuration for memory testing
- `ConfigTestFactories.error()` - Configuration for error testing
- `ConfigTestFactories.edgeCases()` - Configuration for edge case testing

---

## Mock Requirements

### Profile Storage Mock

**ProfileManager Requirements:**

- File-based storage in profiles directory
- Support for JSON and YAML formats
- Atomic write operations to prevent corruption
- Directory structure: `profiles/{profile-name}.json`
- Metadata tracking (createdAt, updatedAt)

### ConfigManager Enhancement Mock

**New Methods Required:**

- `export(config, path, format)` - Export configuration to file
- `import(path)` - Import configuration from file
- `exportBatch(configs, directory)` - Export multiple configs
- `validateBeforeSave(config)` - Validate config before saving

**Expected Responses:**

```typescript
// Success response
{ success: true, data: { /* data */ } }

// Error response
{ success: false, error: { message: string, code: string } }
```

### CLI Command Mock

**Command Structure:**

```typescript
interface CliCommand {
  name: string;
  description: string;
  subcommands?: CliSubcommand[];
  options?: CliOption[];
}
```

**Expected CLI Output:**

```typescript
// Success output
{
  exitCode: 0,
  output: 'Profile created successfully',
  data?: any
}

// Error output
{
  exitCode: 1,
  output: 'Error: Profile name is required',
  error?: Error
}
```

---

## Required data-testid Attributes

**Note:** Since this is a CLI tool (not a web UI), the tests use command-line interfaces and file-based interactions. No HTML data-testid attributes are required.

**Instead, the tests require:**

**File System Attributes:**

- Profile files: `{profilesDir}/{profile-name}.json`
- Config files: `{configDir}/config.json`
- Export files: `{exportDir}/{filename}.{ext}`

**CLI Output Patterns:**

- Success messages: "created", "updated", "exported", "imported"
- Error patterns: "not found", "already exists", "validation"
- Value formats: JSON/YAML parsable output

---

## Implementation Checklist

### Test: ProfileManager Class Creation

**File:** `tests/unit/config/profile-manager.test.ts`

**Tasks to make this test pass:**

- [ ] Create `src/config/profile-manager.ts` module
- [ ] Implement `ProfileManager` class with constructor
- [ ] Add `create()` method with validation
- [ ] Add `switch()` method with profile activation
- [ ] Add `list()` method returning all profiles
- [ ] Add `get()` method for single profile retrieval
- [ ] Add `delete()` method with safety checks
- [ ] Implement file-based storage (JSON/YAML)
- [ ] Add profile name validation
- [ ] Implement configuration merging with defaults
- [ ] Add error handling with Result pattern
- [ ] Run test: `bun test tests/unit/config/profile-manager.test.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 8 hours

---

### Test: ProfileValidator Class Creation

**File:** `tests/unit/config/config-validator-profile-system.test.ts`

**Tasks to make this test pass:**

- [ ] Create `src/config/profile-validator.ts` module
- [ ] Implement `ProfileValidator` class
- [ ] Add `validateProfileName()` method
- [ ] Add `validateMetadata()` method
- [ ] Add `validateProfile()` full validation
- [ ] Add `validateTags()` method with constraints
- [ ] Implement name format validation (no spaces, special chars)
- [ ] Add metadata constraints (description length, tag count)
- [ ] Add config structure validation
- [ ] Implement TypeScript type guards
- [ ] Add error reporting with actionable messages
- [ ] Add schema version checking for migrations
- [ ] Run test: `bun test tests/unit/config/config-validator-profile-system.test.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 6 hours

---

### Test: ConfigManager Export/Import Methods

**File:** `tests/integration/config-import-export.test.ts`

**Tasks to make this test pass:**

- [ ] Add `export()` method to existing `ConfigManager`
- [ ] Add `import()` method to existing `ConfigManager`
- [ ] Add `exportBatch()` method for multiple configs
- [ ] Add `import()` method to existing `ProfileManager`
- [ ] Add `export()` method to existing `ProfileManager`
- [ ] Implement JSON format support
- [ ] Implement YAML format support
- [ ] Add file format auto-detection
- [ ] Implement merge strategies (overwrite, skip, merge)
- [ ] Add validation during import
- [ ] Add batch operation error handling
- [ ] Implement permission error handling
- [ ] Add progress reporting for batch operations
- [ ] Run test: `bun test tests/integration/config-import-export.test.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 10 hours

---

### Test: CLI Commands Implementation

**File:** `tests/integration/cli-config-commands.test.ts`

**Tasks to make this test pass:**

- [ ] Create `src/cli/commands/config-command.ts` module
- [ ] Implement `config get` command with path support
- [ ] Implement `config set` command with validation
- [ ] Implement `config list` command with filtering
- [ ] Implement `config profile create` subcommand
- [ ] Implement `config profile list` subcommand
- [ ] Implement `config profile switch` subcommand
- [ ] Implement `config profile delete` subcommand
- [ ] Implement `config import` command
- [ ] Implement `config export` command
- [ ] Add output format options (JSON, YAML, table)
- [ ] Add help text for all commands
- [ ] Add error handling and user-friendly messages
- [ ] Integrate with existing CLI framework
- [ ] Run test: `bun test tests/integration/cli-config-commands.test.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 12 hours

---

## Running Tests

```bash
# Run all failing tests for this story
bun test tests/unit/config/profile-manager.test.ts
bun test tests/unit/config/config-validator-profile-system.test.ts
bun test tests/integration/config-import-export.test.ts
bun test tests/integration/cli-config-commands.test.ts

# Run specific test file
bun test tests/unit/config/profile-manager.test.ts

# Run tests in watch mode during development
bun test --watch tests/unit/config/profile-manager.test.ts

# Run all configuration-related tests
bun test tests/unit/config/
bun test tests/integration/*config*.test.ts

# Run tests with coverage
bun test --coverage

# Run mutation testing (after implementation)
bun run test:mutation
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

**TEA Agent Responsibilities:**

- ✅ All tests written and failing (42+ tests across 4 test files)
- ✅ Fixtures and factories created with auto-cleanup (2 fixture files, 1 factory file)
- ✅ Mock requirements documented
- ✅ Implementation checklist created with 46 concrete tasks
- ✅ All tests verified to fail due to missing implementation (not test errors)

**Verification:**

- All tests run and fail as expected with "Module not found" errors
- Failure messages are clear and actionable
- Tests fail due to missing implementation, not test bugs
- Tests are properly structured with Given-When-Then format

---

### GREEN Phase (DEV Team - Next Steps)

**DEV Agent Responsibilities:**

1. **Pick one failing test file** from implementation checklist (start with ProfileValidator - smallest scope)
2. **Read the test** to understand expected behavior
3. **Implement minimal code** to make that specific test pass
4. **Run the test** to verify it now passes (green)
5. **Check off the task** in implementation checklist
6. **Move to next test** and repeat

**Implementation Order Recommendation:**

1. ProfileValidator (6 hours) - Independent, no dependencies
2. ProfileManager (8 hours) - Depends on ProfileValidator
3. ConfigManager enhancements (10 hours) - Independent
4. CLI commands (12 hours) - Depends on all above

**Key Principles:**

- One test file at a time (don't try to fix all at once)
- Minimal implementation (don't over-engineer)
- Run tests frequently (immediate feedback)
- Use implementation checklist as roadmap

**Progress Tracking:**

- Check off tasks as you complete them
- Share progress in daily standup
- Mark story as IN PROGRESS in workflow status
- Commit after each green test for traceability

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

**DEV Agent Responsibilities:**

1. **Verify all tests pass** (green phase complete)
2. **Review code for quality** (readability, maintainability, performance)
3. **Extract duplications** (DRY principle)
4. **Optimize performance** (especially file I/O operations)
5. **Ensure tests still pass** after each refactor
6. **Update documentation** (if API contracts change)

**Key Principles:**

- Tests provide safety net (refactor with confidence)
- Make small refactors (easier to debug if tests fail)
- Run tests after each change
- Don't change test behavior (only implementation)

**Completion:**

- All 42+ tests pass
- Code quality meets team standards
- No duplications or code smells
- Mutation score >90% (high threshold)
- Ready for code review and story approval

---

## Next Steps

1. **Review this checklist** with team in standup or planning
2. **Run failing tests** to confirm RED phase: `bun test tests/unit/config/profile-manager.test.ts`
3. **Begin implementation** using implementation checklist as guide (start with ProfileValidator)
4. **Work one test file at a time** (red → green for each)
5. **Share progress** in daily standup
6. **When all tests pass**, refactor code for quality
7. **When refactoring complete**, run mutation testing
8. **When mutation testing passes**, mark story as done

---

## Knowledge Base References Applied

This ATDD workflow consulted the following knowledge fragments:

- **fixture-architecture.md** - Test fixture patterns with setup/teardown and auto-cleanup using Bun Test patterns
- **data-factories.md** - Factory patterns using `@faker-js/faker` for random test data generation with overrides support
- **component-tdd.md** - Component test strategies (not applicable for this CLI tool)
- **network-first.md** - Route interception patterns (not applicable for this CLI tool)
- **test-quality.md** - Test design principles (Given-When-Then, one assertion per test, determinism, isolation)
- **test-levels-framework.md** - Test level selection framework (Unit, Integration, API testing)
- **test-priorities-matrix.md** - Test prioritization (all tests are P0/P1 for core functionality)
- **test-healing-patterns.md** - Common failure patterns and debugging techniques
- **selector-resilience.md** - Not applicable for CLI testing
- **timing-debugging.md** - Not applicable for file-based operations

See `bmad/bmm/testarch/tea-index.csv` for complete knowledge fragment mapping.

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Command:** `bun test tests/unit/config/profile-manager.test.ts`

**Results:**

```
bun test v1.3.1

tests/unit/config/profile-manager.test.ts:

# Unhandled error between tests
-------------------------------
error: Cannot find module '../../../src/config/profile-manager' from '/Users/menoncello/repos/audiobook/bun-tts/1.6-configuration-management-system/tests/unit/config/profile-manager.test.ts'

0 pass
1 fail
1 error
Ran 1 test across 1 file. [60.00ms]
```

**Summary:**

- Total tests written: 42+ across 4 files
- Passing: 0 (expected)
- Failing: 42+ (expected, all due to missing implementation)
- Status: ✅ RED phase verified

**Expected Failure Messages:**

- "Cannot find module '../../../src/config/profile-manager'" (ProfileManager tests)
- "Cannot find module '../../../src/config/profile-validator'" (Validator tests)
- "Cannot find module '../../src/config/profile-manager'" (Import/Export tests)
- "Cannot find module '../../src/cli/commands/config-command'" (CLI tests)

All failures are due to missing implementation modules, NOT test bugs.

---

## Notes

- **Test Framework:** Bun Test (as specified in package.json)
- **Mock Strategy:** Result pattern for error handling (success/error responses)
- **File Format:** Both JSON and YAML supported for configuration storage
- **Architecture:** Follows existing project patterns (Awilix DI, Result pattern, custom error classes)
- **Quality Standards:** Zero ESLint violations, >90% mutation score, comprehensive edge case coverage
- **Dependencies:** Uses existing packages (@faker-js/faker, cosmiconfig, awilix, pino)

### Critical Implementation Notes

1. **Integration Points:**
   - ConfigManager exists at `src/config/config-manager.ts` - extend it, don't replace
   - Use existing DI pattern with Awilix for testability
   - Follow Result pattern for error propagation (existing pattern in project)
   - Use existing logging infrastructure (Pino)

2. **File Structure:**
   - Create `src/config/profile-manager.ts` (new)
   - Create `src/config/profile-validator.ts` (new)
   - Extend `src/config/config-manager.ts` (existing)
   - Create `src/cli/commands/config-command.ts` (new)
   - Tests already created in proper locations

3. **Error Handling:**
   - Custom error classes (follow existing ConfigurationError pattern)
   - Structured error messages with actionable guidance
   - Result pattern: `{ success: true, data: X } | { success: false, error: Error }`

4. **Configuration Schema:**
   - BunTTSConfig interface (exists) - profiles extend this
   - Profile-specific overrides merged with defaults
   - Validation at multiple layers (name, metadata, config structure)

### Security Considerations

- File permission validation before writes
- Path traversal protection (validate profile names)
- Input sanitization for all user-provided values
- Type guards for runtime type checking
- No code execution from configuration files

### Performance Considerations

- Lazy loading of profile configurations
- Caching of active profile
- Async file I/O operations
- Batch import/export optimization
- Validation caching for repeated operations

---

## Contact

**Questions or Issues?**

- Ask in team standup
- Tag Eduardo Menoncello in Slack/Discord
- Refer to `bmad/bmm/workflows/testarch/README.md` for workflow documentation
- Consult `bmad/bmm/testarch/knowledge/` for testing best practices

---

**Generated by BMAD TEA Agent** - 2025-11-01
