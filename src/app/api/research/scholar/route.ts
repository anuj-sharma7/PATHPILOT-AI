import { NextRequest, NextResponse } from "next/server";
import { ScholarSearchRequestSchema } from "@/lib/schemas";
import { searchGoogleScholar } from "@/lib/serpapi/google-scholar";
import { DEMO_SCHOLAR_ARTICLES } from "@/lib/demo/demo-data";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = ScholarSearchRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid scholar search request", details: validation.error.format() },
        { status: 400 }
      );
    }

    const { query, mode, num } = validation.data;

    if (mode === "demo") {
      return NextResponse.json({
        dataMode: "demo",
        query,
        resultCount: DEMO_SCHOLAR_ARTICLES.length,
        articles: DEMO_SCHOLAR_ARTICLES,
        note: "Sample scholarly articles served from verified demo catalog.",
      });
    }

    const apiKey = process.env.SERPAPI_API_KEY;
    if (!apiKey || apiKey.trim() === "") {
      return NextResponse.json(
        {
          error: "SERPAPI_API_KEY is not configured on the server. Switch to Demo Mode to view sample academic literature citations.",
          canFallbackToDemo: true,
        },
        { status: 401 }
      );
    }

    const articles = await searchGoogleScholar(query, num);

    return NextResponse.json({
      dataMode: "live",
      query,
      resultCount: articles.length,
      articles,
      retrievedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Scholar API handler error:", error);
    return NextResponse.json(
      { error: `Scholar search error: ${error.message || "Unknown error"}` },
      { status: 500 }
    );
  }
}

