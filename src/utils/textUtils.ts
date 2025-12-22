import { StatisticsData } from '../components/StatisticsDialog';

/**
 * Calculate document statistics
 */
export function calculateStatistics(text: string): StatisticsData {
  const characters = text.length;
  const charactersNoSpaces = text.replace(/\s/g, '').length;

  // Count words (split by whitespace and filter empty strings)
  const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;

  // Count lines
  const lines = text === '' ? 0 : text.split('\n').length;

  // Count paragraphs (groups of non-empty lines)
  const paragraphs = text.trim() === '' ? 0 : text.split(/\n\n+/).filter(p => p.trim() !== '').length;

  // Count sentences (rough estimate: split by .!? followed by space or end)
  const sentences = text.trim() === '' ? 0 : text.split(/[.!?]+(?:\s|$)/).filter(s => s.trim() !== '').length;

  return {
    characters,
    charactersNoSpaces,
    words,
    lines,
    paragraphs,
    sentences,
  };
}

/**
 * Sort lines alphabetically
 */
export function sortLines(text: string): string {
  const lines = text.split('\n');
  return lines.sort((a, b) => a.localeCompare(b)).join('\n');
}

/**
 * Remove duplicate lines
 */
export function removeDuplicateLines(text: string): string {
  const lines = text.split('\n');
  const uniqueLines = Array.from(new Set(lines));
  return uniqueLines.join('\n');
}

/**
 * Convert text to UPPERCASE
 */
export function convertToUpperCase(text: string): string {
  return text.toUpperCase();
}

/**
 * Convert text to lowercase
 */
export function convertToLowerCase(text: string): string {
  return text.toLowerCase();
}

/**
 * Convert text to Title Case
 */
export function convertToTitleCase(text: string): string {
  return text.replace(/\w\S*/g, (word) => {
    return word.charAt(0).toUpperCase() + word.substr(1).toLowerCase();
  });
}

/**
 * Trim whitespace from start and end of each line
 */
export function trimWhitespace(text: string): string {
  return text.split('\n').map(line => line.trim()).join('\n');
}

/**
 * Remove empty lines from text
 */
export function removeEmptyLines(text: string): string {
  return text.split('\n').filter(line => line.trim() !== '').join('\n');
}
