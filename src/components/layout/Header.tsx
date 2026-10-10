"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShieldCheck, Activity, Search, Sparkles } from "lucide-react";
import { loadSettings, AppSettings } from "@/lib/storage/localStorage";

interface HeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function Header({ title, subtitle, action }: HeaderProps) {
  const [settings, setSettings] = useState<AppSettings | null>(null);

  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  return (
    <header className="bg-white border-b border-slate-200 px-8 py-4 sticky top-0 z-20 flex items-center justify-between">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h1>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        {/* API Requests Counter Pill */}
        <div className="hidden sm:flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200 text-xs text-slate-600">
          <Activity className="w-3.5 h-3.5 text-blue-600" />
          <span>SerpApi Queries:</span>
          <span className="font-semibold text-slate-800">{settings?.serpApiRequestsCount || 0}</span>
        </div>

        {/* Action Button if provided */}
        {action}
      </div>
    </header>
  );
}

