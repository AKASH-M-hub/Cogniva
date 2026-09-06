import React from 'react';
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
  BarChart2,
  X
} from 'lucide-react';

export default function Sidebar({ 
  activeWorkspace, 
  setActiveWorkspace, 
  sessionUser, 
  mobileMenuOpen = false, 
  setMobileMenuOpen 
}) {
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

  return (
    <>
      {/* Mobile Drawer Backdrop Overlay */}
      {mobileMenuOpen && (
        <div 
          onClick={() => setMobileMenuOpen?.(false)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 md:hidden transition-opacity duration-300 animate-fadeIn"
          aria-hidden="true"
        />
      )}

      {/* Responsive Sidebar (Off-Canvas Drawer on Mobile, Sticky on Desktop) */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 flex flex-col justify-between h-full select-none text-left font-sans transition-transform duration-300 ease-in-out
        md:static md:translate-x-0 md:w-64 md:h-screen md:sticky md:top-0 md:z-40 shrink-0
        ${mobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Brand Header */}
        <div>
          <div className="h-20 px-6 flex items-center justify-between border-b border-slate-100">
            <div 
              onClick={() => {
                setActiveWorkspace('dashboard');
                setMobileMenuOpen?.(false);
              }}
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

            {/* Mobile Close Button */}
            <button
              onClick={() => setMobileMenuOpen?.(false)}
              className="md:hidden p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              title="Close navigation menu"
            >
              <X className="w-5 h-5" />
            </button>
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
                  onClick={() => {
                    setActiveWorkspace(item.id);
                    setMobileMenuOpen?.(false);
                  }}
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

        {/* Sign Out Button */}
        <div className="p-4 border-t border-slate-200">
          <button
             onClick={() => {
               localStorage.removeItem('cogniva_user');
               localStorage.removeItem('cogniva_token');
               window.location.reload();
             }}
             className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-slate-100 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-600 hover:text-rose-600 font-bold rounded-xl text-xs transition-all cursor-pointer"
          >
             <LogOut className="w-4 h-4" />
             <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
