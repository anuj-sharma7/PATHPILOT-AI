import { Opportunity, StudentProfile } from "@/types";
import { GoogleGenAI } from "@google/genai";

export interface TailoredPitchResult {
  headline: string;
  coverLetterPitch: string;
  resumeBulletPoints: string[];
  talkingPointsForInterviews: string[];
  suggestedPortfolioProjects: string[];
}

/**
 * Deterministic generator for tailored application materials
 */
export function generateDeterministicPitch(
  opp: Opportunity,
  profile?: StudentProfile
): TailoredPitchResult {
  const studentName = profile?.name || "Applicant";
  const degree = profile?.degree || "Engineering Student";
  const branch = profile?.branch || "Computer Science";
  const gradYear = profile?.graduationYear || 2026;
  const matchedSkills = opp.matchBreakdown.matchedSkills.length > 0
    ? opp.matchBreakdown.matchedSkills
    : (profile?.skills?.slice(0, 3) || ["Python", "Problem Solving"]);

  const headline = `${degree} candidate in ${branch} (Class of ${gradYear}) with core strengths in ${matchedSkills.slice(0, 3).join(", ")}`;

  const coverLetterPitch = [
    `Dear Hiring Team / Selection Committee at ${opp.organization},`,
    "",
    `I am writing to express my strong interest in the ${opp.title} program. As a ${degree} student majoring in ${branch} graduating in ${gradYear}, my technical background and practical project experience directly align with your requirements.`,
    "",
    `Having developed applications leveraging ${matchedSkills.join(", ")}, I have built a solid foundation in building maintainable software and solving complex technical challenges. I am particularly drawn to ${opp.organization} because of your focus on ${opp.category === "fellowship" || opp.category === "research" ? "high-impact technical innovation and community development" : "scaling reliable, modern technological solutions"}.`,
    "",
    `In my past work, I have prioritized rigorous code quality, version control best practices, and proactive collaboration. I look forward to contributing effectively to your team during the upcoming cycle.`,
    "",
    `Thank you for your consideration, and I welcome the opportunity to discuss my qualifications further.`,
    "",
    `Sincerely,`,
    `${studentName}`,
  ].join("\n");

  const resumeBulletPoints = [
    `Engineered practical software solutions utilizing ${matchedSkills.slice(0, 2).join(" and ")}, demonstrating strong algorithmic and architectural fundamentals.`,
    `Implemented modular features and automated workflows conforming to modern development standards and collaborative version control (Git).`,
    `Researched and integrated domain tools relevant to ${opp.category} requirements, adhering strictly to performance and eligibility standards.`,
  ];

  const talkingPointsForInterviews = [
    `Discuss direct hands-on experience with ${matchedSkills[0] || "primary technical skill"} in academic/open-source projects.`,
    `Explain motivation for choosing ${opp.organization} and long-term interest in the ${opp.category} domain.`,
    `Address graduation timing (${gradYear}) and readiness for ${opp.workMode} commitment.`,
  ];

  const suggestedPortfolioProjects = [
    `Full-stack or algorithmic implementation highlighting ${matchedSkills.slice(0, 2).join(" and ")} on GitHub with README documentation.`,
    `Demonstration of testing, CI/CD pipeline, or deployment link showcasing end-to-end delivery.`,
  ];

  return {
    headline,
    coverLetterPitch,
    resumeBulletPoints,
    talkingPointsForInterviews,
    suggestedPortfolioProjects,
  };
}

/**
 * AI-enhanced pitch generator using Google GenAI SDK (Gemini) with deterministic fallback
 */
export async function generateTailoredPitchWithAi(
  opp: Opportunity,
  profile?: StudentProfile
): Promise<TailoredPitchResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";

  if (!apiKey || apiKey.trim() === "") {
    return generateDeterministicPitch(opp, profile);
  }

  try {
    const ai = new GoogleGenAI({ apiKey: apiKey.trim() });
    const prompt = `You are an expert technical career advisor and application strategist for university students.
Generate a tailored application pitch and resume talking points for this student applying to the specified opportunity.

STUDENT PROFILE:
- Name: ${profile?.name || "Student"}
- Degree: ${profile?.degree || "B.Tech"} in ${profile?.branch || "Computer Science"}
- Graduation Year: ${profile?.graduationYear || 2026}
- Skills: ${profile?.skills?.join(", ") || "Python, React, Git"}

OPPORTUNITY:
- Title: ${opp.title}
- Organization: ${opp.organization}
- Category: ${opp.category}
- Description & Requirements: ${opp.description}
- Matched Skills: ${opp.matchBreakdown.matchedSkills.join(", ")}

Respond with a JSON object adhering exactly to:
{
  "headline": "concise 1-sentence value proposition",
  "coverLetterPitch": "clean, professional 3-paragraph tailored cover letter pitch",
  "resumeBulletPoints": ["3 targeted resume action bullets"],
  "talkingPointsForInterviews": ["3 tactical interview defense points"],
  "suggestedPortfolioProjects": ["2 portfolio project recommendations"]
}`;

    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: { responseMimeType: "application/json" },
    });

    const text = response.text;
    if (!text) throw new Error("Empty AI pitch response");

    return JSON.parse(text) as TailoredPitchResult;
  } catch (e: any) {
    console.warn("AI pitch generation fallback to deterministic:", e.message);
    return generateDeterministicPitch(opp, profile);
  }
}

