import React, { useState, useEffect } from 'react';
import {
  User,
  CheckCircle2,
  Save,
  IdCard,
  Building,
  Briefcase,
  Mail,
  Lock,
  KeyRound,
  ShieldCheck,
  AlertTriangle,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Sparkles,
  Camera,
  Layers,
  FolderArchive,
  Building2,
  Check,
  ShieldAlert,
  Clock,
  ChevronRight
} from 'lucide-react';
import { adminAPI } from '../../services/api';

export default function SettingsWorkspace() {
  const currentUser = JSON.parse(localStorage.getItem('cogniva_user') || '{}');
  const userType = currentUser?.user_type || 'employee'; // 'employee', 'org_admin', 'cogniva_admin'

  const [activeTab, setActiveTab] = useState('all'); // 'all', 'profile', 'security', 'organization'

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
        name: 'Enterprise User',
        role: 'Enterprise Employee',
        department: 'General',
        employeeId: 'EMP-2026-0001',
        email: 'user@cogniva.ai',
        profilePicture: '',
      };
    }
  });

  const [savedNotice, setSavedNotice] = useState('');
  const [errorNotice, setErrorNotice] = useState('');
  const [forgotPasswordNotice, setForgotPasswordNotice] = useState('');
  const [isRequestingReset, setIsRequestingReset] = useState(false);

  // Secure Password Change State
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwordFields, setPasswordFields] = useState({
    newPassword: '',
    confirmPassword: ''
  });
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
      reader.onloadend = () => {
        setProfile((prev) => ({ ...prev, profilePicture: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setErrorNotice('');
    setSavedNotice('');

    // If changing password, validate
    if (showPasswordChange && passwordFields.newPassword) {
      if (passwordFields.newPassword.length < 8) {
        setErrorNotice('New password must be at least 8 characters long.');
        return;
      }
      if (passwordFields.newPassword !== passwordFields.confirmPassword) {
        setErrorNotice('New password and confirmation password do not match.');
        return;
      }
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

      // Update session user in localStorage
      if (currentUser) {
        currentUser.full_name = profile.name;
        currentUser.role = profile.role;
        currentUser.department = profile.department;
        currentUser.profilePicture = profile.profilePicture;
        localStorage.setItem('cogniva_user', JSON.stringify(currentUser));
      }

      window.dispatchEvent(new Event('profileUpdated'));
      setSavedNotice('Profile & security credentials updated successfully!');
      setShowPasswordChange(false);
      setPasswordFields({ newPassword: '', confirmPassword: '' });
      setTimeout(() => setSavedNotice(''), 4000);
    } catch (err) {
      console.error('Failed to save settings:', err);
      setErrorNotice(err.response?.data?.detail || 'Failed to update configurations.');
    }
  };

  const handleForgotPassword = async () => {
    setIsRequestingReset(true);
    setForgotPasswordNotice('');
    try {
      const res = await adminAPI.requestPasswordReset({
        user_id: currentUser?.id,
        email: currentUser?.email
      });
      if (res.success) {
        setForgotPasswordNotice(
          userType === 'employee'
            ? 'Password recovery request sent to your Organization Administrator! In case you forgot your password, your Admin can view your password in their Employee Directory using security code [ 34 ].'
            : 'Password recovery notification logged in master security register.'
        );
      } else {
        setErrorNotice(res.message || 'Unable to submit recovery request.');
      }
    } catch (err) {
      setErrorNotice('Failed to communicate with password recovery service.');
    } finally {
      setIsRequestingReset(false);
    }
  };

  // Hero gradient by user role matching employee page sections
  const heroGradient = 
    userType === 'cogniva_admin' 
      ? 'from-slate-900 via-indigo-950 to-rose-950' 
      : userType === 'org_admin' 
      ? 'from-purple-700 via-indigo-700 to-indigo-900' 
      : 'from-blue-600 via-indigo-600 to-violet-600';

  const roleBadgeColor = 
    userType === 'cogniva_admin' 
      ? 'bg-rose-500/20 text-rose-200 border-rose-300/30' 
      : userType === 'org_admin' 
      ? 'bg-purple-500/20 text-purple-200 border-purple-300/30' 
      : 'bg-white/20 text-white border-white/30';

  return (
    <div className="w-full p-4 sm:p-6 lg:p-8 space-y-6 select-none text-left font-sans text-slate-900 bg-[#F8F9FA] min-h-screen">
      <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-500">

        {/* ========================================================================= */}
        {/* HERO SECTION - DESIGNED LIKE THE EMPLOYEE PAGE SECTIONS (KNOWLEDGE HUB) */}
        {/* ========================================================================= */}
        <div className={`bg-gradient-to-r ${heroGradient} rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-indigo-100/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden`}>
          
          {/* Background Decorative Rings */}
          <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-white/5 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -left-10 -top-10 w-48 h-48 bg-indigo-400/10 rounded-full blur-2xl pointer-events-none" />

          {/* User Profile Header */}
          <div className="flex items-center space-x-4 sm:space-x-5 relative z-10">
            <div className="relative group shrink-0">
              <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-white/20 backdrop-blur-md text-white border-2 border-white/30 flex items-center justify-center shadow-lg font-black text-2xl overflow-hidden">
                {profile.profilePicture ? (
                  <img src={profile.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  getInitials(profile.name)
                )}
              </div>
              <label 
                className="absolute -bottom-1 -right-1 w-6 h-6 bg-white text-slate-800 rounded-full flex items-center justify-center shadow-md cursor-pointer hover:bg-slate-100 transition-colors"
                title="Change Avatar"
              >
                <Camera className="w-3.5 h-3.5 text-indigo-600" />
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageUpload} 
                  className="hidden" 
                />
              </label>
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white">
                  {profile.name}
                </h1>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border backdrop-blur-xs ${roleBadgeColor}`}>
                  {userType === 'cogniva_admin' ? 'Master System Admin' : userType === 'org_admin' ? 'Organization Admin' : 'Enterprise Employee'}
                </span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Active Session</span>
                </span>
              </div>
              <p className="text-xs sm:text-sm text-indigo-100 font-medium">
                {profile.role} • {profile.department} • <span className="font-mono">{profile.employeeId}</span>
              </p>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 relative z-10 w-full md:w-auto">

            <button
              onClick={handleSave}
              className="px-5 py-2.5 bg-white hover:bg-slate-50 text-indigo-900 font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center space-x-2 cursor-pointer shrink-0 hover:scale-102 active:scale-98"
            >
              <Save className="w-4 h-4 text-indigo-600" />
              <span>Save Changes</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* ALERTS & NOTICES */}
        {/* ========================================================================= */}
        {savedNotice && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-4 rounded-2xl text-sm font-bold flex items-center space-x-2.5 animate-in fade-in zoom-in-95 shadow-xs">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{savedNotice}</span>
          </div>
        )}

        {errorNotice && (
          <div className="bg-rose-50 border border-rose-200 text-rose-900 p-4 rounded-2xl text-sm font-bold flex items-center space-x-2.5 animate-in fade-in zoom-in-95 shadow-xs">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{errorNotice}</span>
          </div>
        )}

        {forgotPasswordNotice && (
          <div className="bg-amber-50 border border-amber-300 text-amber-950 p-4 rounded-2xl text-xs sm:text-sm font-bold flex items-start space-x-3 animate-in fade-in zoom-in-95 shadow-xs">
            <KeyRound className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-extrabold text-amber-900 block">Password Assistance Dispatched:</span>
              <span className="font-medium text-amber-800">{forgotPasswordNotice}</span>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* BASIC SETTINGS SECTIONS */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* SECTION 1: PROFILE & PERSONAL DETAILS */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-xs space-y-6">
            <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
              <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center border border-indigo-100 shrink-0">
                <User className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h2 className="font-extrabold text-base text-slate-900 uppercase tracking-wider">
                  Profile Details
                </h2>
                <p className="text-[11px] text-slate-500 font-medium">Manage your identity and personal information</p>
              </div>
            </div>

              <div className="space-y-4 text-sm font-sans">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="font-extrabold text-slate-700 block text-xs uppercase tracking-wider">
                    Full Legal Name
                  </label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all"
                    placeholder="Enter full name"
                  />
                </div>

                {/* Corporate Email - IMMUTABLE / DISABLED / CANNOT BE EDITED */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-extrabold text-slate-700 block text-xs uppercase tracking-wider">
                      Corporate Email Address
                    </label>
                    <span className="text-[10px] font-extrabold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md flex items-center space-x-1">
                      <Lock className="w-3 h-3 text-slate-400" />
                      <span>Locked • Non-Editable</span>
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="email"
                      value={profile.email}
                      disabled={true}
                      readOnly={true}
                      className="w-full p-3 pl-10 bg-slate-100/80 border border-slate-200 text-slate-500 rounded-xl font-bold cursor-not-allowed select-none font-mono text-xs"
                      title="Corporate email cannot be changed directly."
                    />
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Email address is tied to enterprise SSO / tenant identity and cannot be edited.
                  </p>
                </div>

                {/* Employee ID / Admin ID - IMMUTABLE / DISABLED / CANNOT BE EDITED */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-extrabold text-slate-700 block text-xs uppercase tracking-wider">
                      {userType === 'cogniva_admin' ? 'Master System ID' : userType === 'org_admin' ? 'Organization Admin ID' : 'Employee ID'}
                    </label>
                    <span className="text-[10px] font-extrabold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md flex items-center space-x-1">
                      <Lock className="w-3 h-3 text-slate-400" />
                      <span>Immutable System ID</span>
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      value={profile.employeeId}
                      disabled={true}
                      readOnly={true}
                      className="w-full p-3 pl-10 bg-slate-100/80 border border-slate-200 text-indigo-900/70 rounded-xl font-mono font-bold cursor-not-allowed select-none text-xs"
                      title="System ID is immutable and assigned by tenant directory."
                    />
                    <IdCard className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400" />
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Assigned identifier is permanent and cannot be modified.
                  </p>
                </div>

                {/* Role / Designation */}
                <div className="space-y-1.5">
                  <label className="font-extrabold text-slate-700 block text-xs uppercase tracking-wider">
                    Role / Position Title
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={profile.role}
                      onChange={(e) => setProfile({ ...profile, role: e.target.value })}
                      className="w-full p-3 pl-10 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all"
                      placeholder="Enter role title"
                    />
                    <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  </div>
                </div>

                {/* Department */}
                <div className="space-y-1.5">
                  <label className="font-extrabold text-slate-700 block text-xs uppercase tracking-wider">
                    Department
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={profile.department}
                      onChange={(e) => setProfile({ ...profile, department: e.target.value })}
                      className="w-full p-3 pl-10 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all"
                      placeholder="Enter department"
                    />
                    <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  </div>
                </div>

              </div>
            </div>

          {/* SECTION 2: SECURITY & PASSWORD */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-xs space-y-6 h-fit">
            <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
              <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center border border-emerald-100 shrink-0">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h2 className="font-extrabold text-base text-slate-900 uppercase tracking-wider">
                  Security & Password
                </h2>
                <p className="text-[11px] text-slate-500 font-medium">Manage your account security and credentials</p>
              </div>
            </div>

              <div className="space-y-5 text-sm font-sans">
                
                {/* MASKED / HASHED PASSWORD DISPLAY - NEVER SHOWN IN PLAINTEXT */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-extrabold text-slate-700 block text-xs uppercase tracking-wider">
                      Current Password State
                    </label>
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold rounded-md flex items-center space-x-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>Bcrypt 256-Bit Salted Hash</span>
                    </span>
                  </div>

                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <Lock className="w-4 h-4 text-indigo-600" />
                      <span className="font-mono text-sm tracking-widest text-slate-700 font-black select-none">
                        ••••••••••••••••••••
                      </span>
                    </div>
                    <span className="text-[10px] font-extrabold text-slate-400 bg-slate-200/60 px-2 py-0.5 rounded uppercase tracking-wider">
                      Hashed & Hidden
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Plaintext password is securely hashed and protected. It is never displayed on this page for enterprise compliance.
                  </p>
                </div>

                {/* FOR EMPLOYEE: FORGOT PASSWORD RECOVERY BUTTON & SECTION */}
                {userType === 'employee' && (
                  <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50/50 border border-amber-200 rounded-2xl space-y-3 shadow-2xs">
                    <div className="flex items-start space-x-2.5">
                      <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 border border-amber-200 mt-0.5">
                        <KeyRound className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-amber-950 uppercase tracking-wide">
                          Forgot Account Password?
                        </h4>
                        <p className="text-[11px] text-amber-800 font-medium mt-0.5 leading-relaxed">
                          If you forgot your password, click below to notify your Organization Administrator. Your Admin can securely view your password in the Employee Directory using Master Verification Code <strong className="font-mono bg-amber-100 px-1 py-0.2 rounded border border-amber-300 text-amber-900">[ 34 ]</strong>.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      disabled={isRequestingReset}
                      className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 hover:scale-101 active:scale-99"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>{isRequestingReset ? 'Sending Alert to Org Admin...' : 'Forgot Password? Request Admin Password Reveal'}</span>
                    </button>
                  </div>
                )}

                {/* FOR ORG ADMIN & COGNIVA ADMIN: INFO ON MASTER RECOVERY */}
                {userType !== 'employee' && (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                    <div className="flex items-start space-x-2.5">
                      <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide">
                          Administrator Security Protocol
                        </h4>
                        <p className="text-[11px] text-slate-600 font-medium mt-0.5 leading-relaxed">
                          {userType === 'org_admin' 
                            ? 'If you ever forget your password, the Cogniva Super Administrator can view your Organization Admin credentials in the Global Network console using Master Verification Code [ 34 ].'
                            : 'Master Cogniva Super Admin credentials have direct vault authority and are backed by Master Code [ 34 ].'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* CHANGE PASSWORD ACCORDION */}
                <div className="pt-2 border-t border-slate-100 space-y-3">
                  {!showPasswordChange ? (
                    <button
                      type="button"
                      onClick={() => setShowPasswordChange(true)}
                      className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-all flex items-center justify-center space-x-2 cursor-pointer"
                    >
                      <Lock className="w-3.5 h-3.5 text-slate-600" />
                      <span>Change Account Password</span>
                    </button>
                  ) : (
                    <div className="space-y-3 bg-slate-50 border border-slate-200 p-4 rounded-2xl animate-in fade-in">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Set New Password</span>
                        <button
                          type="button"
                          onClick={() => {
                            setShowPasswordChange(false);
                            setPasswordFields({ newPassword: '', confirmPassword: '' });
                          }}
                          className="text-[11px] font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-600">New Password (min. 8 characters)</label>
                        <div className="relative">
                          <input
                            type={showNewPassword ? 'text' : 'password'}
                            value={passwordFields.newPassword}
                            onChange={(e) => setPasswordFields({ ...passwordFields, newPassword: e.target.value })}
                            className="w-full p-2.5 pr-10 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                            placeholder="Enter new password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-600">Confirm New Password</label>
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          value={passwordFields.confirmPassword}
                          onChange={(e) => setPasswordFields({ ...passwordFields, confirmPassword: e.target.value })}
                          className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                          placeholder="Re-enter new password"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Security Compliance Note */}
                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center space-x-2 text-[11px] text-slate-500">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Protected by AES-256 multi-tenant isolation and strict RBAC policy.</span>
                </div>

              </div>
            </div>

        </div>

      </div>
    </div>
  );
}
