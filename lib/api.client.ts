export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
}

export async function apiRequest<T>(
  url: string,
  options: {
    method?: string;
    data?: unknown;
    headers?: Record<string, string>;
  } = {},
): Promise<ApiResponse<T>> {
  const { method = "GET", data, headers = {} } = options;

  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: data !== undefined ? JSON.stringify(data) : undefined,
  });

  const json = await res.json();
  return json as ApiResponse<T>;
}

export async function apiGet<T>(
  url: string,
  params: Record<string, string> = {},
): Promise<ApiResponse<T>> {
  const query = new URLSearchParams(params).toString();
  const fullUrl = query ? `${url}?${query}` : url;
  return apiRequest<T>(fullUrl, { method: "GET" });
}
