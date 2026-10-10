import { StudentProfile, SavedOpportunity, Opportunity, ApplicationStatus, ChecklistItem, SearchSession } from "@/types";
export type { StudentProfile, SavedOpportunity, Opportunity, ApplicationStatus, ChecklistItem, SearchSession };

const PROFILE_KEY = "pathpilot_student_profile";
const SAVED_OPPS_KEY = "pathpilot_saved_opportunities";
const SEARCH_HISTORY_KEY = "pathpilot_search_history";
const APP_SETTINGS_KEY = "pathpilot_settings";

export const DEFAULT_PROFILE: StudentProfile = {
  id: "student-user-1",
  name: "Arjun Sharma",
  educationLevel: "undergraduate",
  degree: "B.Tech",
  branch: "Computer Science and Engineering",
  graduationYear: 2026,
  skills: ["Python", "React", "TypeScript", "Data Structures", "Machine Learning", "Git"],
  interests: ["Artificial Intelligence", "Open Source", "Full Stack Development", "Fintech"],
  preferredCategories: ["internship", "fellowship", "hackathon", "research"],
  preferredLocations: ["Bengaluru", "Remote", "Delhi NCR", "Hyderabad", "India"],
  workMode: "flexible",
  experienceLevel: "student",
  fundingPreference: "paid_only",
  updatedAt: new Date().toISOString(),
};

export interface AppSettings {
  mode: "live" | "demo";
  serpApiRequestsCount: number;
  lastSearchAt?: string;
}

export const DEFAULT_SETTINGS: AppSettings = {
  mode: "live",
  serpApiRequestsCount: 0,
};

// --- Profile Storage ---
export function loadProfile(): StudentProfile {
  if (typeof window === "undefined") return DEFAULT_PROFILE;
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(DEFAULT_PROFILE));
      return DEFAULT_PROFILE;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_PROFILE;
  }
}

export function saveProfile(profile: StudentProfile): void {
  if (typeof window === "undefined") return;
  try {
    const updated = { ...profile, updatedAt: new Date().toISOString() };
    localStorage.setItem(PROFILE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("Failed to save profile to localStorage", e);
  }
}

// --- Saved Opportunities Storage ---
export function loadSavedOpportunities(): SavedOpportunity[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SAVED_OPPS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveOpportunity(opp: Opportunity, status: ApplicationStatus = "interested"): SavedOpportunity {
  if (typeof window === "undefined") {
    return {
      opportunityId: opp.id,
      opportunity: opp,
      savedAt: new Date().toISOString(),
      applicationStatus: status,
      notes: "",
      checklist: [],
    };
  }

  const existing = loadSavedOpportunities();
  const index = existing.findIndex((s) => s.opportunityId === opp.id);

  // Generate initial actionable checklist
  const defaultChecklist: ChecklistItem[] = [
    {
      id: "chk-1",
      text: `Verify degree & batch (${opp.requirements[0] || "eligibility guidelines"}) on ${opp.sourceDomain}`,
      completed: false,
      category: "eligibility",
    },
    {
      id: "chk-2",
      text: `Prepare resume highlighting: ${opp.skills.slice(0, 3).join(", ") || "core competencies"}`,
      completed: false,
      category: "materials",
    },
    {
      id: "chk-3",
      text: opp.deadline ? `Verify application deadline (${opp.deadline}) on portal` : "Confirm live submission window on official page",
      completed: false,
      category: "verification",
    },
    {
      id: "chk-4",
      text: "Submit final application via official link",
      completed: false,
      category: "submission",
    },
  ];

  let record: SavedOpportunity;
  if (index >= 0) {
    record = {
      ...existing[index],
      opportunity: opp,
      applicationStatus: status,
    };
    existing[index] = record;
  } else {
    record = {
      opportunityId: opp.id,
      opportunity: opp,
      savedAt: new Date().toISOString(),
      applicationStatus: status,
      notes: "",
      checklist: defaultChecklist,
    };
    existing.unshift(record);
  }

  try {
    localStorage.setItem(SAVED_OPPS_KEY, JSON.stringify(existing));
  } catch (e) {
    console.error("Failed to persist saved opportunity", e);
  }

  return record;
}

export function updateSavedOpportunity(saved: SavedOpportunity): void {
  if (typeof window === "undefined") return;
  const existing = loadSavedOpportunities();
  const index = existing.findIndex((s) => s.opportunityId === saved.opportunityId);
  if (index >= 0) {
    existing[index] = saved;
    try {
      localStorage.setItem(SAVED_OPPS_KEY, JSON.stringify(existing));
    } catch (e) {
      console.error("Failed to update saved opportunity", e);
    }
  }
}

export function removeSavedOpportunity(opportunityId: string): void {
  if (typeof window === "undefined") return;
  const existing = loadSavedOpportunities();
  const filtered = existing.filter((s) => s.opportunityId !== opportunityId);
  try {
    localStorage.setItem(SAVED_OPPS_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.error("Failed to remove saved opportunity", e);
  }
}

export function isOpportunitySaved(opportunityId: string): boolean {
  if (typeof window === "undefined") return false;
  const existing = loadSavedOpportunities();
  return existing.some((s) => s.opportunityId === opportunityId);
}

// --- Search History Storage ---
export function loadSearchHistory(): SearchSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SEARCH_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function recordSearchSession(session: SearchSession): void {
  if (typeof window === "undefined") return;
  const history = loadSearchHistory();
  history.unshift(session);
  const truncated = history.slice(0, 15); // keep last 15 searches
  try {
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(truncated));
  } catch (e) {
    console.error("Failed to record search session", e);
  }
}

// --- App Settings & Counters ---
export function loadSettings(): AppSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(APP_SETTINGS_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: Partial<AppSettings>): AppSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  const current = loadSettings();
  const updated = { ...current, ...settings };
  try {
    localStorage.setItem(APP_SETTINGS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("Failed to save settings", e);
  }
  return updated;
}

export function incrementSearchCounter(): number {
  if (typeof window === "undefined") return 1;
  const current = loadSettings();
  const updatedCount = current.serpApiRequestsCount + 1;
  saveSettings({
    serpApiRequestsCount: updatedCount,
    lastSearchAt: new Date().toISOString(),
  });
  return updatedCount;
}
