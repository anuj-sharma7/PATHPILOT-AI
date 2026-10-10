"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  ClipboardCheck, 
  CheckCircle2, 
  Clock, 
  ExternalLink, 
  Sparkles, 
  Building2, 
  FileText, 
  UserCheck, 
  FolderCheck,
  AlertCircle,
  Plus,
  Trash2
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { 
  loadSavedOpportunities, 
  updateSavedOpportunity, 
  loadProfile, 
  SavedOpportunity, 
  StudentProfile 
} from "@/lib/storage/localStorage";
import { ChecklistItem } from "@/types";

export default function PlannerPage() {
  const [savedList, setSavedList] = useState<SavedOpportunity[]>([]);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [selectedOppId, setSelectedOppId] = useState<string | null>(null);
  const [newTaskText, setNewTaskText] = useState("");

  useEffect(() => {
    const saved = loadSavedOpportunities();
    setSavedList(saved);
    setProfile(loadProfile());
    if (saved.length > 0 && !selectedOppId) {
      setSelectedOppId(saved[0].opportunityId);
    }
  }, []);

  const activeSaved = savedList.find((s) => s.opportunityId === selectedOppId);
  const activeOpp = activeSaved?.opportunity;

  const handleToggleTask = (taskId: string) => {
    if (!activeSaved) return;
    const updatedChecklist = activeSaved.checklist.map((t: ChecklistItem) =>
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );
    const updated = { ...activeSaved, checklist: updatedChecklist };
    updateSavedOpportunity(updated);
    setSavedList(loadSavedOpportunities());
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim() || !activeSaved) return;
    const newTask: ChecklistItem = {
      id: `task-${Date.now()}`,
      text: newTaskText.trim(),
      completed: false,
      category: "materials",
    };
    const updated = { ...activeSaved, checklist: [...activeSaved.checklist, newTask] };
    updateSavedOpportunity(updated);
    setSavedList(loadSavedOpportunities());
    setNewTaskText("");
  };

  const handleDeleteTask = (taskId: string) => {
    if (!activeSaved) return;
    const updatedChecklist = activeSaved.checklist.filter((t: ChecklistItem) => t.id !== taskId);
    const updated = { ...activeSaved, checklist: updatedChecklist };
    updateSavedOpportunity(updated);
    setSavedList(loadSavedOpportunities());
  };

  const completedCount = activeSaved?.checklist.filter((t: ChecklistItem) => t.completed).length || 0;
  const totalCount = activeSaved?.checklist.length || 0;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="flex-1 pb-16">
      <Header
        title="Application Planner & Preparation Assistant"
        subtitle="Step-by-step action plan tailored to opportunity requirements and matched skills."
      />

      <div className="max-w-7xl mx-auto px-8 pt-6 space-y-6">

        {savedList.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            
            {/* Left Column: Shortlisted Opportunities Selector */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center justify-between">
                <span>Select Opportunity</span>
                <span className="text-xs text-slate-400 font-normal">({savedList.length} saved)</span>
              </h3>

              <div className="space-y-2">
                {savedList.map((item) => {
                  const opp = item.opportunity;
                  const isSelected = item.opportunityId === selectedOppId;
                  const comp = item.checklist.filter((c: ChecklistItem) => c.completed).length;
                  const tot = item.checklist.length;

                  return (
                    <div
                      key={item.opportunityId}
                      onClick={() => setSelectedOppId(item.opportunityId)}
                      className={`p-3.5 rounded-xl border text-xs cursor-pointer transition ${
                        isSelected
                          ? "bg-blue-50/70 border-blue-400 text-slate-900 shadow-sm"
                          : "border-slate-200 hover:bg-slate-50 text-slate-600"
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-semibold text-slate-800 truncate max-w-[170px]">{opp.organization}</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 bg-white rounded border border-slate-200 text-slate-700">
                          {comp}/{tot} done
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-900 line-clamp-1">{opp.title}</h4>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1.5">
                        <span className="capitalize">{opp.category}</span>
                        <span className="text-blue-600 font-semibold">{opp.matchScore}% Match</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Tailored Action Plan & Checklist Workspace */}
            {activeSaved && activeOpp && (
              <div className="lg:col-span-2 space-y-6">
                
                {/* Active Opportunity Card */}
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                          {activeOpp.category}
                        </span>
                        <span className="text-xs text-slate-500">
                          Domain: {activeOpp.sourceDomain}
                        </span>
                      </div>
                      <h2 className="text-xl font-bold text-slate-900 leading-snug">
                        {activeOpp.title}
                      </h2>
                      <p className="text-xs text-slate-600 mt-1">
                        {activeOpp.organization} • {activeOpp.location}
                      </p>
                    </div>

                    {activeOpp.originalUrl && (
                      <a
                        href={activeOpp.originalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition self-start shadow-sm"
                      >
                        <span>Official Portal</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>

                  {/* Progress Indicator */}
                  <div>
                    <div className="flex justify-between items-center text-xs font-semibold text-slate-700 mb-1.5">
                      <span>Preparation Progress</span>
                      <span>{progressPercent}% Complete ({completedCount}/{totalCount} tasks)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Key Matched Strengths & Missing Gaps Alert */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
                    <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50/40">
                      <h4 className="font-bold text-emerald-900 mb-1 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Skills to Emphasize in Application
                      </h4>
                      <p className="text-slate-600 text-[11px] leading-relaxed">
                        Highlight your projects using: {activeOpp.matchBreakdown.matchedSkills.join(", ") || activeOpp.skills.slice(0, 3).join(", ")}.
                      </p>
                    </div>

                    <div className="p-3 rounded-lg border border-amber-200 bg-amber-50/40">
                      <h4 className="font-bold text-amber-900 mb-1 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                        Key Item to Verify First
                      </h4>
                      <p className="text-slate-600 text-[11px] leading-relaxed">
                        {activeOpp.missingRequirements[0] || "Verify explicit batch and degree eligibility rules before submitting."}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Customized Checklist */}
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <ClipboardCheck className="w-4 h-4 text-blue-600" />
                      Application Preparation Checklist
                    </h3>
                  </div>

                  <div className="space-y-2">
                    {activeSaved.checklist.map((task: ChecklistItem) => (
                      <div
                        key={task.id}
                        className={`p-3 rounded-lg border flex items-start justify-between gap-3 transition text-xs ${
                          task.completed
                            ? "bg-slate-50 border-slate-200 text-slate-400"
                            : "bg-white border-slate-200 text-slate-800 hover:border-blue-300"
                        }`}
                      >
                        <div
                          onClick={() => handleToggleTask(task.id)}
                          className="flex items-start gap-2.5 cursor-pointer flex-1 select-none"
                        >
                          <input
                            type="checkbox"
                            checked={task.completed}
                            onChange={() => {}}
                            className="w-4 h-4 rounded text-blue-600 mt-0.5 accent-blue-600"
                          />
                          <span className={`leading-relaxed ${task.completed ? "line-through" : "font-medium"}`}>
                            {task.text}
                          </span>
                        </div>

                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="text-slate-300 hover:text-rose-600 p-1 rounded transition"
                          title="Delete task"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Add New Custom Task Form */}
                  <form onSubmit={handleAddTask} className="flex gap-2 pt-2">
                    <input
                      type="text"
                      value={newTaskText}
                      onChange={(e) => setNewTaskText(e.target.value)}
                      placeholder="Add custom task (e.g., Get recommendation letter from Prof. Sharma)..."
                      className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500 focus:bg-white text-slate-800"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition shadow-sm shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Task</span>
                    </button>
                  </form>
                </div>

              </div>
            )}

          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-lg mx-auto space-y-4">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <ClipboardCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">No opportunities shortlisted yet</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Save an opportunity from the Discover page to automatically generate your grounded application checklist and preparation roadmap.
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
    </div>
  );
}
