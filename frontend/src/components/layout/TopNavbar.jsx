import React from 'react';
import { Search, Bell, Building2, ChevronDown, User, ShieldCheck } from 'lucide-react';

export default function TopNavbar({ activeWorkspace, setActiveWorkspace }) {
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Left space */}
      <div></div>

      {/* Right: Workspace Controls, Notifications & Profile */}
      <div className="flex items-center space-x-5">


        {/* Notifications */}
        <button className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full ring-2 ring-white"></span>
        </button>

        {/* Vertical Divider */}
        <div className="h-6 w-px bg-slate-200"></div>

        {/* User Profile */}
        <div className="flex items-center space-x-3 cursor-pointer group">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-semibold text-sm shadow-xs group-hover:bg-blue-700 transition-all">
            A
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-xs font-semibold text-slate-900 group-hover:text-blue-600 transition-all">Akash M</div>
            <div className="text-[11px] text-slate-500 font-normal">Product Manager</div>
          </div>
          <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-all" />
        </div>
      </div>
    </header>
  );
}
