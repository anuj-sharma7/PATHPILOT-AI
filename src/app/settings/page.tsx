"use client";

import { useEffect, useState } from "react";
import { 
  Settings, 
  ShieldCheck, 
  Activity, 
  Cpu, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Key, 
  Sliders, 
  ExternalLink,
  Sparkles
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { loadSettings, saveSettings, AppSettings } from "@/lib/storage/localStorage";

interface HealthStatus {
  status: string;
  timestamp: string;
  service: string;
  integrations: {
    serpapi: {
      configured: boolean;
      enginesSupported: string[];
      note: string;
    };
    gemini: {
      configured: boolean;
      model: string;
      note: string;
    };
  };
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [checking, setChecking] = useState(false);
  const [saveNote, setSaveNote] = useState<string | null>(null);

  useEffect(() => {
    setSettings(loadSettings());
    checkHealth();
  }, []);

  const checkHealth = async () => {
    setChecking(true);
    try {
      const res = await fetch("/api/health");
      const data = await res.json();
      setHealth(data);
    } catch (e) {
      console.error("Health check error:", e);
    } finally {
      setChecking(false);
    }
  };

  const handleToggleMode = (mode: "live" | "demo") => {
    const updated = saveSettings({ mode });
    setSettings(updated);
    setSaveNote(`Active environment switched to ${mode === "live" ? "Live SerpApi Mode" : "Verified Demo Mode"}.`);
    setTimeout(() => setSaveNote(null), 3000);
  };

  const handleResetCounter = () => {
    const updated = saveSettings({ serpApiRequestsCount: 0 });
    setSettings(updated);
  };

  return (
    <div className="flex-1 pb-16">
      <Header
        title="Settings & Integration Health"
        subtitle="Verify live API connectivity, configure environment modes, and review engine status."
      />

      <div className="max-w-4xl mx-auto px-8 pt-6 space-y-6">

        {saveNote && (
          <div className="p-4 rounded-xl border border-blue-200 bg-blue-50 text-blue-800 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
            {saveNote}
          </div>
        )}

        {/* Section 1: Environment Mode Switcher */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sliders className="w-5 h-5 text-blue-600" />
                Active Environment Mode
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Switch between live web queries and deterministic demo datasets for judging review.
              </p>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
              settings?.mode === "live"
                ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                : "bg-amber-100 text-amber-800 border border-amber-300"
            }`}>
              {settings?.mode === "live" ? "Live Mode Active" : "Demo Mode Active"}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div
              onClick={() => handleToggleMode("live")}
              className={`p-4 rounded-xl border cursor-pointer transition space-y-2 select-none ${
                settings?.mode === "live"
                  ? "bg-blue-50/70 border-blue-500 shadow-sm"
                  : "border-slate-200 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm">Live SerpApi Mode</span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Queries live Google Search, Google Jobs, Google News, and Google Scholar engines via server-side SerpApi.
              </p>
            </div>

            <div
              onClick={() => handleToggleMode("demo")}
              className={`p-4 rounded-xl border cursor-pointer transition space-y-2 select-none ${
                settings?.mode === "demo"
                  ? "bg-amber-50/70 border-amber-500 shadow-sm"
                  : "border-slate-200 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm">Verified Demo Mode</span>
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Uses high-fidelity, verified offline opportunities (GSoC, MSR India, SIH, Razorpay) to review UI without live credits.
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: Integration Health Status */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              Backend Service Health & Integrations
            </h3>
            <button
              onClick={checkHealth}
              disabled={checking}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${checking ? "animate-spin" : ""}`} />
              <span>Check Health</span>
            </button>
          </div>

          {health ? (
            <div className="space-y-3">
              {/* SerpApi Status Card */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Key className="w-4 h-4 text-blue-600" />
                    SerpApi Multi-Engine Search Integration
                  </div>
                  <span className={`px-2 py-0.5 rounded font-bold ${
                    health.integrations.serpapi.configured
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-amber-100 text-amber-800"
                  }`}>
                    {health.integrations.serpapi.configured ? "Key Configured" : "Unset in .env.local"}
                  </span>
                </div>
                <p className="text-slate-600">{health.integrations.serpapi.note}</p>
                <div className="pt-1 flex items-center gap-2 text-[11px] text-slate-500 flex-wrap">
                  <span className="font-semibold text-slate-700">Supported Engines:</span>
                  {health.integrations.serpapi.enginesSupported.map((eng) => (
                    <span key={eng} className="bg-white border border-slate-200 px-2 py-0.5 rounded font-mono">
                      {eng}
                    </span>
                  ))}
                </div>
              </div>

              {/* Gemini Status Card */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-purple-600" />
                    Google GenAI SDK (Gemini) Integration
                  </div>
                  <span className={`px-2 py-0.5 rounded font-bold ${
                    health.integrations.gemini.configured
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-amber-100 text-amber-800"
                  }`}>
                    {health.integrations.gemini.configured ? "Key Configured" : "Unset (Rule-Based Fallback Active)"}
                  </span>
                </div>
                <p className="text-slate-600">{health.integrations.gemini.note}</p>
                <div className="pt-1 text-[11px] text-slate-500">
                  Target Model: <span className="font-mono text-slate-700 font-semibold">{health.integrations.gemini.model}</span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400">Loading integration status...</p>
          )}
        </div>

        {/* Section 3: Usage Telemetry & Request Counters */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" />
              Session Telemetry
            </h3>
            <button
              onClick={handleResetCounter}
              className="text-xs text-slate-400 hover:text-slate-600 underline"
            >
              Reset Counter
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block mb-1">Total SerpApi Requests Sent:</span>
              <span className="text-2xl font-black text-slate-900">{settings?.serpApiRequestsCount || 0}</span>
              <p className="text-[11px] text-slate-400 mt-1">App-side counter (distinct from billed account credits)</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block mb-1">Last Search Activity:</span>
              <span className="text-sm font-bold text-slate-800 block">
                {settings?.lastSearchAt ? new Date(settings.lastSearchAt).toLocaleString() : "None this session"}
              </span>
              <p className="text-[11px] text-slate-400 mt-1">Timestamps recorded in browser local storage</p>
            </div>
          </div>
        </div>

        {/* Section 4: Configuration Instructions */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-3 text-xs">
          <h3 className="font-bold text-slate-900 text-sm">How to Configure Live API Keys</h3>
          <p className="text-slate-600 leading-relaxed">
            Create a file named <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-slate-800">.env.local</code> in the project root with the following keys:
          </p>
          <pre className="p-4 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto leading-relaxed">
{`# SerpApi (Required for Live Google Search & Jobs)
SERPAPI_API_KEY=your_serpapi_key_here

# Google Gemini (Optional - AI evidence analysis falls back to rules if unset)
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash`}
          </pre>
          <p className="text-slate-500 text-[11px]">
            API keys are read exclusively on the server side and are never sent to the browser or client-side bundles.
          </p>
        </div>

      </div>
    </div>
  );
}

