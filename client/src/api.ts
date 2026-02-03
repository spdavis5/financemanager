const API_BASE = "/api";

// Fetch wrapper that always includes credentials for session cookies
export async function apiFetch(
  endpoint: string,
  options: RequestInit = {},
): Promise<Response> {
  const url = endpoint.startsWith("/")
    ? `${API_BASE}${endpoint}`
    : `${API_BASE}/${endpoint}`;

  return fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
}

export { API_BASE };
