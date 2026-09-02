import React, { useState, useEffect, useRef } from 'react';
import { Search, Bell, Building2, ChevronDown, User, ShieldCheck } from 'lucide-react';

export default function TopNavbar({ activeWorkspace, setActiveWorkspace }) {
  const [profile, setProfile] = useState({
    name: 'Akash M',
    role: 'Product Manager'
  });
  
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef(null);

  const loadProfile = () => {
    try {
      const saved = localStorage.getItem('cogniva_employee_profile');
      if (saved) {
        setProfile(JSON.parse(saved));
      }
    } catch (e) {}
  };

  const fetchNotifications = async () => {
    try {
      const saved = localStorage.getItem('cogniva_employee_profile');
      let userId = "EMP-2026-8942";
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.employeeId) userId = parsed.employeeId;
      }
      
      const res = await fetch(`http://localhost:8000/notifications?user_id=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (e) {
      console.error("Failed to load notifications", e);
    }
  };

  useEffect(() => {
    loadProfile();
    fetchNotifications();
    window.addEventListener('profileUpdated', loadProfile);
    
    // Polling internally
    const interval = setInterval(fetchNotifications, 10000);
    
    // Handle click outside
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    
    return () => {
      window.removeEventListener('profileUpdated', loadProfile);
      clearInterval(interval);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const markAsRead = async (id) => {
    try {
      await fetch(`http://localhost:8000/notifications/${id}/read`, { method: 'POST' });
      // update state optimistically
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (e) {}
  };

  const getInitials = (name) => {
    if (!name) return 'EM';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Left space */}
      <div></div>

      {/* Right: Workspace Controls, Notifications & Profile */}
      <div className="flex items-center space-x-5">


        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
          >
            <Bell className="w-5 h-5" />
            {notifications.some(n => !n.is_read) && (
               <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full ring-2 ring-white"></span>
            )}
          </button>
          
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="font-bold text-slate-800">Notifications</h3>
                <span className="text-xs font-semibold bg-indigo-100 text-indigo-700 px-2 py-1 rounded-md">{notifications.filter(n => !n.is_read).length} new</span>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-slate-500 text-sm">No notifications yet</div>
                ) : (
                  notifications.map(n => (
                    <div 
                      key={n.id} 
                      onClick={() => markAsRead(n.id)}
                      className={`p-4 border-b border-slate-50 transition-colors cursor-pointer hover:bg-slate-50 ${!n.is_read ? 'bg-blue-50/50' : ''}`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-semibold text-sm text-slate-800">{n.title}</span>
                        {!n.is_read && <span className="w-2 h-2 bg-blue-600 rounded-full mt-1"></span>}
                      </div>
                      <p className="text-xs text-slate-600 whitespace-pre-line">{n.message}</p>
                      <span className="text-[10px] text-slate-400 block mt-2">{new Date(n.created_at).toLocaleString()}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Vertical Divider */}
        <div className="h-6 w-px bg-slate-200"></div>

        {/* User Profile */}
        <div className="flex items-center space-x-3 cursor-pointer group select-none">
          <div className="w-10 h-10 rounded-md bg-indigo-600 text-white flex items-center justify-center font-extrabold text-sm shadow-md overflow-hidden shrink-0 group-hover:bg-indigo-700 transition-all">
            {profile.profilePicture ? (
              <img src={profile.profilePicture} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              getInitials(profile.name)
            )}
          </div>
          <div className="hidden sm:block text-left ml-1">
            <div className="text-[13px] font-black tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">{profile.name}</div>
            <div className="text-[11px] font-bold text-slate-500">
              {profile.role || 'Employee'}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
