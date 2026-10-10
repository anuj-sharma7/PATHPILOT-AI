import { GoogleGenAI } from "@google/genai";
import { Opportunity, StudentProfile } from "@/types";
import { AiEvidenceAnalysisSchema as ZodAiEvidenceSchema } from "../schemas";

export interface GroundedEvidenceAnalysis {
  summaryRationale: string;
  supportedClaims: Array<{
    claim: string;
    sourceText: string;
    significance: string;
  }>;
  unknownRequirements: Array<{
    requirement: string;
    whyUnknown: string;
    verificationAdvice: string;
  }>;
  potentialIneligibilities: string[];
  deadlineAssessment: {
    confirmedDeadline: string | null;
    confidence: "high" | "medium" | "low" | "unconfirmed";
    sourceContext: string;
  };
  actionChecklist: Array<{
    task: string;
    category: "eligibility" | "materials" | "submission" | "verification";
    importance: "critical" | "recommended" | "optional";
  }>;
  modelUsed?: string;
  groundedInLiveEvidence: boolean;
}

/**
 * Deterministic fallback analysis used when Gemini API key is missing,
 * unconfigured, or when the API call fails/times out.
 * Never pretends that an LLM call completed if it did not.
 */
export function generateDeterministicEvidenceAnalysis(
  opp: Opportunity,
  profile?: StudentProfile
): GroundedEvidenceAnalysis {
  const supportedClaims = [
    {
      claim: `Role/Opportunity title "${opp.title}" hosted by ${opp.organization}.`,
      sourceText: opp.evidenceItems[0]?.sourceSnippet || opp.description.slice(0, 200),
      significance: "Directly verified against indexed search listing.",
    },
    {
      claim: `Categorized as ${opp.category} with location: ${opp.location}.`,
      sourceText: `Source domain: ${opp.sourceDomain}. Mode: ${opp.workMode}.`,
      significance: "Structural parameter retrieved from live search metadata.",
    },
  ];

  const unknownRequirements = [
    {
      requirement: "Exact minimum GPA / Academic percentage threshold",
      whyUnknown: "GPA cutoffs are rarely published in search index snippets.",
      verificationAdvice: "Inspect eligibility section on the official portal link.",
    },
    {
      requirement: "Specific graduation batch restrictions (e.g., only 2026 vs 2027)",
      whyUnknown: "Snippet provides summary description without full batch criteria.",
      verificationAdvice: `Confirm if batch of ${profile?.graduationYear || 2026} is strictly accepted.`,
    },
  ];

  const potentialIneligibilities: string[] = [];
  if (profile?.workMode === "remote" && opp.workMode === "on-site") {
    potentialIneligibilities.push("In-person attendance requirement conflicts with your remote work preference.");
  }
  if (opp.requirements.some((r) => r.toLowerCase().includes("graduate") && profile?.educationLevel === "undergraduate")) {
    potentialIneligibilities.push("Opportunity may target graduate/postgraduate candidates.");
  }

  const deadlineAssessment = {
    confirmedDeadline: opp.deadline || null,
    confidence: opp.deadline ? ("medium" as const) : ("unconfirmed" as const),
    sourceContext: opp.deadlineNotes || "No explicit deadline string identified in preview snippet.",
  };

  const actionChecklist = [
    {
      task: `Verify official application guidelines on ${opp.sourceDomain}`,
      category: "eligibility" as const,
      importance: "critical" as const,
    },
    {
      task: `Confirm eligibility for ${profile?.degree || "your degree"} (${profile?.branch || "your discipline"})`,
      category: "eligibility" as const,
      importance: "critical" as const,
    },
    {
      task: `Tailor resume to emphasize matching skills: ${(opp.matchBreakdown.matchedSkills.length ? opp.matchBreakdown.matchedSkills : opp.skills).slice(0, 3).join(", ")}`,
      category: "materials" as const,
      importance: "recommended" as const,
    },
    {
      task: "Check deadline countdown and prepare transcript/portfolio",
      category: "verification" as const,
      importance: "recommended" as const,
    },
  ];

  return {
    summaryRationale: opp.matchExplanation,
    supportedClaims,
    unknownRequirements,
    potentialIneligibilities,
    deadlineAssessment,
    actionChecklist,
    groundedInLiveEvidence: false, // Explicitly false for deterministic fallback
  };
}

/**
 * AI-powered grounded evidence analysis using the official Google GenAI SDK.
 * Strictly adheres to grounding rules: does not invent unbacked facts.
 */
export async function analyzeOpportunityWithGemini(
  opp: Opportunity,
  profile?: StudentProfile
): Promise<GroundedEvidenceAnalysis> {
  const apiKey = process.env.GEMINI_API_KEY;
  const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";

  if (!apiKey || apiKey.trim() === "") {
    return generateDeterministicEvidenceAnalysis(opp, profile);
  }

  try {
    const ai = new GoogleGenAI({ apiKey: apiKey.trim() });

    const prompt = `You are the PathPilot AI Evidence & Eligibility Analysis Agent.
Analyze the following student opportunity strictly based on the provided search evidence and student profile.

CRITICAL GROUNDING RULES:
1. ONLY claim a fact is "supported" if it appears directly in the provided Opportunity Data or Source Snippets.
2. DO NOT hallucinate eligibility requirements, GPA limits, deadlines, or stipends that are not in the text.
3. If an important detail is missing from the search snippet, categorize it as an "unknown requirement" and tell the student what to verify on the official link.
4. Output valid JSON adhering exactly to the requested schema.

STUDENT PROFILE:
- Education Level: ${profile?.educationLevel || "Undergraduate"}
- Degree: ${profile?.degree || "B.Tech/BS"}
- Branch: ${profile?.branch || "Computer Science"}
- Graduation Year: ${profile?.graduationYear || 2026}
- Skills: ${profile?.skills?.join(", ") || "Python, React"}
- Preferred Work Mode: ${profile?.workMode || "Unspecified"}

OPPORTUNITY DATA:
- Title: ${opp.title}
- Organization: ${opp.organization}
- Category: ${opp.category}
- Work Mode: ${opp.workMode}
- Location: ${opp.location}
- Source Domain: ${opp.sourceDomain}
- Snippet & Description: ${opp.description}
- Published Deadline: ${opp.deadline || "None found in snippet"}
- Deadline Status: ${opp.deadlineStatus}
- Known Requirements from snippet: ${JSON.stringify(opp.requirements)}
- Evidence Snippets: ${JSON.stringify(opp.evidenceItems.map(e => ({ claim: e.claim, snippet: e.sourceSnippet })))}

Respond with a JSON object with these exact keys:
{
  "summaryRationale": "string (why it fits or gaps)",
  "supportedClaims": [
    { "claim": "string", "sourceText": "string", "significance": "string" }
  ],
  "unknownRequirements": [
    { "requirement": "string", "whyUnknown": "string", "verificationAdvice": "string" }
  ],
  "potentialIneligibilities": ["string"],
  "deadlineAssessment": {
    "confirmedDeadline": "string or null",
    "confidence": "high" | "medium" | "low" | "unconfirmed",
    "sourceContext": "string"
  },
  "actionChecklist": [
    {
      "task": "string",
      "category": "eligibility" | "materials" | "submission" | "verification",
      "importance": "critical" | "recommended" | "optional"
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("Empty response returned by Gemini model");
    }

    const parsedJson = JSON.parse(text);
    const validated = ZodAiEvidenceSchema.parse(parsedJson);

    return {
      ...validated,
      modelUsed: modelName,
      groundedInLiveEvidence: true,
    };
  } catch (err: any) {
    console.warn("Gemini evidence analysis failed or timed out, using grounded fallback:", err.message);
    const fallback = generateDeterministicEvidenceAnalysis(opp, profile);
    fallback.summaryRationale += " (Deterministic rule-based analysis: Gemini API unavailable or unconfigured)";
    return fallback;
  }
}
