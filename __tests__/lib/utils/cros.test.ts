import {
  matchesPattern,
  patternToRegExp,
  getAllowedOrigins,
  getCorsHeaders,
  parseEnvList,
} from "../../../lib/utils/cors";

describe("CORS utils", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─────────────────────────────────────────────────────────────
  // matchesPattern – positive cases (should return true)
  // ─────────────────────────────────────────────────────────────
  describe("matchesPattern", () => {
    const positiveCases: Array<{
      origin: string;
      patterns: string[];
      desc: string;
    }> = [
      {
        origin: "https://example.com",
        patterns: ["https://example.com"],
        desc: "exact match",
      },
      {
        origin: "https://example.com",
        patterns: ["https://example.*"],
        desc: "TLD wildcard",
      },
      {
        origin: "https://example.com",
        patterns: ["**"],
        desc: "universal wildcard",
      },
      {
        origin: "https://example.org",
        patterns: ["https://example.*"],
        desc: "different TLD with wildcard",
      },
      {
        origin: "https://app.example.co.uk",
        patterns: ["https://**.example.*"],
        desc: "deep subdomain + TLD wildcard",
      },
      {
        origin: "http://localhost:3000",
        patterns: ["http://localhost:*"],
        desc: "port wildcard",
      },
      {
        origin: "https://admin.dev.app.example.com",
        patterns: ["https://**.example.com"],
        desc: "deep subdomain with **",
      },
    ];

    positiveCases.map(({ origin, patterns, desc }) => {
      it(`should return true → ${desc}`, () => {
        expect(matchesPattern(origin, patterns)).toBe(true);
      });
    });

    // ─────────────────────────────────────────────────────────
    // matchesPattern – negative cases (should return false)
    // ─────────────────────────────────────────────────────────
    const negativeCases = [
      {
        origin: "https://example.org",
        patterns: ["https://example.com"],
        desc: "exact mismatch",
      },
      {
        origin: "https://evil.com",
        patterns: ["https://example.*"],
        desc: "domain does not match wildcard",
      },
      {
        origin: "http://example.com",
        patterns: ["https://example.com"],
        desc: "wrong protocol",
      },
      {
        origin: "https://example.com.evil.com",
        patterns: ["https://**.example.com"],
        desc: "suffix attack – should NOT match",
      },
      {
        origin: "https://example.com:8080",
        patterns: ["https://example.com"],
        desc: "different port without wildcard",
      },
    ];

    negativeCases.map(({ origin, patterns, desc }) => {
      it(`should return false → ${desc}`, () => {
        expect(matchesPattern(origin, patterns)).toBe(false);
      });
    });
  });

  // ─────────────────────────────────────────────────────────────
  // patternToRegExp – all expected regex strings
  // ─────────────────────────────────────────────────────────────
  describe("patternToRegExp", () => {
    const cases = [
      {
        pattern: "https://example.com",
        expected: `/^https:\\/\\/example.com$/`,
        desc: "exact origin",
      },
      {
        pattern: "https://example.*",
        expected: `/^https:\\/\\/example\..*$/`,
        desc: "TLD wildcard",
      },
      {
        pattern: "**",
        expected: `/^.*$/`,
        desc: "universal wildcard",
      },
      {
        pattern: "https://*.example.com",
        expected: `/^https:\\/\\/.*\.example\.com$/`,
        desc: "single-level subdomain",
      },
      {
        pattern: "https://**.example.com",
        expected: `/^https:\\/\\/.*\.example\.com$/`,
        desc: "multi-level subdomain",
      },
      {
        pattern: "http://localhost:*",
        expected: `/^http:\\/\\/localhost:.*$/`,
        desc: "port wildcard",
      },
    ] as const;

    cases.map(({ pattern, expected, desc }) => {
      it(`converts correctly → ${desc}`, () => {
        const regex = patternToRegExp(pattern);
        expect(regex.toString()).toBe(expected);
      });
    });
  });

  // ─────────────────────────────────────────────────────────────
  // parseEnvList
  // ─────────────────────────────────────────────────────────────
  describe("parseEnvList", () => {
    const positiveCases = [
      { input: "a,b,c", expected: ["a", "b", "c"], desc: "comma separated" },
      {
        input: "  one  ,  two  , three  ",
        expected: ["one", "two", "three"],
        desc: "trims whitespace",
      },
      { input: "single", expected: ["single"], desc: "single value" },
      { input: ",", expected: [], desc: "empty items filtered" },
      { input: " ,  ,  ", expected: [], desc: "only whitespace" },
    ] as const;

    positiveCases.map(({ input, expected, desc }) => {
      it(`parses correctly → ${desc}`, () => {
        expect(parseEnvList(input)).toEqual(expected);
      });
    });

    it("returns fallback when input is undefined", () => {
      expect(parseEnvList(undefined, ["default"])).toEqual(["default"]);
      expect(parseEnvList(undefined)).toEqual([]);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // getAllowedOrigins
  // ─────────────────────────────────────────────────────────────
  describe("getAllowedOrigins", () => {
    it("returns ['**'] in development", () => {
      process.env.NODE_ENV = "development";
      expect(getAllowedOrigins()).toEqual(["**"]);
    });

    it("returns ['**'] even if CORS_ALLOWED_ORIGINS is set in dev", () => {
      process.env.NODE_ENV = "development";
      process.env.CORS_ALLOWED_ORIGINS = "https://example.com";
      expect(getAllowedOrigins()).toEqual(["**"]); // dev wins
    });

    const prodCases = [
      {
        env: "https://app.com,https://admin.app.com",
        expected: ["https://app.com", "https://admin.app.com"],
        desc: "multiple",
      },
      {
        env: "  https://example.com  ",
        expected: ["https://example.com"],
        desc: "trims",
      },
      { env: "", expected: [], desc: "empty string" },
      { env: undefined, expected: [], desc: "undefined" },
    ] as const;

    prodCases.map(({ env, expected, desc }) => {
      it(`in production → ${desc}`, () => {
        process.env.NODE_ENV = "production";
        if (env === undefined) delete process.env.CORS_ALLOWED_ORIGINS;
        else process.env.CORS_ALLOWED_ORIGINS = env;

        expect(getAllowedOrigins()).toEqual(expected);
      });
    });
  });

  // ─────────────────────────────────────────────────────────────
  // getCorsHeaders
  // ─────────────────────────────────────────────────────────────
  describe("getCorsHeaders", () => {
    it("uses defaults when env vars are not set", () => {
      const headers = getCorsHeaders();
      expect(headers["Access-Control-Allow-Methods"]).toBe(
        "GET, POST, PUT, DELETE, PATCH, OPTIONS",
      );
      expect(headers["Access-Control-Allow-Headers"]).toBe(
        "Content-Type, Authorization, X-Requested-With",
      );
    });

    it("respects custom env vars", () => {
      process.env.CORS_ALLOW_METHODS = "GET, HEAD";
      process.env.CORS_ALLOW_HEADERS = "X-Custom, X-API-Key";

      const headers = getCorsHeaders();
      expect(headers["Access-Control-Allow-Methods"]).toBe("GET, HEAD");
      expect(headers["Access-Control-Allow-Headers"]).toBe(
        "X-Custom, X-API-Key",
      );
    });

    it("trims and filters empty values from env", () => {
      process.env.CORS_ALLOW_METHODS = "GET, , POST,  ";
      process.env.CORS_ALLOW_HEADERS = "  , Auth ";

      const headers = getCorsHeaders();
      expect(headers["Access-Control-Allow-Methods"]).toBe("GET, POST");
      expect(headers["Access-Control-Allow-Headers"]).toBe("Auth");
    });
  });
});
