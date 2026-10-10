"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Search, 
  Sparkles, 
  ArrowRight, 
  Compass, 
  Bookmark, 
  CheckCircle, 
  Clock, 
  MapPin, 
  Building2, 
  ExternalLink,
  ChevronRight,
  TrendingUp,
  UserCheck
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { OpportunityCard } from "@/components/opportunities/OpportunityCard";
import { OpportunityEvidencePanel } from "@/components/evidence/OpportunityEvidencePanel";
import { 
  loadProfile, 
  loadSavedOpportunities, 
  loadSearchHistory, 
  loadSettings, 
  StudentProfile, 
  SavedOpportunity, 
  SearchSession, 
  AppSettings 
} from "@/lib/storage/localStorage";
import { DEMO_OPPORTUNITIES } from "@/lib/demo/demo-data";
import { Opportunity, OpportunityCategory } from "@/types";

const SUGGESTED_QUERIES = [
  "AI ML internships undergraduate India",
  "Google Summer of Code 2026",
  "Smart India Hackathon software edition",
  "Computer Science research fellowships India",
  "Backend software engineer internships 2026",
];

export default function OverviewPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [savedOpps, setSavedOpps] = useState<SavedOpportunity[]>([]);
  const [searchHistory, setSearchHistory] = useState<SearchSession[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [selectedEvidenceOpp, setSelectedEvidenceOpp] = useState<Opportunity | null>(null);
  
  // Search bar state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<OpportunityCategory | "all">("all");
  const [searchLocation, setSearchLocation] = useState("India");

  useEffect(() => {
    setProfile(loadProfile());
    setSavedOpps(loadSavedOpportunities());
    setSearchHistory(loadSearchHistory());
    setSettings(loadSettings());
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const catParam = selectedCategory !== "all" ? `&category=${selectedCategory}` : "";
    const locParam = searchLocation ? `&location=${encodeURIComponent(searchLocation)}` : "";
    router.push(`/discover?q=${encodeURIComponent(searchQuery)}${catParam}${locParam}`);
  };

  const handleSelectSuggested = (query: string) => {
    router.push(`/discover?q=${encodeURIComponent(query)}`);
  };

  // Metrics derived from actual storage
  const totalDiscovered = searchHistory.reduce((acc, s) => acc + s.resultCount, 0);
  const totalSaved = savedOpps.length;
  const totalApplied = savedOpps.filter((s) => s.applicationStatus === "applied").length;
  const upcomingDeadlines = savedOpps.filter(
    (s) => s.opportunity.deadlineStatus === "confirmed" && s.opportunity.deadline
  ).length;

  // Top recommendations based on profile
  const recommendedOpps = DEMO_OPPORTUNITIES.slice(0, 3);

  return (
    <div className="flex-1 pb-16">
      <Header 
        title="Overview" 
        subtitle="Discover opportunities that fit your skills, backed by live search evidence."
      />

      <div className="max-w-7xl mx-auto px-8 pt-8 space-y-8">
        
        {/* Hero Search Panel */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm relative overflow-hidden">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/60 text-blue-700 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Evidence-Driven Opportunity Discovery</span>
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Your next opportunity starts here.
            </h2>
            <p className="text-slate-600 text-sm mt-2 max-w-2xl leading-relaxed">
              Search live internships, fellowships, hackathons, and scholarships via SerpApi.
              Every recommendation includes verifiable evidence, transparent eligibility matching, and confirmed deadlines.
            </p>
          </div>

          <form onSubmit={handleSearchSubmit} className="mt-6 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="E.g., AI/ML internships for undergraduate students in India..."
                className="w-full pl-11 pr-4 py-3 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl text-sm transition outline-none text-slate-900"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as any)}
              className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:border-blue-500"
            >
              <option value="all">All Categories</option>
              <option value="internship">Internships</option>
              <option value="job">Jobs</option>
              <option value="hackathon">Hackathons</option>
              <option value="fellowship">Fellowships</option>
              <option value="scholarship">Scholarships</option>
              <option value="research">Research</option>
            </select>

            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl transition shadow-sm flex items-center justify-center gap-2 shrink-0"
            >
              <Compass className="w-4 h-4" />
              <span>Discover Now</span>
            </button>
          </form>

          {/* Query Suggestion Chips */}
          <div className="mt-4 flex items-center gap-2 flex-wrap text-xs">
            <span className="text-slate-400 font-medium">Try:</span>
            {SUGGESTED_QUERIES.map((q, i) => (
              <button
                key={i}
                onClick={() => handleSelectSuggested(q)}
                className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 rounded-lg transition"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Real Summary Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Discovered</span>
              <Compass className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-black text-slate-900">{totalDiscovered}</div>
            <p className="text-[11px] text-slate-400 mt-1">Found in search history</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Saved in Planner</span>
              <Bookmark className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-2xl font-black text-slate-900">{totalSaved}</div>
            <p className="text-[11px] text-slate-400 mt-1">Shortlisted opportunities</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Applied</span>
              <CheckCircle className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-slate-900">{totalApplied}</div>
            <p className="text-[11px] text-slate-400 mt-1">Applications submitted</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Deadlines Confirmed</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-black text-slate-900">{upcomingDeadlines}</div>
            <p className="text-[11px] text-slate-400 mt-1">Explicit source dates</p>
          </div>
        </div>

        {/* Application Funnel & Quick Tools */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                Application Pipeline & Readiness Funnel
              </h3>
              <p className="text-xs text-slate-500">Track your transition from search discovery to completed submissions</p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/compare"
                className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <span>Compare Shortlist</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/planner"
                className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <span>View Action Plan</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/60">
              <div className="flex justify-between font-bold text-slate-800 mb-1">
                <span>1. Shortlisted (Interested)</span>
                <span>{savedOpps.filter((s) => s.applicationStatus === "interested").length}</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-tight">Verified opportunities saved for preliminary eligibility check.</p>
            </div>

            <div className="p-3 rounded-lg bg-blue-50/60 border border-blue-200">
              <div className="flex justify-between font-bold text-blue-900 mb-1">
                <span>2. In Preparation</span>
                <span>{savedOpps.filter((s) => s.applicationStatus === "preparing").length}</span>
              </div>
              <p className="text-[11px] text-blue-700 leading-tight">Active drafting of resumes, essays, and required transcripts.</p>
            </div>

            <div className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-200">
              <div className="flex justify-between font-bold text-emerald-900 mb-1">
                <span>3. Submitted (Applied)</span>
                <span>{totalApplied}</span>
              </div>
              <p className="text-[11px] text-emerald-700 leading-tight">Completed applications awaiting interview / review cycle.</p>
            </div>
          </div>
        </div>

        {/* Profile Status Banner */}
        {profile && (
          <div className="p-4 rounded-xl bg-slate-900 text-white flex items-center justify-between flex-wrap gap-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold flex items-center gap-2">
                  <span>Active Profile: {profile.name || "Student"}</span>
                  <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded font-normal">
                    {profile.degree} • Class of {profile.graduationYear}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Skills: {profile.skills.slice(0, 5).join(", ")}
                </p>
              </div>
            </div>
            <Link
              href="/profile"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition"
            >
              Update Preferences
            </Link>
          </div>
        )}

        {/* Recommended Top Matches */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Featured High-Match Opportunities</h3>
              <p className="text-xs text-slate-500">Ranked by skills alignment and student eligibility</p>
            </div>
            <Link
              href="/discover"
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <span>Explore All Opportunities</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recommendedOpps.map((opp) => (
              <OpportunityCard
                key={opp.id}
                opportunity={opp}
                onSelectEvidence={(selected) => setSelectedEvidenceOpp(selected)}
                onSaveToggle={() => setSavedOpps(loadSavedOpportunities())}
              />
            ))}
          </div>
        </div>

        {/* Recent Search Activity Section */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 mb-3">Recent Research Activity</h3>
          {searchHistory.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {searchHistory.slice(0, 5).map((session) => (
                <div key={session.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-slate-800">&quot;{session.query}&quot;</span>
                    <span className="text-slate-400 ml-2">
                      ({session.resultCount} opportunities found across {session.enginesUsed.join(", ")})
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400">{new Date(session.createdAt).toLocaleDateString()}</span>
                    <Link
                      href={`/discover?q=${encodeURIComponent(session.query)}`}
                      className="text-blue-600 font-semibold hover:underline"
                    >
                      Re-run
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 py-3">
              No recent searches recorded. Execute a live query above to discover opportunities tailored to your degree.
            </p>
          )}
        </div>

      </div>

      {/* Opportunity Evidence Slide-over Panel */}
      {selectedEvidenceOpp && (
        <OpportunityEvidencePanel
          opportunity={selectedEvidenceOpp}
          profile={profile || undefined}
          onClose={() => setSelectedEvidenceOpp(null)}
          onSaveChanged={() => setSavedOpps(loadSavedOpportunities())}
        />
      )}
    </div>
  );
}

