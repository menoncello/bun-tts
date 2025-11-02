/** JSON indentation spaces for pretty printing configuration */
const JSON_INDENTATION = 2;

/** YAML indentation spaces per level */
const YAML_INDENT_SPACES_PER_LEVEL = 2;

/**
 * Formats output based on the specified format.
 *
 * @param {unknown} data - The data to format
 * @param {string} format - The format to use ('json', 'yaml', 'pretty')
 * @returns {string} The formatted output
 */
export function formatOutput(data: unknown, format: string): string {
  switch (format) {
    case 'json':
      return JSON.stringify(data, null, JSON_INDENTATION);
    case 'yaml':
      // Simple YAML formatting - in real implementation would use a YAML library
      return simpleYamlFormat(data);
    default:
      return JSON.stringify(data, null, JSON_INDENTATION);
  }
}

/**
 * Formats configuration listing based on the specified options.
 *
 * @param {unknown} config - The configuration to format
 * @param {string} prefix - A prefix to add to keys
 * @param {boolean} verbose - Whether to show values
 * @param {string} format - The output format
 * @returns {string} The formatted configuration listing
 */
export function formatConfigListing(
  config: unknown,
  prefix: string,
  verbose: boolean,
  format: string
): string {
  if (format === 'json') {
    return JSON.stringify(config, null, JSON_INDENTATION);
  }

  let output = '';
  const configObj = config as Record<string, unknown>;
  const keys = Object.keys(configObj);

  for (const key of keys) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    output += verbose
      ? `${fullKey} = ${JSON.stringify(configObj[key])}\n`
      : `${fullKey}\n`;
  }

  return output.trim();
}

/**
 * Simple YAML formatter for basic use cases.
 *
 * @param {unknown} obj - The object to format as YAML
 * @param {number} indent - Current indentation level
 * @returns {string} The YAML formatted string
 */
function simpleYamlFormat(obj: unknown, indent = 0): string {
  const spaces = ' '.repeat(indent * YAML_INDENT_SPACES_PER_LEVEL);
  let yaml = '';

  if (typeof obj === 'object' && obj !== null && !Array.isArray(obj)) {
    for (const key of Object.keys(obj)) {
      yaml += `${spaces}${key}:`;
      const value = (obj as Record<string, unknown>)[key];
      yaml +=
        typeof value === 'object' && value !== null && !Array.isArray(value)
          ? `\n${simpleYamlFormat(value, indent + 1)}`
          : ` ${JSON.stringify(value)}\n`;
    }
  } else {
    yaml += `${JSON.stringify(obj)}\n`;
  }

  return yaml;
}

/**
 * Generates text output for profiles list.
 *
 * @param {Array<{name: string, active: boolean, description: string}>} profiles - Array of profiles
 * @returns {string} Formatted text output
 */
export function generateProfilesTextOutput(
  profiles: Array<{ name: string; active: boolean; description: string }>
): string {
  let output = 'Available profiles:\n';
  for (const profile of profiles) {
    const marker = profile.active ? ' (active)' : '';
    output += `  ${profile.name}${marker} - ${profile.description}\n`;
  }
  return output.trim();
}

/**
 * Gets a nested value from an object using dot notation.
 *
 * @param {unknown} obj - The object to get the value from
 * @param {string} path - The dot notation path to the value
 * @returns {unknown} The value at the specified path, or undefined if not found
 */
export function getNestedValue(obj: unknown, path: string): unknown {
  return path.split('.').reduce((current: unknown, key: string) => {
    const currentObj = current as Record<string, unknown>;
    return currentObj?.[key] === undefined ? undefined : currentObj[key];
  }, obj);
}

/**
 * Sets a nested value in an object using dot notation.
 *
 * @param {unknown} obj - The object to set the value in
 * @param {string} path - The dot notation path to set the value at
 * @param {unknown} value - The value to set
 */
export function setNestedValue(
  obj: unknown,
  path: string,
  value: unknown
): void {
  const keys = path.split('.');
  const lastKey = keys.pop();

  if (lastKey === undefined) {
    return;
  }

  const target = keys.reduce((current: unknown, key: string) => {
    const currentObj = current as Record<string, unknown>;
    if (currentObj[key] === undefined) {
      currentObj[key] = {};
    }
    return currentObj[key];
  }, obj);

  (target as Record<string, unknown>)[lastKey] = value;
}

/**
 * Parses a string value into the specified type.
 *
 * @param {string} value - The string value to parse
 * @param {string} type - The type to parse the value as
 * @returns {unknown} The parsed value
 */
export function parseValue(value: string, type: string): unknown {
  switch (type) {
    case 'json':
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    case 'number':
      const num = Number(value);
      return Number.isNaN(num) ? value : num;
    case 'boolean':
      return value.toLowerCase() === 'true';
    default:
      return value;
  }
}
