# BMAD Quick Reference - bun-tts

## Story Development Loop

```bash
# 1. Story Creation
/bmad:bmm:agents:sm
*create-story               # Create new story from epic

# 2. Architecture & Planning
/bmad:bmm:agents:architect
*tech-spec                  # Create technical specification

# 3. Implementation (QUALITY GATES ENFORCED)
/bmad:bmm:agents:dev
*develop                     # Implement story (MANDATORY quality gates)
# Quality gates run automatically:
# - TypeScript: 0 errors
# - ESLint: 0 errors
# - Tests: 100% pass rate
# - Mutation: 90%+/80%+/70%+ score
# - NO eslint-disable or @ts-ignore allowed

# 4. Quality Checks
/bmad:bmm:agents:tea
*test-review                 # Review test quality
/bmad:bmm:agents:dev
*review                      # Code review (quality gates verified)

# 5. Story Completion
/bmad:bmm:agents:sm
*story-done                  # Mark story complete
```

## Quality Gates (MANDATORY)

- **TypeScript**: 0 errors (strict mode)
- **ESLint**: 0 errors (never use eslint-disable)
- **Tests**: 100% pass rate (Bun Test)
- **Mutation**: 90% high, 80% low, 70% break (Stryker)
- **Code Quality**: No @ts-ignore, proper formatting

## Agent Commands

### Core Agents

```bash
/bmad:bmm:agents:dev          # Developer agent (quality enforcement)
/bmad:bmm:agents:architect    # Architecture decision records
/bmad:bmm:agents:sm           # Scrum master (story management)
/bmad:bmm:agents:tea          # Test architect (mutation testing)
/bmad:bmm:agents:pm           # Product manager (requirements)
/bmad:bmm:agents:analyst      # Business analyst (analysis)
/bmad:bmm:agents:ux-designer  # UX designer (CLI interfaces)
```

### Workflows

```bash
*develop-story               # Implement story with quality gates
*create-story                # Create new story from epic
*story-ready                  # Mark story ready for development
*story-done                   # Mark story complete
*code-review                  # Perform code review with quality checks
*tech-spec                    # Create technical specification
*architecture                 # Create architecture decisions
*sprint-planning              # Plan sprint and update status
```

## Pro Tips

- Quality gates are automatically enforced - never skip them
- eslint-disable and @ts-ignore are forbidden - fix the underlying issue
- Mutation testing ensures test quality - write tests that kill mutants
- All code examples in stories must be production-ready
- Stories move through states: backlog → drafted → ready-for-dev → in-progress → review → done
- Use *workflow-status to check current project status

## Quality Enforcement

The DEV agent will automatically run these quality gates:
1. **TypeScript type checking** (`bun run typecheck`)
2. **ESLint validation** (`bun run lint`)
3. **Code formatting** (`bun run format:check`)
4. **Unit/integration tests** (`bun test`)
5. **Mutation testing** (`bun run test:mutation`)

If any quality gate fails, the agent will STOP and require fixes before proceeding.

## Example Usage

```bash
# Start a new story
/bmad:bmm:agents:sm
*create-story

# Implement it (quality gates enforced automatically)
/bmad:bmm:agents:dev
*develop-story

# Review the implementation
/bmad:bmm:agents:dev
*code-review
```

## Zero Tolerance Policy

- **No eslint-disable comments** - refactor code instead
- **No @ts-ignore or @ts-expect-error** - fix type issues properly
- **No failing tests** - all tests must pass 100%
- **No mutation score below thresholds** - improve test quality
- **No TypeScript errors** - strict mode compliance required

---

*Last updated: 2025-10-30*
*Project: bun-tts*