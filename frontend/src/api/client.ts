import type { ApiErrorEnvelope } from './types';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

/**
 * Turns the API's error envelope into a single human-readable string.
 * `message` may be a plain string (most errors) or a string[] (Zod
 * validation failures) — see errorHandler.ts. Falls back to a generic
 * message when the body isn't the expected envelope shape at all,
 * so a network failure or an unexpected 500 never surfaces raw text.
 */
function extractErrorMessage(body: unknown, status: number): string {
  if (body && typeof body === 'object' && 'message' in body) {
    const { message } = body as ApiErrorEnvelope;
    if (Array.isArray(message)) return message.join(', ');
    if (typeof message === 'string' && message.trim().length > 0) return message;
  }
  return `Request failed with status ${status}`;
}

export async function apiFetch<T>(path: string, params?: Record<string, string | undefined>): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== '') {
        url.searchParams.set(key, value);
      }
    }
  }

  let res: Response;
  try {
    res = await fetch(url.toString(), {
      headers: { Accept: 'application/json' },
    });
  } catch {
    throw new Error('Could not reach the server. Please check your connection.');
  }

  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    // No/invalid JSON body — fall through to status-based message below.
  }

  if (!res.ok) {
    throw new Error(extractErrorMessage(body, res.status));
  }

  return body as T;
}
