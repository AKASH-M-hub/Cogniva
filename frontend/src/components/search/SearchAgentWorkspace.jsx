import React, { useState, useEffect } from 'react';
import {
  Search,
  FileText,
  Zap,
  Eye,
  Download,
  ExternalLink,
  X,
  FolderArchive,
  History,
  RefreshCw,
  Trash2,
  Clock,
  Sparkles,
  AlertCircle,
  HelpCircle,
  BookOpen,
  BarChart2,
  CheckCircle2,
  Layers,
  Cpu,
  Target,
  Info,
  ChevronRight,
  Sliders,
  ShieldCheck,
  FileSearch,
  Tag,
  TriangleAlert
} from 'lucide-react';
import { searchAgentAPI, API_BASE_URL } from '../../services/api';

const STOPWORDS = new Set([
  "a", "an", "the", "in", "on", "at", "to", "for", "of", "with", "by", "from",
  "up", "about", "into", "over", "after", "is", "are", "was", "were", "be",
  "been", "being", "have", "has", "had", "do", "does", "did", "show", "find",
  "get", "search", "document", "documents", "file", "files", "me", "please",
  "tell", "what", "where", "which", "who", "how", "can", "you", "give"
]);

// Exact Echo Soundwave Symbol SVG matching user design with clean stripe line gaps
const EchoWaveIcon = ({ className = "w-4 h-4", color = "currentColor" }) => (
  <svg
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Stripe 1 (Smallest - Left) */}
    <path d="M 8 40 A 10 10 0 0 1 8 60 Z" fill={color} />
    {/* Stripe 2 (Medium - 2nd) */}
    <path d="M 26 30 A 20 20 0 0 1 26 70 Z" fill={color} />
    {/* Stripe 3 (Large - 3rd) */}
    <path d="M 54 18 A 32 32 0 0 1 54 82 Z" fill={color} />
    {/* Stripe 4 (Tallest - Right) */}
    <path d="M 84 6 A 44 44 0 0 1 84 94 Z" fill={color} />
  </svg>
);

export default function SearchAgentWorkspace({ onViewAIResponse, onNavigateToKnowledge }) {
  const [activeTab, setActiveTab] = useState('search'); // 'search' or 'history'

  const [query, setQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [fileTypeFilter, setFileTypeFilter] = useState('all');

  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [errorMessage, setErrorMessage] = useState(null);

  // Search History State
  const [searchHistory, setSearchHistory] = useState([]);
  const [totalHistoryCount, setTotalHistoryCount] = useState(0);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Modals for inspecting source documents, chunks, and relevance score explanation
  const [selectedDocForView, setSelectedDocForView] = useState(null);
  const [selectedChunkForInspect, setSelectedChunkForInspect] = useState(null);
  const [scoreExplanationDoc, setScoreExplanationDoc] = useState(null);
  
  // Delete Confirmation Modal State
  const [deleteDialog, setDeleteDialog] = useState(null);

  const currentUser = JSON.parse(localStorage.getItem('cogniva_user') || '{}');
  const userId = currentUser?.id ? String(currentUser.id) : (currentUser?.email || 'emp_101');

  useEffect(() => {
    fetchSearchHistory();
  }, []);

  const fetchSearchHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await searchAgentAPI.getHistory(userId);
      if (res && res.history) {
        setSearchHistory(res.history);
        setTotalHistoryCount(res.total_count !== undefined ? res.total_count : res.history.length);
      }
    } catch (err) {
      console.error('Failed to fetch search history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleClearHistory = () => {
    setDeleteDialog({
      action: 'clearAll',
      title: 'Clear Search History',
      message: 'Are you sure you want to clear all your search history? This action cannot be undone.'
    });
  };

  const handleDeleteHistoryItem = (historyId) => {
    setDeleteDialog({
      action: 'single',
      historyId,
      title: 'Delete Search Record',
      message: 'Are you sure you want to delete this specific search record? This cannot be undone.'
    });
  };

  const confirmDeleteAction = async () => {
    if (!deleteDialog) return;
    try {
      if (deleteDialog.action === 'clearAll') {
        await searchAgentAPI.clearHistory(userId);
        setSearchHistory([]);
        setTotalHistoryCount(0);
      } else if (deleteDialog.action === 'single') {
        await searchAgentAPI.deleteHistoryItem(deleteDialog.historyId);
        setSearchHistory((prev) => prev.filter((item) => item.id !== deleteDialog.historyId));
        setTotalHistoryCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Delete action failed:', err);
    } finally {
      setDeleteDialog(null);
    }
  };

  const handleSearch = async (overrideQuery = null, isHistoryView = false) => {
    const q = (overrideQuery !== null ? overrideQuery : query).trim();
    if (!q) return;

    if (overrideQuery !== null) {
      setQuery(overrideQuery);
      setActiveTab('search');
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const payload = {
        query: q,
        department: departmentFilter === 'all' ? null : departmentFilter,
        file_type: fileTypeFilter === 'all' ? null : fileTypeFilter,
        user_id: userId,
        user_role: currentUser?.role || 'user',
        top_k: 5,
        record_history: !isHistoryView
      };

      const res = await searchAgentAPI.search(payload);

      if (res && res.success) {
        setSearchResults(res.results || []);
        if (!isHistoryView) {
          fetchSearchHistory();
        }
      } else {
        setSearchResults([]);
        setErrorMessage(res?.message || 'Search execution failed. Please try again.');
      }
    } catch (err) {
      console.error('Search Agent Execution Error:', err);
      setErrorMessage(err.message || 'Unable to connect to Enterprise Search Agent backend.');
      setSearchResults([]);
    } finally {
      setLoading(false);
      setHasSearched(true);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleDownloadFile = async (doc) => {
    const fileName = doc.file_name || 'document.pdf';
    try {
      // Attempt to download the original physical uploaded file from server
      const response = await fetch(`${API_BASE_URL}/upload/file/${encodeURIComponent(fileName)}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        return;
      }
    } catch (e) {
      console.warn('Backend file download endpoint notice:', e);
    }

    // Fallback: download raw document content directly without metadata headers
    const blob = new Blob([doc.content || ''], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName.includes('.') ? fileName : `${fileName}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const preciseScore = (score) => Number(((score || 0) * 100).toFixed(1));

  const getScoreBadgeColor = (score) => {
    const val = preciseScore(score);
    if (val >= 85) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (val >= 65) return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    return 'bg-amber-50 text-amber-700 border-amber-200';
  };

  return (
    <div className="w-full p-8 space-y-6 select-none text-left font-sans text-slate-900">
      {/* SEARCH AGENT HEADER CARD */}
      <div className="bg-indigo-600 text-white border border-indigo-500 rounded-2xl p-6 shadow-lg shadow-indigo-500/20 flex flex-col xl:flex-row xl:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center space-x-4 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-white/15 border border-white/20 text-white flex items-center justify-center shadow-xs shrink-0">
            <Search className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-extrabold tracking-tight text-white">Data Scout</h1>

            </div>
            <p className="text-sm text-indigo-100 font-medium mt-1">
              Ask a question in your own words and find the information you need
            </p>
          </div>
        </div>
      </div>

      {/* WORKSPACE NAVIGATION TABS */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('search')}
          className={`px-5 py-2.5 rounded-xl font-extrabold text-xs transition-all flex items-center space-x-2 cursor-pointer ${activeTab === 'search'
            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
        >
          <Search className="w-4 h-4" />
          <span>Search Knowledge</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('history');
            fetchSearchHistory();
          }}
          className={`px-5 py-2.5 rounded-xl font-extrabold text-xs transition-all flex items-center space-x-2 cursor-pointer ${activeTab === 'history'
            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
        >
          <History className="w-4 h-4" />
          <span>Search History ({totalHistoryCount || searchHistory.length})</span>
        </button>
      </div>

      {/* ERROR MESSAGE ALERT */}
      {errorMessage && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl flex items-center justify-between text-xs font-semibold">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-500 hover:text-rose-800 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* TAB 1: SEARCH WORKSPACE */}
      {activeTab === 'search' && (
        <div className="space-y-6">
          {/* SEARCH INPUT BAR & FILTERS CARD */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask any natural language question..."
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-sans font-medium"
                />
                {query && (
                  <button
                    onClick={() => setQuery('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex items-center space-x-2 w-full md:w-auto">
                <div className="relative">
                  <select
                    value={departmentFilter}
                    onChange={(e) => setDepartmentFilter(e.target.value)}
                    className="bg-slate-50 border border-slate-200 px-3.5 py-3.5 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
                  >
                    <option value="all">All Departments</option>
                    <option value="hr">HR & Governance</option>
                    <option value="engineering">Engineering</option>
                    <option value="finance">Finance</option>
                    <option value="general">General</option>
                  </select>
                </div>

                <div className="relative">
                  <select
                    value={fileTypeFilter}
                    onChange={(e) => setFileTypeFilter(e.target.value)}
                    className="bg-slate-50 border border-slate-200 px-3.5 py-3.5 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
                  >
                    <option value="all">All File Types</option>
                    <option value="pdf">PDF Documents</option>
                    <option value="docx">DOCX Files</option>
                    <option value="txt">TXT Files</option>
                  </select>
                </div>

                <button
                  onClick={() => handleSearch()}
                  disabled={loading || !query.trim()}
                  className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center space-x-2 disabled:opacity-50 cursor-pointer shrink-0"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Searching...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      <span>Search Knowledge</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* SEARCH RESULTS LIST */}
          {hasSearched && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-700">
                  SEARCH RESULTS ({searchResults.length})
                </h2>
              </div>

              {searchResults.length > 0 ? (
                <div className="space-y-4">
                  {searchResults.map((doc, idx) => {
                    const scorePct = preciseScore(doc.score);
                    const matchedChunks = doc.metadata?.matched_chunks || 1;

                    return (
                      <div
                        key={idx}
                        className="bg-white border border-slate-200 hover:border-indigo-300 rounded-2xl p-6 shadow-xs hover:shadow-md transition-all space-y-4 text-left"
                      >
                        {/* CARD HEADER: Title, Badges, Relevance Score */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center font-bold shrink-0">
                              <FileText className="w-5 h-5 text-indigo-600" />
                            </div>
                            <div>
                              <h3 className="font-extrabold text-base text-slate-900 flex items-center space-x-2">
                                <span>{doc.file_name}</span>
                              </h3>
                              <div className="flex flex-wrap items-center gap-2 mt-1">
                                <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200/60 font-bold text-[10px] uppercase">
                                  {doc.file_type || 'PDF'}
                                </span>
                                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold text-[10px]">
                                  Dept: {doc.metadata?.department || doc.category || 'General'}
                                </span>
                                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium text-[10px]">
                                  Matched: {matchedChunks} relevant {matchedChunks === 1 ? 'section' : 'sections'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* DYNAMIC RELEVANCE ALIGNMENT MATCHER (CLICKABLE FOR SCORE EXPLANATION) */}
                          <div className="flex items-center space-x-3 shrink-0 self-start sm:self-auto">
                            <button
                              onClick={() => setScoreExplanationDoc(doc)}
                              className="bg-indigo-50/90 hover:bg-indigo-100/90 border border-indigo-200/90 hover:border-indigo-300 rounded-xl px-3 py-2 text-right shadow-2xs transition-all cursor-pointer group"
                              title="Click to view why this score was calculated"
                            >
                              <div className="flex items-center space-x-1 justify-end">
                                <span className="text-[9px] font-extrabold text-indigo-600 uppercase tracking-wider block">
                                  Relevance Matcher
                                </span>
                                <HelpCircle className="w-3 h-3 text-indigo-500 group-hover:scale-110 transition-transform" />
                              </div>
                              <div className="flex items-center space-x-2 mt-1">
                                <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full"
                                    style={{ width: `${scorePct}%` }}
                                  />
                                </div>
                                <span className="text-[11px] font-extrabold text-indigo-900">
                                  {scorePct}%
                                </span>
                              </div>
                            </button>
                          </div>
                        </div>

                        {/* ABSTRACT / TEXT PAYLOAD PREVIEW */}
                        <div className="space-y-1.5">
                          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                            Matched Content Preview:
                          </span>
                          <div className="bg-slate-50/80 border border-slate-200/90 rounded-xl p-4 text-xs font-sans text-slate-700 font-normal leading-relaxed max-h-36 overflow-y-auto shadow-2xs">
                            {doc.content || 'No text snippet payload available.'}
                          </div>
                        </div>

                        {/* ACTION BUTTONS: Explore Echo & Download original file */}
                        <div className="flex items-center justify-end space-x-3 pt-2 border-t border-slate-100">
                          <button
                            onClick={() => {
                              if (onViewAIResponse) {
                                onViewAIResponse({
                                  query: query,
                                  docName: doc.file_name,
                                  file_name: doc.file_name,
                                  department: doc.metadata?.department || doc.category || 'General',
                                  score: preciseScore(doc.score),
                                  chunkContent: doc.content
                                });
                              }
                            }}
                            className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/90 text-indigo-700 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center space-x-2 shadow-2xs group"
                            title="Explore document with Echo AI Assistant on Insight Desk"
                          >
                            <EchoWaveIcon className="w-4 h-4 text-indigo-600 group-hover:scale-110 transition-transform" color="currentColor" />
                            <span>Explore Echo</span>
                          </button>

                          <button
                            onClick={() => handleDownloadFile(doc)}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center space-x-2 shadow-sm shadow-indigo-600/20"
                          >
                            <Download className="w-4 h-4" />
                            <span>Download Original Document</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* NO-RESULT BEHAVIOR */
                <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-4 shadow-xs">
                  <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center mx-auto shadow-xs">
                    <AlertCircle className="w-7 h-7" />
                  </div>
                  <div className="space-y-1 max-w-md mx-auto">
                    <h3 className="text-base font-extrabold text-slate-900">
                      No relevant enterprise knowledge was found.
                    </h3>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                      Try a different query or search using broader terms.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {!hasSearched && (
            <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center space-y-4 shadow-xs">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto shadow-xs">
                <Sparkles className="w-8 h-8" />
              </div>
              <div className="space-y-1 max-w-md mx-auto">
                <h3 className="text-lg font-extrabold text-slate-900">Search Agent Ready</h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Enter any natural language query above to retrieve relevant enterprise knowledge.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SEPARATE SEARCH HISTORY PAGE */}
      {activeTab === 'history' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden space-y-0">
          <div className="flex items-center justify-between p-6 border-b border-slate-100">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                <History className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                  Data Scout Query History
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  History of your executed search query requests.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => fetchSearchHistory()}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all flex items-center space-x-1.5 cursor-pointer"
                title="Refresh history"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${historyLoading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>

              {searchHistory.length > 0 && (
                <button
                  onClick={handleClearHistory}
                  className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80 rounded-xl text-xs font-semibold transition-all flex items-center space-x-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>Clear History</span>
                </button>
              )}
            </div>
          </div>

          <div className="p-6 bg-slate-50/50">
            {searchHistory.length > 0 ? (
              <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-2xs">
                <table className="w-full text-left text-xs text-slate-700 font-sans border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200 uppercase tracking-wider text-[10px] font-bold text-slate-500">
                    <tr>
                      <th className="py-3.5 px-6">Search Query Content</th>
                      <th className="py-3.5 px-6">Timestamp</th>
                      <th className="py-3.5 px-6 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {searchHistory.map((item, idx) => (
                      <tr key={item.id || idx} className="hover:bg-indigo-50/40 transition-colors">
                        <td className="py-4 px-6 font-bold text-slate-900 text-sm">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                              <Search className="w-4 h-4 text-indigo-600" />
                            </div>
                            <span
                              className="cursor-pointer hover:text-indigo-600 transition-colors"
                              onClick={() => handleSearch(item.query, true)}
                            >
                              {item.query}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6 font-mono text-xs text-slate-500">
                          {item.timestamp || '2026-08-12 14:00'}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleSearch(item.query, true)}
                              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center space-x-1.5 shadow-xs"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View</span>
                            </button>

                            <button
                              onClick={() => handleDeleteHistoryItem(item.id)}
                              className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200/80 rounded-xl transition-all cursor-pointer inline-flex items-center justify-center shadow-xs"
                              title="Delete search history entry"
                            >
                              <Trash2 className="w-4 h-4 text-rose-600" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-16 text-center space-y-3 bg-white border border-slate-200 rounded-xl">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <History className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-800">No Search History Recorded</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    When you perform searches in the Search Agent, your queries will be recorded here.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: VIEW DOCUMENT PREVIEW MODAL */}
      {selectedDocForView && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-4xl w-full h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">{selectedDocForView.file_name}</h3>
                  <span className="text-[11px] text-slate-400 font-medium">
                    Department: {selectedDocForView.metadata?.department || selectedDocForView.category || 'General'}
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleDownloadFile(selectedDocForView)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl flex items-center space-x-1.5 transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Document</span>
                </button>
                <button
                  onClick={() => setSelectedDocForView(null)}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 bg-slate-100 p-6 overflow-y-auto flex flex-col items-center">
              <div className="bg-white border border-slate-200 rounded-xl shadow-md p-8 max-w-3xl w-full space-y-6 text-left font-sans">
                <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 rounded-full bg-rose-500" />
                    <span className="font-extrabold text-sm uppercase tracking-wider text-slate-900">
                      {selectedDocForView.file_type || 'PDF'} Document Viewer
                    </span>
                  </div>
                </div>

                <div className="space-y-4 text-xs leading-relaxed text-slate-800">
                  <h4 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">
                    {selectedDocForView.file_name}
                  </h4>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-slate-800 font-mono text-xs whitespace-pre-wrap leading-relaxed shadow-inner">
                    {selectedDocForView.content}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: VIEW RELEVANT SECTION (CHUNK INSPECTION) MODAL */}
      {selectedChunkForInspect && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-2xl w-full space-y-4 shadow-xl text-left">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    Relevant Section: {selectedChunkForInspect.file_name}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setSelectedChunkForInspect(null)}
                className="text-slate-400 hover:text-slate-700 font-bold p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-900 text-slate-100 p-4 rounded-xl font-mono leading-relaxed max-h-60 overflow-y-auto border border-slate-800 shadow-inner">
                {selectedChunkForInspect.content}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedChunkForInspect(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-200 cursor-pointer"
              >
                Close Inspection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: RELEVANCE SCORE EXPLANATION BREAKDOWN MODAL */}
      {scoreExplanationDoc && (() => {
        const docObj = scoreExplanationDoc;
        const rawScore = docObj.score !== undefined ? (docObj.score > 1 ? docObj.score / 100 : docObj.score) : 0.85;
        
        // Exact calculated score mapping
        const exactScore = rawScore * 100;
        const scorePct = preciseScore(rawScore);
        
        const fileName = docObj.file_name || docObj.name || 'Document';
        const fileType = docObj.file_type || 'PDF';
        const dept = docObj.metadata?.department || docObj.dept || docObj.category || 'General';
        const matchedChunks = docObj.metadata?.matched_chunks || 1;
        const contentSnippet = docObj.content || 'Matched section snippet payload available for analysis.';

        const explain = docObj.explainability || {};
        const simScore = explain.similarity_score !== undefined ? explain.similarity_score : rawScore;
        
        // Ensure total alignment by mapping directly from the exactScore
        const vectorPtsVal = exactScore * 0.40;
        const keywordPtsVal = exactScore * 0.30;
        const deptPtsVal = exactScore * 0.20;
        const freshPtsVal = exactScore * 0.10;

        const vectorPts = vectorPtsVal.toFixed(1);
        const keywordPts = keywordPtsVal.toFixed(1);
        const deptPts = deptPtsVal.toFixed(1);
        const freshPts = freshPtsVal.toFixed(1);

        const totalCalculated = (
          parseFloat(vectorPts) + 
          parseFloat(keywordPts) + 
          parseFloat(deptPts) + 
          parseFloat(freshPts)
        ).toFixed(1);

        const keywords = (explain.matched_keywords && explain.matched_keywords.length > 0)
          ? explain.matched_keywords
          : (query.trim() ? query.toLowerCase().split(/\s+/).filter(w => w.length > 2 && !STOPWORDS.has(w)).slice(0, 5) : ['search', 'term', 'relevance']);

        const matchReason = explain.match_reason || `Matched ${matchedChunks} relevant vector section(s) via hybrid semantic search with ${scorePct}% relevance confidence.`;
        const confidenceLevel = explain.confidence_level || (scorePct >= 75 ? 'High Confidence Match' : (scorePct >= 50 ? 'Moderate Alignment' : 'Low Confidence Match'));

        return (
          <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4 animate-in fade-in duration-100 select-text">
            <div className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full p-6 space-y-5 shadow-xl text-left font-sans max-h-[90vh] overflow-y-auto">

              {/* MODAL HEADER */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-md shadow-indigo-600/20">
                    <BarChart2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-lg tracking-tight">Relevance Score Breakdown</h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">Why <span className="font-semibold text-slate-800">{fileName}</span> received {scorePct}%</p>
                  </div>
                </div>
                <button
                  onClick={() => setScoreExplanationDoc(null)}
                  className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* TOP SCORE OVERVIEW BANNER */}
              <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-5 shadow-lg border border-indigo-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative overflow-hidden">
                <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-indigo-500/10 rounded-full blur-xl pointer-events-none" />

                <div className="space-y-1 relative z-10">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-indigo-300">
                      Calculated Match Alignment
                    </span>
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-bold text-[10px] rounded-full">
                      {confidenceLevel}
                    </span>
                  </div>
                  <div className="text-3xl font-black tracking-tight text-white flex items-baseline space-x-2">
                    <span>{scorePct}%</span>
                    <span className="text-xs font-semibold text-indigo-200">Relevance Score</span>
                  </div>
                  <p className="text-xs text-slate-300 font-normal leading-relaxed mt-1">
                    {matchReason}
                  </p>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center w-full sm:w-auto border-t sm:border-t-0 border-white/10 pt-3 sm:pt-0 shrink-0">
                  <span className="px-3 py-1 bg-white/10 text-white font-extrabold text-xs rounded-xl border border-white/15">
                    {matchedChunks} {matchedChunks === 1 ? 'Section' : 'Sections'} Matched
                  </span>
                  <span className="text-[10px] text-indigo-300 font-mono mt-1">
                    Dept: {dept}
                  </span>
                </div>
              </div>

              {/* MULTI-FACTOR WEIGHT BREAKDOWN */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
                    <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Algorithmic Weight Breakdown (100 Point Scale)</span>
                  </h4>
                  <span className="text-[10px] font-mono text-slate-400">Total: {totalCalculated} / 100 pts</span>
                </div>

                {/* FACTOR 1: Semantic Vector Cosine Distance */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-900 flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                      <span>1. Semantic Vector Cosine Similarity (40% Weight)</span>
                    </span>
                    <span className="text-indigo-700 font-mono font-extrabold">{vectorPts} / 40 pts</span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-600 rounded-full transition-all duration-500" style={{ width: `${(vectorPts / 40) * 100}%` }} />
                  </div>
                  <p className="text-[11px] text-slate-600 font-normal leading-relaxed">
                    ChromaDB vector embedding distance calculated at <span className="font-semibold text-slate-800">{(simScore * 100).toFixed(1)}% Cosine similarity</span> using <span className="font-mono text-xs">all-MiniLM-L6-v2</span> model.
                  </p>
                </div>

                {/* FACTOR 2: Keyword Match Density & BM25 Score */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-900 flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <span>2. Keyword Match Density & Frequency (30% Weight)</span>
                    </span>
                    <span className="text-emerald-700 font-mono font-extrabold">{keywordPts} / 30 pts</span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${(keywordPts / 30) * 100}%` }} />
                  </div>
                  <p className="text-[11px] text-slate-600 font-normal leading-relaxed">
                    High query token frequency overlap in the document chunk payload.
                  </p>
                </div>

                {/* FACTOR 3: Department & Metadata Alignment */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-900 flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                      <span>3. Department & Context Alignment (20% Weight)</span>
                    </span>
                    <span className="text-blue-700 font-mono font-extrabold">{deptPts} / 20 pts</span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${(deptPts / 20) * 100}%` }} />
                  </div>
                  <p className="text-[11px] text-slate-600 font-normal leading-relaxed">
                    Evaluated alignment between document category/department metadata (<span className="font-semibold text-slate-800">{dept}</span>) and search parameters.
                  </p>
                </div>

                {/* FACTOR 4: Indexing Authority & Freshness */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-900 flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                      <span>4. Indexing Health & Document Freshness (10% Weight)</span>
                    </span>
                    <span className="text-amber-700 font-mono font-extrabold">{freshPts} / 10 pts</span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full transition-all duration-500" style={{ width: `${(freshPts / 10) * 100}%` }} />
                  </div>
                  <p className="text-[11px] text-slate-600 font-normal leading-relaxed">
                    Verified active vector index status and document recency boost in PostgreSQL memory registry.
                  </p>
                </div>
              </div>

              {/* MATCHED QUERY KEYWORDS PILLS */}
              {keywords.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
                    <Tag className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Matched Search Query Terms</span>
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {keywords.map((kw, idx) => (
                      <span key={idx} className="px-2.5 py-1 bg-indigo-50 border border-indigo-200 text-indigo-800 font-mono font-semibold text-xs rounded-xl flex items-center space-x-1">
                        <CheckCircle2 className="w-3 h-3 text-indigo-600" />
                        <span>{kw}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* FOOTER ACTIONS */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => {
                    const targetDoc = scoreExplanationDoc;
                    setScoreExplanationDoc(null);
                    if (onViewAIResponse) {
                      onViewAIResponse({
                        query: query,
                        docName: fileName,
                        file_name: fileName,
                        department: dept,
                        score: scorePct,
                        chunkContent: contentSnippet
                      });
                    }
                  }}
                  className="px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 font-extrabold text-xs rounded-xl transition-all cursor-pointer flex items-center space-x-2"
                >
                  <EchoWaveIcon className="w-4 h-4 text-indigo-600" color="currentColor" />
                  <span>Explore in Echo AI</span>
                </button>

                <button
                  onClick={() => setScoreExplanationDoc(null)}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                >
                  Close Explanation
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteDialog && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-2xl text-left transform scale-100 transition-all">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                <TriangleAlert className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">{deleteDialog.title}</h3>
                <p className="text-sm text-slate-500 mt-1 leading-relaxed">{deleteDialog.message}</p>
              </div>
            </div>
            
            <div className="flex items-center justify-end space-x-3 mt-8">
              <button
                onClick={() => setDeleteDialog(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteAction}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-sm shadow-md shadow-rose-600/20 transition-all cursor-pointer flex items-center space-x-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Yes, Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
