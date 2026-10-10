import { fetchSerpApi } from "./client";
import { ScholarArticle } from "@/types";

interface GoogleScholarResult {
  position?: number;
  title?: string;
  link?: string;
  snippet?: string;
  publication_info?: {
    summary?: string;
    authors?: Array<{ name?: string; link?: string }>;
  };
  inline_links?: {
    cited_by?: {
      total?: number;
      link?: string;
    };
    related_pages_link?: string;
    versions?: {
      total?: number;
      link?: string;
    };
  };
}

interface GoogleScholarResponse {
  search_metadata?: {
    id?: string;
    status?: string;
  };
  organic_results?: GoogleScholarResult[];
  error?: string;
}

export async function searchGoogleScholar(
  query: string,
  num = 10
): Promise<ScholarArticle[]> {
  const params = {
    engine: "google_scholar" as const,
    q: query,
    hl: "en",
    num,
  };

  const response = await fetchSerpApi<GoogleScholarResponse>(params);
  const results = response.organic_results || [];
  const retrievedAt = new Date().toISOString();

  return results
    .filter((res) => res.title)
    .map((res, index) => {
      const title = res.title || "Academic Publication";
      const link = res.link || `https://scholar.google.com/scholar?q=${encodeURIComponent(title)}`;
      const authors = res.publication_info?.authors?.map((a) => a.name || "").filter(Boolean) || [];
      const pubSummary = res.publication_info?.summary || "";
      
      // Extract year if available (e.g., 2024, 2025)
      const yearMatch = pubSummary.match(/\b(19\d\d|20\d\d)\b/);
      const year = yearMatch ? yearMatch[1] : undefined;

      return {
        id: `scholar-${index}-${Buffer.from(title).toString("base64").slice(0, 12)}`,
        title,
        link,
        snippet: res.snippet || "Scholarly citation from Google Scholar index.",
        authors: authors.length > 0 ? authors : undefined,
        publicationInfo: pubSummary,
        citedByCount: res.inline_links?.cited_by?.total,
        citedByLink: res.inline_links?.cited_by?.link,
        relatedArticlesLink: res.inline_links?.related_pages_link,
        year,
        retrievedAt,
      };
    });
}

