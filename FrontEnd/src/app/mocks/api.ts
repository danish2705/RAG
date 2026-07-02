const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

export async function apiFetch<T = any>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, options);

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(
      body?.error || `Request failed with status ${response.status}`,
    );
  }

  return response.json();
}
