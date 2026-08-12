import React, { useState, useEffect } from 'react';
import {
  Brain,
  Database,
  Sparkles,
  Zap,
  Search,
  PlusCircle,
  Pin,
  PinOff,
  Clock,
  UserCheck,
  Building,
  Bookmark,
  CheckCircle2,
  FileText,
  Tag,
  BarChart2,
  Shield,
  Layers,
  ArrowRight,
  RefreshCw,
  Sliders,
  Calendar,
  Globe,
  MessageSquare,
  Activity,
  Filter,
  Check,
  X,
  ChevronRight,
  TrendingUp,
  Cpu,
  Workflow
} from 'lucide-react';
import { memoryAgentAPI } from '../../services/api';

export default function MemoryAgentWorkspace({ onNavigateToResponse }) {
  const [activeTab, setActiveTab] = useState('overview');

  // Stats State
  const [stats, setStats] = useState({
    total_memories: 1482,
    conversation_memories: 942,
    enterprise_decisions: 18,
    pinned_memories: 12,
    avg_retrieval_time_ms: 14.2,
    context_accuracy: '98.6%',
    hindsight_engine_status: 'Operational'
  });

  // User Preferences State
  const [preferences, setPreferences] = useState({
    department: 'Engineering & Product',
    role: 'Engineering Manager',
    language: 'English',
    preferred_tone: 'Professional',
    favorite_docs: ['System Architecture Spec 2026.pdf', 'Security & Governance Guidelines.pdf'],
    frequently_accessed: ['Remote Work Policy', 'Sprint Release SOP']
  });
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [prefNotice, setPrefNotice] = useState(null);

  // Decisions State
  const [decisions, setDecisions] = useState([]);
  const [loadingDecisions, setLoadingDecisions] = useState(false);
  const [decisionFilterDept, setDecisionFilterDept] = useState('all');
  const [decisionFilterPriority, setDecisionFilterPriority] = useState('all');
  const [decisionSearch, setDecisionSearch] = useState('');
  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState(false);

  // New Decision Form State
  const [newDecisionTitle, setNewDecisionTitle] = useState('');
  const [newDecisionDept, setNewDecisionDept] = useState('Engineering & Product');
  const [newDecisionText, setNewDecisionText] = useState('');
  const [newDecisionReason, setNewDecisionReason] = useState('');
  const [newDecisionPriority, setNewDecisionPriority] = useState('High');
  const [newDecisionOwner, setNewDecisionOwner] = useState('Enterprise Admin');
  const [newDecisionTags, setNewDecisionTags] = useState('Architecture, LLM');
  const [submittingDecision, setSubmittingDecision] = useState(false);

  // Conversation Memory State
  const [conversations, setConversations] = useState([]);
  const [loadingConvs, setLoadingConvs] = useState(false);
  const [selectedConvTimeline, setSelectedConvTimeline] = useState('all'); // 'all', 'today', 'week', 'month'

  // Interactive Context Playground State
  const [testQuery, setTestQuery] = useState('Explain the second module of Cogniva architecture.');
  const [testResult, setTestResult] = useState(null);
  const [testingContext, setTestingContext] = useState(false);

  // Fetch initial data
  useEffect(() => {
    fetchStats();
    fetchPreferences();
    fetchDecisions();
    fetchConversations();
  }, []);

  const fetchStats = async () => {
    try {
      const data = await memoryAgentAPI.getStats();
      if (data) setStats(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchPreferences = async () => {
    try {
      const data = await memoryAgentAPI.getPreferences();
      if (data) setPreferences(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchDecisions = async () => {
    setLoadingDecisions(true);
    try {
      const data = await memoryAgentAPI.getDecisions({
        department: decisionFilterDept,
        priority: decisionFilterPriority,
        search: decisionSearch
      });
      setDecisions(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDecisions(false);
    }
  };

  useEffect(() => {
    fetchDecisions();
  }, [decisionFilterDept, decisionFilterPriority, decisionSearch]);

  const fetchConversations = async () => {
    setLoadingConvs(true);
    try {
      const data = await memoryAgentAPI.getConversations();
      setConversations(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingConvs(false);
    }
  };

  const handleUpdatePreferences = async (e) => {
    e.preventDefault();
    setSavingPrefs(true);
    setPrefNotice(null);
    try {
      await memoryAgentAPI.updatePreferences(preferences);
      setPrefNotice('User Memory & Preferences updated successfully!');
      setTimeout(() => setPrefNotice(null), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleCreateDecision = async (e) => {
    e.preventDefault();
    if (!newDecisionTitle || !newDecisionText || !newDecisionReason) return;
    setSubmittingDecision(true);
    try {
      const tagsArray = newDecisionTags.split(',').map((t) => t.trim()).filter(Boolean);
      await memoryAgentAPI.createDecision({
        title: newDecisionTitle,
        department: newDecisionDept,
        decision: newDecisionText,
        reason: newDecisionReason,
        priority: newDecisionPriority,
        owner: newDecisionOwner,
        tags: tagsArray,
        is_pinned: false
      });
      setIsDecisionModalOpen(false);
      setNewDecisionTitle('');
      setNewDecisionText('');
      setNewDecisionReason('');
      fetchDecisions();
      fetchStats();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingDecision(false);
    }
  };

  const handleTogglePin = async (id) => {
    try {
      await memoryAgentAPI.togglePinDecision(id);
      fetchDecisions();
      fetchStats();
    } catch (e) {
      console.error(e);
    }
  };

  const handleRunSmartContextTest = async () => {
    if (!testQuery) return;
    setTestingContext(true);
    try {
      const res = await memoryAgentAPI.getSmartContext({
        query: testQuery,
        department: preferences.department,
        user_id: 'default_user'
      });
      setTestResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setTestingContext(false);
    }
  };

  // Filter decisions that are pinned
  const pinnedDecisions = decisions.filter((d) => d.is_pinned);

  return (
    <div className="w-full p-8 space-y-8 select-none text-left">
      {/* 1. Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-slate-200/80 pb-6">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
            <Brain className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Memory Agent</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-700 border border-indigo-200">
                Agent 3
              </span>
            </div>
            <p className="text-sm text-slate-500 font-medium mt-0.5">
              Enterprise Context & Organizational Memory Intelligence Layer
            </p>
          </div>
        </div>
      </div>

      {/* 3. Feature Workspace Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
        <div className="flex flex-wrap items-center space-x-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-white text-indigo-600 shadow-xs border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Workflow className="w-3.5 h-3.5" />
            <span>Architecture & Pipeline</span>
          </button>

          <button
            onClick={() => setActiveTab('pinned')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'pinned'
                ? 'bg-white text-indigo-600 shadow-xs border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Pin className="w-3.5 h-3.5" />
            <span>Pinned Memory ({pinnedDecisions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('conversations')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'conversations'
                ? 'bg-white text-indigo-600 shadow-xs border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Conversation Memory</span>
          </button>

          <button
            onClick={() => setActiveTab('decisions')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'decisions'
                ? 'bg-white text-indigo-600 shadow-xs border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>Enterprise Decisions</span>
          </button>

          <button
            onClick={() => setActiveTab('user-memory')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'user-memory'
                ? 'bg-white text-indigo-600 shadow-xs border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>User Preferences</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'analytics'
                ? 'bg-white text-indigo-600 shadow-xs border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Memory Analytics</span>
          </button>
        </div>

        <button
          onClick={() => setIsDecisionModalOpen(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-xs transition-all flex items-center space-x-2 cursor-pointer"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>Log Decision</span>
        </button>
      </div>

      {/* 4. Tab Views */}

      {/* TAB 1: OVERVIEW & ARCHITECTURE PIPELINE */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Architecture Pipeline Visualizer Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Workflow className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Cogniva Agent 3 — Memory Agent Processing Pipeline
                  </h3>
                  <p className="text-xs text-slate-500">
                    How Hindsight Memory Engine processes query intent, ranks context, and supplies Response Agent (Agent 1).
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full">
                Powered by Hindsight
              </span>
            </div>

            {/* Interactive Architecture Flow Diagram */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 relative">
              {/* Step 1 */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between space-y-2 hover:border-blue-300 transition-all">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-blue-600 mb-1">Step 1</div>
                  <h4 className="font-bold text-xs text-slate-900">Query Intake</h4>
                  <p className="text-[11px] text-slate-500 mt-1">Receives query & session context from AI Orchestrator.</p>
                </div>
                <span className="text-[10px] font-semibold text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-200 w-fit">
                  Trigger Intake
                </span>
              </div>

              {/* Step 2 */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between space-y-2 hover:border-blue-300 transition-all">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 mb-1">Step 2</div>
                  <h4 className="font-bold text-xs text-slate-900">Intent & Coreference</h4>
                  <p className="text-[11px] text-slate-500 mt-1">Resolves "the second module" references to previous sessions.</p>
                </div>
                <span className="text-[10px] font-semibold text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-200 w-fit">
                  Semantic Parse
                </span>
              </div>

              {/* Step 3 */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between space-y-2 hover:border-blue-300 transition-all">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-purple-600 mb-1">Step 3</div>
                  <h4 className="font-bold text-xs text-slate-900">Ranking & Scoring</h4>
                  <p className="text-[11px] text-slate-500 mt-1">Scores by Recency, Importance, Department & Priority.</p>
                </div>
                <span className="text-[10px] font-semibold text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-200 w-fit">
                  Hybrid Ranking
                </span>
              </div>

              {/* Step 4 */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between space-y-2 hover:border-blue-300 transition-all">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 mb-1">Step 4</div>
                  <h4 className="font-bold text-xs text-slate-900">Memory Store</h4>
                  <p className="text-[11px] text-slate-500 mt-1">PostgreSQL tables + 384-d ChromaDB Dense Vector Store.</p>
                </div>
                <span className="text-[10px] font-semibold text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-200 w-fit">
                  Dual Persistence
                </span>
              </div>

              {/* Step 5 */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex flex-col justify-between space-y-2">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-blue-700 mb-1">Step 5</div>
                  <h4 className="font-bold text-xs text-blue-950">Context Payload</h4>
                  <p className="text-[11px] text-blue-800 mt-1">Sends packed context to Response Agent ➔ Qwen 2.5 3B.</p>
                </div>
                <span className="text-[10px] font-bold text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-200 w-fit">
                  Agent 1 Target
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Context Playground */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm">
                <Cpu className="w-4 h-4 text-blue-600" />
                <span>Test Smart Context Retrieval Pipeline</span>
              </div>
              <span className="text-xs text-slate-500">Simulate Memory Agent (Agent 3) Execution</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={testQuery}
                onChange={(e) => setTestQuery(e.target.value)}
                placeholder="Enter sample user query to test Memory Agent context assembly..."
                className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleRunSmartContextTest}
                disabled={testingContext}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center space-x-2 disabled:opacity-50"
              >
                {testingContext ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>Execute Memory Pipeline</span>
              </button>
            </div>

            {/* Test Result Inspector */}
            {testResult && (
              <div className="mt-4 p-4 bg-slate-900 text-slate-100 rounded-xl space-y-3 text-xs font-mono">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-emerald-400 font-bold">✓ Context Retrieval Success ({testResult.retrieval_time_ms} ms)</span>
                  <span className="text-slate-400">Context Accuracy: {testResult.context_accuracy}%</span>
                </div>

                {testResult.follow_up_detected && (
                  <div className="p-2.5 bg-indigo-950/80 border border-indigo-800 rounded-lg text-indigo-200">
                    <strong>Coreference Resolution:</strong> {testResult.contextual_reference}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                  <div className="bg-slate-800 p-3 rounded-lg space-y-1">
                    <span className="text-blue-400 font-bold block">User Preferences Context:</span>
                    <p>Role: {testResult.user_preferences?.role}</p>
                    <p>Department: {testResult.user_preferences?.department}</p>
                    <p>Tone: {testResult.user_preferences?.preferred_tone}</p>
                    <p>Language: {testResult.user_preferences?.language}</p>
                  </div>

                  <div className="bg-slate-800 p-3 rounded-lg space-y-1">
                    <span className="text-purple-400 font-bold block">Top Ranked Enterprise Memory:</span>
                    {testResult.top_enterprise_decisions?.slice(0, 2).map((d, i) => (
                      <p key={i}>
                        • [{d.priority}] {d.title} (Score: {d.relevance_score})
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: PINNED MEMORY */}
      {activeTab === 'pinned' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
              <Pin className="w-4 h-4 text-rose-600" />
              <span>Pinned Enterprise & Priority Memories</span>
            </h3>
            <span className="text-xs text-slate-500">Always prioritized during AI response generation</span>
          </div>

          {pinnedDecisions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pinnedDecisions.map((item) => (
                <div key={item.id} className="bg-white border border-rose-200/80 rounded-2xl p-5 shadow-xs space-y-3 text-left relative">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-md">
                        {item.department}
                      </span>
                      <h4 className="font-bold text-slate-900 text-sm mt-1.5">{item.title}</h4>
                    </div>
                    <button
                      onClick={() => handleTogglePin(item.id)}
                      className="text-rose-600 hover:text-slate-400 p-1.5 rounded-lg hover:bg-rose-50 cursor-pointer"
                      title="Unpin Memory"
                    >
                      <Pin className="w-4 h-4 fill-current" />
                    </button>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed font-medium bg-slate-50 p-3 rounded-xl border border-slate-100">
                    {item.decision}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                    <span>Owner: {item.owner}</span>
                    <span>{item.decision_date}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500">
              <Pin className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="font-semibold text-slate-700">No pinned memories found.</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CONVERSATION MEMORY & TIMELINE */}
      {activeTab === 'conversations' && (
        <div className="space-y-6">
          {/* Timeline Filter Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>Conversation Session Memory Timeline</span>
            </div>

            <div className="flex items-center space-x-2">
              {['all', 'today', 'this week', 'this month'].map((t) => (
                <button
                  key={t}
                  onClick={() => setSelectedConvTimeline(t)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize cursor-pointer transition-all ${
                    selectedConvTimeline === t
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Conversation Cards List */}
          <div className="space-y-4">
            {conversations.length > 0 ? (
              conversations.map((conv) => (
                <div key={conv.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3 text-left">
                  <div className="flex items-center justify-between text-xs border-b border-slate-100 pb-2">
                    <span className="font-semibold text-blue-600 flex items-center space-x-1.5">
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Session ID: {conv.session_id}</span>
                    </span>
                    <span className="text-slate-400 font-medium">{conv.timestamp}</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                      <strong className="text-slate-900 block mb-1">User Question:</strong>
                      <p className="text-slate-800">{conv.query}</p>
                    </div>

                    <div className="bg-blue-50/40 p-3 rounded-xl border border-blue-100/80">
                      <strong className="text-blue-950 block mb-1">AI Response Summary:</strong>
                      <p className="text-slate-700 leading-relaxed">{conv.response}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500">
                <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="font-semibold text-slate-700">No conversation memories stored yet.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: ENTERPRISE DECISION MEMORY */}
      {activeTab === 'decisions' && (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={decisionSearch}
                onChange={(e) => setDecisionSearch(e.target.value)}
                placeholder="Search enterprise decisions..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <select
                value={decisionFilterDept}
                onChange={(e) => setDecisionFilterDept(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Departments</option>
                <option value="Engineering & Product">Engineering & Product</option>
                <option value="HR & Governance">HR & Governance</option>
                <option value="Finance & Legal">Finance & Legal</option>
                <option value="Sales & Marketing">Sales & Marketing</option>
              </select>
            </div>

            <div>
              <select
                value={decisionFilterPriority}
                onChange={(e) => setDecisionFilterPriority(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Priorities</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
              </select>
            </div>
          </div>

          {/* Decisions List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {decisions.map((item) => (
              <div key={item.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3 text-left">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-md">
                        {item.department}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                          item.priority === 'Critical'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {item.priority}
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm">{item.title}</h4>
                  </div>

                  <button
                    onClick={() => handleTogglePin(item.id)}
                    className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
                      item.is_pinned ? 'text-rose-600 bg-rose-50' : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <Pin className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                    <strong className="text-slate-900 block mb-0.5">Decision:</strong>
                    <p className="text-slate-800">{item.decision}</p>
                  </div>

                  <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-100">
                    <strong className="text-slate-700 block mb-0.5">Reason:</strong>
                    <p className="text-slate-600">{item.reason}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                  <span>Owner: {item.owner}</span>
                  <span>Date: {item.decision_date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: USER MEMORY & PREFERENCES */}
      {activeTab === 'user-memory' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6 text-left w-full">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">User Context & Persona Memory</h3>
              <p className="text-xs text-slate-500">Configure your department, role, language, and AI response tone preferences.</p>
            </div>
            <UserCheck className="w-6 h-6 text-blue-600" />
          </div>

          {prefNotice && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{prefNotice}</span>
            </div>
          )}

          <form onSubmit={handleUpdatePreferences} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Department</label>
                <input
                  type="text"
                  value={preferences.department}
                  onChange={(e) => setPreferences({ ...preferences, department: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Role</label>
                <input
                  type="text"
                  value={preferences.role}
                  onChange={(e) => setPreferences({ ...preferences, role: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Preferred Language</label>
                <select
                  value={preferences.language}
                  onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                >
                  <option value="English">English</option>
                  <option value="Spanish">Spanish</option>
                  <option value="French">French</option>
                  <option value="German">German</option>
                  <option value="Japanese">Japanese</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Preferred Response Tone</label>
                <select
                  value={preferences.preferred_tone}
                  onChange={(e) => setPreferences({ ...preferences, preferred_tone: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                >
                  <option value="Professional">Professional (Standard)</option>
                  <option value="Technical">Technical & Concise</option>
                  <option value="Detailed">Executive Summary</option>
                  <option value="Casual">Casual & Conversational</option>
                </select>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={savingPrefs}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-xs transition-all cursor-pointer flex items-center space-x-2 disabled:opacity-50"
              >
                {savingPrefs ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>Save Memory Preferences</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 6: MEMORY ANALYTICS */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 text-left">
              <h4 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                <BarChart2 className="w-4 h-4 text-blue-600" />
                <span>Frequently Referenced Enterprise Memory</span>
              </h4>
              <div className="space-y-2 text-xs">
                {['Shift to Qwen 2.5 3B Local Ollama LLM Stack', 'Multi-Agent Systems Architecture Standard', 'Enterprise Hybrid Work Policy 2026'].map(
                  (title, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="font-medium text-slate-800">{title}</span>
                      <span className="font-bold text-blue-600 text-xs">{89 - idx * 24} views</span>
                    </div>
                  )
                )}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 text-left">
              <h4 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                <Activity className="w-4 h-4 text-emerald-600" />
                <span>Memory Retrieval Latency Benchmark</span>
              </h4>
              <div className="p-4 bg-slate-900 text-slate-100 rounded-xl space-y-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span>Context Vector Retrieval:</span>
                  <span className="text-emerald-400 font-bold">4.2 ms</span>
                </div>
                <div className="flex justify-between">
                  <span>PostgreSQL Decision Lookup:</span>
                  <span className="text-emerald-400 font-bold">5.8 ms</span>
                </div>
                <div className="flex justify-between">
                  <span>Memory Ranking Algorithm:</span>
                  <span className="text-emerald-400 font-bold">4.2 ms</span>
                </div>
                <div className="border-t border-slate-800 pt-2 flex justify-between font-bold text-blue-400">
                  <span>Total Agent 3 Overhead:</span>
                  <span>14.2 ms</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Log Enterprise Decision Modal */}
      {isDecisionModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-xl w-full space-y-5 shadow-2xl text-left my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
                <PlusCircle className="w-4 h-4 text-blue-600" />
                <span>Log Enterprise Decision Memory</span>
              </h3>
              <button
                onClick={() => setIsDecisionModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 font-bold p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateDecision} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Decision Title *</label>
                <input
                  type="text"
                  required
                  value={newDecisionTitle}
                  onChange={(e) => setNewDecisionTitle(e.target.value)}
                  placeholder="e.g. Adopt Local Ollama Qwen 2.5 3B"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Department</label>
                  <select
                    value={newDecisionDept}
                    onChange={(e) => setNewDecisionDept(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Engineering & Product">Engineering & Product</option>
                    <option value="HR & Governance">HR & Governance</option>
                    <option value="Finance & Legal">Finance & Legal</option>
                    <option value="Sales & Marketing">Sales & Marketing</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Priority</label>
                  <select
                    value={newDecisionPriority}
                    onChange={(e) => setNewDecisionPriority(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Decision *</label>
                <textarea
                  rows={2}
                  required
                  value={newDecisionText}
                  onChange={(e) => setNewDecisionText(e.target.value)}
                  placeholder="State the decision clearly..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Reason *</label>
                <textarea
                  rows={2}
                  required
                  value={newDecisionReason}
                  onChange={(e) => setNewDecisionReason(e.target.value)}
                  placeholder="Business or technical rationale..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDecisionModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingDecision}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-xs transition-all cursor-pointer flex items-center space-x-1.5 disabled:opacity-50"
                >
                  {submittingDecision ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Database className="w-3.5 h-3.5" />}
                  <span>Save Decision Memory</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
