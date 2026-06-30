import { retrieveAuthToken } from './storage';

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8080';

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<{ success: true; data: T } | { success: false; error: string; status: number }> {
  try {
    const token = await retrieveAuthToken();

    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers ?? {})
      }
    });

    const json = await response.json() as Record<string, unknown>;

    if (!response.ok) {
      return {
        success: false,
        error: (json['error'] as string) ?? `HTTP ${response.status}`,
        status: response.status
      };
    }

    return { success: true, data: json as T };
  } catch (err) {
    console.error(`[API Fetch Exception] ${path}:`, err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Network error.',
      status: 0
    };
  }
}
