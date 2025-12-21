/**
 * Generate a unique ID for documents
 */
export const generateId = (): string => {
  return `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Format date to ISO string
 */
export const formatDate = (date: Date = new Date()): string => {
  return date.toISOString();
};

/**
 * Get current line and column from textarea
 */
export const getCursorPosition = (
  textarea: HTMLTextAreaElement
): { line: number; column: number } => {
  const text = textarea.value;
  const cursorPos = textarea.selectionStart;

  const textBeforeCursor = text.substring(0, cursorPos);
  const lines = textBeforeCursor.split('\n');
  const line = lines.length;
  const column = lines[lines.length - 1].length + 1;

  return { line, column };
};

/**
 * Count characters in text
 */
export const countCharacters = (text: string): number => {
  return text.length;
};

/**
 * Count words in text
 */
export const countWords = (text: string): number => {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
};

/**
 * Count lines in text
 */
export const countLines = (text: string): number => {
  return text.split('\n').length;
};

/**
 * Extract filename from path
 */
export const getFilename = (path: string): string => {
  return path.split('/').pop() || 'Untitled';
};

/**
 * Detect if device is mobile
 */
export const isMobile = (): boolean => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};

/**
 * Debounce function
 */
export const debounce = <T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};
