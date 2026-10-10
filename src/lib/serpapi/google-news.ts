import { fetchSerpApi } from "./client";
import { Opportunity, OpportunityCategory, EvidenceItem } from "@/types";
import { extractDomain, detectCategoryFromText, detectDeadlineFromText } from "./google-search";

interface GoogleNewsResult {
  position?: number;
  title?: string;
  link?: string;
  snippet?: string;
  source?: {
    name?: string;
    icon?: string;
    authors?: string[];
  };
  date?: string;
  thumbnail?: string;
}

interface GoogleNewsResponse {
  news_results?: GoogleNewsResult[];
  error?: string;
}

export async function searchGoogleNews(
  query: string,
  preferredCategory?: OpportunityCategory
): Promise<Opportunity[]> {
  const params = {
    engine: "google_news" as const,
    q: query,
    gl: "in",
    hl: "en",
  };

  const response = await fetchSerpApi<GoogleNewsResponse>(params);
  const results = response.news_results || [];
  const retrievedAt = new Date().toISOString();

  return results
    .filter((news) => news.title && news.link)
    .slice(0, 5)
    .map((news, index) => {
      const title = news.title || "Opportunity Announcement";
      const snippet = news.snippet || "";
      const domain = extractDomain(news.link);
      const category = detectCategoryFromText(`${title} ${snippet}`, preferredCategory || "fellowship");
      const deadlineInfo = detectDeadlineFromText(`${title} ${snippet}`);

      const evidenceItem: EvidenceItem = {
        id: `ev-news-${index}`,
        claim: `Recent public announcement: "${title}" reported by ${news.source?.name || domain}.`,
        status: "supported",
        sourceUrl: news.link,
        sourceDomain: domain,
        sourceSnippet: snippet || `Press announcement reported by ${news.source?.name || domain}.`,
        sourceEngine: "google_news",
        publishedAt: news.date,
        retrievedAt,
        confidenceNote: "Verified announcement published in Google News index.",
      };

      const verificationItem: EvidenceItem = {
        id: `ev-news-verify-${index}`,
        claim: "Official registration portal link & eligibility guidelines.",
        status: "needs_verification",
        sourceUrl: news.link,
        sourceDomain: domain,
        sourceEngine: "google_news",
        retrievedAt,
        limitations: "News articles report on programs but may not host the primary application form.",
        confidenceNote: "Locate primary program URL referenced inside the article.",
      };

      return {
        id: `opp-news-${Buffer.from(news.link || String(index)).toString("base64").slice(0, 16)}`,
        title,
        organization: news.source?.name || domain,
        category,
        description: snippet || "Recent opportunity announcement from news coverage.",
        originalUrl: news.link || "",
        sourceDomain: domain,
        location: "India / Global",
        workMode: "unspecified",
        skills: ["Initiative", "Domain Knowledge"],
        requirements: ["Check official program application link inside press release"],
        deadline: deadlineInfo.deadline,
        deadlineStatus: deadlineInfo.status,
        deadlineNotes: deadlineInfo.note,
        publishedAt: news.date,
        retrievedAt,
        sourceEngine: "google_news",
        matchScore: 68,
        matchBreakdown: {
          skillsScore: 65,
          eligibilityScore: 70,
          interestScore: 70,
          locationScore: 75,
          experienceScore: 65,
          totalScore: 68,
          isProvisional: true,
          provisionalReason: "News announcement requires navigating to official program portal.",
          matchedSkills: [],
          missingSkills: [],
          matchedInterests: [],
          notes: [`Reported by ${news.source?.name || domain} on ${news.date || "recent date"}`],
        },
        matchExplanation: `Recent announcement discovered in Google News. Review the article for primary application deadlines.`,
        missingRequirements: ["Confirm program portal link from the article"],
        evidenceItems: [evidenceItem, verificationItem],
        sourceQualityNotes: `News coverage via ${news.source?.name || domain}.`,
        dataMode: "live",
      };
    });
}

