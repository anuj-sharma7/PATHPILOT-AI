"use client";

import { useEffect, useState, useTransition, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  Compass, 
  MapPin, 
  Laptop, 
  Sparkles, 
  AlertCircle, 
  Loader2, 
  CheckCircle2, 
  Clock, 
  RefreshCw, 
  BookmarkCheck, 
  ShieldAlert, 
  Info 
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { OpportunityCard } from "@/components/opportunities/OpportunityCard";
import { OpportunityEvidencePanel } from "@/components/evidence/OpportunityEvidencePanel";
import { 
  loadProfile, 
  loadSettings, 
  saveSettings, 
  recordSearchSession, 
  incrementSearchCounter, 
  loadSavedOpportunities, 
  StudentProfile, 
  AppSettings 
} from "@/lib/storage/localStorage";
import { Opportunity, OpportunityCategory, WorkMode, SearchSession } from "@/types";
import { DEMO_OPPORTUNITIES } from "@/lib/demo/demo-data";

const CATEGORIES: Array<{ id: OpportunityCategory; label: string }> = [
  { id: "internship", label: "Internships" },
  { id: "job", label: "Jobs" },
  { id: "scholarship", label: "Scholarships" },
  { id: "fellowship", label: "Fellowships" },
  { id: "hackathon", label: "Hackathons" },
  { id: "research", label: "Research Programs" },
  { id: "competition", label: "Competitions" },
];

function DiscoverContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "AI ML software engineering internships India 2026";
  const initialCat = (searchParams.get("category") as OpportunityCategory) || undefined;
  const initialLoc = searchParams.get("location") || "India";

  const [query, setQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState<OpportunityCategory | "all">(initialCat || "all");
  const [location, setLocation] = useState(initialLoc);
  const [workMode, setWorkMode] = useState<WorkMode>("unspecified");
  
  // Results and status
  const [loading, setLoading] = useState(false);
  const [searchStep, setSearchStep] = useState<string>("");
  const [results, setResults] = useState<Opportunity[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [canFallbackDemo, setCanFallbackDemo] = useState(false);
  const [activeDataMode, setActiveDataMode] = useState<"live" | "demo">("live");
  const [enginesUsed, setEnginesUsed] = useState<string[]>([]);
  
  // Local storage state
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [selectedEvidenceOpp, setSelectedEvidenceOpp] = useState<Opportunity | null>(null);

  // Filters and Sorting
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [minMatchScore, setMinMatchScore] = useState<number>(0);
  const [filterDeadline, setFilterDeadline] = useState<string>("all");
  const [filterWorkMode, setFilterWorkMode] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"best_match" | "deadline" | "title">("best_match");

  useEffect(() => {
    const prof = loadProfile();
    const sett = loadSettings();
    setProfile(prof);
    setSettings(sett);
    setActiveDataMode(sett.mode);

    // Run initial search
    executeSearch(initialQuery, initialCat, initialLoc, sett.mode, prof);
  }, []);

  const executeSearch = async (
    searchQ: string,
    cat?: OpportunityCategory | "all",
    loc?: string,
    mode?: "live" | "demo",
    prof?: StudentProfile | null
  ) => {
    if (!searchQ.trim()) return;

    setLoading(true);
    setError(null);
    setCanFallbackDemo(false);
    setSearchStep("1. Dispatching SerpApi live request...");

    const activeMode = mode || settings?.mode || "live";
    const selectedCats = cat && cat !== "all" ? [cat] : [];

    try {
      setTimeout(() => setSearchStep("2. Normalizing structured results & links..."), 400);
      setTimeout(() => setSearchStep("3. Deduplicating and grounding profile match..."), 900);

      const res = await fetch("/api/opportunities/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: searchQ,
          categories: selectedCats,
          location: loc || "India",
          workMode: workMode !== "unspecified" ? workMode : undefined,
          mode: activeMode,
          userProfile: prof || profile || undefined,
          limit: 20,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.canFallbackToDemo) {
          setCanFallbackDemo(true);
        }
        throw new Error(data.error || `Search returned HTTP ${res.status}`);
      }

      setResults(data.results || []);
      setActiveDataMode(data.dataMode || activeMode);
      setEnginesUsed(data.enginesUsed || []);

      // Record in local search history & increment query counter
      if (data.dataMode === "live") {
        incrementSearchCounter();
      }

      const session: SearchSession = {
        id: `sess-${Date.now()}`,
        query: searchQ,
        categories: selectedCats,
        location: loc,
        workMode,
        enginesUsed: data.enginesUsed || [],
        resultCount: data.results?.length || 0,
        results: data.results || [],
        createdAt: new Date().toISOString(),
        dataMode: data.dataMode || activeMode,
      };
      recordSearchSession(session);

    } catch (err: any) {
      setError(err.message || "Failed to complete search query.");
    } finally {
      setLoading(false);
      setSearchStep("");
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(query, selectedCategory, location, settings?.mode, profile);
  };

  const handleSwitchToDemoMode = () => {
    const updated = saveSettings({ mode: "demo" });
    setSettings(updated);
    setActiveDataMode("demo");
    executeSearch(query, selectedCategory, location, "demo", profile);
  };

  // Filter and Sort results
  const filteredResults = results.filter((opp) => {
    if (filterCategory !== "all" && opp.category !== filterCategory) return false;
    if (opp.matchScore < minMatchScore) return false;
    if (filterDeadline === "confirmed" && opp.deadlineStatus !== "confirmed") return false;
    if (filterDeadline === "rolling" && opp.deadlineStatus !== "rolling") return false;
    if (filterWorkMode !== "all" && opp.workMode !== filterWorkMode) return false;
    return true;
  });

  const sortedResults = [...filteredResults].sort((a, b) => {
    if (sortBy === "best_match") return b.matchScore - a.matchScore;
    if (sortBy === "title") return a.title.localeCompare(b.title);
    if (sortBy === "deadline") {
      if (a.deadlineStatus === "confirmed" && b.deadlineStatus !== "confirmed") return -1;
      if (b.deadlineStatus === "confirmed" && a.deadlineStatus !== "confirmed") return 1;
      return b.matchScore - a.matchScore;
    }
    return 0;
  });

  return (
    <div className="flex-1 pb-16">
      <Header
        title="Discover Opportunities"
        subtitle="Search live internships, fellowships, hackathons, and scholarships with verifiable evidence."
      />

      <div className="max-w-7xl mx-auto px-8 pt-6 space-y-6">

        {/* Primary Search Controls Bar */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="E.g., Software engineering internships, Google Summer of Code, AI fellowships..."
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl text-sm outline-none text-slate-900 transition"
                />
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Location (e.g. India)"
                    className="pl-9 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none w-36 focus:border-blue-500"
                  />
                </div>

                <select
                  value={workMode}
                  onChange={(e) => setWorkMode(e.target.value as WorkMode)}
                  className="px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 outline-none focus:border-blue-500"
                >
                  <option value="unspecified">Any Work Mode</option>
                  <option value="remote">Remote Only</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="on-site">On-Site</option>
                </select>

                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold text-sm rounded-xl transition flex items-center gap-2 shadow-sm shrink-0"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Searching...</span>
                    </>
                  ) : (
                    <>
                      <Compass className="w-4 h-4" />
                      <span>Search Live</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Quick Category Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pt-1 pb-1 text-xs">
              <button
                type="button"
                onClick={() => setSelectedCategory("all")}
                className={`px-3 py-1.5 rounded-lg font-medium transition shrink-0 ${
                  selectedCategory === "all"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                All Opportunities
              </button>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition shrink-0 ${
                    selectedCategory === cat.id
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* AI Query Assistant Chips */}
            <div className="pt-2 border-t border-slate-100 flex items-center gap-2 flex-wrap text-xs">
              <span className="text-slate-400 font-medium flex items-center gap-1 shrink-0">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                Query Assistant:
              </span>
              {[
                `Class of ${profile?.graduationYear || 2026} Software Engineer Internships India`,
                `${profile?.branch || "Computer Science"} undergraduate research fellowships`,
                "Smart India Hackathon 2026 problem statements",
                "Google Summer of Code 2026 contributors",
                "Machine Learning fellowships paid India",
              ].map((sug, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setQuery(sug);
                    executeSearch(sug, selectedCategory, location, settings?.mode, profile);
                  }}
                  className="px-2.5 py-1 rounded bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 transition text-[11px]"
                >
                  {sug}
                </button>
              ))}
            </div>
          </form>
        </div>

        {/* Live Search Progress Status Indicator */}
        {loading && (
          <div className="p-4 rounded-xl border border-blue-200 bg-blue-50 text-blue-900 flex items-center justify-between animate-pulse">
            <div className="flex items-center gap-3 text-xs font-semibold">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              <span>{searchStep || "Executing SerpApi multi-engine search..."}</span>
            </div>
            <span className="text-[11px] text-blue-600 bg-blue-100/60 px-2 py-0.5 rounded">
              Engines: Google Search • Google Jobs
            </span>
          </div>
        )}

        {/* Error Handling & Graceful Demo Mode Switcher */}
        {error && (
          <div className="p-5 rounded-xl border border-rose-200 bg-rose-50 text-rose-900 space-y-3">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm">Live Search Notification</h4>
                <p className="text-xs text-rose-800 mt-1 leading-relaxed">{error}</p>
              </div>
            </div>

            {canFallbackDemo && (
              <div className="pt-2 flex items-center gap-3">
                <button
                  onClick={handleSwitchToDemoMode}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition shadow-sm flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Switch to Verified Demo Mode</span>
                </button>
                <span className="text-xs text-rose-700">
                  Explore full UI, evidence audit, and match scoring with offline verified sample data.
                </span>
              </div>
            )}
          </div>
        )}

        {/* Results Metadata Bar & Active Mode Badge */}
        {!loading && results.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200">
            <div className="flex items-center gap-3 flex-wrap text-xs">
              <span className="font-bold text-slate-800">
                Found {sortedResults.length} opportunities
              </span>
              <span className="text-slate-400">•</span>
              <span className={`px-2 py-0.5 rounded font-semibold text-[11px] ${
                activeDataMode === "live" 
                  ? "bg-emerald-100 text-emerald-800" 
                  : "bg-amber-100 text-amber-800"
              }`}>
                {activeDataMode === "live" ? "Live SerpApi Results" : "Verified Demo Mode"}
              </span>
              {enginesUsed.length > 0 && (
                <span className="text-slate-500 text-[11px]">
                  Queried: {enginesUsed.map((e) => e.replace("_", " ")).join(", ")}
                </span>
              )}
            </div>

            {/* Filter Controls Row */}
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span>Filters:</span>
              </div>

              {/* Min Match Filter */}
              <select
                value={minMatchScore}
                onChange={(e) => setMinMatchScore(Number(e.target.value))}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium outline-none text-xs"
              >
                <option value={0}>All Match Scores</option>
                <option value={70}>70%+ Match</option>
                <option value={80}>80%+ Match</option>
                <option value={90}>90%+ Match</option>
              </select>

              {/* Deadline Status Filter */}
              <select
                value={filterDeadline}
                onChange={(e) => setFilterDeadline(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium outline-none text-xs"
              >
                <option value="all">Any Deadline</option>
                <option value="confirmed">Confirmed Only</option>
                <option value="rolling">Rolling Review</option>
              </select>

              {/* Sort By Dropdown */}
              <div className="flex items-center gap-1 ml-2">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-semibold outline-none text-xs"
                >
                  <option value="best_match">Sort: Best Match</option>
                  <option value="deadline">Sort: Deadline</option>
                  <option value="title">Sort: Title (A-Z)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Opportunities Grid */}
        {!loading && sortedResults.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedResults.map((opp) => (
              <OpportunityCard
                key={opp.id}
                opportunity={opp}
                onSelectEvidence={(selected) => setSelectedEvidenceOpp(selected)}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && results.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-lg mx-auto space-y-4">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <Search className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">No matching opportunities found</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Try broadening your query keywords, removing specific location restrictions, or selecting &quot;All Categories&quot;.
              </p>
            </div>
            <button
              onClick={() => {
                setQuery("Software engineering internships undergraduate India 2026");
                setSelectedCategory("all");
                executeSearch("Software engineering internships undergraduate India 2026", "all", "India", settings?.mode, profile);
              }}
              className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg font-semibold text-xs hover:bg-blue-100 transition"
            >
              Reset to Recommended Search
            </button>
          </div>
        )}

      </div>

      {/* Opportunity Evidence Side-Panel Modal */}
      {selectedEvidenceOpp && (
        <OpportunityEvidencePanel
          opportunity={selectedEvidenceOpp}
          profile={profile || undefined}
          onClose={() => setSelectedEvidenceOpp(null)}
        />
      )}
    </div>
  );
}

export default function DiscoverPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 p-8 text-center text-slate-500 text-xs">
        Loading discovery interface...
      </div>
    }>
      <DiscoverContent />
    </Suspense>
  );
}
