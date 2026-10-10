"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  ExternalLink, 
  Building2, 
  MapPin, 
  Sparkles, 
  ShieldCheck, 
  Clock, 
  Bookmark, 
  BookmarkCheck,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Layers,
  ListTodo
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Opportunity, StudentProfile } from "@/types";
import { 
  loadSavedOpportunities, 
  loadSearchHistory, 
  loadProfile, 
  saveOpportunity, 
  removeSavedOpportunity, 
  isOpportunitySaved 
} from "@/lib/storage/localStorage";
import { DEMO_OPPORTUNITIES } from "@/lib/demo/demo-data";

export default function OpportunityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [opp, setOpp] = useState<Opportunity | null>(null);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<"evidence" | "match">("evidence");

  useEffect(() => {
    const prof = loadProfile();
    setProfile(prof);

    // Look up opportunity from saved, recent search sessions, or demo dataset
    const savedList = loadSavedOpportunities();
    const foundSaved = savedList.find((s) => s.opportunityId === id);
    if (foundSaved) {
      setOpp(foundSaved.opportunity);
      setSaved(true);
      return;
    }

    const history = loadSearchHistory();
    for (const session of history) {
      const match = session.results.find((r) => r.id === id);
      if (match) {
        setOpp(match);
        setSaved(isOpportunitySaved(match.id));
        return;
      }
    }

    const demoMatch = DEMO_OPPORTUNITIES.find((d) => d.id === id);
    if (demoMatch) {
      setOpp(demoMatch);
      setSaved(isOpportunitySaved(demoMatch.id));
    }
  }, [id]);

  if (!opp) {
    return (
      <div className="flex-1 p-8">
        <Header title="Opportunity Evidence Detail" />
        <div className="max-w-2xl mx-auto mt-12 bg-white rounded-xl border border-slate-200 p-8 text-center space-y-4">
          <p className="text-slate-600 text-sm">Opportunity record not found in active session.</p>
          <Link
            href="/discover"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold"
          >
            Back to Discover
          </Link>
        </div>
      </div>
    );
  }

  const handleToggleSave = () => {
    if (saved) {
      removeSavedOpportunity(opp.id);
      setSaved(false);
    } else {
      saveOpportunity(opp, "interested");
      setSaved(true);
    }
  };

  const supportedItems = opp.evidenceItems.filter((i) => i.status === "supported");
  const verificationItems = opp.evidenceItems.filter((i) => i.status === "needs_verification");
  const conflictingItems = opp.evidenceItems.filter((i) => i.status === "conflicting");

  return (
    <div className="flex-1 pb-16">
      <Header
        title={opp.title}
        subtitle={`${opp.organization} • ${opp.category} • Retrieved via ${opp.sourceEngine.replace("_", " ")}`}
      />

      <div className="max-w-5xl mx-auto px-8 pt-6 space-y-6">
        
        {/* Back Link */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Results</span>
        </button>

        {/* Opportunity Summary Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                  {opp.category}
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                  via {opp.sourceEngine.replace("_", " ")}
                </span>
                {opp.deadline && (
                  <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    <Clock className="w-3.5 h-3.5" />
                    Deadline: {opp.deadline}
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900 leading-snug">
                {opp.title}
              </h1>
              <div className="flex items-center gap-4 text-xs text-slate-600 mt-2 flex-wrap">
                <span className="flex items-center gap-1 font-semibold text-slate-800">
                  <Building2 className="w-4 h-4 text-slate-400" />
                  {opp.organization}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  {opp.location}
                </span>
                <span className="px-2 py-0.5 bg-slate-100 rounded text-[11px] capitalize font-medium">
                  {opp.workMode}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={handleToggleSave}
                className={`px-4 py-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition ${
                  saved 
                    ? "bg-blue-50 border-blue-200 text-blue-600" 
                    : "border-slate-300 text-slate-700 hover:bg-slate-50"
                }`}
              >
                {saved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                <span>{saved ? "Saved in Planner" : "Save Opportunity"}</span>
              </button>

              {opp.originalUrl && (
                <a
                  href={opp.originalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-sm"
                >
                  <span>Apply on Official Site</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>

          <p className="text-xs text-slate-700 leading-relaxed max-w-3xl">
            {opp.description}
          </p>

          {opp.stipendOrSalary && (
            <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 font-semibold inline-block">
              💰 Compensation / Stipend: {opp.stipendOrSalary}
            </div>
          )}
        </div>

        {/* Evidence Audit & Grounding Section */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-6">
          <div className="border-b border-slate-200 pb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-bold text-slate-900">Opportunity Evidence Audit</h2>
            </div>
            <span className="text-xs text-slate-500 font-mono">
              Source: {opp.sourceDomain}
            </span>
          </div>

          {/* Group 1: Supported */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Supported Claims ({supportedItems.length})
            </h3>
            <div className="space-y-2">
              {supportedItems.map((item) => (
                <div key={item.id} className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 text-xs space-y-2">
                  <div className="font-semibold text-slate-900">{item.claim}</div>
                  {item.sourceSnippet && (
                    <div className="p-2.5 rounded bg-white border border-emerald-100 text-slate-700 font-mono text-[11px]">
                      &quot;{item.sourceSnippet}&quot;
                    </div>
                  )}
                  <p className="text-[11px] text-emerald-800 font-medium">✓ {item.confidenceNote}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Group 2: Needs Verification */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Needs Primary Verification ({verificationItems.length})
            </h3>
            <div className="space-y-2">
              {verificationItems.map((item) => (
                <div key={item.id} className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 text-xs space-y-1.5">
                  <div className="font-semibold text-slate-900">{item.claim}</div>
                  {item.limitations && (
                    <p className="text-slate-600 text-xs">{item.limitations}</p>
                  )}
                  <p className="text-[11px] text-amber-900 font-medium">→ Action: {item.confidenceNote}</p>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

