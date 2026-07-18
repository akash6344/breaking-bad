import { describe, expect, it } from 'vitest';
import { cleanOptionalText, sanitizeText } from './coach-contract';

describe('sanitizeText', () => {
  it('strips markup characters and bounds length', () => {
    expect(sanitizeText('  hello<script>  ')).toBe('helloscript');
    expect(sanitizeText('x'.repeat(200))).toHaveLength(160);
  });
});

describe('cleanOptionalText', () => {
  it('rejects empty or non-string values after cleaning', () => {
    expect(cleanOptionalText('  hi  ')).toBe('hi');
    expect(cleanOptionalText('   ')).toBeNull();
    expect(cleanOptionalText(12)).toBeNull();
  });
});
