/**
 * Test context builder for CLI commands
 */
export const createTestCliContextFixed = (overrides: any = {}) => {
  // If args are provided, prepend 'config' to simulate the full command
  const input = overrides.args
    ? ['config', ...overrides.args]
    : overrides.input || ['test.md'];

  return {
    input,
    flags: {
      verbose: false,
      config: undefined,
      help: false,
      version: false,
      ...overrides.flags,
    },
    logLevel: 'info',
    ...overrides,
  };
};
