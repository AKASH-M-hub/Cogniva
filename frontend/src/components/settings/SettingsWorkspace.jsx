import React, { useState } from 'react';
import {
  User,
  Cpu,
  CheckCircle2,
  Save,
  MessageSquare,
  IdCard,
  Building,
  Briefcase,
  Mail,
  Image as ImageIcon
} from 'lucide-react';

export default function SettingsWorkspace() {
  const [profile, setProfile] = useState(() => {
    try {
      const savedUser = localStorage.getItem('cogniva_user');
      const currentUser = savedUser ? JSON.parse(savedUser) : null;
      const userKey = currentUser?.id ? `cogniva_profile_${currentUser.id}` : 'cogniva_employee_profile';
      const saved = localStorage.getItem(userKey);
      if (saved) return JSON.parse(saved);

      return {
        name: currentUser?.full_name || 'Enterprise User',
        role: currentUser?.role || (currentUser?.user_type === 'cogniva_admin' ? 'Master System Admin' : (currentUser?.user_type === 'org_admin' ? 'Organization Admin' : 'Enterprise Employee')),
        department: currentUser?.department || 'Engineering & Product',
        employeeId: currentUser?.id ? `EMP-2026-${String(currentUser.id).padStart(4, '0')}` : 'EMP-2026-0001',
        email: currentUser?.email || 'user@cogniva.ai',
        profilePicture: '',
      };
    } catch (e) {}
    return {
      name: 'Enterprise User',
      role: 'Enterprise Employee',
      department: 'Engineering & Product',
      employeeId: 'EMP-2026-0001',
      email: 'user@cogniva.ai',
      profilePicture: '',
    };
  });

  const [savedNotice, setSavedNotice] = useState(false);

  const getInitials = (name) => {
    if (!name) return 'EM';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile((prev) => ({ ...prev, profilePicture: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = (e) => {
    if (e) e.preventDefault();
    try {
      const savedUser = localStorage.getItem('cogniva_user');
      const currentUser = savedUser ? JSON.parse(savedUser) : null;
      const userKey = currentUser?.id ? `cogniva_profile_${currentUser.id}` : 'cogniva_employee_profile';
      localStorage.setItem(userKey, JSON.stringify(profile));

      // Also update currentUser in localStorage so role and full_name stay synced
      if (currentUser) {
        currentUser.full_name = profile.name;
        currentUser.role = profile.role;
        currentUser.department = profile.department;
        currentUser.profilePicture = profile.profilePicture;
        localStorage.setItem('cogniva_user', JSON.stringify(currentUser));
      }

      window.dispatchEvent(new Event('profileUpdated'));
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 3000);
    } catch (err) {
      console.error('Failed to save settings:', err);
    }
  };

  return (
    <div className="w-full p-6 lg:p-10 space-y-8 select-none text-left font-sans text-slate-900 bg-slate-50/50 min-h-full">
      <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg font-extrabold text-xl overflow-hidden shrink-0">
              {profile.profilePicture ? (
                <img src={profile.profilePicture} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                getInitials(profile.name)
              )}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-3xl font-black tracking-tight text-slate-900">{profile.name}</h1>
              </div>
              <p className="text-sm font-semibold text-slate-500 mt-1">
                {profile.role} • {profile.department} ({profile.employeeId})
              </p>
            </div>
          </div>
          <button
            onClick={handleSave}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center space-x-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save All Configurations</span>
          </button>
        </div>

        {savedNotice && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-4 rounded-xl text-sm font-bold flex items-center space-x-2 animate-in fade-in zoom-in-95">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>Profile settings saved successfully!</span>
          </div>
        )}

        {/* SETTINGS LAYOUT */}
        <div className="max-w-2xl">

          {/* EMPLOYEE PROFILE DETAILS */}
          <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-2xs space-y-6 h-fit">
            <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
              <User className="w-5 h-5 text-indigo-600" />
              <h2 className="font-extrabold text-base text-slate-900 uppercase tracking-wider">
                Employee Details Configuration
              </h2>
            </div>

            <div className="space-y-5 text-sm font-sans">
              <div className="space-y-2">
                <label className="font-extrabold text-slate-900 block text-xs uppercase text-slate-500 tracking-wider">
                  Full Name
                </label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all"
                  placeholder="Enter full name"
                />
              </div>

              <div className="space-y-2">
                <label className="font-extrabold text-slate-900 block text-xs uppercase text-slate-500 tracking-wider">
                  Corporate Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    className="w-full p-3.5 pl-11 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all"
                    placeholder="Enter corporate email"
                  />
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="font-extrabold text-slate-900 block text-xs uppercase text-slate-500 tracking-wider">
                  Role / Title
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={profile.role}
                    onChange={(e) => setProfile({ ...profile, role: e.target.value })}
                    className="w-full p-3.5 pl-11 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all"
                    placeholder="Enter role"
                  />
                  <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="font-extrabold text-slate-900 block text-xs uppercase text-slate-500 tracking-wider">
                  Department
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={profile.department}
                    onChange={(e) => setProfile({ ...profile, department: e.target.value })}
                    className="w-full p-3.5 pl-11 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all"
                    placeholder="Enter department"
                  />
                  <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <label className="font-extrabold text-slate-900 block text-xs uppercase text-slate-500 tracking-wider">
                  Employee ID
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={profile.employeeId}
                    onChange={(e) => setProfile({ ...profile, employeeId: e.target.value })}
                    className="w-full p-3.5 pl-11 bg-indigo-50/70 border border-indigo-200 rounded-xl font-mono font-bold text-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all"
                    placeholder="Enter employee ID"
                  />
                  <IdCard className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500" />
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <label className="font-extrabold text-slate-900 block text-xs uppercase text-slate-500 tracking-wider">
                  Profile Picture
                </label>
                <div className="relative hover:opacity-80 transition-opacity">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="w-full p-3.5 pl-11 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-500 flex items-center overflow-hidden">
                    <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <span className="truncate">
                      {profile.profilePicture ? 'Update Image...' : 'Click to select image file...'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
