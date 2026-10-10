/**
 * SerpApi Client for PathPilot AI
 * Official documentation: https://serpapi.com/search-api
 * 
 * Secure server-side client with timeouts, defensive error checking,
 * and rate-limit awareness. Never exposes API keys to client-side code.
 */

const SERPAPI_BASE_URL = "https://serpapi.com/search.json";
const DEFAULT_TIMEOUT_MS = 12000;

export interface SerpApiRequestParams {
  engine: "google" | "google_jobs" | "google_news" | "google_scholar";
  q?: string;
  query?: string;
  location?: string;
  gl?: string;
  hl?: string;
  num?: number;
  start?: number;
  [key: string]: string | number | boolean | undefined;
}

export class SerpApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public engine?: string,
    public rawError?: unknown
  ) {
    super(message);
    this.name = "SerpApiError";
  }
}

export async function fetchSerpApi<T = any>(
  params: SerpApiRequestParams,
  timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<T> {
  const apiKey = process.env.SERPAPI_API_KEY;

  if (!apiKey || apiKey.trim() === "") {
    throw new SerpApiError(
      "SERPAPI_API_KEY is not configured on the server. Please add your key to .env.local to enable live searches, or switch to Demo Mode.",
      401,
      params.engine
    );
  }

  const searchParams = new URLSearchParams();
  searchParams.set("api_key", apiKey.trim());
  searchParams.set("output", "json");

  // Handle engine specific query naming
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, String(value));
    }
  }

  const url = `${SERPAPI_BASE_URL}?${searchParams.toString()}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "User-Agent": "PathPilotAI-Agent/1.0",
      },
      signal: controller.signal,
      // Cache searches briefly (e.g., 60 seconds) in production to conserve search credits
      next: { revalidate: 60 },
    });

    clearTimeout(timer);

    if (!response.ok) {
      let errorMessage = `SerpApi returned HTTP ${response.status}: ${response.statusText}`;
      try {
        const errJson = await response.json();
        if (errJson.error) {
          errorMessage = `SerpApi Error: ${errJson.error}`;
        }
      } catch {
        // ignore JSON parse error on non-OK response
      }

      if (response.status === 401 || response.status === 403) {
        throw new SerpApiError(
          "Invalid or unauthorized SerpApi key. Please check your SERPAPI_API_KEY configuration.",
          response.status,
          params.engine
        );
      }

      if (response.status === 429) {
        throw new SerpApiError(
          "SerpApi rate limit or monthly account quota exceeded.",
          429,
          params.engine
        );
      }

      throw new SerpApiError(errorMessage, response.status, params.engine);
    }

    const data = await response.json();

    if (data.error) {
      throw new SerpApiError(`SerpApi response error: ${data.error}`, 400, params.engine);
    }

    return data as T;
  } catch (error: any) {
    clearTimeout(timer);

    if (error.name === "AbortError") {
      throw new SerpApiError(
        `Search request timed out after ${timeoutMs / 1000}s while querying ${params.engine}.`,
        504,
        params.engine
      );
    }

    if (error instanceof SerpApiError) {
      throw error;
    }

    throw new SerpApiError(
      `Failed to connect to SerpApi: ${error.message || "Unknown network error"}`,
      500,
      params.engine,
      error
    );
  }
}

