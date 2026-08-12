import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  TrendingUp,
  BookOpen,
  ArrowRight,
  RefreshCw,
  Search,
  Filter,
  Layers,
  Sparkles,
  Database
} from 'lucide-react';
import { analyticsAgentAPI } from '../../services/api';

export default function AdminWorkspace({ onNavigateToKnowledge }) {
  const [knowledgeGaps, setKnowledgeGaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('pending'); // 'all', 'pending', 'resolved'
  const [searchTerm, setSearchTerm] = useState('');
  const [actionNotice, setActionNotice] = useState('');

  const fetchGaps = async () => {
    setLoading(true);
    try {
      const data = await analyticsAgentAPI.getKnowledgeGaps();
      if (Array.isArray(data)) {
        setKnowledgeGaps(data);
      }
    } catch (err) {
      console.error('Error fetching knowledge gaps:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGaps();
  }, []);

  const handleResolveGap = async (gapId) => {
    const res = await analyticsAgentAPI.resolveKnowledgeGap(gapId);
    if (res?.success) {
      setActionNotice(`Knowledge Gap #${gapId} marked as Resolved.`);
      fetchGaps();
      setTimeout(() => setActionNotice(''), 3000);
    }
  };

  const filteredGaps = knowledgeGaps.filter((gap) => {
    const matchesFilter =
      activeFilter === 'all'
        ? true
        : activeFilter === 'pending'
        ? gap.status !== 'Resolved'
        : gap.status === 'Resolved';
    const matchesSearch =
      gap.query.toLowerCase().includes(searchTerm.toLowerCase()) ||
      gap.department.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const pendingCount = knowledgeGaps.filter((g) => g.status !== 'Resolved').length;
  const resolvedCount = knowledgeGaps.filter((g) => g.status === 'Resolved').length;
  const totalAttempts = knowledgeGaps.reduce((acc, g) => acc + (g.attempts || 1), 0);

  // Top unanswered topic for Insight Engine
  const topGap = knowledgeGaps.length > 0 ? knowledgeGaps[0] : null;

  return (
    <div className="w-full p-8 space-y-6 select-none text-left font-sans text-slate-900">
      {/* HEADER BANNER */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border border-indigo-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-indigo-600/30 border border-indigo-400/40 rounded-2xl backdrop-blur-md text-white shadow-md">
              <ShieldCheck className="w-8 h-8 text-indigo-300" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-extrabold tracking-tight text-white">Admin Control Center</h1>
                <span className="px-3 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-indigo-500/30 border border-indigo-400/40 text-indigo-200">
                  Continuous Knowledge Loop
                </span>
              </div>
              <p className="text-sm text-slate-300 font-medium mt-1">
                Monitor unanswered user queries, off-topic requests, and detected knowledge gaps to refine Cogniva.
              </p>
            </div>
          </div>

          <button
            onClick={fetchGaps}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold rounded-xl text-xs shadow-xs transition-all flex items-center space-x-2 cursor-pointer shrink-0 self-start md:self-auto"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Real Telemetry</span>
          </button>
        </div>
      </div>

      {actionNotice && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-4 rounded-xl text-xs font-bold flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* METRICS STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-1">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-600 block flex items-center space-x-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Pending Knowledge Gaps</span>
          </span>
          <p className="text-3xl font-black text-slate-900">{pendingCount}</p>
          <p className="text-[11px] text-slate-500 font-medium">Queries with no document match</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-1">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 block flex items-center space-x-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Resolved Knowledge Gaps</span>
          </span>
          <p className="text-3xl font-black text-slate-900">{resolvedCount}</p>
          <p className="text-[11px] text-slate-500 font-medium">Documentation uploaded & verified</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-1">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 block flex items-center space-x-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Total Unanswered Attempts</span>
          </span>
          <p className="text-3xl font-black text-slate-900">{totalAttempts}</p>
          <p className="text-[11px] text-slate-500 font-medium">User query repeat volume</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-1">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 block flex items-center space-x-1">
            <Database className="w-3.5 h-3.5" />
            <span>Data Integrity Mode</span>
          </span>
          <p className="text-xl font-black text-slate-900 mt-1">100% Real Data</p>
          <p className="text-[11px] text-slate-500 font-medium">Live PostgreSQL / SQLite Telemetry</p>
        </div>
      </div>

      {/* CONTINUOUS REINFORCEMENT LEARNING INSIGHT & RECOMMENDATION CARD */}
      {topGap && (
        <div className="bg-gradient-to-r from-indigo-50 via-blue-50 to-indigo-50 border border-indigo-200 rounded-2xl p-5 shadow-2xs space-y-3">
          <div className="flex items-center space-x-2 border-b border-indigo-100 pb-2">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <h3 className="font-extrabold text-xs uppercase tracking-wider text-indigo-900">
              Analytics Agent — Automated Insight & Actionable Recommendation
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase">Top Unresolved Query</span>
              <p className="font-extrabold text-slate-900 text-sm">"{topGap.query}"</p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase">Evidence</span>
              <p className="font-bold text-indigo-900">
                {topGap.attempts} recorded attempts • {topGap.department} Department
              </p>
            </div>
            <div className="space-y-1 md:text-right">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase block">Actionable Recommendation</span>
              <button
                onClick={() => onNavigateToKnowledge && onNavigateToKnowledge()}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all inline-flex items-center space-x-1.5 cursor-pointer mt-0.5"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Upload to Knowledge Hub</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UNANSWERED & OFF-TOPIC QUERY REGISTRY TABLE */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">
              Knowledge Gap Registry & Unanswered Queries
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              100% Real user telemetry collected directly from Data Scout & Insight Desk.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Filter queries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setActiveFilter('pending')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeFilter === 'pending'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Pending ({pendingCount})
              </button>
              <button
                onClick={() => setActiveFilter('resolved')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeFilter === 'resolved'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Resolved ({resolvedCount})
              </button>
              <button
                onClick={() => setActiveFilter('all')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                All ({knowledgeGaps.length})
              </button>
            </div>
          </div>
        </div>

        {/* TABLE OF KNOWLEDGE GAPS */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-slate-400 font-medium text-xs flex items-center justify-center space-x-2">
              <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
              <span>Fetching real database telemetry...</span>
            </div>
          ) : filteredGaps.length > 0 ? (
            <table className="w-full text-left text-xs font-sans">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <th className="p-3.5">ID</th>
                  <th className="p-3.5">Unanswered Query / Topic</th>
                  <th className="p-3.5">Department</th>
                  <th className="p-3.5 text-center">Attempt Count</th>
                  <th className="p-3.5">Detected Time</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredGaps.map((gap) => (
                  <tr key={gap.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 font-mono text-slate-400 font-bold">#{gap.id}</td>
                    <td className="p-3.5 font-bold text-slate-900">
                      <span className="flex items-center space-x-2">
                        <HelpCircle className="w-4 h-4 text-amber-500 shrink-0" />
                        <span>"{gap.query}"</span>
                      </span>
                    </td>
                    <td className="p-3.5 font-semibold text-slate-600">{gap.department}</td>
                    <td className="p-3.5 text-center">
                      <span className="px-2.5 py-1 bg-indigo-50 border border-indigo-200 font-extrabold text-indigo-800 text-[11px] rounded-full">
                        {gap.attempts} {gap.attempts === 1 ? 'time' : 'times'}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono text-slate-400 text-[11px]">{gap.created_at}</td>
                    <td className="p-3.5">
                      <span
                        className={`px-2.5 py-1 font-extrabold text-[10px] uppercase rounded-full border ${
                          gap.status === 'Resolved'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {gap.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right space-x-2">
                      {gap.status !== 'Resolved' && (
                        <button
                          onClick={() => handleResolveGap(gap.id)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-[11px] transition-all cursor-pointer inline-flex items-center space-x-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Mark Resolved</span>
                        </button>
                      )}
                      <button
                        onClick={() => onNavigateToKnowledge && onNavigateToKnowledge()}
                        className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 font-bold rounded-xl text-[11px] transition-all cursor-pointer inline-flex items-center space-x-1"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Add Doc</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-12 text-center text-slate-400 font-medium text-xs space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
              <p>No knowledge gaps found matching your filter criteria.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
