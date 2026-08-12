import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Zap,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Search,
  Brain,
  ShieldCheck,
  Workflow,
  Activity,
  Clock,
  Check,
  Play,
  BarChart3,
  PlusCircle,
  ChevronRight,
  Server,
  Lock,
  Bell,
  HelpCircle,
  X
} from 'lucide-react';
import { orchestratorAPI } from '../../services/api';

export default function OrchestratorWorkspace({ onNavigateToResponse }) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [orchestrationResult, setOrchestrationResult] = useState(null);
  const [logs, setLogs] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [logsRes, analyticsRes] = await Promise.all([
        orchestratorAPI.getLogs(),
        orchestratorAPI.getAnalytics()
      ]);
      setLogs(logsRes || []);
      if (analyticsRes) {
        setAnalytics(analyticsRes);
      }
    } catch (e) {
      console.error('Orchestrator fetch error:', e);
    }
  };

  const handleRunOrchestration = async (testQuery) => {
    const q = testQuery || query;
    if (!q.trim()) return;

    setLoading(true);
    try {
      const res = await orchestratorAPI.execute({
        query: q,
        department: 'Engineering & Product',
        user_role: 'employee'
      });
      setOrchestrationResult(res);
      fetchInitialData();
    } catch (e) {
      console.error('Orchestration run error:', e);
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
    <div className="p-8 max-w-7xl mx-auto space-y-8 select-none text-left font-sans">
      {/* 1. Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-slate-200/80 pb-6">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">AI Orchestrator</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                Master Intelligence Layer
              </span>
            </div>
            <p className="text-sm text-slate-500 font-medium mt-0.5">
              Enterprise Multi-Agent Coordination Engine • Coordinates Search, Memory, Decision & Response Agents
            </p>
          </div>
        </div>

        {/* Actions: How It Works & System Architecture Badge */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowHowItWorks(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white border border-indigo-500 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all shadow-xs cursor-pointer"
          >
            <HelpCircle className="w-4 h-4 text-indigo-100" />
            <span>How It Works</span>
          </button>

          <div className="flex items-center space-x-2 bg-white border border-slate-200 px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 shadow-2xs">
            <Server className="w-4 h-4 text-indigo-600" />
            <span>Ollama Qwen 2.5 3B • PostgreSQL • ChromaDB</span>
          </div>
        </div>
      </div>

      {/* 2. Top Real Database Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs text-center space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active Agents</span>
          <span className="text-2xl font-extrabold text-indigo-600 block">{analytics?.active_agents ?? 4}</span>
          <span className="text-[10px] font-semibold text-slate-500 block">Search, Memory, Decision, Response</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs text-center space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tasks Executed</span>
          <span className="text-2xl font-extrabold text-indigo-600 block">{(analytics?.tasks_executed ?? 0).toLocaleString()}</span>
          <span className="text-[10px] font-semibold text-slate-500 block">Orchestrator Runs</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs text-center space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Avg Planning Time</span>
          <span className="text-2xl font-extrabold text-purple-600 block">{analytics?.avg_planning_time_ms ?? 0} ms</span>
          <span className="text-[10px] font-semibold text-slate-500 block">Real Database Average</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs text-center space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Agent Success Rate</span>
          <span className="text-2xl font-extrabold text-emerald-600 block">{analytics?.agent_success_rate ?? '100.0%'}</span>
          <span className="text-[10px] font-semibold text-slate-500 block">Zero Routing Drop</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs text-center space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Avg Execution Time</span>
          <span className="text-2xl font-extrabold text-slate-800 block">{analytics?.avg_agent_latency_ms ?? 0} ms</span>
          <span className="text-[10px] font-semibold text-slate-500 block">Pipeline Latency</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs text-center space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Requests</span>
          <span className="text-2xl font-extrabold text-slate-900 block">{(analytics?.total_requests_processed ?? 0).toLocaleString()}</span>
          <span className="text-[10px] font-semibold text-slate-500 block">System Queries</span>
        </div>
      </div>

      {/* 3. Interactive Live Request Intake */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm">
            <Zap className="w-4 h-4 text-indigo-600 fill-current" />
            <span>AI Orchestrator Query Intake & Agent Dispatcher</span>
          </div>
          <span className="text-xs text-slate-500 font-medium">Does not generate responses. It plans, triggers & coordinates agents.</span>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type your query (e.g., Explain Cogniva architecture, search leave policy...)..."
            className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
          />
          <button
            onClick={() => handleRunOrchestration(query)}
            disabled={loading || !query.trim()}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center space-x-2 disabled:opacity-50 shadow-xs"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
            <span>Run Orchestration Pipeline</span>
          </button>
        </div>

        {/* Real Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span className="text-slate-400 font-semibold">Quick Actions:</span>
          {[
            'Explain Cogniva architecture',
            'Retrieve HR Leave Policy & User History',
            'Search Engineering SOP & Specs'
          ].map((preset, idx) => (
            <button
              key={idx}
              onClick={() => {
                setQuery(preset);
                handleRunOrchestration(preset);
              }}
              className="px-3 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 rounded-lg text-slate-600 text-[11px] font-medium transition-all cursor-pointer"
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      {/* 4. EXECUTION PIPELINE STAGE DIAGRAM */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
            <Workflow className="w-4 h-4 text-blue-600" />
            <span>Execution Pipeline (Live Coordination Flow)</span>
          </h2>
          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${orchestrationResult ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-slate-500 bg-slate-100 border-slate-200'}`}>
            {orchestrationResult ? 'Execution Completed' : 'Awaiting Request'}
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold">
          <div className="flex items-center space-x-1.5 text-slate-700 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
            <span>Employee Query</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />

          <div className="flex items-center space-x-1.5 text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200">
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>Intent Detection</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />

          <div className="flex items-center space-x-1.5 text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-200">
            <Cpu className="w-3.5 h-3.5" />
            <span>Agent Planner</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />

          <div className="flex items-center space-x-1.5 text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200">
            <Search className="w-3.5 h-3.5" />
            <span>Search Agent</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />

          <div className="flex items-center space-x-1.5 text-purple-700 bg-purple-50 px-3 py-1.5 rounded-lg border border-purple-200">
            <Brain className="w-3.5 h-3.5" />
            <span>Memory Agent</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />

          <div className="flex items-center space-x-1.5 text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Decision Agent</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />

          <div className="flex items-center space-x-1.5 text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Response Agent</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />

          <div className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-white font-semibold shadow-xs ${orchestrationResult ? 'bg-emerald-600' : 'bg-slate-400'}`}>
            <Check className="w-3.5 h-3.5" />
            <span>{orchestrationResult ? 'Completed' : 'Idle'}</span>
          </div>
        </div>
      </div>

      {/* 5. AGENT STATUS CARDS GRID */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
            <Activity className="w-4 h-4 text-blue-600" />
            <span>Agent Status Cards</span>
          </h2>
          <span className="text-xs text-slate-500">Real Execution Latencies & Output Summaries</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Agent 2: Search Agent */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-3 text-left">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Search className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold text-slate-900">Search Agent</span>
              </div>
              <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${orchestrationResult ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                {orchestrationResult ? 'Completed' : 'Idle'}
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              {orchestrationResult?.plan?.execution_steps?.[0]?.summary || 'Semantic enterprise document retrieval.'}
            </p>
            <div className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-200/60 font-mono">
              Latency: {orchestrationResult?.plan?.execution_steps?.[0]?.latency_ms ?? 0} ms
            </div>
          </div>

          {/* Agent 3: Memory Agent */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-3 text-left">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Brain className="w-4 h-4 text-purple-600" />
                <span className="text-xs font-bold text-slate-900">Memory Agent</span>
              </div>
              <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${orchestrationResult ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                {orchestrationResult ? 'Completed' : 'Idle'}
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              {orchestrationResult?.plan?.execution_steps?.[1]?.summary || 'Conversation history & preference linking.'}
            </p>
            <div className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-200/60 font-mono">
              Latency: {orchestrationResult?.plan?.execution_steps?.[1]?.latency_ms ?? 0} ms
            </div>
          </div>

          {/* Agent 4: Decision Agent */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-3 text-left">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-bold text-slate-900">Decision Agent</span>
              </div>
              <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${orchestrationResult ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                {orchestrationResult ? 'Completed' : 'Idle'}
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              {orchestrationResult?.plan?.execution_steps?.[2]?.summary || 'Intent validation & routing decisions.'}
            </p>
            <div className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-200/60 font-mono">
              Latency: {orchestrationResult?.plan?.execution_steps?.[2]?.latency_ms ?? 0} ms
            </div>
          </div>

          {/* Agent 1: Response Agent */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-3 text-left">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold text-slate-900">Response Agent</span>
              </div>
              <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${orchestrationResult ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                {orchestrationResult ? 'Completed' : 'Idle'}
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              {orchestrationResult?.plan?.execution_steps?.[3]?.summary || 'Context packaging for Qwen 2.5 model.'}
            </p>
            <div className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-200/60 font-mono">
              Latency: {orchestrationResult?.plan?.execution_steps?.[3]?.latency_ms ?? 0} ms
            </div>
          </div>
        </div>
      </div>

      {/* 6. EXECUTION TIMELINE & ROUTING DECISIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Timeline Checklist (Cols 6) */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>Execution Timeline</span>
            </h3>
            <span className="text-xs text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full font-bold">
              Total: {orchestrationResult?.total_execution_time_ms ?? 0} ms
            </span>
          </div>

          <div className="space-y-2 text-xs">
            {orchestrationResult ? (
              [
                { title: 'Query Received', detail: `Query: "${orchestrationResult.query}"`, icon: CheckCircle2 },
                { title: 'Intent Identified', detail: `Intent: "${orchestrationResult.plan.intent}" (${orchestrationResult.plan.complexity} complexity)`, icon: CheckCircle2 },
                { title: 'Search Executed', detail: `Retrieved document chunks from ChromaDB & Postgres`, icon: CheckCircle2 },
                { title: 'Memory Vault Consulted', detail: 'Fetched conversation context & user preferences', icon: CheckCircle2 },
                { title: 'Decision Validated', detail: 'Routing strategy confirmed with confidence', icon: CheckCircle2 },
                { title: 'Payload Packaged', detail: 'Aggregated context dispatched to Response Agent (Agent 1)', icon: CheckCircle2 }
              ].map((step, idx) => (
                <div key={idx} className="flex items-start space-x-3 p-2.5 bg-slate-50 rounded-xl border border-slate-200/70">
                  <step.icon className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong className="text-slate-900 font-bold block">{step.title}</strong>
                    <span className="text-slate-500 font-medium">{step.detail}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-slate-400 font-medium">
                No active execution timeline. Submit a query to see the live step-by-step breakdown.
              </div>
            )}
          </div>
        </div>

        {/* Routing Decisions (Cols 6) */}
        <div className="lg:col-span-6 bg-slate-900 text-slate-100 rounded-2xl p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs font-bold text-blue-300 uppercase tracking-wider flex items-center space-x-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400 fill-current" />
              <span>Routing Rationale</span>
            </span>
            <span className="text-[11px] text-slate-400">Master Orchestrator Logic</span>
          </div>

          <div className="space-y-3 text-xs">
            {orchestrationResult?.plan?.routing_reasons ? (
              Object.entries(orchestrationResult.plan.routing_reasons).map(([agentName, reason], idx) => (
                <div key={idx} className="p-3 bg-slate-800 rounded-xl border border-slate-700 space-y-1">
                  <strong className="text-blue-300 font-bold block">{agentName}</strong>
                  <p className="text-slate-300 leading-relaxed text-[11px]">{reason}</p>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-slate-500 font-medium">
                Run an enterprise query above to display real agent selection rationale.
              </div>
            )}
          </div>

          {orchestrationResult && (
            <div className="pt-2 flex justify-end">
              <button
                onClick={handleForwardToResponseAgent}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-xs transition-all flex items-center space-x-2 cursor-pointer"
              >
                <span>Forward Aggregated Context to Response Agent</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 7. REAL DATABASE AGENT UTILIZATION & FUTURE READY REGISTRY */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Real Database Agent Requests (Cols 7) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
                <BarChart3 className="w-4.5 h-4.5 text-blue-600" />
                <span>Real Agent Execution Analytics</span>
              </h3>
              <p className="text-xs text-slate-500">Live database query records per agent module.</p>
            </div>
            <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">
              PostgreSQL Data
            </span>
          </div>

          <div className="space-y-3">
            {(analytics?.agent_utilization || []).map((item, i) => (
              <div key={i} className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800">{item.agent}</span>
                <div className="flex items-center space-x-3">
                  <span className="font-mono text-slate-600 font-semibold">{item.requests ?? 0} Requests</span>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-md">
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Future Ready Agents Registry (Cols 5) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                <PlusCircle className="w-4 h-4 text-purple-600" />
                <span>Extensible Agent Registry</span>
              </h3>
              <p className="text-[11px] text-slate-500">Plug & Play Agent Registry (Zero Core Logic Changes)</p>
            </div>
          </div>

          <div className="space-y-2.5 text-xs">
            {(analytics?.future_ready_agents || []).map((agent, idx) => (
              <div key={idx} className="p-3 bg-purple-50/40 border border-purple-100 rounded-xl flex items-center justify-between">
                <div>
                  <strong className="text-slate-900 font-bold block">{agent.name}</strong>
                  <span className="text-slate-500 text-[11px] font-medium">{agent.type}</span>
                </div>
                <span className="px-2.5 py-1 bg-purple-100 text-purple-800 text-[10px] font-bold rounded-lg border border-purple-200">
                  {agent.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 8. LIVE ORCHESTRATION LOGS TABLE */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <span>Live AI Orchestration Logs</span>
          </h3>
          <span className="text-xs text-slate-500">Actual Multi-Agent Dispatch Records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-y border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <th className="p-3">Query</th>
                <th className="p-3">Intent</th>
                <th className="p-3">Agents Triggered</th>
                <th className="p-3">Context Summary</th>
                <th className="p-3">Planning Time</th>
                <th className="p-3">Total Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(logs || []).length > 0 ? (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-semibold text-slate-900 max-w-xs truncate">{log.query}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-md font-semibold text-[11px]">
                        {log.intent}
                      </span>
                    </td>
                    <td className="p-3 font-semibold text-indigo-700">
                      {Array.isArray(log.execution_plan) ? log.execution_plan.length : 4} Agents
                    </td>
                    <td className="p-3 text-slate-600 truncate max-w-xs">{log.aggregated_context_summary || 'Search + Memory + Decision'}</td>
                    <td className="p-3 font-mono text-purple-700 font-bold">{log.planning_time_ms} ms</td>
                    <td className="p-3 font-mono text-emerald-700 font-bold">{log.total_execution_time_ms} ms</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 font-medium">
                    No orchestration logs recorded yet. Execute an enterprise query above to create real database execution records.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* HOW IT WORKS MODAL */}
      {showHowItWorks && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-4xl w-full p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">How the AI Orchestrator Works</h2>
                  <p className="text-xs text-slate-500">Master Intelligence & Multi-Agent Execution Routing</p>
                </div>
              </div>
              <button
                onClick={() => setShowHowItWorks(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-600 leading-relaxed font-medium">
              <p className="p-4 bg-blue-50/60 border border-blue-100 rounded-2xl text-blue-900">
                The <strong>AI Orchestrator</strong> acts as the central brain. It receives incoming enterprise queries, analyzes intent and complexity, formulates execution plans, dispatches tasks sequentially across <strong>Search Agent (Agent 2)</strong>, <strong>Memory Agent (Agent 3)</strong>, <strong>Decision Agent (Agent 4)</strong>, and packages the unified context payload for <strong>Response Agent (Agent 1)</strong>.
              </p>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <strong className="text-slate-900 font-bold block">Pipeline Execution Steps:</strong>
                <ol className="list-decimal list-inside space-y-1 font-semibold text-slate-700">
                  <li><strong>Intent Analysis</strong>: Classifies query intent and complexity level.</li>
                  <li><strong>Search Agent Execution</strong>: Fetches top-K vector chunks from ChromaDB.</li>
                  <li><strong>Memory Vault Consultation</strong>: Fetches user preferences and conversation history.</li>
                  <li><strong>Decision Agent Evaluation</strong>: Evaluates context confidence and selects retrieval strategy.</li>
                  <li><strong>Payload Packaging</strong>: Assembles unified multi-agent context for Ollama Qwen 2.5 3B response synthesis.</li>
                </ol>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowHowItWorks(false)}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-xs cursor-pointer flex items-center space-x-2"
              >
                <span>Got It, Back to Workspace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
