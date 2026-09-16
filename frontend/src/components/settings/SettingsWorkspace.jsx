import React, { useState, useEffect } from 'react';
import {
  User, CheckCircle2, Save, IdCard, Building, Briefcase, Mail, Lock,
  KeyRound, ShieldCheck, AlertTriangle, Eye, EyeOff, Camera
} from 'lucide-react';
import { adminAPI } from '../../services/api';

export default function SettingsWorkspace() {
  const currentUser = JSON.parse(localStorage.getItem('cogniva_user') || '{}');
  const userType = currentUser?.user_type || 'employee';

  const [profile, setProfile] = useState(() => {
    try {
      const userKey = currentUser?.id ? `cogniva_profile_${currentUser.id}` : 'cogniva_employee_profile';
      const saved = localStorage.getItem(userKey);
      if (saved) return JSON.parse(saved);

      const defaultId = currentUser?.id 
        ? (userType === 'cogniva_admin' ? `COG-SYS-${String(currentUser.id).padStart(4, '0')}` : userType === 'org_admin' ? `ORG-ADM-${String(currentUser.id).padStart(4, '0')}` : `EMP-2026-${String(currentUser.id).padStart(4, '0')}`)
        : 'EMP-2026-0001';

      return {
        name: currentUser?.full_name || 'Enterprise User',
        role: currentUser?.role || (userType === 'cogniva_admin' ? 'Master System Admin' : userType === 'org_admin' ? 'Organization Admin' : 'Enterprise Employee'),
        department: currentUser?.department || 'General',
        employeeId: defaultId,
        email: currentUser?.email || 'user@cogniva.ai',
        profilePicture: currentUser?.profilePicture || '',
      };
    } catch (e) {
      return {
        name: 'Enterprise User', role: 'Enterprise Employee', department: 'General',
        employeeId: 'EMP-2026-0001', email: 'user@cogniva.ai', profilePicture: '',
      };
    }
  });

  const [savedNotice, setSavedNotice] = useState('');
  const [errorNotice, setErrorNotice] = useState('');
  const [forgotPasswordNotice, setForgotPasswordNotice] = useState('');
  const [isRequestingReset, setIsRequestingReset] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwordFields, setPasswordFields] = useState({ newPassword: '', confirmPassword: '' });
  const [showNewPassword, setShowNewPassword] = useState(false);

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
      reader.onloadend = () => setProfile((prev) => ({ ...prev, profilePicture: reader.result }));
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setErrorNotice(''); setSavedNotice('');

    if (showPasswordChange && passwordFields.newPassword) {
      if (passwordFields.newPassword.length < 8) return setErrorNotice('New password must be at least 8 characters long.');
      if (passwordFields.newPassword !== passwordFields.confirmPassword) return setErrorNotice('Passwords do not match.');
    }

    try {
      if (currentUser?.id) {
        await adminAPI.updateProfile({
          user_id: currentUser.id,
          full_name: profile.name,
          role: profile.role,
          department: profile.department,
          new_password: showPasswordChange && passwordFields.newPassword ? passwordFields.newPassword : null
        });
      }

      const userKey = currentUser?.id ? `cogniva_profile_${currentUser.id}` : 'cogniva_employee_profile';
      localStorage.setItem(userKey, JSON.stringify(profile));

      if (currentUser) {
        currentUser.full_name = profile.name;
        currentUser.role = profile.role;
        currentUser.department = profile.department;
        currentUser.profilePicture = profile.profilePicture;
        localStorage.setItem('cogniva_user', JSON.stringify(currentUser));
      }

      window.dispatchEvent(new Event('profileUpdated'));
      setSavedNotice('Settings updated successfully!');
      setShowPasswordChange(false);
      setPasswordFields({ newPassword: '', confirmPassword: '' });
      setTimeout(() => setSavedNotice(''), 4000);
    } catch (err) {
      setErrorNotice(err.response?.data?.detail || 'Failed to update configurations.');
    }
  };

  const handleForgotPassword = async () => {
    setIsRequestingReset(true);
    setForgotPasswordNotice('');
    try {
      const res = await adminAPI.requestPasswordReset({ user_id: currentUser?.id, email: currentUser?.email });
      if (res.success) {
        setForgotPasswordNotice(
          userType === 'employee'
            ? 'Request sent to Org Admin. They can view your password using code [ 34 ].'
            : 'Recovery notification logged securely.'
        );
      } else {
        setErrorNotice(res.message || 'Unable to submit recovery request.');
      }
    } catch (err) {
      setErrorNotice('Failed to communicate with service.');
    } finally {
      setIsRequestingReset(false);
    }
  };

  return (
    <div className="w-full p-4 sm:p-6 lg:p-8 flex justify-center items-start min-h-screen bg-[#F8F9FA] font-sans">
      <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-8 animate-in fade-in slide-in-from-bottom-3">
        
        {/* PROFILE HEADER & PICTURE */}
        <div className="flex flex-col items-center space-y-4">
          <div className="relative group shrink-0">
            <div className="w-24 h-24 rounded-full bg-indigo-50 text-indigo-600 border-4 border-white shadow-md flex items-center justify-center font-black text-3xl overflow-hidden">
              {profile.profilePicture ? (
                <img src={profile.profilePicture} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                getInitials(profile.name)
              )}
            </div>
            <label className="absolute bottom-0 right-0 w-8 h-8 bg-white text-slate-800 rounded-full flex items-center justify-center shadow-lg border border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors">
              <Camera className="w-4 h-4 text-indigo-600" />
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </label>
          </div>
          <div className="text-center">
            <h1 className="text-xl font-black text-slate-900">{profile.name}</h1>
            <p className="text-sm text-slate-500 font-medium">{profile.role}</p>
          </div>
        </div>

        {/* ALERTS */}
        {savedNotice && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-3 rounded-xl text-sm font-bold flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /><span>{savedNotice}</span>
          </div>
        )}
        {errorNotice && (
          <div className="bg-rose-50 border border-rose-200 text-rose-900 p-3 rounded-xl text-sm font-bold flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" /><span>{errorNotice}</span>
          </div>
        )}

        {/* BASIC FORM FIELDS */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 text-xs uppercase tracking-wider">Full Name</label>
              <input
                type="text" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 text-xs uppercase tracking-wider flex items-center gap-2">
                Email Address <Lock className="w-3 h-3 text-slate-400" />
              </label>
              <input
                type="email" value={profile.email} disabled className="w-full p-2.5 bg-slate-100 border border-slate-200 text-slate-500 rounded-xl font-bold cursor-not-allowed text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 text-xs uppercase tracking-wider flex items-center gap-2">
                System ID <Lock className="w-3 h-3 text-slate-400" />
              </label>
              <input
                type="text" value={profile.employeeId} disabled className="w-full p-2.5 bg-slate-100 border border-slate-200 text-slate-500 rounded-xl font-mono font-bold cursor-not-allowed text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 text-xs uppercase tracking-wider">Department</label>
              <input
                type="text" value={profile.department} onChange={(e) => setProfile({ ...profile, department: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>
        </div>

        <hr className="border-slate-100" />

        {/* SECURITY & PASSWORD */}
        <div className="space-y-4">
          <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" /> Account Security
          </h3>

          {forgotPasswordNotice && (
            <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3 rounded-xl text-xs font-bold">
              {forgotPasswordNotice}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setShowPasswordChange(!showPasswordChange)}
              className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" /> {showPasswordChange ? 'Cancel Password Change' : 'Change Password'}
            </button>

            {userType === 'employee' && (
              <button
                onClick={handleForgotPassword} disabled={isRequestingReset}
                className="flex-1 py-2.5 bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <KeyRound className="w-4 h-4" /> Forgot Password?
              </button>
            )}
          </div>

          {showPasswordChange && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 mt-3 animate-in fade-in">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'} value={passwordFields.newPassword}
                    onChange={(e) => setPasswordFields({ ...passwordFields, newPassword: e.target.value })}
                    className="w-full p-2.5 pr-10 bg-white border border-slate-200 rounded-lg text-sm font-bold outline-none"
                  />
                  <button onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Confirm Password</label>
                <input
                  type={showNewPassword ? 'text' : 'password'} value={passwordFields.confirmPassword}
                  onChange={(e) => setPasswordFields({ ...passwordFields, confirmPassword: e.target.value })}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm font-bold outline-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* SAVE BUTTON */}
        <button
          onClick={handleSave}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 mt-6"
        >
          <Save className="w-4 h-4" /> Save Changes
        </button>

      </div>
    </div>
  );
}
