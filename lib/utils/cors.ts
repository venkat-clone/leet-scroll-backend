// utils/cors.ts
/** Parse a comma‑separated list from an environment variable */
export function parseEnvList(
  envVar?: string,
  fallback: string[] = [],
): string[] {
  if (!envVar) return fallback;
  return envVar
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Convert a simple wildcard pattern to a RegExp */
export function patternToRegExp(pattern: string): RegExp {
  const escaped = pattern
    .replace(".", `\.`)
    .replace(/\*/g, ".*")
    .replace(".*.*", ".*");
  return new RegExp(`^${escaped}$`);
}

/** Test an origin against a list that may contain wild‑cards */
export function matchesPattern(origin: string, allowList: string[]): boolean {
  return allowList.some((item) => {
    if (item.includes("*")) {
      const re = patternToRegExp(item);
      return re.test(origin);
    }
    return item === origin;
  });
}

/** Retrieve allowed origins – dev defaults or env var */
export function getAllowedOrigins(): string[] {
  if (process.env.NODE_ENV === "development") {
    // Allow any origin in development (wild‑card)
    return ["**"];
  }
  return parseEnvList(process.env.CORS_ALLOWED_ORIGINS, []);
}

/** Build CORS headers – can be overridden via env vars */
export function getCorsHeaders(): Record<string, string> {
  const methods = parseEnvList(process.env.CORS_ALLOW_METHODS, [
    "GET",
    "POST",
    "PUT",
    "DELETE",
    "PATCH",
    "OPTIONS",
  ]).join(", ");

  const headers = parseEnvList(process.env.CORS_ALLOW_HEADERS, [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
  ]).join(", ");

  return {
    "Access-Control-Allow-Methods": methods,
    "Access-Control-Allow-Headers": headers,
  };
}
