import { describe, it, expect } from 'vitest';
import { normalizeAnswer, compareAnswers } from '../src/lib/normalize';

describe('Answer Normalization and Comparison', () => {
  it('ignores leading and trailing whitespace', () => {
    expect(compareAnswers('  hello  ', 'hello')).toBe(true);
  });

  it('ignores case', () => {
    expect(compareAnswers('GrAcIaS', 'gracias')).toBe(true);
    expect(compareAnswers('Hello, how are you?', 'hello, how are you?')).toBe(true);
  });

  it('ignores accents and diacritics', () => {
    expect(compareAnswers('adios', 'adiós')).toBe(true);
    expect(compareAnswers('Buenos dias', 'Buenos días')).toBe(true);
    expect(compareAnswers('el', 'él')).toBe(true);
    expect(compareAnswers('como estas', 'cómo estás')).toBe(true);
  });

  it('ignores punctuation (inverted question marks, exclamation marks, commas, periods)', () => {
    expect(compareAnswers('Hola como estas', 'Hola, ¿cómo estás?')).toBe(true);
    expect(compareAnswers('Si me gusta mucho', 'Sí, me gusta mucho.')).toBe(true);
    expect(compareAnswers('Un cafe por favor', 'Un café, por favor.')).toBe(true);
  });

  it('correctly fails incorrect answers', () => {
    expect(compareAnswers('adios', 'hola')).toBe(false);
    expect(compareAnswers('dog', 'cat')).toBe(false);
  });
});
