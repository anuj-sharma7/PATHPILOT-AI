"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Bookmark, 
  Trash2, 
  ExternalLink, 
  Sparkles, 
  Edit3, 
  CheckSquare, 
  Square, 
  Clock, 
  Building2, 
  MapPin, 
  AlertCircle,
  Search,
  Filter
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { OpportunityEvidencePanel } from "@/components/evidence/OpportunityEvidencePanel";
import { 
  loadSavedOpportunities, 
  updateSavedOpportunity, 
  removeSavedOpportunity, 
  loadProfile, 
  SavedOpportunity, 
  StudentProfile 
} from "@/lib/storage/localStorage";
import { ApplicationStatus, Opportunity, ChecklistItem } from "@/types";

const STATUS_TABS: Array<{ id: ApplicationStatus | "all"; label: string }> = [
  { id: "all", label: "All Saved" },
  { id: "interested", label: "Interested" },
  { id: "preparing", label: "Preparing" },
  { id: "applied", label: "Applied" },
  { id: "archived", label: "Archived" },
];

export default function SavedPage() {
  const [savedList, setSavedList] = useState<SavedOpportunity[]>([]);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | "all">("all");
  const [searchFilter, setSearchFilter] = useState("");
  const [selectedEvidenceOpp, setSelectedEvidenceOpp] = useState<Opportunity | null>(null);
  
  // Note editing state
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");

  useEffect(() => {
    setSavedList(loadSavedOpportunities());
    setProfile(loadProfile());
  }, []);

  const handleStatusChange = (opportunityId: string, newStatus: ApplicationStatus) => {
    const item = savedList.find((s) => s.opportunityId === opportunityId);
    if (!item) return;
    const updated = { ...item, applicationStatus: newStatus };
    updateSavedOpportunity(updated);
    setSavedList(loadSavedOpportunities());
  };

  const handleRemove = (opportunityId: string) => {
    removeSavedOpportunity(opportunityId);
    setSavedList(loadSavedOpportunities());
  };

  const handleToggleChecklist = (opportunityId: string, checkId: string) => {
    const item = savedList.find((s) => s.opportunityId === opportunityId);
    if (!item) return;
    const updatedChecklist = item.checklist.map((c: ChecklistItem) =>
      c.id === checkId ? { ...c, completed: !c.completed } : c
    );
    const updated = { ...item, checklist: updatedChecklist };
    updateSavedOpportunity(updated);
    setSavedList(loadSavedOpportunities());
  };

  const handleSaveNote = (opportunityId: string) => {
    const item = savedList.find((s) => s.opportunityId === opportunityId);
    if (!item) return;
    const updated = { ...item, notes: noteText };
    updateSavedOpportunity(updated);
    setSavedList(loadSavedOpportunities());
    setEditingNoteId(null);
  };

  const filtered = savedList.filter((item) => {
    if (statusFilter !== "all" && item.applicationStatus !== statusFilter) return false;
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      const opp = item.opportunity;
      return (
        opp.title.toLowerCase().includes(q) ||
        opp.organization.toLowerCase().includes(q) ||
        item.notes.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="flex-1 pb-16">
      <Header
        title="Saved Opportunities & Applications"
        subtitle="Manage shortlisted programs, track application deadlines, and record preparation notes."
      />

      <div className="max-w-7xl mx-auto px-8 pt-6 space-y-6">

        {/* Filter and Status Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200">
          
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto text-xs">
            {STATUS_TABS.map((tab) => {
              const count = tab.id === "all" 
                ? savedList.length 
                : savedList.filter((s) => s.applicationStatus === tab.id).length;
              return (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 shrink-0 ${
                    statusFilter === tab.id
                      ? "bg-blue-600 text-white font-semibold"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    statusFilter === tab.id ? "bg-blue-700 text-white" : "bg-slate-200 text-slate-700"
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Quick Search */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search saved..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Saved List Content */}
        {filtered.length > 0 ? (
          <div className="space-y-4">
            {filtered.map((item) => {
              const opp = item.opportunity;
              const completedTasks = item.checklist.filter((c: ChecklistItem) => c.completed).length;
              const totalTasks = item.checklist.length;
              const isEditingNote = editingNoteId === opp.id;

              return (
                <div key={item.opportunityId} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow transition space-y-4">
                  
                  {/* Item Header */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                          {opp.category}
                        </span>
                        <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded font-medium">
                          Saved: {new Date(item.savedAt).toLocaleDateString()}
                        </span>
                        {opp.deadline && (
                          <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <Clock className="w-3 h-3 text-emerald-600" />
                            Deadline: {opp.deadline}
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 leading-snug">
                        {opp.title}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-slate-600 mt-1 flex-wrap">
                        <span className="flex items-center gap-1 font-semibold text-slate-800">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          {opp.organization}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {opp.location}
                        </span>
                        <span className="font-semibold text-blue-600">
                          {opp.matchScore}% Profile Match
                        </span>
                      </div>
                    </div>

                    {/* Status Dropdown & Delete Action */}
                    <div className="flex items-center gap-2 shrink-0">
                      <select
                        value={item.applicationStatus}
                        onChange={(e) => handleStatusChange(opp.id, e.target.value as ApplicationStatus)}
                        className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none focus:border-blue-500"
                      >
                        <option value="interested">Status: Interested</option>
                        <option value="preparing">Status: Preparing</option>
                        <option value="applied">Status: Applied</option>
                        <option value="archived">Status: Archived</option>
                      </select>

                      <button
                        onClick={() => setSelectedEvidenceOpp(opp)}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
                        title="View Evidence Panel"
                      >
                        <Sparkles className="w-4 h-4 text-purple-600" />
                      </button>

                      {opp.originalUrl && (
                        <a
                          href={opp.originalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
                          title="Open original link"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}

                      <button
                        onClick={() => handleRemove(opp.id)}
                        className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition"
                        title="Remove from saved"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Checklist & Notes Columns */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1 text-xs">
                    
                    {/* Interactive Checklist */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-slate-700 font-bold mb-1">
                        <span className="flex items-center gap-1.5">
                          <CheckSquare className="w-4 h-4 text-blue-600" />
                          Preparation Checklist ({completedTasks}/{totalTasks})
                        </span>
                      </div>

                      <div className="space-y-1.5 bg-slate-50 p-3 rounded-lg border border-slate-200/60">
                        {item.checklist.map((task: ChecklistItem) => (
                          <div
                            key={task.id}
                            onClick={() => handleToggleChecklist(opp.id, task.id)}
                            className="flex items-start gap-2 cursor-pointer hover:opacity-80 transition select-none"
                          >
                            {task.completed ? (
                              <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                            )}
                            <span className={`text-slate-800 leading-snug ${task.completed ? "line-through text-slate-400" : ""}`}>
                              {task.text}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Personal Notes */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-slate-700 font-bold mb-1">
                        <span className="flex items-center gap-1.5">
                          <Edit3 className="w-4 h-4 text-slate-500" />
                          Personal Notes
                        </span>
                        {!isEditingNote && (
                          <button
                            onClick={() => {
                              setEditingNoteId(opp.id);
                              setNoteText(item.notes);
                            }}
                            className="text-blue-600 hover:underline font-semibold text-[11px]"
                          >
                            Edit Note
                          </button>
                        )}
                      </div>

                      {isEditingNote ? (
                        <div className="space-y-2">
                          <textarea
                            value={noteText}
                            onChange={(e) => setNoteText(e.target.value)}
                            placeholder="Add application notes, referral contact, submission date..."
                            rows={3}
                            className="w-full p-2.5 bg-white border border-blue-400 rounded-lg text-xs text-slate-800 outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setEditingNoteId(null)}
                              className="px-2.5 py-1 text-slate-500 hover:bg-slate-100 rounded text-xs"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleSaveNote(opp.id)}
                              className="px-3 py-1 bg-blue-600 text-white rounded text-xs font-semibold hover:bg-blue-700"
                            >
                              Save Note
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/60 min-h-[76px] text-slate-600 italic">
                          {item.notes || "No notes recorded yet. Click 'Edit Note' to add personal reminders or referral contacts."}
                        </div>
                      )}
                    </div>

                  </div>

                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-lg mx-auto space-y-4">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <Bookmark className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">No saved opportunities in this view</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Shortlist opportunities from the Discover page to track requirements, prepare application materials, and monitor deadlines.
              </p>
            </div>
            <Link
              href="/discover"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition inline-block shadow-sm"
            >
              Go to Discover
            </Link>
          </div>
        )}

      </div>

      {/* Opportunity Evidence Panel */}
      {selectedEvidenceOpp && (
        <OpportunityEvidencePanel
          opportunity={selectedEvidenceOpp}
          profile={profile || undefined}
          onClose={() => setSelectedEvidenceOpp(null)}
          onSaveChanged={() => setSavedList(loadSavedOpportunities())}
        />
      )}
    </div>
  );
}
