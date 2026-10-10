"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Scale, 
  ExternalLink, 
  Sparkles, 
  Clock, 
  Building2, 
  MapPin, 
  CheckCircle2, 
  AlertCircle, 
  Trash2,
  Plus
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { OpportunityEvidencePanel } from "@/components/evidence/OpportunityEvidencePanel";
import { loadSavedOpportunities, loadProfile, SavedOpportunity, StudentProfile } from "@/lib/storage/localStorage";
import { Opportunity } from "@/types";

export default function ComparePage() {
  const [savedList, setSavedList] = useState<SavedOpportunity[]>([]);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedEvidenceOpp, setSelectedEvidenceOpp] = useState<Opportunity | null>(null);

  useEffect(() => {
    const list = loadSavedOpportunities();
    setSavedList(list);
    setProfile(loadProfile());
    // Auto-select first 2-3 saved opportunities for immediate comparison
    if (list.length > 0) {
      setSelectedIds(list.slice(0, 3).map((s) => s.opportunityId));
    }
  }, []);

  const handleToggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      if (selectedIds.length > 1) {
        setSelectedIds(selectedIds.filter((item) => item !== id));
      }
    } else {
      if (selectedIds.length < 3) {
        setSelectedIds([...selectedIds, id]);
      } else {
        // replace last
        setSelectedIds([selectedIds[0], selectedIds[1], id]);
      }
    }
  };

  const comparedOpps = savedList
    .filter((s) => selectedIds.includes(s.opportunityId))
    .map((s) => s.opportunity);

  return (
    <div className="flex-1 pb-16">
      <Header
        title="Opportunity Comparison Matrix"
        subtitle="Compare shortlisted opportunities side-by-side on match score, deadlines, stipends, and requirements."
      />

      <div className="max-w-7xl mx-auto px-8 pt-6 space-y-6">

        {/* Opportunity Selector Chips */}
        {savedList.length > 0 && (
          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-blue-600" />
                Select Opportunities to Compare (Up to 3)
              </span>
              <span className="text-slate-400">
                {selectedIds.length} of 3 selected
              </span>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {savedList.map((item) => {
                const isSelected = selectedIds.includes(item.opportunityId);
                return (
                  <button
                    key={item.opportunityId}
                    onClick={() => handleToggleSelect(item.opportunityId)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition border flex items-center gap-1.5 ${
                      isSelected
                        ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <span>{item.opportunity.organization}: {item.opportunity.title.slice(0, 28)}...</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Comparison Table */}
        {comparedOpps.length >= 2 ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="p-4 w-44 font-bold text-slate-500 uppercase tracking-wider text-[11px]">
                    Attribute
                  </th>
                  {comparedOpps.map((opp) => (
                    <th key={opp.id} className="p-4 font-bold text-slate-900 border-l border-slate-200 min-w-[260px]">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                          {opp.category}
                        </span>
                        <span className="text-blue-600 font-extrabold text-sm">{opp.matchScore}% Match</span>
                      </div>
                      <div className="text-sm font-bold text-slate-900 leading-snug line-clamp-2">
                        {opp.title}
                      </div>
                      <div className="text-slate-500 font-normal mt-0.5">
                        {opp.organization}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                
                {/* Match Score & Rating */}
                <tr>
                  <td className="p-4 font-bold text-slate-700 bg-slate-50/50">
                    Match Breakdown
                  </td>
                  {comparedOpps.map((opp) => (
                    <td key={opp.id} className="p-4 border-l border-slate-100 space-y-1">
                      <div className="flex justify-between text-slate-600">
                        <span>Skills (35%):</span>
                        <span className="font-semibold text-slate-900">{opp.matchBreakdown.skillsScore}%</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Eligibility (30%):</span>
                        <span className="font-semibold text-slate-900">{opp.matchBreakdown.eligibilityScore}%</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Interests (20%):</span>
                        <span className="font-semibold text-slate-900">{opp.matchBreakdown.interestScore}%</span>
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Deadline & Certainty */}
                <tr>
                  <td className="p-4 font-bold text-slate-700 bg-slate-50/50">
                    Deadline Intelligence
                  </td>
                  {comparedOpps.map((opp) => (
                    <td key={opp.id} className="p-4 border-l border-slate-100 space-y-1">
                      <div className="font-bold text-slate-900">
                        {opp.deadline || "Unconfirmed deadline"}
                      </div>
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold capitalize ${
                        opp.deadlineStatus === "confirmed" 
                          ? "bg-emerald-100 text-emerald-800" 
                          : opp.deadlineStatus === "rolling"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-amber-100 text-amber-800"
                      }`}>
                        {opp.deadlineStatus}
                      </span>
                      <p className="text-[11px] text-slate-500 leading-tight pt-1">
                        {opp.deadlineNotes || "Verify official countdown."}
                      </p>
                    </td>
                  ))}
                </tr>

                {/* Location & Work Mode */}
                <tr>
                  <td className="p-4 font-bold text-slate-700 bg-slate-50/50">
                    Location & Work Mode
                  </td>
                  {comparedOpps.map((opp) => (
                    <td key={opp.id} className="p-4 border-l border-slate-100 space-y-1">
                      <div className="flex items-center gap-1 text-slate-800 font-semibold">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{opp.location}</span>
                      </div>
                      <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-600 capitalize text-[11px]">
                        {opp.workMode}
                      </span>
                    </td>
                  ))}
                </tr>

                {/* Stipend / Compensation */}
                <tr>
                  <td className="p-4 font-bold text-slate-700 bg-slate-50/50">
                    Compensation
                  </td>
                  {comparedOpps.map((opp) => (
                    <td key={opp.id} className="p-4 border-l border-slate-100">
                      {opp.stipendOrSalary ? (
                        <span className="px-2 py-1 bg-emerald-50 text-emerald-800 font-bold rounded border border-emerald-200">
                          💰 {opp.stipendOrSalary}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Not disclosed in snippet</span>
                      )}
                    </td>
                  ))}
                </tr>

                {/* Matched Skills */}
                <tr>
                  <td className="p-4 font-bold text-slate-700 bg-slate-50/50">
                    Matched Skills
                  </td>
                  {comparedOpps.map((opp) => (
                    <td key={opp.id} className="p-4 border-l border-slate-100">
                      <div className="flex flex-wrap gap-1">
                        {opp.matchBreakdown.matchedSkills.map((s, i) => (
                          <span key={i} className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-semibold text-[10px]">
                            ✓ {s}
                          </span>
                        ))}
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Evidence & Action Buttons */}
                <tr>
                  <td className="p-4 font-bold text-slate-700 bg-slate-50/50">
                    Actions
                  </td>
                  {comparedOpps.map((opp) => (
                    <td key={opp.id} className="p-4 border-l border-slate-100 space-y-2">
                      <button
                        onClick={() => setSelectedEvidenceOpp(opp)}
                        className="w-full py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition border border-blue-200/60"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                        <span>View Evidence Audit</span>
                      </button>

                      {opp.originalUrl && (
                        <a
                          href={opp.originalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-lg text-xs flex items-center justify-center gap-1.5 transition"
                        >
                          <span>Open Source</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </td>
                  ))}
                </tr>

              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-lg mx-auto space-y-4">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Select at least 2 opportunities to compare</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Save opportunities from the Discover page to compare their match scores, compensation, and deadlines side-by-side.
              </p>
            </div>
            <Link
              href="/discover"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition inline-block shadow-sm"
            >
              Explore Discover
            </Link>
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

