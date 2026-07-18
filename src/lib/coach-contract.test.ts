import { describe, expect, it } from 'vitest';
import { validateCoachResponseData } from './coach-contract';

describe('coach response contract', () => {
  it('rejects empty required SOS fields', () => {
    expect(validateCoachResponseData('sos', {
      acknowledgment: '',
      urgeSurfing: 'Breathe',
      replacementAction: 'Stand up',
      cognitiveReframe: 'This will pass',
      intensityAdvice: '',
    })).toBeNull();
  });

  it('accepts an empty intensity message for low-intensity SOS responses', () => {
    expect(validateCoachResponseData('sos', {
      acknowledgment: 'The urge is understandable.',
      urgeSurfing: 'Notice the feeling and breathe slowly.',
      replacementAction: 'Hold a book with both hands.',
      cognitiveReframe: 'An urge is not an instruction.',
      intensityAdvice: '',
    })).toMatchObject({ intensityAdvice: '' });
  });

  it('rejects invalid weekly trend values', () => {
    expect(validateCoachResponseData('weekly', {
      trend: 'unknown',
      keyInsight: 'One sentence',
      strongestDay: 'Monday',
      watchOutFor: 'Evenings',
      encouragement: 'Keep going',
    })).toBeNull();
  });
});
