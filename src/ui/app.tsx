import { Text } from 'ink';
import React from 'react';
import { generateHelp, generateVersionInfo } from '../cli/help.js';
import type { CliFlags } from '../types/index.js';

interface AppProps {
  flags: CliFlags;
  input: string[];
}

/**
 * Renders the main application component based on provided flags and input.
 * Handles help, version, and default message display.
 *
 * @param props - The component properties
 * @param props.flags - CLI flags containing configuration options
 * @param props.input - Command line input arguments
 * @returns React.ReactElement representing the appropriate UI component
 */
export function App({ flags, input }: AppProps): React.ReactElement {
  if (flags.help || input.includes('help')) {
    return <HelpMessage verbose={flags.verbose} />;
  }

  if (input.includes('version')) {
    return <VersionMessage />;
  }

  return <DefaultMessage />;
}

/**
 * Renders the default welcome message when no specific command is provided.
 *
 * @returns React.ReactElement containing the default welcome message
 */
function DefaultMessage(): React.ReactElement {
  return (
    <Text>
      Hello, <Text color="green">bun-tts</Text>!{'\n\n'}
      <Text color="gray">Use bun-tts help to see available commands</Text>
    </Text>
  );
}

/**
 * Renders a formatted help message with color coding for different sections.
 *
 * @param props - The component properties
 * @param props.verbose - Whether to show verbose help information
 * @returns React.ReactElement containing the formatted help message
 */
function HelpMessage({
  verbose = false,
}: {
  verbose?: boolean;
}): React.ReactElement {
  const helpText = generateHelp({ verbose });

  return (
    <Text>
      {helpText.split('\n').map((line, index) => (
        <HelpLine key={index} line={line} index={index} />
      ))}
    </Text>
  );
}

/**
 * Renders a single help line with appropriate color formatting.
 * Handles different types of help content (headers, commands, examples, etc.).
 *
 * @param props - The component properties
 * @param props.line - The help line text to render
 * @param props.index - The line index for the React key
 * @returns React.ReactElement containing the formatted help line
 */
function HelpLine({
  line,
  index,
}: {
  line: string;
  index: number;
}): React.ReactElement {
  const coloredLine = getColoredHelpLine(line);

  return (
    <Text key={index}>
      {coloredLine}
      {'\n'}
    </Text>
  );
}

/**
 * Determines the appropriate color and formatting for a help line based on its content.
 * Analyzes the line content and applies color coding for different sections.
 *
 * @param line - The help line text to format
 * @returns React.ReactElement containing the colored help line content
 */
function getColoredHelpLine(line: string): React.ReactElement {
  if (isHeaderLine(line)) {
    return getHeaderColor(line);
  }

  if (isCommandLine(line)) {
    return <Text color="white">{line}</Text>;
  }

  if (isDescriptionLine(line)) {
    return <Text color="gray">{line}</Text>;
  }

  return <Text>{line}</Text>;
}

/**
 * Checks if a line is a header line (sections like Usage, Commands, Options, etc.).
 *
 * @param line - The line to check
 * @returns true if the line is a header, false otherwise
 */
function isHeaderLine(line: string): boolean {
  return (
    line.startsWith('bun-tts -') ||
    line.startsWith('Usage:') ||
    line.startsWith('Commands:') ||
    line.startsWith('Options:') ||
    line.startsWith('Examples:')
  );
}

/**
 * Checks if a line is a command line (starts with 'bun-tts' and is not a header).
 *
 * @param line - The line to check
 * @returns true if the line is a command, false otherwise
 */
function isCommandLine(line: string): boolean {
  return line.trim().startsWith('bun-tts') && !line.startsWith('bun-tts -');
}

/**
 * Checks if a line is a description line (non-empty and not indented).
 *
 * @param line - The line to check
 * @returns true if the line is a description, false otherwise
 */
function isDescriptionLine(line: string): boolean {
  return Boolean(line.trim()) && !line.startsWith('  ');
}

/**
 * Returns the appropriate colored header based on the header type.
 *
 * @param line - The header line to format
 * @returns React.ReactElement containing the colored header
 */
function getHeaderColor(line: string): React.ReactElement {
  if (line.startsWith('bun-tts -')) {
    return <Text color="blue">{line}</Text>;
  }

  if (line.startsWith('Usage:')) {
    return <Text color="yellow">{line}</Text>;
  }

  if (line.startsWith('Commands:')) {
    return <Text color="cyan">{line}</Text>;
  }

  if (line.startsWith('Options:')) {
    return <Text color="magenta">{line}</Text>;
  }

  if (line.startsWith('Examples:')) {
    return <Text color="green">{line}</Text>;
  }

  return <Text>{line}</Text>;
}

/**
 * Renders version information with color formatting for different components.
 * Displays version number, build information, and system details.
 *
 * @returns React.ReactElement containing the formatted version information
 */
function VersionMessage(): React.ReactElement {
  const versionText = generateVersionInfo();

  return (
    <Text>
      {versionText.split('\n').map((line, index) => (
        <VersionLine key={index} line={line} index={index} />
      ))}
    </Text>
  );
}

/**
 * Renders a single version line with appropriate color formatting.
 * Handles version numbers, build information, and status indicators.
 *
 * @param props - The component properties
 * @param props.line - The version line text to render
 * @param props.index - The line index for the React key
 * @returns React.ReactElement containing the formatted version line
 */
function VersionLine({
  line,
  index,
}: {
  line: string;
  index: number;
}): React.ReactElement {
  const coloredLine = getColoredVersionLine(line);

  return (
    <Text key={index}>
      {coloredLine}
      {'\n'}
    </Text>
  );
}

/**
 * Determines the appropriate color and formatting for a version line based on its content.
 * Handles version numbers, status indicators, and build information.
 *
 * @param line - The version line text to format
 * @returns React.ReactElement containing the colored version line content
 */
function getColoredVersionLine(line: string): React.ReactElement {
  if (isVersionLine(line)) {
    return formatVersionLine(line);
  }

  if (isStatusLine(line)) {
    return <Text color="green">{line}</Text>;
  }

  if (isBuildInfoLine(line)) {
    return <Text color="blue">{line}</Text>;
  }

  return <Text color="gray">{line}</Text>;
}

/**
 * Checks if a line is a version line (starts with 'bun-tts version').
 *
 * @param line - The line to check
 * @returns true if the line is a version line, false otherwise
 */
function isVersionLine(line: string): boolean {
  return line.startsWith('bun-tts version');
}

/**
 * Checks if a line is a status line (contains checkmark symbol).
 *
 * @param line - The line to check
 * @returns true if the line is a status line, false otherwise
 */
function isStatusLine(line: string): boolean {
  return line.includes('✓');
}

/**
 * Checks if a line is a build information line.
 *
 * @param line - The line to check
 * @returns true if the line is build information, false otherwise
 */
function isBuildInfoLine(line: string): boolean {
  return line.includes('Build Information:');
}

/**
 * Formats a version line by splitting it into components and applying colors.
 * Separates the app name, version word, and version number with different colors.
 *
 * @param line - The version line to format
 * @returns React.ReactElement containing the formatted version line
 */
function formatVersionLine(line: string): React.ReactElement {
  const parts = line.split(' ');
  return (
    <>
      <Text color="green">bun-tts</Text>
      <Text> version </Text>
      <Text color="cyan">{parts[2]}</Text>
    </>
  );
}
