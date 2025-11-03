# MANDATORY Quality Requirements for All Development Work

## 🚨 CRITICAL QUALITY GATES - ZERO TOLERANCE POLICY

**ATTENTION DEVELOPER**: You are strictly prohibited from delivering work that violates ANY of these quality requirements. Story completion will be BLOCKED until all gates pass.

### **ABSOLUTE QUALITY REQUIREMENTS**

**1. ZERO ESLINT ERRORS**
- ❌ NO `eslint-disable` comments permitted
- ❌ NO `eslint-disable-next-line` comments permitted
- ❌ NO `/* eslint-disable */` comments permitted
- ✅ ALL ESLint errors MUST be fixed by refactoring code properly

**2. ZERO TYPESCRIPT ERRORS**
- ❌ NO `@ts-ignore` comments permitted
- ❌ NO `@ts-expect-error` comments permitted
- ✅ ALL TypeScript errors MUST be resolved with proper types

**3. ZERO LAZY WORKAROUNDS**
- ❌ NO compressing functions into single lines to reduce line count
- ❌ NO inlining everything to avoid complexity warnings
- ❌ NO ugly hacks to make linters happy
- ✅ PROPER refactoring with extracted helper functions
- ✅ CLEAR separation of concerns

**4. FUNCTION SIZE LIMITS**
- ✅ Functions MUST be ≤ 30 lines
- ✅ Complex logic MUST be extracted into smaller functions
- ✅ Single responsibility principle MUST be followed

**5. FILE SIZE LIMITS**
- ✅ Files MUST be ≤ 300 lines
- ✅ Large files MUST be split into focused modules
- ✅ Related functionality MUST be grouped logically

**6. TEST QUALITY REQUIREMENTS**
- ✅ ALL tests MUST pass (zero failures permitted)
- ✅ ALL test fixtures referenced MUST exist
- ✅ Test coverage MUST meet minimum thresholds
- ✅ NO test-specific quality shortcuts permitted

**7. MUTATION TESTING REQUIREMENTS**
- ✅ Mutation score MUST meet thresholds (90% high, 80% low, 70% break)
- ✅ Tests MUST kill mutants effectively
- ✅ NO lowering thresholds to make tests pass

## **ENFORCEMENT MECHANISM**

**IF ANY QUALITY GATE FAILS:**
1. ⛔ **WORKFLOW BLOCKED** - Story cannot be marked complete
2. 📋 **SPECIFIC VIOLATIONS** - Exact issues will be reported
3. 🔧 **REMEDIATION STEPS** - Actionable fixes will be provided
4. 🚫 **NO EXCEPTIONS** - Quality gates cannot be bypassed

## **SUCCESS CRITERIA**

**Story completion ONLY permitted when:**
- ✅ Zero ESLint errors
- ✅ Zero TypeScript errors
- ✅ All tests passing
- ✅ Mutation testing thresholds met
- ✅ No quality shortcuts detected
- ✅ All code properly refactored
- ✅ All fixtures exist and work

---

**REMEMBER**: Quality is not optional. Speed without quality creates technical debt that slows future development. Take the time to do it right the first time.