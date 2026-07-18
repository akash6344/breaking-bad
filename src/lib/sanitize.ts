import { MAX_TEXT_LENGTH } from './coach-contract';

export function sanitizeText(value: string): string {
  return value.replace(/[<>]/g, '').trim().slice(0, MAX_TEXT_LENGTH);
}
