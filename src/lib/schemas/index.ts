import { z } from "zod";

export const OpportunityCategorySchema = z.enum([
  "internship",
  "job",
  "scholarship",
  "fellowship",
  "hackathon",
  "research",
  "competition",
]);

export const WorkModeSchema = z.enum(["remote", "hybrid", "on-site", "flexible", "unspecified"]);

export const StudentProfileSchema = z.object({
  id: z.string().default("default-user"),
  name: z.string().optional(),
  educationLevel: z.enum(["high_school", "undergraduate", "graduate", "phd", "bootcamp", "other"]).default("undergraduate"),
  degree: z.string().min(1, "Degree is required"),
  branch: z.string().min(1, "Major or branch is required"),
  graduationYear: z.number().int().min(2020).max(2035),
  skills: z.array(z.string()).default([]),
  interests: z.array(z.string()).default([]),
  preferredCategories: z.array(OpportunityCategorySchema).default(["internship", "hackathon"]),
  preferredLocations: z.array(z.string()).default([]),
  workMode: WorkModeSchema.default("unspecified"),
  experienceLevel: z.enum(["entry", "junior", "mid", "student"]).default("student"),
  fundingPreference: z.enum(["any", "paid_only", "funded_only"]).default("any"),
  updatedAt: z.string().default(() => new Date().toISOString()),
});

export const SearchOpportunitiesRequestSchema = z.object({
  query: z.string().min(2, "Search query is required"),
  categories: z.array(OpportunityCategorySchema).optional().default([]),
  location: z.string().optional().default("India"),
  workMode: WorkModeSchema.optional().default("unspecified"),
  mode: z.enum(["live", "demo"]).optional().default("live"),
  userProfile: StudentProfileSchema.optional(),
  limit: z.number().int().min(5).max(30).optional().default(15),
});

export const ScholarSearchRequestSchema = z.object({
  query: z.string().min(2, "Research query is required"),
  mode: z.enum(["live", "demo"]).optional().default("live"),
  num: z.number().int().min(3).max(20).optional().default(10),
});

export const AnalyzeOpportunityRequestSchema = z.object({
  opportunityId: z.string(),
  opportunity: z.any(), // Opportunity object
  profile: StudentProfileSchema.optional(),
});

export const AiEvidenceAnalysisSchema = z.object({
  summaryRationale: z.string(),
  supportedClaims: z.array(z.object({
    claim: z.string(),
    sourceText: z.string(),
    significance: z.string(),
  })),
  unknownRequirements: z.array(z.object({
    requirement: z.string(),
    whyUnknown: z.string(),
    verificationAdvice: z.string(),
  })),
  potentialIneligibilities: z.array(z.string()),
  deadlineAssessment: z.object({
    confirmedDeadline: z.string().nullable(),
    confidence: z.enum(["high", "medium", "low", "unconfirmed"]),
    sourceContext: z.string(),
  }),
  actionChecklist: z.array(z.object({
    task: z.string(),
    category: z.enum(["eligibility", "materials", "submission", "verification"]),
    importance: z.enum(["critical", "recommended", "optional"]),
  })),
});

