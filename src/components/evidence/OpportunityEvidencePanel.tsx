"use client";

import { useState } from "react";
import { 
  X, 
  ExternalLink, 
  CheckCircle2, 
  AlertTriangle, 
  HelpCircle, 
  Sparkles, 
  Bookmark, 
  BookmarkCheck, 
  Clock, 
  Building2, 
  MapPin, 
  ShieldCheck, 
  Layers, 
  FileCheck2,
  ListTodo,
  Loader2,
  CalendarPlus,
  Download,
  Copy,
  Check,
  PenTool,
  Share2
} from "lucide-react";
import { Opportunity, StudentProfile } from "@/types";
import { isOpportunitySaved, saveOpportunity, removeSavedOpportunity } from "@/lib/storage/localStorage";
import { generateGoogleCalendarUrl, generateIcsContent, generateOpportunityDossierMarkdown } from "@/lib/utils/calendar";

interface OpportunityEvidencePanelProps {
  opportunity: Opportunity;
  profile?: StudentProfile;
  onClose: () => void;
  onSaveChanged?: () => void;
}

export function OpportunityEvidencePanel({ opportunity, profile, onClose, onSaveChanged }: OpportunityEvidencePanelProps) {
  const [activeTab, setActiveTab] = useState<"evidence" | "match" | "ai_analysis" | "pitch">("evidence");
  const [saved, setSaved] = useState<boolean>(() => isOpportunitySaved(opportunity.id));
  
  // AI analysis state
  const [analyzing, setAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<any | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // Pitch generation state
  const [pitchLoading, setPitchLoading] = useState(false);
  const [pitchResult, setPitchResult] = useState<any | null>(null);
  const [pitchError, setPitchError] = useState<string | null>(null);

  // Copy feedback state
  const [copiedDossier, setCopiedDossier] = useState(false);
  const [copiedPitch, setCopiedPitch] = useState(false);

  const handleCopyDossier = () => {
    const md = generateOpportunityDossierMarkdown(opportunity);
    navigator.clipboard.writeText(md);
    setCopiedDossier(true);
    setTimeout(() => setCopiedDossier(false), 2500);
  };

  const handleDownloadIcs = () => {
    const icsData = generateIcsContent(opportunity);
    const blob = new Blob([icsData], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${opportunity.id}-deadline.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRunPitchGenerator = async () => {
    setPitchLoading(true);
    setPitchError(null);
    try {
      const res = await fetch("/api/opportunities/pitch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ opportunity, profile }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate pitch");
      setPitchResult(data.pitch);
      setActiveTab("pitch");
    } catch (e: any) {
      setPitchError(e.message || "Failed to generate pitch");
    } finally {
      setPitchLoading(false);
    }
  };

  const handleToggleSave = () => {
    if (saved) {
      removeSavedOpportunity(opportunity.id);
      setSaved(false);
    } else {
      saveOpportunity(opportunity, "interested");
      setSaved(true);
    }
    onSaveChanged?.();
  };

  const handleRunAiAnalysis = async () => {
    setAnalyzing(true);
    setAiError(null);
    try {
      const res = await fetch("/api/opportunities/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          opportunityId: opportunity.id,
          opportunity,
          profile,
        }),
      });

      if (!res.ok) {
        throw new Error(`Analysis service responded with ${res.status}`);
      }

      const data = await res.json();
      setAiAnalysis(data.analysis);
      setActiveTab("ai_analysis");
    } catch (err: any) {
      setAiError(err.message || "Failed to generate grounded analysis");
    } finally {
      setAnalyzing(false);
    }
  };

  const supportedItems = opportunity.evidenceItems.filter((item) => item.status === "supported");
  const verificationItems = opportunity.evidenceItems.filter((item) => item.status === "needs_verification");
  const conflictingItems = opportunity.evidenceItems.filter((item) => item.status === "conflicting");

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex justify-end transition-opacity">
      <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200">
        
        {/* Panel Header */}
        <div className="p-6 border-b border-slate-200 bg-slate-50 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                {opportunity.category}
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                via {opportunity.sourceEngine.replace("_", " ")}
              </span>
              <span className="text-xs text-slate-500">
                Retrieved: {new Date(opportunity.retrievedAt).toLocaleDateString()}
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 leading-snug">
              {opportunity.title}
            </h2>
            <div className="flex items-center gap-3 text-xs text-slate-600 mt-2 flex-wrap">
              <span className="flex items-center gap-1 font-semibold text-slate-800">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                {opportunity.organization}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {opportunity.location}
              </span>
              <span className="px-2 py-0.5 bg-slate-200/70 rounded text-[11px] capitalize font-medium">
                {opportunity.workMode}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyDossier}
              className={`p-2 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition ${
                copiedDossier
                  ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
              }`}
              title="Copy markdown dossier for mentors or advisors"
            >
              {copiedDossier ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span className="hidden sm:inline">{copiedDossier ? "Dossier Copied!" : "Export Dossier"}</span>
            </button>

            <button
              onClick={handleToggleSave}
              className={`p-2 rounded-lg border transition ${
                saved 
                  ? "bg-blue-50 border-blue-200 text-blue-600" 
                  : "border-slate-300 text-slate-500 hover:bg-slate-100"
              }`}
              title={saved ? "Saved in Planner" : "Save Opportunity"}
            >
              {saved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              title="Close panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 px-6 bg-white gap-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab("evidence")}
            className={`py-3.5 text-sm font-semibold border-b-2 flex items-center gap-2 transition shrink-0 ${
              activeTab === "evidence"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Evidence Audit ({opportunity.evidenceItems.length})
          </button>
          <button
            onClick={() => setActiveTab("match")}
            className={`py-3.5 text-sm font-semibold border-b-2 flex items-center gap-2 transition shrink-0 ${
              activeTab === "match"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Layers className="w-4 h-4" />
            Profile Fit ({opportunity.matchScore}%)
          </button>
          <button
            onClick={() => {
              setActiveTab("ai_analysis");
              if (!aiAnalysis && !analyzing) handleRunAiAnalysis();
            }}
            className={`py-3.5 text-sm font-semibold border-b-2 flex items-center gap-2 transition shrink-0 ${
              activeTab === "ai_analysis"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Sparkles className="w-4 h-4 text-purple-600" />
            Gemini Grounding
          </button>
          <button
            onClick={() => {
              setActiveTab("pitch");
              if (!pitchResult && !pitchLoading) handleRunPitchGenerator();
            }}
            className={`py-3.5 text-sm font-semibold border-b-2 flex items-center gap-2 transition shrink-0 ${
              activeTab === "pitch"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <PenTool className="w-4 h-4 text-emerald-600" />
            Pitch & Resume
          </button>
        </div>

        {/* Panel Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* TAB 1: EVIDENCE AUDIT */}
          {activeTab === "evidence" && (
            <div className="space-y-6">
              
              {/* Evidence Disclaimer Alert */}
              <div className="p-3.5 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-900 leading-relaxed">
                <span className="font-bold">Traceable Source Evidence:</span> All claims below are extracted directly from live SerpApi results. Search snippets cannot replace full verification on the official application page.
              </div>

              {/* Group 1: Supported Claims */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                    Supported Claims ({supportedItems.length})
                  </h3>
                </div>
                <div className="space-y-3">
                  {supportedItems.map((item) => (
                    <div key={item.id} className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 text-xs space-y-2">
                      <div className="font-semibold text-slate-900 text-sm">{item.claim}</div>
                      {item.sourceSnippet && (
                        <div className="p-2.5 rounded bg-white border border-emerald-100 text-slate-700 font-mono text-[11px] leading-relaxed">
                          &quot;{item.sourceSnippet}&quot;
                        </div>
                      )}
                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                        <span>Source: <strong className="text-slate-700">{item.sourceDomain}</strong></span>
                        {item.sourceUrl && (
                          <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1 font-medium">
                            Verify Source Link <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                      <p className="text-[11px] text-emerald-800 font-medium">✓ {item.confidenceNote}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Group 2: Needs Verification */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                    Needs Verification ({verificationItems.length})
                  </h3>
                </div>
                <div className="space-y-3">
                  {verificationItems.map((item) => (
                    <div key={item.id} className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 text-xs space-y-2">
                      <div className="font-semibold text-slate-900 text-sm">{item.claim}</div>
                      {item.limitations && (
                        <p className="text-slate-600 text-xs">{item.limitations}</p>
                      )}
                      <div className="p-2.5 rounded bg-white border border-amber-100 text-amber-900 text-[11px]">
                        <strong>Recommended Action:</strong> {item.confidenceNote}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Group 3: Conflicting Claims */}
              {conflictingItems.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <HelpCircle className="w-4 h-4 text-rose-600" />
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                      Conflicting Claims ({conflictingItems.length})
                    </h3>
                  </div>
                  <div className="space-y-3">
                    {conflictingItems.map((item) => (
                      <div key={item.id} className="p-4 rounded-xl border border-rose-200 bg-rose-50/40 text-xs space-y-2">
                        <div className="font-semibold text-slate-900 text-sm">{item.claim}</div>
                        {item.sourceSnippet && (
                          <div className="p-2.5 rounded bg-white border border-rose-100 text-slate-700 text-[11px]">
                            &quot;{item.sourceSnippet}&quot;
                          </div>
                        )}
                        <p className="text-[11px] text-rose-800 font-medium">⚠ {item.confidenceNote}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Deadline & Expiration Intelligence */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                  <Clock className="w-4 h-4 text-blue-600" />
                  Deadline Intelligence
                </div>
                <div className="flex items-center gap-3 text-xs flex-wrap">
                  <span className="font-medium text-slate-700">Published Status:</span>
                  <span className="px-2 py-0.5 rounded font-bold text-xs bg-slate-100 text-slate-800 capitalize">
                    {opportunity.deadlineStatus}
                  </span>
                  {opportunity.deadline && (
                    <span className="font-bold text-slate-900">{opportunity.deadline}</span>
                  )}
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {opportunity.deadlineNotes || "Always confirm deadline countdown directly on employer or program portal."}
                </p>

                {/* Calendar Export Integration */}
                {opportunity.deadline && (
                  <div className="pt-2 border-t border-slate-100 flex items-center gap-2 flex-wrap">
                    {generateGoogleCalendarUrl(opportunity) && (
                      <a
                        href={generateGoogleCalendarUrl(opportunity)!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-[11px] flex items-center gap-1.5 transition border border-blue-200/60"
                      >
                        <CalendarPlus className="w-3.5 h-3.5" />
                        <span>Add to Google Calendar</span>
                      </a>
                    )}
                    <button
                      onClick={handleDownloadIcs}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] flex items-center gap-1.5 transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download iCal (.ics)</span>
                    </button>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 2: PROFILE FIT & EXPLAINABLE MATCH */}
          {activeTab === "match" && (
            <div className="space-y-6 text-xs">
              
              {/* Match Score Banner */}
              <div className="p-5 rounded-xl border border-blue-200 bg-blue-50/50 flex items-center justify-between">
                <div>
                  <div className="text-2xl font-black text-blue-700">{opportunity.matchScore}%</div>
                  <div className="text-xs font-semibold text-slate-700 mt-0.5">Profile Match Rating</div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Calculated via deterministic weighted algorithms against your current student profile.
                  </p>
                </div>
                {opportunity.matchBreakdown.isProvisional && (
                  <div className="px-3 py-1.5 bg-amber-100 border border-amber-300 rounded-lg text-amber-900 text-xs font-medium">
                    Provisional (Incomplete Profile)
                  </div>
                )}
              </div>

              {/* Explainable Score Factor Weights */}
              <div>
                <h3 className="font-bold text-slate-900 text-sm mb-3">Scoring Factor Weights</h3>
                <div className="space-y-2.5">
                  <div>
                    <div className="flex justify-between mb-1 font-semibold text-slate-700">
                      <span>Skills Alignment (35% weight)</span>
                      <span>{opportunity.matchBreakdown.skillsScore}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-blue-600 h-full rounded-full" style={{ width: `${opportunity.matchBreakdown.skillsScore}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1 font-semibold text-slate-700">
                      <span>Eligibility Fit (30% weight)</span>
                      <span>{opportunity.matchBreakdown.eligibilityScore}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${opportunity.matchBreakdown.eligibilityScore}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1 font-semibold text-slate-700">
                      <span>Interests & Category (20% weight)</span>
                      <span>{opportunity.matchBreakdown.interestScore}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-purple-600 h-full rounded-full" style={{ width: `${opportunity.matchBreakdown.interestScore}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1 font-semibold text-slate-700">
                      <span>Location & Work Mode (10% weight)</span>
                      <span>{opportunity.matchBreakdown.locationScore}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${opportunity.matchBreakdown.locationScore}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1 font-semibold text-slate-700">
                      <span>Experience Level (5% weight)</span>
                      <span>{opportunity.matchBreakdown.experienceScore}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-amber-600 h-full rounded-full" style={{ width: `${opportunity.matchBreakdown.experienceScore}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Matched vs Missing Skills */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3.5 rounded-lg border border-emerald-200 bg-emerald-50/40">
                  <h4 className="font-bold text-emerald-900 mb-2">Matched Skills ({opportunity.matchBreakdown.matchedSkills.length})</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {opportunity.matchBreakdown.matchedSkills.length > 0 ? (
                      opportunity.matchBreakdown.matchedSkills.map((s, i) => (
                        <span key={i} className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-medium text-[11px]">
                          ✓ {s}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-400 italic">No direct keyword overlap found</span>
                    )}
                  </div>
                </div>

                <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50">
                  <h4 className="font-bold text-slate-800 mb-2">Unmatched Profile Skills</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {opportunity.matchBreakdown.missingSkills.length > 0 ? (
                      opportunity.matchBreakdown.missingSkills.slice(0, 5).map((s, i) => (
                        <span key={i} className="px-2 py-0.5 bg-white border border-slate-200 text-slate-600 rounded text-[11px]">
                          {s}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-400 italic">None</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Rationale Notes */}
              <div>
                <h4 className="font-bold text-slate-900 mb-2">Evaluation Notes & Logic</h4>
                <ul className="space-y-1.5 list-disc pl-4 text-slate-600">
                  {opportunity.matchBreakdown.notes.map((note, i) => (
                    <li key={i}>{note}</li>
                  ))}
                </ul>
              </div>

              {/* Acceptance Probability Disclaimer */}
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-900">
                <strong>Important Distinction:</strong> Match score indicates alignment between your stated profile and the search listing. It does not calculate or guarantee your probability of acceptance, interview selection, or admission.
              </div>

            </div>
          )}

          {/* TAB 3: GEMINI GROUNDED ANALYSIS */}
          {activeTab === "ai_analysis" && (
            <div className="space-y-6 text-xs">
              {analyzing ? (
                <div className="py-16 text-center space-y-3">
                  <Loader2 className="w-8 h-8 text-purple-600 animate-spin mx-auto" />
                  <div className="font-bold text-slate-800 text-sm">Synthesizing Grounded Evidence...</div>
                  <p className="text-slate-500 max-w-sm mx-auto">
                    Gemini is cross-referencing your profile credentials against retrieved SerpApi search snippets and eligibility constraints.
                  </p>
                </div>
              ) : aiError ? (
                <div className="p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-900 space-y-2">
                  <div className="font-bold">Analysis Encountered an Error</div>
                  <p>{aiError}</p>
                  <button
                    onClick={handleRunAiAnalysis}
                    className="px-3 py-1.5 bg-rose-600 text-white rounded font-semibold text-xs hover:bg-rose-700 transition"
                  >
                    Retry Analysis
                  </button>
                </div>
              ) : aiAnalysis ? (
                <div className="space-y-5">
                  
                  {/* Summary Callout */}
                  <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/50 space-y-1.5">
                    <div className="font-bold text-purple-900 text-sm flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-purple-600" />
                      Grounded Synthesis
                    </div>
                    <p className="text-slate-700 leading-relaxed text-xs">
                      {aiAnalysis.summaryRationale}
                    </p>
                  </div>

                  {/* Unknown Requirements Detected */}
                  {aiAnalysis.unknownRequirements?.length > 0 && (
                    <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/30 space-y-3">
                      <h4 className="font-bold text-amber-900 text-sm">Gaps to Verify on Official Portal</h4>
                      <div className="space-y-2">
                        {aiAnalysis.unknownRequirements.map((req: any, i: number) => (
                          <div key={i} className="p-2.5 rounded bg-white border border-amber-200 text-xs space-y-1">
                            <div className="font-semibold text-slate-900">{req.requirement}</div>
                            <div className="text-slate-500 text-[11px]">{req.whyUnknown}</div>
                            <div className="text-amber-800 font-medium text-[11px]">→ {req.verificationAdvice}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Potential Ineligibilities */}
                  {aiAnalysis.potentialIneligibilities?.length > 0 && (
                    <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/50 space-y-2">
                      <h4 className="font-bold text-rose-900 text-sm">Potential Ineligibility Flags</h4>
                      <ul className="list-disc pl-4 text-rose-800 space-y-1">
                        {aiAnalysis.potentialIneligibilities.map((flag: string, i: number) => (
                          <li key={i}>{flag}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Action Preparation Checklist */}
                  {aiAnalysis.actionChecklist?.length > 0 && (
                    <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
                      <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                        <ListTodo className="w-4 h-4 text-blue-600" />
                        Grounded Preparation Checklist
                      </h4>
                      <div className="space-y-2">
                        {aiAnalysis.actionChecklist.map((item: any, i: number) => (
                          <div key={i} className="flex items-start gap-2 p-2 rounded bg-slate-50 border border-slate-200">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold shrink-0 ${
                              item.importance === "critical" ? "bg-rose-100 text-rose-800" : "bg-blue-100 text-blue-800"
                            }`}>
                              {item.importance}
                            </span>
                            <span className="text-xs text-slate-800 font-medium">{item.task}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              ) : (
                <div className="py-12 text-center space-y-3">
                  <p className="text-slate-600 text-xs">
                    Run an AI-powered evidence grounding assessment to discover missing eligibility rules and generate a tailored checklist.
                  </p>
                  <button
                    onClick={handleRunAiAnalysis}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold text-xs hover:bg-purple-700 transition inline-flex items-center gap-2 shadow-sm"
                  >
                    <Sparkles className="w-4 h-4" />
                    Analyze with Gemini
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: APPLICATION PITCH & RESUME FIT */}
          {activeTab === "pitch" && (
            <div className="space-y-6 text-xs">
              {pitchLoading ? (
                <div className="py-16 text-center space-y-3">
                  <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
                  <div className="font-bold text-slate-800 text-sm">Drafting Tailored Application Materials...</div>
                  <p className="text-slate-500 max-w-sm mx-auto">
                    Synthesizing your matched skills and degree credentials into a tailored cover letter pitch and resume talking points.
                  </p>
                </div>
              ) : pitchError ? (
                <div className="p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-900 space-y-2">
                  <div className="font-bold">Failed to Generate Pitch</div>
                  <p>{pitchError}</p>
                  <button
                    onClick={handleRunPitchGenerator}
                    className="px-3 py-1.5 bg-rose-600 text-white rounded font-semibold text-xs hover:bg-rose-700"
                  >
                    Retry Pitch Generation
                  </button>
                </div>
              ) : pitchResult ? (
                <div className="space-y-5">
                  {/* Headline Banner */}
                  <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-1">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                      Tailored Candidate Value Proposition
                    </div>
                    <div className="font-bold text-slate-900 text-sm leading-snug">
                      {pitchResult.headline}
                    </div>
                  </div>

                  {/* 3-Paragraph Cover Letter Pitch */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2.5">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                        <PenTool className="w-4 h-4 text-emerald-600" />
                        Tailored Cover Letter Pitch
                      </h4>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(pitchResult.coverLetterPitch);
                          setCopiedPitch(true);
                          setTimeout(() => setCopiedPitch(false), 2000);
                        }}
                        className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] flex items-center gap-1 transition"
                      >
                        {copiedPitch ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedPitch ? "Copied!" : "Copy Pitch"}</span>
                      </button>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 whitespace-pre-line leading-relaxed font-sans text-xs">
                      {pitchResult.coverLetterPitch}
                    </div>
                  </div>

                  {/* Targeted Resume Bullets */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                    <h4 className="font-bold text-slate-900 text-sm">
                      Recommended Resume Action Bullets
                    </h4>
                    <ul className="space-y-1.5 list-disc pl-4 text-slate-700">
                      {pitchResult.resumeBulletPoints?.map((bullet: string, i: number) => (
                        <li key={i} className="leading-relaxed">{bullet}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Tactical Interview Talking Points */}
                  <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 space-y-2">
                    <h4 className="font-bold text-blue-950 text-sm">
                      Tactical Interview Talking Points
                    </h4>
                    <ul className="space-y-1.5 list-disc pl-4 text-blue-900">
                      {pitchResult.talkingPointsForInterviews?.map((point: string, i: number) => (
                        <li key={i} className="leading-relaxed">{point}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Portfolio Project Ideas */}
                  <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/40 space-y-2">
                    <h4 className="font-bold text-purple-950 text-sm">
                      Recommended Portfolio Project Highlights
                    </h4>
                    <ul className="space-y-1.5 list-disc pl-4 text-purple-900">
                      {pitchResult.suggestedPortfolioProjects?.map((proj: string, i: number) => (
                        <li key={i} className="leading-relaxed">{proj}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center space-y-3">
                  <p className="text-slate-600 text-xs">
                    Generate an instant customized cover letter pitch, targeted resume bullets, and interview defense points grounded in this posting.
                  </p>
                  <button
                    onClick={handleRunPitchGenerator}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-semibold text-xs hover:bg-emerald-700 transition inline-flex items-center gap-2 shadow-sm"
                  >
                    <PenTool className="w-4 h-4" />
                    Generate Application Pitch
                  </button>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Panel Footer Actions */}
        <div className="p-6 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-4">
          <button
            onClick={handleToggleSave}
            className={`px-4 py-2.5 rounded-lg font-semibold text-xs flex items-center gap-2 transition border ${
              saved
                ? "bg-blue-50 border-blue-200 text-blue-700"
                : "bg-white border-slate-300 text-slate-700 hover:bg-slate-100"
            }`}
          >
            {saved ? <BookmarkCheck className="w-4 h-4 text-blue-600" /> : <Bookmark className="w-4 h-4" />}
            {saved ? "Saved in Planner" : "Save Opportunity"}
          </button>

          {opportunity.originalUrl && (
            <a
              href={opportunity.originalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-xs flex items-center gap-2 transition shadow-sm"
            >
              <span>Open Official Application Page</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>

      </div>
    </div>
  );
}

