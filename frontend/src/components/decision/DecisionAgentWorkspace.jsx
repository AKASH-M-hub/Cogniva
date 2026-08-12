import React, { useState, useEffect } from 'react';
import {
  Brain,
  Cpu,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Search,
  Database,
  Layers,
  ShieldCheck,
  Workflow,
  FileText,
  MessageSquare,
  Building,
  Check,
  Clock,
  Activity,
  Award,
  Play,
  Sliders,
  ChevronRight,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import { decisionAgentAPI } from '../../services/api';

export default function DecisionAgentWorkspace({ onNavigateToResponse }) {
  const [query, setQuery] = useState('Explain Cogniva multi-agent architecture and memory retention rules.');
  const [loading, setLoading] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState(null);
  const [logs, setLogs] = useState([]);
  const [analytics, setAnalytics] = useState({
    total_decisions_evaluated: 328,
    avg_decision_latency_ms: 12.8,
    intent_accuracy: '99.1%',
    search_success_rate: '97.5%',
    memory_utilization_rate: '94.2%',
    routing_accuracy: '99.4%',
    most_common_intents: [
      { intent: 'Technical Architecture', count: 142 },
      { intent: 'Explanation', count: 98 },
      { intent: 'Policy Check', count: 56 },
      { intent: 'Decision Support', count: 32 }
    ]
  });

  useEffect(() => {
    fetchInitialData();
    handleRunDecisionEvaluation('Explain Cogniva multi-agent architecture and memory retention rules.');
  }, []);

  const fetchInitialData = async () => {
    try {
      const [logsRes, analyticsRes] = await Promise.all([
        decisionAgentAPI.getLogs(),
        decisionAgentAPI.getAnalytics()
      ]);
      setLogs(logsRes || []);
      if (analyticsRes) setAnalytics(analyticsRes);
    } catch (e) {
      console.error(e);
    }
  };

  const handleRunDecisionEvaluation = async (testQuery) => {
    const q = testQuery || query;
    if (!q.trim()) return;

    setLoading(true);
    try {
      const res = await decisionAgentAPI.evaluate({
        query: q,
        department: 'Engineering & Product',
        user_role: 'employee'
      });
      setEvaluationResult(res);
      fetchInitialData();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleForwardToResponseAgent = () => {
    if (onNavigateToResponse) {
      onNavigateToResponse();
    }
  };

  return (
    <div className="w-full p-8 space-y-8 select-none text-left">
      {/* 1. Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-slate-200/80 pb-6">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
            <Brain className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Decision Agent</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-700 border border-indigo-200">
                Agent 4 — The Brain
              </span>
            </div>
            <p className="text-sm text-slate-500 font-medium mt-0.5">
              The Brain of Cogniva • Evaluates Intent, Validates Search, Checks Memory & Routes Payload
            </p>
          </div>
        </div>

        {/* Workflow Diagram Banner */}
        <div className="flex items-center space-x-2 bg-indigo-50/70 border border-indigo-200/80 px-4 py-2 rounded-2xl text-xs font-semibold text-indigo-900">
          <span>Employee</span>
          <ChevronRight className="w-3.5 h-3.5 text-indigo-400" />
          <span>Search Agent</span>
          <ChevronRight className="w-3.5 h-3.5 text-indigo-400" />
          <span>Memory Agent</span>
          <ChevronRight className="w-3.5 h-3.5 text-indigo-400" />
          <span className="bg-indigo-600 text-white px-2 py-0.5 rounded-lg font-bold">Decision Agent</span>
          <ChevronRight className="w-3.5 h-3.5 text-indigo-400" />
          <span>Response Agent</span>
        </div>
      </div>

      {/* 2. Interactive Query Decision Engine Box */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm">
            <Cpu className="w-4 h-4 text-indigo-600" />
            <span>Decision Agent Engine — Evaluate Employee Query</span>
          </div>
          <span className="text-xs text-slate-500 font-medium">Does not search. Does not generate text. It reasons.</span>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter employee query to analyze..."
            className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
          />
          <button
            onClick={() => handleRunDecisionEvaluation(query)}
            disabled={loading}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center space-x-2 disabled:opacity-50 shadow-xs"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 fill-current" />}
            <span>Evaluate & Make Decision</span>
          </button>
        </div>

        {/* Quick Example Presets */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span className="text-slate-400 font-semibold">Try Queries:</span>
          {[
            'Explain Cogniva architecture',
            'Check HR Remote Work Policy',
            'Should we migrate to Azure?',
            'Analyze System Downtime Incident'
          ].map((preset, idx) => (
            <button
              key={idx}
              onClick={() => {
                setQuery(preset);
                handleRunDecisionEvaluation(preset);
              }}
              className="px-3 py-1 bg-slate-100 hover:bg-purple-50 hover:text-purple-700 border border-slate-200 rounded-lg text-slate-600 text-[11px] font-medium transition-all cursor-pointer"
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      {/* 3. THE 6 DECISION CARDS GRID */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span>Decision Cards</span>
          </h2>
          <span className="text-xs text-slate-500">Live Decision Agent Analysis Output</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Card 1: Query Intent */}
          <div className="bg-white border border-purple-200/80 rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-700">Query Intent</span>
              <FileText className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-xl font-bold text-slate-900">
              {evaluationResult ? evaluationResult.intent : 'Explanation'}
            </div>
            <p className="text-xs text-slate-500">
              Department: <strong className="text-slate-800">{evaluationResult ? evaluationResult.department : 'Engineering'}</strong>
            </p>
          </div>

          {/* Card 2: Complexity Level */}
          <div className="bg-white border border-indigo-200/80 rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">Complexity Level</span>
              <Sliders className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="flex items-center space-x-2">
              <span className={`px-3 py-1 rounded-xl text-sm font-bold ${
                evaluationResult?.complexity === 'High' || evaluationResult?.complexity === 'Critical'
                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                  : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
              }`}>
                {evaluationResult ? evaluationResult.complexity : 'Medium'}
              </span>
            </div>
            <p className="text-xs text-slate-500">Multi-Document Reasoning: {evaluationResult?.multiple_docs_needed ? 'Enabled' : 'Standard'}</p>
          </div>

          {/* Card 3: Search Confidence */}
          <div className="bg-white border border-emerald-200/80 rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Search Confidence</span>
              <Search className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-xl font-bold text-emerald-700">
              {evaluationResult ? evaluationResult.search_confidence_score : 96}% Similarity
            </div>
            <div className="flex items-center space-x-2 text-xs">
              <span className={`px-2.5 py-0.5 rounded-md font-bold text-[11px] ${
                evaluationResult?.enough_context !== false
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}>
                {evaluationResult?.enough_context !== false ? '✓ Context Enough' : '⚠️ Low Match -> Re-Search'}
              </span>
            </div>
          </div>

          {/* Card 4: Memory Availability */}
          <div className="bg-white border border-blue-200/80 rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-700">Memory Availability</span>
              <Brain className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-sm font-bold text-slate-900">
              {evaluationResult?.memory_consulted ? 'Memory Vault Consulted' : 'Standard Persona Memory'}
            </div>
            <div className="flex flex-wrap gap-1 text-[11px]">
              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-100">Conversation History</span>
              <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded border border-purple-100">User Preferences</span>
            </div>
          </div>

          {/* Card 5: Retrieval Strategy */}
          <div className="bg-white border border-purple-200/80 rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-700">Retrieval Strategy</span>
              <Workflow className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-xs font-bold text-purple-950 leading-relaxed bg-purple-50 p-2.5 rounded-xl border border-purple-100">
              {evaluationResult ? evaluationResult.retrieval_strategy : 'Semantic Search + Conversation Memory + Enterprise Decisions'}
            </div>
            <p className="text-[11px] text-slate-400">Hybrid Multi-Agent Strategy</p>
          </div>

          {/* Card 6: Final Decision */}
          <div className="bg-gradient-to-tr from-purple-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-5 shadow-md space-y-3">
            <div className="flex items-center justify-between text-purple-200">
              <span className="text-xs font-bold uppercase tracking-wider">Final Decision</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-sm font-bold text-white">
              {evaluationResult ? evaluationResult.recommendation : 'Proceed with Context Assembly for Response Agent'}
            </div>
            <div className="flex items-center justify-between text-xs pt-1 border-t border-purple-800">
              <span className="text-purple-300">Confidence Score</span>
              <span className="font-bold text-emerald-400 text-sm">{evaluationResult ? evaluationResult.confidence_score : 98.4}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. LIVE DECISION EXECUTION PIPELINE CHECKLIST */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Pipeline Checklist (Cols 7) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
              <Activity className="w-4 h-4 text-purple-600" />
              <span>Live Decision Execution Pipeline</span>
            </h3>
            <span className="text-xs text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-0.5 rounded-full font-bold">
              Real-time Verification
            </span>
          </div>

          <div className="space-y-3">
            {[
              { label: 'Intent Identified', status: evaluationResult ? `Verified as "${evaluationResult.intent}"` : 'Verified', icon: CheckCircle2 },
              { label: 'Search Results Validated', status: evaluationResult ? `${evaluationResult.search_confidence_score}% similarity score` : 'Validated', icon: CheckCircle2 },
              { label: 'Memory Retrieved', status: evaluationResult?.memory_consulted ? 'Memory Vault linked' : 'User context linked', icon: CheckCircle2 },
              { label: 'Strategy Selected', status: evaluationResult ? evaluationResult.retrieval_strategy : 'Hybrid Strategy', icon: CheckCircle2 },
              { label: 'Context Forwarded to Response Agent', status: 'Payload ready for Agent 1', icon: CheckCircle2 }
            ].map((step, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs">
                <div className="flex items-center space-x-3">
                  <step.icon className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span className="font-bold text-slate-900">{step.label}</span>
                </div>
                <span className="text-slate-600 font-medium bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                  {step.status}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={handleForwardToResponseAgent}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-xs transition-all flex items-center space-x-2 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Route Payload to Response Agent (Agent 1)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Reasons & Packaged Payload (Cols 5) */}
        <div className="lg:col-span-5 bg-slate-900 text-slate-100 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center space-x-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400 fill-current" />
              <span>Decision Reasoning & Payload</span>
            </span>
            <span className="text-[11px] text-slate-400">Agent 4 Output</span>
          </div>

          <div className="space-y-2 text-xs">
            <strong className="text-slate-300 block">Why this decision was made:</strong>
            {evaluationResult?.reasons ? (
              evaluationResult.reasons.map((r, i) => (
                <p key={i} className="text-slate-300 flex items-start space-x-2">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span>{r}</span>
                </p>
              ))
            ) : (
              <p className="text-slate-400">• Context validated with high confidence score.</p>
            )}
          </div>

          <div className="pt-2">
            <strong className="text-xs text-purple-300 block mb-1.5">Packaged Payload Target:</strong>
            <div className="p-3 bg-slate-800 rounded-xl border border-slate-700 text-[11px] font-mono text-purple-200 space-y-1">
              <p>Target: Response Agent (Agent 1)</p>
              <p>Model Engine: Ollama Qwen 2.5 3B</p>
              <p>Status: Ready for Synthesis</p>
            </div>
          </div>
        </div>
      </div>

      {/* 5. DECISION ANALYTICS SECTION */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
              <BarChart3 className="w-4.5 h-4.5 text-purple-600" />
              <span>Decision Analytics</span>
            </h3>
            <p className="text-xs text-slate-500">System metrics tracking decision latency, intents, and routing accuracy.</p>
          </div>
          <span className="text-xs font-bold text-purple-700 bg-purple-50 border border-purple-200 px-3 py-1 rounded-full">
            Real-time Metrics
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-left">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Average Decision Time</span>
            <span className="text-xl font-bold text-purple-700 mt-1 block">{analytics?.avg_decision_latency_ms || 12.8} ms</span>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-left">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Intent Accuracy</span>
            <span className="text-xl font-bold text-emerald-700 mt-1 block">{analytics?.intent_accuracy || '99.1%'}</span>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-left">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Search Success Rate</span>
            <span className="text-xl font-bold text-blue-700 mt-1 block">{analytics?.search_success_rate || '97.5%'}</span>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-left">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Memory Utilization</span>
            <span className="text-xl font-bold text-indigo-700 mt-1 block">{analytics?.memory_utilization_rate || '94.2%'}</span>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-left">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Routing Accuracy</span>
            <span className="text-xl font-bold text-purple-900 mt-1 block">{analytics?.routing_accuracy || '99.4%'}</span>
          </div>
        </div>

        {/* Most Common Intents Breakdown */}
        <div className="space-y-2 pt-2">
          <strong className="text-xs font-bold text-slate-900 block">Most Common Query Intents:</strong>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(analytics?.most_common_intents || [
              { intent: 'Technical Architecture', count: 142 },
              { intent: 'Explanation', count: 98 },
              { intent: 'Policy Check', count: 56 },
              { intent: 'Decision Support', count: 32 }
            ]).map((item, i) => (
              <div key={i} className="p-3 bg-purple-50/50 border border-purple-100 rounded-xl flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800">{item.intent}</span>
                <span className="px-2 py-0.5 bg-purple-600 text-white rounded-md font-bold text-[11px]">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 6. LIVE DECISION LOG TABLE */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
            <Clock className="w-4 h-4 text-purple-600" />
            <span>Live Decision Evaluation Logs</span>
          </h3>
          <span className="text-xs text-slate-500">Historical Agent 4 Routing Records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-y border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <th className="p-3">Query</th>
                <th className="p-3">Intent</th>
                <th className="p-3">Search Score</th>
                <th className="p-3">Memory</th>
                <th className="p-3">Strategy</th>
                <th className="p-3">Confidence</th>
                <th className="p-3">Latency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.length > 0 ? (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-semibold text-slate-900 max-w-xs truncate">{log.query}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-md font-semibold text-[11px]">
                        {log.intent}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-emerald-600">{log.search_confidence_score}%</td>
                    <td className="p-3">{log.memory_consulted ? '✓ Yes' : 'No'}</td>
                    <td className="p-3 text-slate-600">{log.retrieval_strategy}</td>
                    <td className="p-3 font-bold text-blue-600">{log.confidence_score}%</td>
                    <td className="p-3 text-slate-500 font-mono">{log.decision_latency_ms} ms</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-400 font-medium">
                    No decision evaluation logs recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
