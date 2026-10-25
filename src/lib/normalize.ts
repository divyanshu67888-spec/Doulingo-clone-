/**
 * Answer normalization for typed exercises according to PRD:
 * "Typed answers are compared after trimming and ignoring case, accents, and punctuation."
 */

export function normalizeAnswer(text: string): string {
  if (!text) return '';
  return text
    .trim()
    .toLowerCase()
    // Normalize unicode accents: decompose and remove non-spacing marks
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    // Remove punctuation: ¿ ? ¡ ! . , ; : ' " - _
    .replace(/[¿?¡!.,;:’'"\-_(){}[\]]/g, '')
    // Collapse multi-whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

export function compareAnswers(submitted: string, target: string): boolean {
  return normalizeAnswer(submitted) === normalizeAnswer(target);
}
