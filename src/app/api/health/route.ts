import { NextResponse } from "next/server";

export async function GET() {
  const hasSerpApiKey = Boolean(process.env.SERPAPI_API_KEY && process.env.SERPAPI_API_KEY.trim().length > 0);
  const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0);
  const geminiModel = process.env.GEMINI_MODEL || "gemini-2.5-flash";

  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "PathPilot AI Opportunity Intelligence Engine",
    version: "1.0.0",
    integrations: {
      serpapi: {
        configured: hasSerpApiKey,
        enginesSupported: ["google", "google_jobs", "google_news", "google_scholar"],
        note: hasSerpApiKey 
          ? "Live search engine connectivity ready." 
          : "SERPAPI_API_KEY is not configured in .env.local. Live searches will prompt or fallback to Demo Mode.",
      },
      gemini: {
        configured: hasGeminiKey,
        model: geminiModel,
        note: hasGeminiKey 
          ? `Grounded LLM analysis enabled using ${geminiModel}.` 
          : "GEMINI_API_KEY is not configured. Deterministic rule-based evidence analysis active.",
      },
    },
  });
}

