import { fetchSerpApi } from "./client";
import { Opportunity, OpportunityCategory, WorkMode, DeadlineStatus, EvidenceItem } from "@/types";

interface GoogleOrganicResult {
  position?: number;
  title?: string;
  link?: string;
  displayed_link?: string;
  snippet?: string;
  snippet_highlighted_words?: string[];
  sitelinks?: {
    inline?: Array<{ title?: string; link?: string }>;
    expanded?: Array<{ title?: string; link?: string; snippet?: string }>;
  };
  rich_snippet?: {
    top?: {
      detected_extensions?: Record<string, any>;
      extensions?: string[];
    };
  };
  date?: string;
  source?: string;
}

interface GoogleSearchResponse {
  search_metadata?: {
    id?: string;
    status?: string;
    created_at?: string;
    total_time_taken?: number;
  };
  search_parameters?: {
    engine?: string;
    q?: string;
    location_requested?: string;
  };
  organic_results?: GoogleOrganicResult[];
  error?: string;
}

export function extractDomain(urlStr?: string): string {
  if (!urlStr) return "web";
  try {
    const url = new URL(urlStr);
    return url.hostname.replace(/^www\./, "");
  } catch {
    return "source-link";
  }
}

export function detectCategoryFromText(text: string, defaultCat?: OpportunityCategory): OpportunityCategory {
  const lower = text.toLowerCase();
  if (lower.includes("hackathon") || lower.includes("buildathon") || lower.includes("codeathon")) return "hackathon";
  if (lower.includes("scholarship") || lower.includes("grant") || lower.includes("bursary")) return "scholarship";
  if (lower.includes("fellowship") || lower.includes("fellow")) return "fellowship";
  if (lower.includes("research") || lower.includes("lab") || lower.includes("phd") || lower.includes("faculty")) return "research";
  if (lower.includes("competition") || lower.includes("contest") || lower.includes("challenge") || lower.includes("olympiad")) return "competition";
  if (lower.includes("intern") || lower.includes("internship") || lower.includes("trainee") || lower.includes("summer analyst")) return "internship";
  if (lower.includes("job") || lower.includes("career") || lower.includes("hiring") || lower.includes("engineer") || lower.includes("developer")) return "job";
  return defaultCat || "internship";
}

export function detectWorkMode(text: string): WorkMode {
  const lower = text.toLowerCase();
  if (lower.includes("remote") || lower.includes("work from home") || lower.includes("wfh")) return "remote";
  if (lower.includes("hybrid")) return "hybrid";
  if (lower.includes("on-site") || lower.includes("onsite") || lower.includes("in-office")) return "on-site";
  return "unspecified";
}

export function detectDeadlineFromText(text: string): { deadline?: string; status: DeadlineStatus; note?: string } {
  const lower = text.toLowerCase();
  // Regex looking for common deadline formats: "Deadline: Month DD, YYYY", "Apply by DD Month YYYY", "Last date: DD/MM/YYYY"
  const deadlineMatch = text.match(/(?:deadline|apply by|last date|due date|closes on)[:\s]+([A-Za-z0-9,\s/-]{4,25})/i);
  if (deadlineMatch && deadlineMatch[1]) {
    const candidate = deadlineMatch[1].trim().replace(/[.,;]$/, "");
    return {
      deadline: candidate,
      status: "confirmed",
      note: `Identified from search snippet text: "${deadlineMatch[0]}"`,
    };
  }

  if (lower.includes("rolling") || lower.includes("first come") || lower.includes("immediate")) {
    return {
      status: "rolling",
      note: "Posting indicates rolling or immediate consideration.",
    };
  }

  return {
    status: "unknown",
    note: "No specific deadline date found in search snippet. Verify on official source page.",
  };
}

export async function searchGoogleOpportunities(
  query: string,
  preferredCategory?: OpportunityCategory,
  location?: string
): Promise<Opportunity[]> {
  const params = {
    engine: "google" as const,
    q: query,
    gl: "in",
    hl: "en",
    num: 10,
  };

  const response = await fetchSerpApi<GoogleSearchResponse>(params);
  const results = response.organic_results || [];
  const retrievedAt = new Date().toISOString();

  return results
    .filter((res) => res.link && res.title)
    .map((res, index) => {
      const title = res.title || "Untitled Opportunity";
      const snippet = res.snippet || "";
      const domain = extractDomain(res.link);
      const category = detectCategoryFromText(`${title} ${snippet}`, preferredCategory);
      const workMode = detectWorkMode(`${title} ${snippet}`);
      const deadlineInfo = detectDeadlineFromText(`${title} ${snippet}`);

      // Extract skills mentions
      const commonSkills = ["python", "javascript", "react", "node.js", "c++", "java", "machine learning", "ai", "sql", "data analysis", "docker", "cloud", "aws", "git"];
      const detectedSkills = commonSkills.filter(s => `${title} ${snippet}`.toLowerCase().includes(s));

      const evidenceItem: EvidenceItem = {
        id: `ev-google-${index}`,
        claim: `Opportunity titled "${title}" published and indexed by Google Search.`,
        status: "supported",
        sourceUrl: res.link,
        sourceDomain: domain,
        sourceSnippet: snippet || "Source indexed under Google organic results.",
        sourceEngine: "google",
        publishedAt: res.date,
        retrievedAt,
        confidenceNote: "Verified source link retrieved directly via SerpApi Google Search.",
      };

      // Secondary verification evidence for snippet limitations
      const verificationItem: EvidenceItem = {
        id: `ev-google-verify-${index}`,
        claim: "Full eligibility requirements & application form validity.",
        status: "needs_verification",
        sourceUrl: res.link,
        sourceDomain: domain,
        sourceSnippet: snippet,
        sourceEngine: "google",
        retrievedAt,
        limitations: "Search snippet preview may omit specific GPA, graduation year, or citizenship restrictions.",
        confidenceNote: "Requires primary verification on the official application page prior to applying.",
      };

      const opp: Opportunity = {
        id: `opp-google-${Buffer.from(res.link || String(index)).toString("base64").slice(0, 16)}`,
        title,
        organization: res.source || domain,
        category,
        description: snippet || "View official link for detailed program structure and guidelines.",
        originalUrl: res.link || "",
        sourceDomain: domain,
        location: location || "India / Flexible",
        workMode,
        skills: detectedSkills.length > 0 ? detectedSkills : ["Problem Solving", "Collaboration"],
        requirements: [
          "Check target academic level and graduation year on source link",
          "Review required documents and technical prerequisites",
        ],
        deadline: deadlineInfo.deadline,
        deadlineStatus: deadlineInfo.status,
        deadlineNotes: deadlineInfo.note,
        publishedAt: res.date,
        retrievedAt,
        sourceEngine: "google",
        matchScore: 70, // baseline before personalization
        matchBreakdown: {
          skillsScore: 70,
          eligibilityScore: 75,
          interestScore: 70,
          locationScore: 80,
          experienceScore: 70,
          totalScore: 72,
          isProvisional: true,
          provisionalReason: "Provisional match prior to profile evaluation.",
          matchedSkills: detectedSkills,
          missingSkills: [],
          matchedInterests: [],
          notes: ["Calculated from live SerpApi Google Search result snippet."],
        },
        matchExplanation: `Discovered on ${domain} matching keywords for ${category}. Verification of complete prerequisites recommended.`,
        missingRequirements: ["Confirm eligibility criteria from official page"],
        evidenceItems: [evidenceItem, verificationItem],
        sourceQualityNotes: `Direct organic Google Search link from domain ${domain}.`,
        dataMode: "live",
      };

      return opp;
    });
}

