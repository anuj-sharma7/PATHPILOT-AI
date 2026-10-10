"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Compass, 
  Bookmark, 
  ClipboardCheck, 
  GraduationCap, 
  User, 
  Settings, 
  LayoutDashboard,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  FlaskConical
} from "lucide-react";
import { useEffect, useState } from "react";
import { loadProfile, loadSettings, StudentProfile, AppSettings } from "@/lib/storage/localStorage";

const NAV_ITEMS = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/discover", label: "Discover", icon: Compass },
  { href: "/saved", label: "Saved Opportunities", icon: Bookmark },
  { href: "/planner", label: "Application Planner", icon: ClipboardCheck },
  { href: "/research", label: "Research Support", icon: FlaskConical },
  { href: "/profile", label: "Profile", icon: User },
  { href: "/settings", label: "Settings & Health", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);

  useEffect(() => {
    setProfile(loadProfile());
    setSettings(loadSettings());

    const handleStorage = () => {
      setProfile(loadProfile());
      setSettings(loadSettings());
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0 shrink-0 z-30 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-100 flex flex-col gap-1">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20 group-hover:bg-blue-700 transition">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
              PathPilot <span className="text-blue-600 text-xs font-semibold px-1.5 py-0.5 bg-blue-50 rounded">AI</span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium leading-none">Evidence-Driven Navigator</p>
          </div>
        </Link>
      </div>

      {/* Environment Mode Banner */}
      <div className="px-4 pt-3 pb-1">
        <div className={`px-2.5 py-1.5 rounded-md text-xs font-medium flex items-center justify-between ${
          settings?.mode === "live" 
            ? "bg-emerald-50 text-emerald-800 border border-emerald-200/60" 
            : "bg-amber-50 text-amber-800 border border-amber-200/60"
        }`}>
          <span className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${settings?.mode === "live" ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
            {settings?.mode === "live" ? "Live SerpApi Mode" : "Verified Demo Mode"}
          </span>
          <Link href="/settings" className="text-[10px] underline hover:opacity-80">
            change
          </Link>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
                isActive
                  ? "bg-blue-50 text-blue-700 font-semibold"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-blue-600" : "text-slate-400"}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Hackathon Badge & Profile Footer */}
      <div className="p-4 border-t border-slate-100 flex flex-col gap-3">
        <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/60">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold text-slate-700 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              SerpApi Hackathon
            </span>
            <span className="text-[10px] bg-slate-200 px-1.5 py-0.2 rounded text-slate-700">Track 01</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-tight">
            AI Agents • Evidence Grounding
          </p>
        </div>

        {/* Compact Profile Chip */}
        {profile && (
          <Link href="/profile" className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-slate-50 transition group">
            <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-semibold text-xs flex items-center justify-center shrink-0">
              {profile.name ? profile.name.slice(0, 2).toUpperCase() : "ST"}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-slate-800 truncate group-hover:text-blue-600 transition">
                {profile.name || "Student"}
              </p>
              <p className="text-[10px] text-slate-400 truncate">
                {profile.degree} • {profile.graduationYear}
              </p>
            </div>
          </Link>
        )}
      </div>
    </aside>
  );
}

