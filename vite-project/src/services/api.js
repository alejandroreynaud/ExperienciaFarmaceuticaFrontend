function joinUrl(base, path) {
  const normalizedBase = base.replace(/\/$/, "");
  const normalizedPath = path.replace(/^\//, "");
  return `${normalizedBase}/${normalizedPath}`;
}

function buildUrl(path) {
  if (/^https?:\/\//i.test(path)) return path;
  const baseUrl = import.meta.env.VITE_API_URL || "/api";
  return joinUrl(baseUrl, path);
}

async function parseResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const payload = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const message =
      (isJson && payload && (payload.message || payload.error)) ||
      `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return payload;
}

export async function apiRequest(path, options = {}) {
  const method = options.method || "GET";
  const config = {
    method,
    ...(String(method).toUpperCase() === "GET" ? { cache: "no-store" } : {}),
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  };

  const response = await fetch(buildUrl(path), config);
  return parseResponse(response);
}