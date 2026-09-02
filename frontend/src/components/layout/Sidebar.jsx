import {
  Search,
  MessageSquare,
  BookOpen,
  Brain,
  BarChart3,
  Settings,
  ShieldCheck,
  LogOut,
  UserPlus,
  Users,
  BarChart2
} from 'lucide-react';

export default function Sidebar({ activeWorkspace, setActiveWorkspace, sessionUser }) {
  // Determine if falling back to localStorage if sessionUser wasn't perfectly passed yet
  const user = sessionUser || JSON.parse(localStorage.getItem('cogniva_user') || '{}');
  const isOrgAdmin = user?.user_type === 'org_admin';
  const isCognivaAdmin = user?.user_type === 'cogniva_admin';
  const isEmployee = user?.user_type === 'employee';

  let adminNavItems = [];
  if (isCognivaAdmin) {
    adminNavItems = [
      { id: 'network', label: 'Global Network', icon: Users },
      { id: 'directory', label: 'Org Admin Directory', icon: Users }
    ];
  } else if (isOrgAdmin) {
    adminNavItems = [
      { id: 'provisioning', label: 'Provision Employees', icon: UserPlus },
      { id: 'directory', label: 'Access & Directory', icon: Users }
    ];
  }

  const employeeItems = [
    { id: 'knowledge-hub', label: 'Knowledge Hub', icon: BookOpen },
    { id: 'search-agent', label: 'Data Scout', icon: Search },
    { id: 'response-agent', label: 'Insight Desk', icon: MessageSquare },
    { id: 'analytics-agent', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  const userNavItems = (isOrgAdmin || isCognivaAdmin) ? adminNavItems : employeeItems.filter(item => {
    if (isEmployee && item.hideForEmployee) return false;
    return true;
  });

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

      <div className="p-4 border-t border-slate-200">
        <button
           onClick={() => {
             localStorage.removeItem('cogniva_user');
             window.location.reload();
           }}
           className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-slate-100 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-600 hover:text-rose-600 font-bold rounded-xl text-xs transition-all cursor-pointer"
        >
           <LogOut className="w-4 h-4" />
           <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
