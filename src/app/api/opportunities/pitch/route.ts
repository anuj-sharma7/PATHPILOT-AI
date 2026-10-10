import { NextRequest, NextResponse } from "next/server";
import { generateTailoredPitchWithAi } from "@/lib/ai/pitch-generator";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { opportunity, profile } = body;

    if (!opportunity || !opportunity.id) {
      return NextResponse.json({ error: "Opportunity payload is required" }, { status: 400 });
    }

    const pitch = await generateTailoredPitchWithAi(opportunity, profile);

    return NextResponse.json({
      opportunityId: opportunity.id,
      pitch,
      generatedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: `Pitch generator error: ${err.message || "Unknown error"}` },
      { status: 500 }
    );
  }
}

