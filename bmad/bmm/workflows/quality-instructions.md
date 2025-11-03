# MANDATORY QUALITY ENFORCEMENT INSTRUCTIONS
# ==========================================
#
# CRITICAL: These instructions are MANDATORY for ALL agents
# ANY deviation = IMMEDIATE quality gate failure
# NO exceptions, NO workarounds, NO shortcuts permitted
#
# LAST UPDATED: 2025-11-03
# ENFORCEMENT: STRICT - ZERO TOLERANCE

## 🚨 QUALITY IS NON-NEGOTIABLE

### BEFORE WRITING ANY CODE:
1. **MUST** understand quality requirements
2. **MUST** plan for test coverage
3. **MUST** design for maintainability
4. **MUST** consider security implications

### DURING DEVELOPMENT:
1. **NEVER** use `eslint-disable` or `@ts-ignore`
2. **NEVER** write functions > 30 lines
3. **NEVER** write files > 300 lines
4. **NEVER** skip error handling
5. **NEVER** use `any` types
6. **NEVER** commit failing tests

### AFTER IMPLEMENTATION:
1. **MUST** run `bun run quality:gates`
2. **MUST** fix ALL failures
3. **MUST** achieve mutation testing thresholds
4. **MUST** pass ALL quality gates
5. **MUST** ensure production readiness

## 📋 MANDATORY QUALITY CHECKLIST

### Code Quality (MANDATORY):
- [ ] **ZERO** ESLint errors
- [ ] **ZERO** TypeScript errors
- [ ] **ZERO** `eslint-disable` comments
- [ ] **ZERO** `@ts-ignore` comments
- [ ] **ZERO** `any` types in new code
- [ ] Functions ≤ 30 lines
- [ ] Files ≤ 300 lines
- [ ] Complexity ≤ 15

### Testing Quality (MANDATORY):
- [ ] **ALL** tests pass
- [ ] Coverage ≥ 90% statements
- [ ] Coverage ≥ 85% branches
- [ ] Coverage ≥ 90% functions
- [ ] Coverage ≥ 90% lines
- [ ] Mutation score ≥ 80%
- [ ] Integration tests for critical paths
- [ ] Test fixtures included and working

### Security Quality (MANDATORY):
- [ ] **ZERO** security vulnerabilities
- [ ] Input validation on all user inputs
- [ ] Safe execution of external commands
- [ ] No hardcoded secrets or credentials
- [ ] Proper error handling without information leakage

### Documentation Quality (MANDATORY):
- [ ] JSDoc comments on all public APIs
- [ ] Complex functions have explanatory comments
- [ ] Configuration options documented
- [ ] Error messages are clear and actionable
- [ ] README updated if needed

## 🛑 FORBIDDEN PATTERNS - INSTANT REJECTION

### NEVER USE THESE PATTERNS:
```typescript
// ❌ FORBIDDEN - ESLint disable
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const data: any = fetchData();

// ❌ FORBIDDEN - TypeScript ignore
// @ts-ignore
const result = someUntypedFunction();

// ❌ FORBIDDEN - Lazy single-line compression
export const validateAuth = (db: Database, userId: string, req: AuthRequest): Promise<AuthResult> => { /* 50+ lines compressed */ };

// ❌ FORBIDDEN - Any types
const config: any = getConfig();

// ❌ FORBIDDEN - Console.log in production code
console.log('Debug info:', data);
```

### INSTEAD, USE THESE PATTERNS:
```typescript
// ✅ CORRECT - Proper typing
interface UserConfig {
  apiUrl: string;
  timeout: number;
}

const config: UserConfig = getConfig();

// ✅ CORRECT - Proper function extraction
export async function verifyTwoFactorAuth(
  db: Database,
  userId: string,
  request: TwoFactorVerifyRequest,
): Promise<{ success: boolean; backupCodeUsed?: string }> {
  const user = await getUserForTwoFactorVerification(db, userId);
  if (!user) return { success: false };

  return processTwoFactorAuthentication(user, request);
}

// ✅ CORRECT - Proper logging
import { logger } from '../utils/logger.js';

logger.info('Processing user authentication', { userId, timestamp: Date.now() });
```

## ⚡ AUTOMATIC QUALITY GATES

The system **AUTOMATICALLY** enforces quality gates:

### Pre-Commit Checks:
- `bun run quality:gates` must pass
- All linting issues resolved
- All tests passing
- No forbidden patterns

### Pre-Story Completion:
- Quality gates validation
- Code review compliance
- Test coverage verification
- Mutation testing requirements

### Pre-Epic Completion:
- Full epic quality validation
- Integration testing
- Performance verification
- Security assessment

## 🚨 CONSEQUENCES OF QUALITY FAILURES

### Immediate Actions:
1. **AUTOMATIC BLOCK** of story completion
2. **IMMEDIATE** requirement to fix issues
3. **NO** manual overrides permitted
4. **NO** progression to next story

### Quality Debt:
- Every quality failure creates technical debt
- Technical debt must be resolved before proceeding
- No accumulation of quality debt permitted
- Quality gates prevent debt accumulation

## 🎯 QUALITY SCORE METRICS

### Target Metrics:
- **Overall Quality Score**: ≥ 95%
- **Functionality**: 100% (all features working)
- **Reliability**: ≥ 95% (minimal failures)
- **Security**: 100% (no vulnerabilities)
- **Maintainability**: ≥ 90% (clean, readable code)
- **Performance**: ≥ 85% (acceptable speed)

### Monitoring:
- Quality scores tracked automatically
- Trends monitored over time
- Degradation triggers immediate review
- Continuous improvement enforced

## 📞 QUALITY SUPPORT

### If Quality Gates Fail:
1. **DO NOT** attempt manual overrides
2. **DO NOT** modify quality gate settings
3. **DO NOT** disable quality checks
4. **DO** fix underlying issues
5. **DO** ask for quality guidance if needed

### Getting Help:
- Review quality failure messages carefully
- Check documentation for best practices
- Ask Scrum Master for quality guidance
- Use code review process for quality improvement

---

## 🎖️ QUALITY EXCELLENCE STANDARD

**Remember**: Quality is not optional - it's **mandatory**.
Our users deserve production-ready software, and our quality gates ensure we deliver exactly that.

**Every line of code matters. Every test matters. Every quality gate matters.**

**Quality is everyone's responsibility, and quality gates are everyone's constraint.**

---
*This document is enforced by automated quality gates. Any attempt to bypass quality requirements will be automatically blocked.*