import {
  Search,
  MessageSquare,
  BookOpen,
  Brain,
  BarChart3,
  Settings,
  ShieldCheck
} from 'lucide-react';

export default function Sidebar({ activeWorkspace, setActiveWorkspace }) {
  const userNavItems = [
    { id: 'knowledge-hub', label: 'Knowledge Hub', icon: BookOpen },
    { id: 'search-agent', label: 'Data Scout', icon: Search },
    { id: 'response-agent', label: 'Insight Desk', icon: MessageSquare },
    { id: 'analytics-agent', label: 'Analytics', icon: BarChart3 },
    { id: 'admin', label: 'Admin', icon: ShieldCheck },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const isAdminView = activeWorkspace === 'admin' || activeWorkspace === 'ai-orchestrator' || activeWorkspace === 'admin-orchestrator';

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between h-screen sticky top-0 z-40 select-none text-left font-sans">
      {/* Brand Header */}
      <div>
        <div className="h-20 px-6 flex items-center border-b border-slate-100">
          <div 
            onClick={() => setActiveWorkspace('dashboard')}
            className="flex items-center space-x-3 cursor-pointer group select-none"
          >
            <div className="relative w-9 h-9 flex items-center justify-center shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
                <polygon
                  points="50,4 93,25 93,75 50,96 7,75 7,25"
                  fill="#FFFFFF"
                  stroke="#6366F1"
                  strokeWidth="5"
                />
              </svg>
              <Brain className="w-5 h-5 text-indigo-600 absolute stroke-[2.2]" />
            </div>
            <div>
              <span className="font-black text-lg tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors block leading-none">COGNIVA</span>
            </div>
          </div>
        </div>

        {/* Navigation List */}
        <div className="px-3 py-4 space-y-1">
          <div className="px-3 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Enterprise Navigation
          </div>
          {userNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeWorkspace === item.id || (item.id === 'analytics-agent' && activeWorkspace === 'analytics');
            return (
              <button
                key={item.id}
                onClick={() => setActiveWorkspace(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-50 text-blue-600 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

    </aside>
  );
}
