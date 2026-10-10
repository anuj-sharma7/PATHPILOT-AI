import { NextRequest, NextResponse } from "next/server";
import { AnalyzeOpportunityRequestSchema } from "@/lib/schemas";
import { analyzeOpportunityWithGemini } from "@/lib/ai/gemini";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = AnalyzeOpportunityRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid opportunity analysis request", details: validation.error.format() },
        { status: 400 }
      );
    }

    const { opportunity, profile } = validation.data;

    // Run grounded evidence analysis
    const analysis = await analyzeOpportunityWithGemini(opportunity, profile);

    return NextResponse.json({
      opportunityId: opportunity.id,
      analysis,
      analyzedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Analyze API handler error:", error);
    return NextResponse.json(
      { error: `Analysis failed: ${error.message || "Unknown error"}` },
      { status: 500 }
    );
  }
}

