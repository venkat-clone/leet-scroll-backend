import { NextRequest, NextResponse } from "next/server";

import {
  matchesPattern,
  getAllowedOrigins,
  getCorsHeaders,
} from "./lib/utils/cors";
export function middleware(request: NextRequest) {
  const origin = request.headers.get("origin") || "";

  // Debug logging – can be silenced by setting CORS_DEBUG to "false"
  if (process.env.CORS_DEBUG !== "false") {
    console.log("[CORS] Request origin:", origin);
  }

  const allowedOrigins = getAllowedOrigins();
  const isAllowedOrigin = matchesPattern(origin, allowedOrigins);

  const corsHeaders = getCorsHeaders();

  // Handle preflight (OPTIONS) requests
  if (request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 200,
      headers: {
        ...(isAllowedOrigin && { "Access-Control-Allow-Origin": origin }),
        ...corsHeaders,
      },
    });
  }

  // Handle actual requests
  const response = NextResponse.next();

  if (isAllowedOrigin) {
    response.headers.set("Access-Control-Allow-Origin", origin);
  } else {
    console.log("[CORS] Forbidden origin:", origin);
  }

  // Apply the generic CORS headers to every response
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

/**
 * Next.js middleware configuration – matches all API routes.
 */
export const config = {
  matcher: "/api/:path*",
};
