// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const allowedOrigins = [
  "https://portofoliomukti.framer.website",
  "https://portofolioku2-astro-theme.vercel.app",
];

export function middleware(request: NextRequest) {
  const origin = request.headers.get("origin") || "";
  const response = NextResponse.next();

  if (allowedOrigins.includes(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
  }

  response.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type");

  // Menangani preflight OPTIONS
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: response.headers,
    });
  }

  return response;
}
