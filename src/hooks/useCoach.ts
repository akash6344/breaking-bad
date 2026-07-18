import { useCallback, useEffect, useRef, useState } from 'react';
import { requestCoach } from '../lib/coach';
import type { CoachRequest, CoachResponse, CoachResult } from '../types';

export function useCoach<T extends CoachResponse>() {
  const [result, setResult] = useState<CoachResult<T> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generatedAt, setGeneratedAt] = useState('');
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => () => controllerRef.current?.abort(), []);

  const abort = useCallback(() => {
    controllerRef.current?.abort();
  }, []);

  const clear = useCallback(() => {
    controllerRef.current?.abort();
    setResult(null);
    setError('');
    setLoading(false);
    setGeneratedAt('');
  }, []);

  const run = useCallback(async (request: CoachRequest) => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setLoading(true);
    setError('');
    try {
      const next = await requestCoach<T>(request, controller.signal);
      setResult(next);
      setGeneratedAt(new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }));
      return next;
    } catch (caught) {
      if (!(caught instanceof DOMException && caught.name === 'AbortError')) {
        setError(caught instanceof Error ? caught.message : 'Please try again.');
      }
      return null;
    } finally {
      if (controllerRef.current === controller) setLoading(false);
    }
  }, []);

  return { result, loading, error, generatedAt, run, clear, abort };
}
