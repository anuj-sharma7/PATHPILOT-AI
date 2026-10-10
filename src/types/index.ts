export type OpportunityCategory =
  | "internship"
  | "job"
  | "scholarship"
  | "fellowship"
  | "hackathon"
  | "research"
  | "competition";

export type WorkMode = "remote" | "hybrid" | "on-site" | "flexible" | "unspecified";

export type DeadlineStatus = "confirmed" | "estimated" | "rolling" | "unknown" | "passed";

export type EvidenceStatus = "supported" | "needs_verification" | "conflicting";

export type ApplicationStatus = "interested" | "preparing" | "applied" | "archived";

export interface StudentProfile {
  id: string;
  name?: string;
  educationLevel: "high_school" | "undergraduate" | "graduate" | "phd" | "bootcamp" | "other";
  degree: string;
  branch: string;
  graduationYear: number;
  skills: string[];
  interests: string[];
  preferredCategories: OpportunityCategory[];
  preferredLocations: string[];
  workMode: WorkMode;
  experienceLevel: "entry" | "junior" | "mid" | "student";
  fundingPreference?: "any" | "paid_only" | "funded_only";
  updatedAt: string;
}

export interface MatchBreakdown {
  skillsScore: number;       // weight: 35%
  eligibilityScore: number;  // weight: 30%
  interestScore: number;     // weight: 20%
  locationScore: number;     // weight: 10%
  experienceScore: number;   // weight: 5%
  totalScore: number;        // 0 - 100
  isProvisional: boolean;
  provisionalReason?: string;
  matchedSkills: string[];
  missingSkills: string[];
  matchedInterests: string[];
  notes: string[];
}

export interface SourceEvidence {
  id: string;
  title: string;
  url: string;
  domain: string;
  snippet: string;
  engine: "google" | "google_jobs" | "google_news" | "google_scholar";
  publishedAt?: string;
  retrievedAt: string;
  claimReferences?: string[];
  limitations?: string;
}

export interface EvidenceItem {
  id: string;
  claim: string;
  status: EvidenceStatus;
  sourceUrl?: string;
  sourceDomain?: string;
  sourceSnippet?: string;
  sourceEngine?: string;
  publishedAt?: string;
  retrievedAt?: string;
  limitations?: string;
  confidenceNote: string;
}

export interface Opportunity {
  id: string;
  title: string;
  organization: string;
  category: OpportunityCategory;
  description: string;
  originalUrl: string;
  sourceDomain: string;
  location: string;
  workMode: WorkMode;
  stipendOrSalary?: string;
  skills: string[];
  requirements: string[];
  deadline?: string;
  deadlineStatus: DeadlineStatus;
  deadlineNotes?: string;
  publishedAt?: string;
  retrievedAt: string;
  sourceEngine: "google" | "google_jobs" | "google_news" | "google_scholar";
  matchScore: number;
  matchBreakdown: MatchBreakdown;
  matchExplanation: string;
  missingRequirements: string[];
  evidenceItems: EvidenceItem[];
  sourceQualityNotes: string;
  dataMode: "live" | "demo";
  applyLinks?: Array<{ title: string; link: string }>;
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  category: "eligibility" | "materials" | "submission" | "verification";
  notes?: string;
}

export interface SavedOpportunity {
  opportunityId: string;
  opportunity: Opportunity;
  savedAt: string;
  applicationStatus: ApplicationStatus;
  notes: string;
  checklist: ChecklistItem[];
}

export interface SearchSession {
  id: string;
  query: string;
  categories: OpportunityCategory[];
  location?: string;
  workMode?: WorkMode;
  enginesUsed: string[];
  resultCount: number;
  results: Opportunity[];
  errors?: Array<{ engine: string; error: string }>;
  createdAt: string;
  dataMode: "live" | "demo";
}

export interface ScholarArticle {
  id: string;
  title: string;
  link: string;
  snippet: string;
  authors?: string[];
  publicationInfo?: string;
  citedByCount?: number;
  citedByLink?: string;
  relatedArticlesLink?: string;
  year?: string;
  retrievedAt: string;
}

