import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import importPlugin from 'eslint-plugin-import';
import jsdoc from 'eslint-plugin-jsdoc';
import nodePlugin from 'eslint-plugin-node';
import securityPlugin from 'eslint-plugin-security';
import sonarjs from 'eslint-plugin-sonarjs';
import unicorn from 'eslint-plugin-unicorn';

export default [
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/coverage/**',
      '**/*.js',
      '**/*.d.ts',
      '**/reports/**',
      '**/.stryker-tmp/**',
    ],
  },
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        Bun: 'readonly',
        process: 'readonly',
        console: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        setImmediate: 'readonly',
        clearImmediate: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      sonarjs,
      unicorn,
      import: importPlugin,
      jsdoc,
      node: nodePlugin,
      security: securityPlugin,
    },
    rules: {
      // Template-based strict thresholds
      complexity: ['error', 5],
      'max-depth': ['error', 3],
      'max-lines': ['error', { max: 200, skipBlankLines: true, skipComments: true }],
      'max-lines-per-function': ['error', { max: 15, skipBlankLines: true, skipComments: true }],
      'max-nested-callbacks': ['error', 3],
      'max-params': ['error', 4],
      'max-statements': ['error', 10],

      // TypeScript Advanced Rules
      '@typescript-eslint/explicit-function-return-type': ['error', { allowExpressions: true }],
      '@typescript-eslint/explicit-module-boundary-types': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/prefer-for-of': 'error',
      '@typescript-eslint/prefer-as-const': 'error',
      '@typescript-eslint/no-array-constructor': 'error',
      '@typescript-eslint/no-inferrable-types': 'error',
      '@typescript-eslint/array-type': ['error', { default: 'array-simple' }],
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
      '@typescript-eslint/method-signature-style': ['error', 'property'],
      '@typescript-eslint/naming-convention': [
        'error',
        { selector: 'interface', format: ['PascalCase'] },
        { selector: 'typeAlias', format: ['PascalCase'] },
        { selector: 'enum', format: ['PascalCase'] },
      ],

      // SonarJS Static Analysis
      'sonarjs/cognitive-complexity': ['error', 5],
      'sonarjs/no-duplicate-string': ['error', { threshold: 3 }],
      'sonarjs/no-identical-functions': 'error',
      'sonarjs/no-duplicated-branches': 'error',
      'sonarjs/no-redundant-boolean': 'error',
      'sonarjs/prefer-immediate-return': 'error',

      // Unicorn Modern Best Practices
      'unicorn/better-regex': 'error',
      'unicorn/catch-error-name': 'error',
      'unicorn/consistent-function-scoping': 'error',
      'unicorn/custom-error-definition': 'error',
      'unicorn/error-message': 'error',
      'unicorn/escape-case': 'error',
      'unicorn/expiring-todo-comments': 'error',
      'unicorn/explicit-length-check': 'error',
      'unicorn/filename-case': ['error', { case: 'kebabCase' }],
      'unicorn/no-abusive-eslint-disable': 'error',
      'unicorn/no-array-for-each': 'error',
      'unicorn/no-console-spaces': 'error',
      'unicorn/no-instanceof-array': 'error',
      'unicorn/no-invalid-remove-event-listener': 'error',
      'unicorn/no-unreadable-array-destructuring': 'error',
      'unicorn/no-unused-properties': 'error',
      'unicorn/no-useless-undefined': 'error',
      'unicorn/number-literal-case': 'error',
      'unicorn/prefer-add-event-listener': 'error',
      'unicorn/prefer-array-find': 'error',
      'unicorn/prefer-array-flat-map': 'error',
      'unicorn/prefer-array-some': 'error',
      'unicorn/prefer-default-parameters': 'error',
      'unicorn/prefer-includes': 'error',
      'unicorn/prefer-modern-math-apis': 'error',
      'unicorn/prefer-negative-index': 'error',
      'unicorn/prefer-number-properties': 'error',
      'unicorn/prefer-optional-catch-binding': 'error',
      'unicorn/prefer-string-starts-ends-with': 'error',
      'unicorn/prefer-type-error': 'error',

      // Import Organization
      'import/no-duplicates': 'error',
      'import/no-unresolved': 'error',
      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          'newlines-between': 'never',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      'import/newline-after-import': 'error',
      'import/no-default-export': 'error',
      'import/no-mutable-exports': 'error',

      // JSDoc Documentation
      'jsdoc/check-alignment': 'error',
      'jsdoc/check-param-names': 'error',
      'jsdoc/check-tag-names': 'error',
      'jsdoc/check-types': 'error',
      'jsdoc/require-description': 'error',
      'jsdoc/require-param': 'error',
      'jsdoc/require-param-description': 'error',
      'jsdoc/require-param-type': 'error',
      'jsdoc/require-returns': 'error',
      'jsdoc/require-returns-description': 'error',
      'jsdoc/require-returns-type': 'error',
      'jsdoc/require-jsdoc': [
        'error',
        {
          require: {
            FunctionDeclaration: true,
            MethodDefinition: true,
            ClassDeclaration: true,
            ArrowFunctionExpression: false,
            FunctionExpression: false,
          },
        },
      ],

      // Core ESLint Rules
      'no-magic-numbers': ['error', { ignoreArrayIndexes: true, ignoreDefaultValues: true }],
      'no-duplicate-imports': 'error',
      'no-lonely-if': 'error',
      'no-return-await': 'error',
      'no-useless-return': 'error',
      'prefer-const': 'error',
      'prefer-template': 'error',
      yoda: 'error',

      // Filtered TypeScript ESLint Rules
      ...Object.fromEntries(
        Object.entries(tseslint.configs.recommended.rules).filter(
          ([rule]) =>
            ![
              '@typescript-eslint/no-unused-vars',
              '@typescript-eslint/no-explicit-any',
              '@typescript-eslint/no-debugger',
              '@typescript-eslint/no-empty-function',
              '@typescript-eslint/no-non-null-assertion',
              '@typescript-eslint/no-misused-new',
              '@typescript-eslint/no-unnecessary-type-assertion',
              '@typescript-eslint/prefer-const',
              '@typescript-eslint/no-var-requires',
            ].includes(rule),
        ),
      ),

      // Additional Performance and Security Rules
      'no-loop-func': 'error',
      'no-self-compare': 'error',
      'no-iterator': 'error',
      'no-restricted-syntax': [
        'error',
        {
          selector: 'WithStatement',
          message: 'Avoid using with statements',
        },
        {
          selector: 'DebuggerStatement',
          message: 'Avoid using debugger statements in production',
        },
        {
          selector: 'LabeledStatement',
          message: 'Avoid using labeled statements',
        },
      ],
      'prefer-rest-params': 'error',

      // Code Quality Rules
      'array-callback-return': 'error',
      'consistent-return': 'error',
      'func-name-matching': 'error',

      // Additional TypeScript Rules
      '@typescript-eslint/ban-ts-comment': 'error',
      '@typescript-eslint/no-restricted-types': 'error',
      '@typescript-eslint/no-dynamic-delete': 'error',
      '@typescript-eslint/no-empty-interface': 'error',
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',
      '@typescript-eslint/restrict-template-expressions': 'error',
      '@typescript-eslint/strict-boolean-expressions': 'error',

      // Additional Import Rules
      'import/extensions': ['error', 'never'],
      'import/first': 'error',
      'import/no-relative-parent-imports': 'off', // Allow relative imports for project structure
      'import/no-useless-path-segments': 'error',
    },
  },
  {
    files: ['**/*.test.ts', '**/*.spec.ts', '**/tests/**/*.ts'],
    rules: {
      'max-lines': 'off',
      'max-lines-per-function': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'sonarjs/no-duplicate-string': 'off',
      'jsdoc/require-jsdoc': 'off',
      'jsdoc/require-description': 'off',
      'jsdoc/require-param': 'off',
      'jsdoc/require-returns': 'off',
      'no-magic-numbers': 'off',
      'import/no-default-export': 'off',
    },
  },
];
