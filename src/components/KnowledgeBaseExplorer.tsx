import React, { useState, useMemo, useEffect } from 'react';
import { RAW_KB_DOCUMENTS, buildChunksFromKb } from '../data/kbData';
import { Category, KbDocument } from '../types';
import {
  Search,
  Tag,
  Layers,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  Globe,
  ExternalLink,
  Sparkles,
  Loader2,
  Plus,
  Filter,
  BookOpen,
  Calendar,
} from 'lucide-react';
import { defaultEmbedder } from '../engine/embedder';

export const KnowledgeBaseExplorer: React.FC = () => {
  const [documents, setDocuments] = useState<KbDocument[]>(RAW_KB_DOCUMENTS);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [onlyWebResearched, setOnlyWebResearched] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [simTestQuery, setSimTestQuery] = useState('');

  // Web search ingestion state
  const [showWebIngestModal, setShowWebIngestModal] = useState(false);
  const [webTopic, setWebTopic] = useState('');
  const [webCategory, setWebCategory] = useState<string>('Software');
  const [isResearching, setIsResearching] = useState(false);
  const [researchSuccess, setResearchSuccess] = useState<string | null>(null);

  // Sync with server KB on mount
  useEffect(() => {
    fetch('/api/kb')
      .then((res) => res.json())
      .then((data) => {
        if (data.documents && Array.isArray(data.documents) && data.documents.length > 0) {
          setDocuments(data.documents);
        }
      })
      .catch(() => {});
  }, []);

  const categories = ['All', 'Account & Access', 'Network', 'Hardware', 'Software', 'Productivity', 'Facility'];

  const filteredDocs = useMemo(() => {
    return documents.filter((doc) => {
      const matchCat = selectedCategory === 'All' || doc.category === selectedCategory;
      const matchWeb = !onlyWebResearched || Boolean(doc.is_web_researched);
      const matchSearch =
        !searchQuery ||
        doc.issue.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.resolution.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchWeb && matchSearch;
    });
  }, [documents, selectedCategory, onlyWebResearched, searchQuery]);

  // Compute live similarity if simTestQuery is active
  const simScores = useMemo(() => {
    if (!simTestQuery.trim()) return {};
    const queryVec = defaultEmbedder.embed(simTestQuery);
    const scores: Record<string, number> = {};

    for (const doc of documents) {
      const docText = `Category: ${doc.category} | Issue: ${doc.issue}\nQ: ${doc.question}\nA: ${doc.resolution}`;
      const docVec = defaultEmbedder.embed(docText);
      const dot = defaultEmbedder.dotProduct(queryVec, docVec);
      scores[doc.kb_id] = Math.max(0, Math.min(1, dot));
    }
    return scores;
  }, [documents, simTestQuery]);

  const handleResearchAndIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!webTopic.trim() || isResearching) return;

    setIsResearching(true);
    setResearchSuccess(null);

    try {
      const res = await fetch('/api/kb/search-and-ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: webTopic.trim(),
          category: webCategory,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.document) {
          setDocuments((prev) => [data.document, ...prev]);
          setExpandedId(data.document.kb_id);
          setResearchSuccess(`Ingested "${data.document.issue}" with verified vendor documentation!`);
          setWebTopic('');
        }
      }
    } catch {
      // ignore
    } finally {
      setIsResearching(false);
    }
  };

  const webResearchedCount = documents.filter((d) => d.is_web_researched).length;

  return (
    <div className="space-y-5" id="kb-explorer-view">
      {/* Top Banner / Ingestion Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${documents.length} KB articles by issue, keyword, or tag (e.g. vpn, crowdstrike, okta)...`}
              className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg pl-10 pr-4 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 font-sans transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={simTestQuery}
              onChange={(e) => setSimTestQuery(e.target.value)}
              placeholder="Live vector tester..."
              className="w-36 sm:w-44 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-blue-600 dark:text-blue-400 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 font-mono"
              title="Enter any phrase to see real-time vector similarity against all KB articles"
            />

            <button
              onClick={() => setShowWebIngestModal(!showWebIngestModal)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-lg text-xs font-semibold transition-colors shrink-0 shadow-2xs"
              title="Search Internet via Google GenAI and add new article to Knowledge Base"
            >
              <Globe className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>{showWebIngestModal ? 'Close Researcher' : 'Search Internet & Ingest'}</span>
            </button>
          </div>
        </div>

        {/* Live Internet Research Panel */}
        {showWebIngestModal && (
          <form
            onSubmit={handleResearchAndIngest}
            className="p-4 bg-blue-50/50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-xl space-y-3 transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-blue-700 dark:text-blue-300 flex items-center gap-1.5 font-sans">
                <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Live Internet Knowledge Base Researcher (Google Grounding)
              </span>
              <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                Retrieves official vendor documentation and synthesizes canonical steps
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={webTopic}
                onChange={(e) => setWebTopic(e.target.value)}
                placeholder="Enter enterprise IT topic, error code, or CVE (e.g., 'Windows 11 Recall AI disable policy', 'SentinelOne agent offline')..."
                className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 font-sans shadow-2xs"
              />

              <select
                value={webCategory}
                onChange={(e) => setWebCategory(e.target.value)}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-sans text-slate-700 dark:text-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 shadow-2xs"
              >
                <option value="Software">Software</option>
                <option value="Network">Network</option>
                <option value="Hardware">Hardware</option>
                <option value="Account & Access">Account & Access</option>
                <option value="Productivity">Productivity</option>
                <option value="Facility">Facility</option>
              </select>

              <button
                type="submit"
                disabled={isResearching || !webTopic.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 shrink-0 shadow-xs"
              >
                {isResearching ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Searching Web...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Research & Ingest</span>
                  </>
                )}
              </button>
            </div>

            {researchSuccess && (
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs font-sans text-emerald-700 dark:text-emerald-300 flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span>{researchSuccess}</span>
              </div>
            )}
          </form>
        )}

        {/* Category & Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                selectedCategory === cat && !onlyWebResearched
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}

          <button
            onClick={() => setOnlyWebResearched(!onlyWebResearched)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
              onlyWebResearched
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Globe className="w-3 h-3" />
            <span>Web-Researched ({webResearchedCount})</span>
          </button>

          <span className="text-xs text-slate-500 dark:text-slate-400 ml-auto font-sans">
            Showing <strong className="text-slate-900 dark:text-slate-100 font-semibold">{filteredDocs.length}</strong> of{' '}
            {documents.length} articles
          </span>
        </div>
      </div>

      {/* KB Documents Grid / Accordion */}
      <div className="space-y-3">
        {filteredDocs.map((doc: KbDocument) => {
          const isExpanded = expandedId === doc.kb_id;
          const chunks = buildChunksFromKb([doc], 60, 15);
          const score = simScores[doc.kb_id];

          return (
            <div
              key={doc.kb_id}
              className={`bg-white dark:bg-slate-900 border rounded-xl transition-all overflow-hidden shadow-xs ${
                doc.is_web_researched
                  ? 'border-blue-200 dark:border-blue-900'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div
                onClick={() => setExpandedId(isExpanded ? null : doc.kb_id)}
                className="p-4 flex items-center justify-between cursor-pointer gap-3 select-none"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <span className="font-mono text-xs font-semibold text-blue-700 dark:text-blue-300 px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 shrink-0">
                    {doc.kb_id}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate font-sans">
                        {doc.issue}
                      </h4>
                      {doc.is_web_researched && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900 shrink-0 font-medium">
                          <Globe className="w-2.5 h-2.5" />
                          Web Researched
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-sans">
                      {doc.category} · {doc.question}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {score !== undefined && (
                    <span
                      className={`text-xs font-mono px-2.5 py-1 rounded-md border font-medium ${
                        score > 0.3
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                          : score > 0.15
                          ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      sim: {(score * 100).toFixed(1)}%
                    </span>
                  )}
                  <span className="text-xs text-slate-400 font-mono hidden sm:inline">
                    {chunks.length} chunk{chunks.length > 1 ? 's' : ''}
                  </span>
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </div>

              {isExpanded && (
                <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60 space-y-4">
                  {/* Resolution Text */}
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        Canonical Resolution
                      </span>
                      {doc.source_url && (
                        <a
                          href={doc.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Official Vendor Documentation</span>
                        </a>
                      )}
                    </div>
                    <div className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg whitespace-pre-line font-sans shadow-2xs">
                      {doc.resolution}
                    </div>
                  </div>

                  {/* Derived Chunks (Phase 2a Chunking Visualizer) */}
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      Word-Based Chunks (60 words / 15 overlap)
                    </div>
                    <div className="space-y-2">
                      {chunks.map((chk, cIdx) => {
                        const wordCount = chk.text.split(/\s+/).filter(Boolean).length;
                        return (
                          <div
                            key={chk.chunk_id}
                            className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono shadow-2xs"
                          >
                            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-1.5">
                              <span className="font-semibold text-blue-600 dark:text-blue-400">
                                Chunk #{cIdx + 1} ({chk.chunk_id})
                              </span>
                              <span>{wordCount} words</span>
                            </div>
                            <p className="text-slate-700 dark:text-slate-300 text-xs leading-relaxed font-mono">
                              {chk.text}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Metadata Tags & Source */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/80 dark:border-slate-800">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-slate-400" />
                      {doc.tags.map((t, idx) => (
                        <span
                          key={idx}
                          className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>

                    {doc.date_added && (
                      <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Added: {doc.date_added}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
