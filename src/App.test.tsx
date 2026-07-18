import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { requestCoach } from './lib/coach';

vi.mock('./lib/coach', () => ({ requestCoach: vi.fn() }));

const mockedRequestCoach = vi.mocked(requestCoach);

afterEach(cleanup);

function completeOnboarding(goal = 'Read more') {
  fireEvent.change(screen.getByPlaceholderText('Late-night phone scrolling'), { target: { value: 'Scrolling' } });
  fireEvent.change(screen.getByPlaceholderText('Stress after work'), { target: { value: 'Stress' } });
  fireEvent.change(screen.getByPlaceholderText('Read before bed instead'), { target: { value: goal } });
  fireEvent.change(screen.getByPlaceholderText('After 9pm'), { target: { value: 'After 9pm' } });
  fireEvent.click(screen.getByRole('button', { name: 'Create my plan' }));
}

describe('BreakFree onboarding', () => {
  beforeEach(() => {
    window.localStorage.clear();
    mockedRequestCoach.mockReset();
  });

  it('stores a completed profile and opens the dashboard', () => {
    render(<App />);
    completeOnboarding();
    expect(screen.getByRole('heading', { name: 'A craving is a wave. Let’s get through this one.' })).toBeInTheDocument();
  });

  it('keeps the full goal visible in a multiline field', () => {
    render(<App />);
    const goal = 'Start tasks within 5 minutes of thinking about them';
    fireEvent.change(screen.getByLabelText(/Your goal/), { target: { value: goal } });
    expect(screen.getByLabelText(/Your goal/)).toHaveValue(goal);
  });

  it('requires an explicit check-in outcome and exposes editable ranges', () => {
    render(<App />);
    completeOnboarding();

    const mood = screen.getByRole('slider', { name: 'Mood from 1 to 5' });
    fireEvent.change(mood, { target: { value: '4' } });
    expect(mood).toHaveValue('4');

    fireEvent.change(screen.getByLabelText(/What triggered you/), { target: { value: 'A difficult meeting' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save check-in & get a nudge' }));
    expect(screen.getByText('Choose what happened today.')).toBeInTheDocument();
    expect(mockedRequestCoach).not.toHaveBeenCalled();
  });

  it('clears generated advice when a plan is reset without clearing unrelated storage', async () => {
    mockedRequestCoach.mockResolvedValue({
      source: 'ai',
      data: {
        acknowledgment: 'Old scrolling context',
        urgeSurfing: 'Notice the urge.',
        replacementAction: 'Grab your old book.',
        cognitiveReframe: 'This urge will pass.',
        intensityAdvice: '',
      },
    });
    window.localStorage.setItem('unrelated.preference', 'keep-me');
    render(<App />);
    completeOnboarding('Read before bed');

    fireEvent.click(screen.getByRole('button', { name: 'I need support now' }));
    expect(await screen.findByText('Grab your old book.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Reset plan' }));
    expect(screen.getByRole('alertdialog')).toHaveTextContent('permanently deletes this plan and its check-in history');
    fireEvent.click(screen.getByRole('button', { name: 'Reset and delete' }));
    completeOnboarding('Start important tasks promptly');

    await waitFor(() => expect(screen.queryByText('Grab your old book.')).not.toBeInTheDocument());
    expect(window.localStorage.getItem('unrelated.preference')).toBe('keep-me');
  });
});
