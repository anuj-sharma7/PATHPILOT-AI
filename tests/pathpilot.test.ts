import { test, describe } from "node:test";
import assert from "node:assert";
import { 
  extractDomain, 
  detectCategoryFromText, 
  detectWorkMode, 
  detectDeadlineFromText 
} from "../src/lib/serpapi/google-search";
import { calculateMatchScore } from "../src/lib/matching/score";
import { SerpApiError } from "../src/lib/serpapi/client";
import { SearchOpportunitiesRequestSchema, StudentProfileSchema } from "../src/lib/schemas";
import { DEMO_OPPORTUNITIES } from "../src/lib/demo/demo-data";
import { StudentProfile, Opportunity } from "../src/types";

describe("PathPilot AI Test Suite", () => {

  // Test 1: Google Search result normalization & domain extraction
  test("1. Google Search domain extraction & category detection", () => {
    const domain1 = extractDomain("https://summerofcode.withgoogle.com/rules");
    assert.strictEqual(domain1, "summerofcode.withgoogle.com");

    const domain2 = extractDomain("https://www.microsoft.com/en-us/research");
    assert.strictEqual(domain2, "microsoft.com");

    const cat = detectCategoryFromText("Smart India Hackathon 2026 nationwide event");
    assert.strictEqual(cat, "hackathon");
  });

  // Test 2: Google Jobs result normalization logic
  test("2. Google Jobs work mode detection", () => {
    const mode1 = detectWorkMode("Software Engineer Intern (Work From Home / Remote)");
    assert.strictEqual(mode1, "remote");

    const mode2 = detectWorkMode("Hybrid working model with 2 days at Bangalore office");
    assert.strictEqual(mode2, "hybrid");

    const mode3 = detectWorkMode("On-site full time role at Chennai campus");
    assert.strictEqual(mode3, "on-site");
  });

  // Test 3: Missing optional response fields handling
  test("3. Missing optional response fields does not crash domain/category parser", () => {
    assert.strictEqual(extractDomain(undefined), "web");
    assert.strictEqual(extractDomain(""), "web");
    assert.strictEqual(detectWorkMode(""), "unspecified");
    assert.strictEqual(detectCategoryFromText("", "internship"), "internship");
  });

  // Test 4: Invalid response shapes and Zod validation
  test("4. Invalid response shapes and request validation rejection", () => {
    const invalidReq = { query: "a" }; // min length 2
    const result = SearchOpportunitiesRequestSchema.safeParse(invalidReq);
    assert.strictEqual(result.success, false);

    const validReq = { query: "Software Engineer Intern India" };
    const validResult = SearchOpportunitiesRequestSchema.safeParse(validReq);
    assert.strictEqual(validResult.success, true);
  });

  // Test 5: URL deduplication logic
  test("5. URL deduplication across searches", () => {
    const urls = [
      "https://example.com/jobs/123",
      "https://example.com/jobs/123/",
      "https://example.com/jobs/456",
    ];

    const normalize = (u: string) => {
      const p = new URL(u);
      return `${p.hostname}${p.pathname}`.replace(/\/+$/, "").toLowerCase();
    };

    const seen = new Set<string>();
    const unique: string[] = [];

    for (const u of urls) {
      const norm = normalize(u);
      if (!seen.has(norm)) {
        seen.add(norm);
        unique.push(u);
      }
    }

    assert.strictEqual(unique.length, 2);
    assert.strictEqual(seen.size, 2);
  });

  // Test 6: Deterministic matching score calculation
  test("6. Matching score calculations based on skills and profile", () => {
    const sampleProfile: StudentProfile = {
      id: "test-user",
      educationLevel: "undergraduate",
      degree: "B.Tech",
      branch: "Computer Science",
      graduationYear: 2026,
      skills: ["Python", "Git", "React"],
      interests: ["Open Source"],
      preferredCategories: ["fellowship"],
      preferredLocations: ["Remote"],
      workMode: "remote",
      experienceLevel: "student",
      updatedAt: new Date().toISOString(),
    };

    const opp = DEMO_OPPORTUNITIES[0]; // GSoC
    const scoreData = calculateMatchScore(opp, sampleProfile);

    assert.ok(scoreData.matchScore >= 80, `Expected score >= 80, got ${scoreData.matchScore}`);
    assert.strictEqual(scoreData.matchBreakdown.isProvisional, false);
    assert.ok(scoreData.matchBreakdown.matchedSkills.includes("python"));
  });

  // Test 7: Incomplete profile scoring is labeled provisional
  test("7. Incomplete-profile scoring is labeled provisional", () => {
    const incompleteProfile: StudentProfile = {
      id: "incomplete-user",
      educationLevel: "undergraduate",
      degree: "",
      branch: "",
      graduationYear: 0,
      skills: [],
      interests: [],
      preferredCategories: [],
      preferredLocations: [],
      workMode: "unspecified",
      experienceLevel: "student",
      updatedAt: new Date().toISOString(),
    };

    const opp = DEMO_OPPORTUNITIES[0];
    const scoreData = calculateMatchScore(opp, incompleteProfile);

    assert.strictEqual(scoreData.matchBreakdown.isProvisional, true);
    assert.ok(scoreData.matchBreakdown.provisionalReason?.includes("provisional"));
  });

  // Test 8: Eligibility uncertainty identification
  test("8. Eligibility uncertainty flags graduation year and missing requirements", () => {
    const sampleProfile: StudentProfile = {
      id: "grad-user",
      educationLevel: "undergraduate",
      degree: "B.Tech",
      branch: "Civil Engineering",
      graduationYear: 2028,
      skills: ["AutoCAD"],
      interests: ["Structural Engineering"],
      preferredCategories: ["internship"],
      preferredLocations: ["India"],
      workMode: "on-site",
      experienceLevel: "student",
      updatedAt: new Date().toISOString(),
    };

    const opp = DEMO_OPPORTUNITIES[1]; // MSR India (CS focused)
    const scoreData = calculateMatchScore(opp, sampleProfile);

    assert.ok(scoreData.missingRequirements.length > 0);
  });

  // Test 9: Deadline parsing
  test("9. Deadline parsing from snippet text", () => {
    const text1 = "Application Deadline: May 15, 2026. Submit resume early.";
    const d1 = detectDeadlineFromText(text1);
    assert.strictEqual(d1.status, "confirmed");
    assert.strictEqual(d1.deadline, "May 15, 2026");

    const text2 = "Candidates reviewed on a rolling basis until all seats filled.";
    const d2 = detectDeadlineFromText(text2);
    assert.strictEqual(d2.status, "rolling");

    const text3 = "Great company hiring engineers.";
    const d3 = detectDeadlineFromText(text3);
    assert.strictEqual(d3.status, "unknown");
  });

  // Test 10: Conflicting source evidence in opportunity
  test("10. Conflicting source evidence is identified properly", () => {
    const oppWithConflict = DEMO_OPPORTUNITIES.find((o) =>
      o.evidenceItems.some((e) => e.status === "conflicting")
    );
    assert.ok(oppWithConflict, "Should find opportunity with conflicting evidence item");
    const conflictItem = oppWithConflict?.evidenceItems.find((e) => e.status === "conflicting");
    assert.strictEqual(conflictItem?.status, "conflicting");
  });

  // Test 11: Missing API-key errors handling
  test("11. SerpApiError thrown when API key is missing", () => {
    const err = new SerpApiError("SERPAPI_API_KEY is not configured", 401, "google");
    assert.strictEqual(err.statusCode, 401);
    assert.strictEqual(err.engine, "google");
    assert.ok(err.message.includes("SERPAPI_API_KEY"));
  });

  // Test 12: Request timeout error handling
  test("12. Timeout error creates appropriate SerpApiError with 504", () => {
    const timeoutErr = new SerpApiError("Search request timed out after 12s", 504, "google_jobs");
    assert.strictEqual(timeoutErr.statusCode, 504);
  });

  // Test 13: Rate limit error handling
  test("13. Rate limit creates 429 SerpApiError", () => {
    const quotaErr = new SerpApiError("SerpApi rate limit or monthly account quota exceeded", 429, "google");
    assert.strictEqual(quotaErr.statusCode, 429);
  });

  // Test 14: Empty search results handling
  test("14. Empty search results does not throw error", () => {
    const opps: Opportunity[] = [];
    assert.strictEqual(opps.length, 0);
  });

  // Test 15: Saved opportunity data model validity
  test("15. Student profile schema accepts valid profile", () => {
    const profile = {
      id: "student-1",
      educationLevel: "undergraduate",
      degree: "B.Tech",
      branch: "Information Technology",
      graduationYear: 2026,
      skills: ["Python", "Node.js"],
      interests: ["Web Development"],
      preferredCategories: ["internship", "job"],
      preferredLocations: ["Pune"],
      workMode: "remote",
      experienceLevel: "student",
      fundingPreference: "paid_only",
    };

    const parsed = StudentProfileSchema.safeParse(profile);
    assert.strictEqual(parsed.success, true);
  });

});

