"use client";

import { useState, useEffect } from "react";
import { 
  FlaskConical, 
  Search, 
  ExternalLink, 
  BookOpen, 
  Award, 
  Sparkles, 
  Loader2, 
  AlertCircle,
  ShieldCheck,
  Quote
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { ScholarArticle } from "@/types";
import { loadSettings, saveSettings, AppSettings } from "@/lib/storage/localStorage";
import { DEMO_SCHOLAR_ARTICLES } from "@/lib/demo/demo-data";

export default function ResearchSupportPage() {
  const [query, setQuery] = useState("Efficient Transformers and Diffusion Models for Computer Vision");
  const [articles, setArticles] = useState<ScholarArticle[]>(DEMO_SCHOLAR_ARTICLES);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [dataMode, setDataMode] = useState<"live" | "demo">("demo");

  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);

    const mode = settings?.mode || "live";

    try {
      const res = await fetch("/api/research/scholar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          mode,
          num: 10,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `Scholar API returned HTTP ${res.status}`);
      }

      setArticles(data.articles || []);
      setDataMode(data.dataMode || mode);
    } catch (err: any) {
      setError(err.message || "Failed to search Google Scholar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 pb-16">
      <Header
        title="Academic Research Support"
        subtitle="Explore literature and foundational citations via SerpApi Google Scholar for research fellowship proposals."
      />

      <div className="max-w-7xl mx-auto px-8 pt-6 space-y-6">

        {/* Search Bar */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-700 bg-purple-50 px-3 py-1.5 rounded-lg border border-purple-200/60 w-fit">
            <FlaskConical className="w-3.5 h-3.5" />
            <span>Dedicated Google Scholar Engine — Isolated Search Budget</span>
          </div>

          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="E.g., Graph Neural Networks in Drug Discovery, Large Language Model alignment..."
                className="w-full pl-11 pr-4 py-3 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 rounded-xl text-sm outline-none text-slate-900 transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-semibold text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-sm shrink-0"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Searching Scholar...</span>
                </>
              ) : (
                <>
                  <BookOpen className="w-4 h-4" />
                  <span>Search Literature</span>
                </>
              )}
            </button>
          </form>

          <p className="text-xs text-slate-500">
            <strong>Data Disclosure:</strong> Google Scholar returns publication metadata, authors, and citation indices. Full paper text is not indexed in snippets.
          </p>
        </div>

        {/* Error notification */}
        {error && (
          <div className="p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-900 text-xs flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Scholar Query Notification:</span> {error}
            </div>
          </div>
        )}

        {/* Status Bar */}
        <div className="flex items-center justify-between text-xs bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center gap-2 font-bold text-slate-800">
            <span>Found {articles.length} Academic Publications</span>
            <span className="text-slate-400">•</span>
            <span className={`px-2 py-0.5 rounded font-semibold text-[11px] ${
              dataMode === "live" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
            }`}>
              {dataMode === "live" ? "Live SerpApi Scholar" : "Verified Demo Catalog"}
            </span>
          </div>
          <span className="text-slate-400 text-[11px]">
            Engine: google_scholar
          </span>
        </div>

        {/* Articles List */}
        <div className="space-y-4">
          {articles.map((art) => (
            <div key={art.id} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow transition space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 hover:text-purple-600 transition">
                    <a href={art.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5">
                      <span>{art.title}</span>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    </a>
                  </h3>
                  
                  {art.authors && (
                    <p className="text-xs text-slate-600 mt-1">
                      Authors: <span className="font-medium text-slate-800">{art.authors.join(", ")}</span>
                    </p>
                  )}

                  {art.publicationInfo && (
                    <p className="text-xs text-slate-500 italic mt-0.5">
                      {art.publicationInfo} {art.year ? `(${art.year})` : ""}
                    </p>
                  )}
                </div>

                {art.citedByCount !== undefined && (
                  <div className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 shrink-0 flex items-center gap-1.5">
                    <Quote className="w-3.5 h-3.5 text-purple-600" />
                    <span>Cited by {art.citedByCount.toLocaleString()}</span>
                  </div>
                )}
              </div>

              <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200/60 leading-relaxed font-sans">
                {art.snippet}
              </p>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <span>Retrieved via SerpApi Google Scholar API</span>
                <a
                  href={art.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-600 hover:underline font-semibold flex items-center gap-1"
                >
                  <span>Open Paper / Citation Source</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

