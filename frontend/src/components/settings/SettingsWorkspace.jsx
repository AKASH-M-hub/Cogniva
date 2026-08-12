import React, { useState, useEffect } from 'react';
import {
  User,
  Cpu,
  CheckCircle2,
  Mail,
  Building,
  Save,
  Briefcase,
  IdCard
} from 'lucide-react';

export default function SettingsWorkspace() {
  // Load saved employee profile from localStorage if available
  const [profile, setProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('cogniva_employee_profile');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return {
      name: 'Akash M',
      role: 'Product Manager / Enterprise Analyst',
      department: 'Engineering & Product',
      employeeId: 'EMP-2026-8942',
      email: 'akash.m@cogniva.ai',
      location: 'HQ - Tech Innovation Hub'
    };
  });

  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('cogniva_ai_settings');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return {
      aiModel: 'qwen2.5:3b',
      targetPersona: 'executive_summary',
      tone: 'professional',
      autoSaveHistory: true,
      multilingual: true
    };
  });

  const [savedNotice, setSavedNotice] = useState(false);

  const handleSave = (e) => {
    if (e) e.preventDefault();
    try {
      localStorage.setItem('cogniva_employee_profile', JSON.stringify(profile));
      localStorage.setItem('cogniva_ai_settings', JSON.stringify(settings));
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 3000);
    } catch (err) {
      console.error('Failed to save settings:', err);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'EM';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  };

  return (
    <div className="w-full p-8 space-y-6 select-none text-left font-sans text-slate-900 max-w-6xl mx-auto">
      {/* HEADER BANNER */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-extrabold text-xl shadow-md shrink-0">
            {getInitials(profile.name)}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">{profile.name}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                Active Employee
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {profile.role} • {profile.department} ({profile.employeeId})
            </p>
          </div>
        </div>

        <button
          onClick={handleSave}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center space-x-2 cursor-pointer self-start md:self-auto"
        >
          <Save className="w-4 h-4" />
          <span>Save Preferences</span>
        </button>
      </div>

      {savedNotice && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-4 rounded-xl text-xs font-bold flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Employee profile details and AI settings updated and saved successfully!</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: EDITABLE EMPLOYEE PROFILE */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
              <User className="w-4 h-4 text-indigo-600" />
              <h2 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">
                Editable Employee Details
              </h2>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5 text-xs font-sans">
              <div>
                <label className="text-[10px] font-extrabold text-slate-400 uppercase block mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="w-full font-bold text-slate-900 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                  placeholder="Enter full name"
                />
              </div>

              <div>
                <label className="text-[10px] font-extrabold text-slate-400 uppercase block mb-1">
                  Corporate Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    className="w-full font-semibold text-slate-800 bg-slate-50 border border-slate-200 px-3 py-2 pr-9 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                    placeholder="Enter corporate email"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-extrabold text-slate-400 uppercase block mb-1">
                  Role / Title
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={profile.role}
                    onChange={(e) => setProfile({ ...profile, role: e.target.value })}
                    className="w-full font-semibold text-slate-800 bg-slate-50 border border-slate-200 px-3 py-2 pr-9 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                    placeholder="Enter employee role"
                  />
                  <Briefcase className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-extrabold text-slate-400 uppercase block mb-1">
                  Department
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={profile.department}
                    onChange={(e) => setProfile({ ...profile, department: e.target.value })}
                    className="w-full font-semibold text-slate-800 bg-slate-50 border border-slate-200 px-3 py-2 pr-9 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                    placeholder="Enter department"
                  />
                  <Building className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-extrabold text-slate-400 uppercase block mb-1">
                  Employee ID
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={profile.employeeId}
                    onChange={(e) => setProfile({ ...profile, employeeId: e.target.value })}
                    className="w-full font-mono font-bold text-indigo-700 bg-indigo-50/70 border border-indigo-200 px-3 py-2 pr-9 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    placeholder="Enter employee ID"
                  />
                  <IdCard className="w-4 h-4 text-indigo-500 absolute right-3 top-2.5 pointer-events-none" />
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* RIGHT TWO COLUMNS: AI SYSTEM PREFERENCES */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-6">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
              <Cpu className="w-4 h-4 text-indigo-600" />
              <h2 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">
                Cogniva AI Engine & Response Preferences
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs font-sans">
              {/* AI MODEL SELECTION */}
              <div className="space-y-2 sm:col-span-2">
                <label className="font-extrabold text-slate-900 block">
                  Active Response Model Engine
                </label>
                <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between font-bold text-indigo-900">
                    <span className="text-sm">Ollama Qwen 2.5 3B</span>
                    <span className="px-2.5 py-1 bg-indigo-600 text-white rounded-lg text-[10px] font-extrabold uppercase">
                      Local CPU / 8GB RAM Execution
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Optimized quantized LLM running 100% locally on your machine with 0 cloud data transfer and sub-second deterministic fallbacks.
                  </p>
                </div>
              </div>

              {/* RESPONSE PERSONA */}
              <div className="space-y-2">
                <label className="font-extrabold text-slate-900 block">
                  Default AI Response Style
                </label>
                <select
                  value={settings.targetPersona}
                  onChange={(e) => setSettings({ ...settings, targetPersona: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="executive_summary">Executive Summary & Key Takeaways</option>
                  <option value="detailed_technical">Detailed Technical Breakdown</option>
                  <option value="bulleted_list">Concise Bulleted Points</option>
                </select>
              </div>

              {/* TONE */}
              <div className="space-y-2">
                <label className="font-extrabold text-slate-900 block">
                  Response Tone
                </label>
                <select
                  value={settings.tone}
                  onChange={(e) => setSettings({ ...settings, tone: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="professional">Professional & Objective</option>
                  <option value="concise">Concise & Direct</option>
                  <option value="friendly">Friendly & Conversational</option>
                </select>
              </div>
            </div>

            {/* TOGGLE PREFERENCES */}
            <div className="border-t border-slate-100 pt-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 text-xs block">Automatic Conversation Memory</span>
                  <span className="text-[11px] text-slate-500 font-medium">Preserve multi-turn history across sessions</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.autoSaveHistory}
                  onChange={(e) => setSettings({ ...settings, autoSaveHistory: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 text-xs block">Multilingual Translation Support</span>
                  <span className="text-[11px] text-slate-500 font-medium">Enable on-the-fly translation in English, Tamil, Hindi, Spanish</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.multilingual}
                  onChange={(e) => setSettings({ ...settings, multilingual: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                onClick={handleSave}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>Save Settings</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
