"use client";

import { useState } from "react";
import { 
  ExternalLink, 
  Bookmark, 
  BookmarkCheck, 
  FileText, 
  Clock, 
  MapPin, 
  Building2, 
  Sparkles,
  AlertCircle,
  CheckCircle2,
  HelpCircle
} from "lucide-react";
import { Opportunity } from "@/types";
import { isOpportunitySaved, saveOpportunity, removeSavedOpportunity } from "@/lib/storage/localStorage";

interface OpportunityCardProps {
  opportunity: Opportunity;
  onSelectEvidence?: (opp: Opportunity) => void;
  onSaveToggle?: (saved: boolean) => void;
}

export function OpportunityCard({ opportunity, onSelectEvidence, onSaveToggle }: OpportunityCardProps) {
  const [saved, setSaved] = useState<boolean>(() => isOpportunitySaved(opportunity.id));
  const [showScoreDetails, setShowScoreDetails] = useState(false);

  const handleToggleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (saved) {
      removeSavedOpportunity(opportunity.id);
      setSaved(false);
      onSaveToggle?.(false);
    } else {
      saveOpportunity(opportunity, "interested");
      setSaved(true);
      onSaveToggle?.(true);
    }
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case "internship": return "bg-blue-50 text-blue-700 border-blue-200";
      case "job": return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "scholarship": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "fellowship": return "bg-purple-50 text-purple-700 border-purple-200";
      case "hackathon": return "bg-amber-50 text-amber-700 border-amber-200";
      case "research": return "bg-rose-50 text-rose-700 border-rose-200";
      default: return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const getDeadlineBadge = () => {
    if (opportunity.deadlineStatus === "confirmed" && opportunity.deadline) {
      return (
        <span className="flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
          <Clock className="w-3 h-3 text-emerald-600" />
          {opportunity.deadline}
        </span>
      );
    }
    if (opportunity.deadlineStatus === "rolling") {
      return (
        <span className="flex items-center gap-1 text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
          <Clock className="w-3 h-3 text-blue-600" />
          Rolling Review
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
        <HelpCircle className="w-3 h-3 text-amber-600" />
        Unconfirmed Deadline
      </span>
    );
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between group">
      <div>
        {/* Top Header: Category, Engine, Save Button */}
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded border ${getCategoryColor(opportunity.category)}`}>
              {opportunity.category}
            </span>
            <span className="text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded font-medium">
              via {opportunity.sourceEngine.replace("_", " ")}
            </span>
            {opportunity.dataMode === "demo" && (
              <span className="text-[10px] font-medium bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded">
                Demo
              </span>
            )}
          </div>

          <button
            onClick={handleToggleSave}
            title={saved ? "Remove from saved" : "Save opportunity"}
            className={`p-1.5 rounded-lg border transition ${
              saved 
                ? "bg-blue-50 border-blue-200 text-blue-600" 
                : "border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50"
            }`}
          >
            {saved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
          </button>
        </div>

        {/* Title and Organization */}
        <h3 className="font-semibold text-slate-900 text-base group-hover:text-blue-600 transition line-clamp-2">
          {opportunity.title}
        </h3>
        
        <div className="flex items-center gap-3 text-xs text-slate-600 mt-1 mb-2.5 flex-wrap">
          <span className="flex items-center gap-1 font-medium text-slate-700">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            {opportunity.organization}
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            {opportunity.location}
          </span>
          {opportunity.workMode !== "unspecified" && (
            <span className="capitalize px-1.5 py-0.2 bg-slate-100 rounded text-[11px] text-slate-600">
              {opportunity.workMode}
            </span>
          )}
        </div>

        {/* Factual Description Snippet */}
        <p className="text-xs text-slate-600 line-clamp-3 mb-3 leading-relaxed">
          {opportunity.description}
        </p>

        {/* Stipend if available */}
        {opportunity.stipendOrSalary && (
          <div className="mb-3 px-2.5 py-1 bg-emerald-50/70 border border-emerald-100 rounded text-xs text-emerald-800 font-medium">
            💰 {opportunity.stipendOrSalary}
          </div>
        )}

        {/* Skills Pills */}
        <div className="flex flex-wrap gap-1 mb-4">
          {opportunity.skills.slice(0, 4).map((skill, i) => (
            <span key={i} className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
              {skill}
            </span>
          ))}
          {opportunity.skills.length > 4 && (
            <span className="text-[11px] text-slate-400 self-center">
              +{opportunity.skills.length - 4} more
            </span>
          )}
        </div>
      </div>

      {/* Bottom Section: Match Score & Action Buttons */}
      <div className="border-t border-slate-100 pt-3 flex flex-col gap-2.5">
        {/* Match Score Bar */}
        <div className="flex items-center justify-between">
          <div className="relative">
            <button
              onClick={() => setShowScoreDetails(!showScoreDetails)}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 hover:text-blue-600 transition"
            >
              <div className={`px-2 py-0.5 rounded font-bold text-xs ${
                opportunity.matchScore >= 85 
                  ? "bg-emerald-100 text-emerald-800" 
                  : opportunity.matchScore >= 70 
                  ? "bg-blue-100 text-blue-800" 
                  : "bg-slate-100 text-slate-700"
              }`}>
                {opportunity.matchScore}% Match
              </div>
              <span className="text-[11px] text-slate-400 font-normal underline">breakdown</span>
            </button>

            {/* Score Breakdown Popover */}
            {showScoreDetails && (
              <div className="absolute bottom-7 left-0 w-64 bg-white p-3 rounded-xl border border-slate-200 shadow-xl z-20 text-xs">
                <div className="font-bold text-slate-800 mb-1.5 flex justify-between items-center">
                  <span>Match Score Breakdown</span>
                  <button onClick={() => setShowScoreDetails(false)} className="text-slate-400 hover:text-slate-600">×</button>
                </div>
                <div className="space-y-1 text-slate-600">
                  <div className="flex justify-between">
                    <span>Skills Fit (35%):</span>
                    <span className="font-semibold">{opportunity.matchBreakdown.skillsScore}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Eligibility Fit (30%):</span>
                    <span className="font-semibold">{opportunity.matchBreakdown.eligibilityScore}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Interest Fit (20%):</span>
                    <span className="font-semibold">{opportunity.matchBreakdown.interestScore}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Location Fit (10%):</span>
                    <span className="font-semibold">{opportunity.matchBreakdown.locationScore}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Experience Fit (5%):</span>
                    <span className="font-semibold">{opportunity.matchBreakdown.experienceScore}%</span>
                  </div>
                </div>
                <p className="mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-400 leading-tight">
                  Deterministic score against your student profile. Does not imply acceptance probability.
                </p>
              </div>
            )}
          </div>

          <div>{getDeadlineBadge()}</div>
        </div>

        {/* Actions: View Evidence & Real Source Link */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={() => onSelectEvidence?.(opportunity)}
            className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-2 rounded-lg border border-blue-200/60 transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            View Evidence
          </button>

          {opportunity.originalUrl ? (
            <a
              href={opportunity.originalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-2 rounded-lg transition"
              title={`Open primary link on ${opportunity.sourceDomain}`}
            >
              <span>Source</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}

