import { NextRequest, NextResponse } from "next/server";
import { SearchOpportunitiesRequestSchema } from "@/lib/schemas";
import { searchGoogleOpportunities } from "@/lib/serpapi/google-search";
import { searchGoogleJobs } from "@/lib/serpapi/google-jobs";
import { searchGoogleNews } from "@/lib/serpapi/google-news";
import { calculateMatchScore } from "@/lib/matching/score";
import { DEMO_OPPORTUNITIES } from "@/lib/demo/demo-data";
import { Opportunity, OpportunityCategory } from "@/types";

function normalizeUrlForDeduplication(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.hostname}${parsed.pathname}`.replace(/\/+$/, "").toLowerCase();
  } catch {
    return url.toLowerCase().trim();
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = SearchOpportunitiesRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid search parameters", details: validation.error.format() },
        { status: 400 }
      );
    }

    const { query, categories, location, workMode, mode, userProfile, limit } = validation.data;

    // Handle DEMO MODE explicitly
    if (mode === "demo") {
      let filtered = [...DEMO_OPPORTUNITIES];

      // Filter by category if requested
      if (categories && categories.length > 0) {
        filtered = filtered.filter((opp) => categories.includes(opp.category));
        // If category filter left no results, include all demo opportunities matching query
        if (filtered.length === 0) {
          filtered = [...DEMO_OPPORTUNITIES];
        }
      }

      // Re-evaluate matching scores based on the current user profile
      const scoredResults = filtered.map((opp) => {
        const scoreData = calculateMatchScore(opp, userProfile);
        return {
          ...opp,
          matchScore: scoreData.matchScore,
          matchBreakdown: scoreData.matchBreakdown,
          matchExplanation: scoreData.matchExplanation,
          missingRequirements: scoreData.missingRequirements,
          dataMode: "demo" as const,
        };
      });

      // Sort by match score descending
      scoredResults.sort((a, b) => b.matchScore - a.matchScore);

      return NextResponse.json({
        dataMode: "demo",
        query,
        resultCount: scoredResults.length,
        enginesUsed: ["demo_cache"],
        results: scoredResults.slice(0, limit),
        metadata: {
          note: "Results served from verified Demo Mode dataset for preview and evaluation.",
        },
      });
    }

    // LIVE MODE — Check API Key
    const apiKey = process.env.SERPAPI_API_KEY;
    if (!apiKey || apiKey.trim() === "") {
      return NextResponse.json(
        {
          error: "SERPAPI_API_KEY is not configured on the server. You can switch to Demo Mode to explore the full interface and analysis capabilities with verified sample data.",
          canFallbackToDemo: true,
          configured: false,
        },
        { status: 401 }
      );
    }

    // Attempt research orchestration via Python FastAPI agent service (serpapi-search-tools)
    const agentUrl = process.env.RESEARCH_AGENT_URL || "http://127.0.0.1:8000";
    try {
      const agentController = new AbortController();
      const timeoutId = setTimeout(() => agentController.abort(), 12000);

      const agentRes = await fetch(`${agentUrl}/api/research/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          categories: categories && categories.length > 0 ? categories : undefined,
          location: location || undefined,
          profile: userProfile ? {
            degree: userProfile.degree,
            field_of_study: userProfile.branch,
            year_of_study: userProfile.graduationYear ? (2028 - userProfile.graduationYear + 1) : 3,
            skills: userProfile.skills || [],
            interests: userProfile.interests || [],
            location_preference: userProfile.preferredLocations?.[0] || location || "India",
          } : undefined,
        }),
        signal: agentController.signal,
      });

      clearTimeout(timeoutId);

      if (agentRes.ok) {
        const agentData = await agentRes.json();
        if (agentData && Array.isArray(agentData.opportunities) && agentData.opportunities.length > 0) {
          const mappedResults: Opportunity[] = agentData.opportunities.map((opp: any) => ({
            id: opp.id,
            title: opp.title,
            organization: opp.organization,
            category: opp.category,
            location: opp.location || "Flexible",
            workMode: opp.is_remote ? "remote" : "in-person",
            deadline: opp.deadline,
            stipendOrSalary: opp.stipend_or_salary,
            sourceEngine: opp.source_engine || "serpapi_search_tools",
            sourceSnippet: opp.snippet,
            originalUrl: opp.source_url,
            applyUrl: opp.source_url,
            descriptionSnippet: opp.snippet || opp.description || "",
            fullDescription: opp.description,
            dataMode: "live" as const,
            matchScore: opp.match_score || 75,
            matchExplanation: opp.evidence?.match_reasons || [],
            missingRequirements: opp.evidence?.missing_information || [],
            evidence: opp.evidence ? {
              matchReasons: opp.evidence.match_reasons || [],
              verifiedRequirements: opp.evidence.verified_requirements || [],
              missingInformation: opp.evidence.missing_information || [],
              potentialDisqualifiers: opp.evidence.potential_disqualifiers || [],
              nextSteps: opp.evidence.next_steps || [],
              deadlineConfirmed: opp.evidence.deadline_confirmed || false,
              sources: opp.evidence.sources || [opp.source_url],
            } : undefined,
            retrievedAt: new Date().toISOString(),
          }));

          return NextResponse.json({
            dataMode: "live",
            query,
            resultCount: mappedResults.length,
            enginesUsed: agentData.metadata?.engines_used || ["serpapi-search-tools"],
            results: mappedResults.slice(0, limit),
            metadata: {
              ...agentData.metadata,
              orchestrator: "python_fastapi_agent_service",
              serpapi_package: "serpapi-search-tools",
            },
            retrievedAt: new Date().toISOString(),
          });
        }
      }
    } catch {
      // Python agent service not running or timed out; seamlessly fallback to direct Next.js SerpApi client
    }

    const enginesUsed: string[] = [];
    const rawResults: Opportunity[] = [];
    const errors: Array<{ engine: string; error: string }> = [];

    const isJobOrInternOnly =
      categories.length > 0 &&
      categories.every((c) => c === "job" || c === "internship");

    const promises: Promise<void>[] = [];

    // 1. Google Jobs API (Primary for jobs and internships)
    if (isJobOrInternOnly || categories.length === 0 || categories.includes("internship") || categories.includes("job")) {
      promises.push(
        searchGoogleJobs(query, location)
          .then((jobs) => {
            enginesUsed.push("google_jobs");
            rawResults.push(...jobs);
          })
          .catch((err) => {
            errors.push({ engine: "google_jobs", error: err.message });
          })
      );
    }

    // 2. Google Search API (Primary for scholarships, fellowships, hackathons, research, competitions)
    const primaryCat: OpportunityCategory | undefined = categories.length > 0 ? categories[0] : undefined;
    promises.push(
      searchGoogleOpportunities(query, primaryCat, location)
        .then((opps) => {
          enginesUsed.push("google");
          rawResults.push(...opps);
        })
        .catch((err) => {
          errors.push({ engine: "google", error: err.message });
        })
    );

    // 3. Google News API (Contextual announcements when searching broad opportunities or fellowships)
    if (categories.includes("fellowship") || categories.includes("scholarship") || categories.includes("hackathon")) {
      promises.push(
        searchGoogleNews(`${query} announcement 2026`, primaryCat)
          .then((news) => {
            enginesUsed.push("google_news");
            rawResults.push(...news);
          })
          .catch((err) => {
            errors.push({ engine: "google_news", error: err.message });
          })
      );
    }

    await Promise.all(promises);

    // If all engines failed, return error
    if (rawResults.length === 0 && errors.length > 0) {
      return NextResponse.json(
        {
          error: `Live search query failed: ${errors.map((e) => `${e.engine}: ${e.error}`).join("; ")}`,
          errors,
          canFallbackToDemo: true,
        },
        { status: 502 }
      );
    }

    // Deduplication by normalized URL and title similarity
    const seenUrls = new Set<string>();
    const seenTitles = new Set<string>();
    const deduplicated: Opportunity[] = [];

    for (const item of rawResults) {
      const normUrl = normalizeUrlForDeduplication(item.originalUrl);
      const normTitle = item.title.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 30);

      if (seenUrls.has(normUrl) || (normTitle && seenTitles.has(normTitle))) {
        continue;
      }

      seenUrls.add(normUrl);
      if (normTitle) seenTitles.add(normTitle);
      deduplicated.push(item);
    }

    // Apply workMode filter if specified by user and not 'unspecified'
    let filtered = deduplicated;
    if (workMode && workMode !== "unspecified") {
      filtered = deduplicated.filter(
        (opp) => opp.workMode === workMode || opp.workMode === "flexible" || opp.workMode === "unspecified"
      );
      if (filtered.length === 0) {
        filtered = deduplicated; // preserve results if filter is overly strict
      }
    }

    // Deterministic Profile-based Ranking
    const personalizedResults = filtered.map((opp) => {
      const matchData = calculateMatchScore(opp, userProfile);
      return {
        ...opp,
        matchScore: matchData.matchScore,
        matchBreakdown: matchData.matchBreakdown,
        matchExplanation: matchData.matchExplanation,
        missingRequirements: matchData.missingRequirements,
        dataMode: "live" as const,
      };
    });

    // Sort by calculated matchScore descending
    personalizedResults.sort((a, b) => b.matchScore - a.matchScore);

    return NextResponse.json({
      dataMode: "live",
      query,
      resultCount: personalizedResults.length,
      enginesUsed,
      errors: errors.length > 0 ? errors : undefined,
      results: personalizedResults.slice(0, limit),
      retrievedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Search API handler error:", error);
    return NextResponse.json(
      { error: `Internal search error: ${error.message || "Unknown error"}` },
      { status: 500 }
    );
  }
}

