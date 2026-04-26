import { describe, it, expect } from 'vitest';
import {
  calculateStatistics,
  sortLines,
  removeDuplicateLines,
  convertToUpperCase,
  convertToLowerCase,
  convertToTitleCase,
  trimWhitespace,
  removeEmptyLines,
} from '@/utils/textUtils';

describe('calculateStatistics', () => {
  it('returns zeros for empty string', () => {
    const stats = calculateStatistics('');
    expect(stats.characters).toBe(0);
    expect(stats.words).toBe(0);
    expect(stats.lines).toBe(0);
    expect(stats.paragraphs).toBe(0);
    expect(stats.sentences).toBe(0);
  });

  it('counts characters including spaces', () => {
    const stats = calculateStatistics('Hello World');
    expect(stats.characters).toBe(11);
    expect(stats.charactersNoSpaces).toBe(10);
  });

  it('counts words correctly', () => {
    expect(calculateStatistics('one two three').words).toBe(3);
    expect(calculateStatistics('  spaces  around  ').words).toBe(2);
    expect(calculateStatistics('single').words).toBe(1);
  });

  it('counts lines correctly', () => {
    expect(calculateStatistics('one\ntwo\nthree').lines).toBe(3);
    expect(calculateStatistics('one line').lines).toBe(1);
  });

  it('counts paragraphs correctly', () => {
    const text = 'Paragraph one.\n\nParagraph two.\n\nParagraph three.';
    expect(calculateStatistics(text).paragraphs).toBe(3);
  });

  it('counts sentences correctly', () => {
    expect(calculateStatistics('Hello. World! How are you?').sentences).toBe(3);
  });
});

describe('sortLines', () => {
  it('sorts lines alphabetically', () => {
    expect(sortLines('banana\napple\ncherry')).toBe('apple\nbanana\ncherry');
  });

  it('handles single line', () => {
    expect(sortLines('only')).toBe('only');
  });

  it('handles empty string', () => {
    expect(sortLines('')).toBe('');
  });

  it('sorts case-sensitively by locale', () => {
    const result = sortLines('b\nA\nc');
    expect(result.split('\n')[0]).toBe('A');
  });
});

describe('removeDuplicateLines', () => {
  it('removes duplicate lines', () => {
    expect(removeDuplicateLines('a\nb\na\nc\nb')).toBe('a\nb\nc');
  });

  it('preserves order of first occurrence', () => {
    const result = removeDuplicateLines('z\na\nz\nb');
    expect(result).toBe('z\na\nb');
  });

  it('handles no duplicates', () => {
    expect(removeDuplicateLines('x\ny\nz')).toBe('x\ny\nz');
  });

  it('handles empty string', () => {
    expect(removeDuplicateLines('')).toBe('');
  });
});

describe('convertToUpperCase', () => {
  it('converts to uppercase', () => {
    expect(convertToUpperCase('Hello World')).toBe('HELLO WORLD');
  });

  it('handles already uppercase', () => {
    expect(convertToUpperCase('ALREADY')).toBe('ALREADY');
  });

  it('handles empty string', () => {
    expect(convertToUpperCase('')).toBe('');
  });
});

describe('convertToLowerCase', () => {
  it('converts to lowercase', () => {
    expect(convertToLowerCase('HELLO WORLD')).toBe('hello world');
  });

  it('handles mixed case', () => {
    expect(convertToLowerCase('MiXeD')).toBe('mixed');
  });
});

describe('convertToTitleCase', () => {
  it('capitalizes first letter of each word', () => {
    expect(convertToTitleCase('hello world')).toBe('Hello World');
  });

  it('lowercases the rest of each word', () => {
    expect(convertToTitleCase('HELLO WORLD')).toBe('Hello World');
  });

  it('handles single word', () => {
    expect(convertToTitleCase('word')).toBe('Word');
  });

  it('handles empty string', () => {
    expect(convertToTitleCase('')).toBe('');
  });
});

describe('trimWhitespace', () => {
  it('trims each line', () => {
    expect(trimWhitespace('  hello  \n  world  ')).toBe('hello\nworld');
  });

  it('leaves already-trimmed lines unchanged', () => {
    expect(trimWhitespace('clean\nlines')).toBe('clean\nlines');
  });

  it('handles empty string', () => {
    expect(trimWhitespace('')).toBe('');
  });
});

describe('removeEmptyLines', () => {
  it('removes blank lines', () => {
    expect(removeEmptyLines('a\n\nb\n\nc')).toBe('a\nb\nc');
  });

  it('removes whitespace-only lines', () => {
    expect(removeEmptyLines('a\n   \nb')).toBe('a\nb');
  });

  it('handles no empty lines', () => {
    expect(removeEmptyLines('a\nb\nc')).toBe('a\nb\nc');
  });

  it('handles all empty lines', () => {
    expect(removeEmptyLines('\n\n\n')).toBe('');
  });
});
