export function isAbortError(caught: unknown): boolean {
  return caught instanceof DOMException && caught.name === 'AbortError';
}

export function toUserErrorMessage(caught: unknown, fallback = 'Please try again.'): string {
  return caught instanceof Error ? caught.message : fallback;
}
