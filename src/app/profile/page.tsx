"use client";

import { useEffect, useState } from "react";
import { 
  User, 
  Save, 
  Plus, 
  X, 
  Sparkles, 
  CheckCircle2, 
  GraduationCap, 
  MapPin, 
  Briefcase, 
  ShieldCheck,
  AlertCircle
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { loadProfile, saveProfile, StudentProfile } from "@/lib/storage/localStorage";
import { OpportunityCategory, WorkMode } from "@/types";

const ALL_CATEGORIES: Array<{ id: OpportunityCategory; label: string }> = [
  { id: "internship", label: "Internships" },
  { id: "job", label: "Jobs" },
  { id: "scholarship", label: "Scholarships" },
  { id: "fellowship", label: "Fellowships" },
  { id: "hackathon", label: "Hackathons" },
  { id: "research", label: "Research Programs" },
  { id: "competition", label: "Student Competitions" },
];

export default function ProfilePage() {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);
  
  // Tag input temp states
  const [newSkill, setNewSkill] = useState("");
  const [newInterest, setNewInterest] = useState("");
  const [newLocation, setNewLocation] = useState("");

  useEffect(() => {
    setProfile(loadProfile());
  }, []);

  if (!profile) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveProfile(profile);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleAddSkill = () => {
    if (!newSkill.trim() || profile.skills.includes(newSkill.trim())) return;
    setProfile({ ...profile, skills: [...profile.skills, newSkill.trim()] });
    setNewSkill("");
  };

  const handleRemoveSkill = (skill: string) => {
    setProfile({ ...profile, skills: profile.skills.filter((s: string) => s !== skill) });
  };

  const handleAddInterest = () => {
    if (!newInterest.trim() || profile.interests.includes(newInterest.trim())) return;
    setProfile({ ...profile, interests: [...profile.interests, newInterest.trim()] });
    setNewInterest("");
  };

  const handleRemoveInterest = (interest: string) => {
    setProfile({ ...profile, interests: profile.interests.filter((i: string) => i !== interest) });
  };

  const handleAddLocation = () => {
    if (!newLocation.trim() || profile.preferredLocations.includes(newLocation.trim())) return;
    setProfile({ ...profile, preferredLocations: [...profile.preferredLocations, newLocation.trim()] });
    setNewLocation("");
  };

  const handleRemoveLocation = (loc: string) => {
    setProfile({ ...profile, preferredLocations: profile.preferredLocations.filter((l: string) => l !== loc) });
  };

  const handleCategoryToggle = (cat: OpportunityCategory) => {
    const exists = profile.preferredCategories.includes(cat);
    const updated = exists
      ? profile.preferredCategories.filter((c: OpportunityCategory) => c !== cat)
      : [...profile.preferredCategories, cat];
    setProfile({ ...profile, preferredCategories: updated });
  };

  return (
    <div className="flex-1 pb-16">
      <Header
        title="Student Profile & Match Preferences"
        subtitle="Your qualifications and preferences guide deterministic opportunity matching and query personalization."
      />

      <div className="max-w-4xl mx-auto px-8 pt-6 space-y-6">

        {savedSuccess && (
          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Profile saved successfully! Search matching weights will update instantly across the app.
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          
          {/* Section 1: Academic Background */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-blue-600" />
              Academic Credentials
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={profile.name || ""}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  placeholder="E.g. Arjun Sharma"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Education Level
                </label>
                <select
                  value={profile.educationLevel}
                  onChange={(e) => setProfile({ ...profile, educationLevel: e.target.value as any })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500 text-slate-900"
                >
                  <option value="undergraduate">Undergraduate (Bachelor's / B.Tech / BS)</option>
                  <option value="graduate">Graduate (Master's / M.Tech / MS)</option>
                  <option value="phd">Doctorate (Ph.D.)</option>
                  <option value="high_school">High School Senior</option>
                  <option value="bootcamp">Bootcamp / Non-Traditional</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Degree / Program
                </label>
                <input
                  type="text"
                  value={profile.degree}
                  onChange={(e) => setProfile({ ...profile, degree: e.target.value })}
                  placeholder="E.g. B.Tech / B.E / B.Sc"
                  required
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Major / Discipline / Branch
                </label>
                <input
                  type="text"
                  value={profile.branch}
                  onChange={(e) => setProfile({ ...profile, branch: e.target.value })}
                  placeholder="E.g. Computer Science, Electrical, AI/Data Science"
                  required
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Graduation Year
                </label>
                <input
                  type="number"
                  value={profile.graduationYear}
                  onChange={(e) => setProfile({ ...profile, graduationYear: Number(e.target.value) })}
                  min={2020}
                  max={2035}
                  required
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Experience Level
                </label>
                <select
                  value={profile.experienceLevel}
                  onChange={(e) => setProfile({ ...profile, experienceLevel: e.target.value as any })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500 text-slate-900"
                >
                  <option value="student">Student / Intern</option>
                  <option value="entry">Entry-Level New Grad</option>
                  <option value="junior">Junior (1-2 years exp)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Skills & Competencies */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center justify-between">
              <span>Technical Skills (35% Matching Weight)</span>
              <span className="text-xs text-slate-400 font-normal">({profile.skills.length} added)</span>
            </h3>

            <div className="flex flex-wrap gap-2">
              {profile.skills.map((skill: string) => (
                <span
                  key={skill}
                  className="px-3 py-1 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-xs font-semibold flex items-center gap-1.5"
                >
                  <span>{skill}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill)}
                    className="hover:text-blue-900"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddSkill(); } }}
                placeholder="Type a skill (e.g. Python, Docker, PyTorch) and press Add..."
                className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500 text-slate-900"
              />
              <button
                type="button"
                onClick={handleAddSkill}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition"
              >
                Add Skill
              </button>
            </div>
          </div>

          {/* Section 3: Interests & Preferred Opportunity Types */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Interests & Opportunity Preferences
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Preferred Opportunity Categories
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {ALL_CATEGORIES.map((cat) => {
                  const isChecked = profile.preferredCategories.includes(cat.id);
                  return (
                    <label
                      key={cat.id}
                      className={`p-2.5 rounded-lg border text-xs font-semibold cursor-pointer transition flex items-center gap-2 select-none ${
                        isChecked
                          ? "bg-blue-50 border-blue-300 text-blue-800"
                          : "border-slate-200 hover:bg-slate-50 text-slate-600"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleCategoryToggle(cat.id)}
                        className="accent-blue-600"
                      />
                      <span>{cat.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Work Mode Preference
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(["flexible", "remote", "hybrid", "on-site"] as WorkMode[]).map((mode) => (
                  <label
                    key={mode}
                    className={`p-2.5 rounded-lg border text-xs font-semibold cursor-pointer transition flex items-center gap-2 capitalize select-none ${
                      profile.workMode === mode
                        ? "bg-blue-50 border-blue-300 text-blue-800"
                        : "border-slate-200 hover:bg-slate-50 text-slate-600"
                    }`}
                  >
                    <input
                      type="radio"
                      name="workMode"
                      checked={profile.workMode === mode}
                      onChange={() => setProfile({ ...profile, workMode: mode })}
                      className="accent-blue-600"
                    />
                    <span>{mode}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Preferred Locations
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {profile.preferredLocations.map((loc: string) => (
                  <span
                    key={loc}
                    className="px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-medium flex items-center gap-1"
                  >
                    <span>{loc}</span>
                    <button type="button" onClick={() => handleRemoveLocation(loc)}>
                      <X className="w-3 h-3 text-slate-400 hover:text-slate-700" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddLocation(); } }}
                  placeholder="Add location (e.g. Bengaluru, Remote, Delhi NCR)..."
                  className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500 text-slate-900"
                />
                <button
                  type="button"
                  onClick={handleAddLocation}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition"
                >
                  Add Location
                </button>
              </div>
            </div>
          </div>

          {/* Submit Action */}
          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-slate-500">
              Data is stored securely in your browser&apos;s local storage and used purely for client-side search ranking.
            </p>

            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-2 shadow-sm"
            >
              <Save className="w-4 h-4" />
              <span>Save Profile Preferences</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
