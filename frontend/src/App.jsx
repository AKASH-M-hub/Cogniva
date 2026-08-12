import React, { useState } from 'react';
import Sidebar from './components/layout/Sidebar';
import TopNavbar from './components/layout/TopNavbar';
import SearchAgentWorkspace from './components/search/SearchAgentWorkspace';
import ResponseAgentWorkspace from './components/response/ResponseAgentWorkspace';
import KnowledgeHubWorkspace from './components/knowledge/KnowledgeHubWorkspace';
import DecisionAgentWorkspace from './components/decision/DecisionAgentWorkspace';
import OrchestratorWorkspace from './components/orchestrator/OrchestratorWorkspace';
import AnalyticsAgentWorkspace from './components/analytics/AnalyticsAgentWorkspace';
import DashboardWorkspace from './components/dashboard/DashboardWorkspace';
import AdminWorkspace from './components/admin/AdminWorkspace';
import SettingsWorkspace from './components/settings/SettingsWorkspace';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Cogniva Workspace Render Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-12 max-w-4xl mx-auto space-y-6 text-center">
          <div className="bg-white border border-rose-200 rounded-3xl p-8 shadow-sm space-y-4">
            <div className="w-12 h-12 bg-rose-50 border border-rose-200 text-rose-600 rounded-2xl flex items-center justify-center mx-auto text-xl font-bold">
              ⚠️
            </div>
            <h2 className="text-xl font-bold text-slate-900">Workspace Execution Notice</h2>
            <p className="text-sm text-slate-600">
              An unexpected display issue occurred while loading this workspace.
            </p>
            <div className="flex justify-center space-x-3 pt-2">
              <button
                onClick={() => {
                  this.setState({ hasError: false });
                  window.location.reload();
                }}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-all"
              >
                Reload Workspace
              </button>
              <button
                onClick={() => {
                  localStorage.setItem('cogniva_active_workspace', 'dashboard');
                  window.location.reload();
                }}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer transition-all"
              >
                Return to SaaS Landing Page
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  // On fresh website visit: default to SaaS Intro Landing Page ('dashboard')
  // On page refresh (F5): preserve the active workspace page user was viewing
  const [activeWorkspace, setActiveWorkspaceState] = useState(() => {
    const isReload = performance.getEntriesByType('navigation')?.[0]?.type === 'reload';
    const savedWorkspace = sessionStorage.getItem('cogniva_active_workspace');
    if (isReload && savedWorkspace) {
      return savedWorkspace;
    }
    return 'dashboard';
  });
  const [selectedSearchContext, setSelectedSearchContext] = useState(null);

  const setActiveWorkspace = (workspace) => {
    setActiveWorkspaceState(workspace);
    sessionStorage.setItem('cogniva_active_workspace', workspace);
  };

  const handleViewAIResponse = (searchContext) => {
    setSelectedSearchContext(searchContext);
    setActiveWorkspace('response-agent');
  };

  // If on the SaaS Intro Page ('dashboard'), display full-screen landing page layout without sidebar
  const isSaaSPage = activeWorkspace === 'dashboard' || activeWorkspace === 'saas-page';

  if (isSaaSPage) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] text-[#0F172A] font-sans antialiased">
        <ErrorBoundary key="saas-page">
          <DashboardWorkspace onProceed={(target = 'knowledge-hub') => setActiveWorkspace(target)} />
        </ErrorBoundary>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F8F9FA] text-[#0F172A] font-sans antialiased">
      {/* Sidebar Navigation - Visible in Enterprise Workspace */}
      <Sidebar activeWorkspace={activeWorkspace} setActiveWorkspace={setActiveWorkspace} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <TopNavbar activeWorkspace={activeWorkspace} setActiveWorkspace={setActiveWorkspace} />

        {/* Dynamic Workspace Container */}
        <main className="flex-1 bg-[#F8F9FA]">
          <ErrorBoundary key={activeWorkspace}>
            {activeWorkspace === 'ai-orchestrator' && (
              <OrchestratorWorkspace
                onNavigateToResponse={() => setActiveWorkspace('response-agent')}
                onNavigateToAgent={(agentId) => setActiveWorkspace(agentId)}
              />
            )}

            {activeWorkspace === 'search-agent' && (
              <SearchAgentWorkspace
                onViewAIResponse={handleViewAIResponse}
                onNavigateToKnowledge={() => setActiveWorkspace('knowledge-hub')}
              />
            )}

            {(activeWorkspace === 'response-agent' || activeWorkspace === 'ai-workspace') && (
              <ResponseAgentWorkspace selectedContext={selectedSearchContext} />
            )}

            {activeWorkspace === 'decision-agent' && (
              <DecisionAgentWorkspace onNavigateToResponse={() => setActiveWorkspace('response-agent')} />
            )}
            
            {(activeWorkspace === 'knowledge-hub' ||
              activeWorkspace === 'add-knowledge' ||
              activeWorkspace === 'documents') && (
              <KnowledgeHubWorkspace
                activeWorkspace={activeWorkspace}
                onNavigateToSearch={() => setActiveWorkspace('search-agent')}
                onNavigateToResponse={() => setActiveWorkspace('response-agent')}
              />
            )}

            {(activeWorkspace === 'analytics-agent' || activeWorkspace === 'analytics') && (
              <AnalyticsAgentWorkspace />
            )}

            {(activeWorkspace === 'admin' || activeWorkspace === 'admin-orchestrator') && (
              <AdminWorkspace onNavigateToKnowledge={() => setActiveWorkspace('knowledge-hub')} />
            )}

            {activeWorkspace === 'settings' && (
              <SettingsWorkspace />
            )}

            {/* Workspace fallback view for unhandled routes */}
            {!['dashboard', 'ai-orchestrator', 'search-agent', 'response-agent', 'ai-workspace', 'memory-vault', 'memory-agent', 'decision-agent', 'knowledge-hub', 'add-knowledge', 'documents', 'analytics', 'analytics-agent', 'admin', 'admin-orchestrator', 'settings'].includes(activeWorkspace) && (
              <div className="p-8 max-w-7xl mx-auto space-y-6 text-left">
                <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-xs">
                  <h1 className="text-2xl font-bold text-slate-900 capitalize">{activeWorkspace.replace('-', ' ')}</h1>
                  <p className="text-slate-500 text-sm mt-1">
                    Cogniva Enterprise Intelligence Platform • Select Knowledge Hub, Search Agent, or Response Agent from the sidebar.
                  </p>

                  <div className="mt-6 flex flex-wrap gap-4">
                    <button
                      onClick={() => setActiveWorkspace('knowledge-hub')}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-all cursor-pointer shadow-xs"
                    >
                      Open Knowledge Hub
                    </button>
                    <button
                      onClick={() => setActiveWorkspace('search-agent')}
                      className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200/70 border border-slate-200 text-slate-800 font-semibold rounded-xl text-sm transition-all cursor-pointer"
                    >
                      Open Search Agent
                    </button>
                  </div>
                </div>
              </div>
            )}
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}

export default App;
