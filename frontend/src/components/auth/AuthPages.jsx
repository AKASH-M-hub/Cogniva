import React, { useState, useEffect } from 'react';
import { Briefcase, Mail, Lock, ShieldCheck, Database, Key, User, Building, ArrowLeft, Brain, Hexagon, Zap, ArrowRight, Activity, PlusCircle } from 'lucide-react';
import api from '../../services/api';

function CognivaHexLogo({ lightText = false }) {
  return (
    <div className="flex items-center space-x-3.5 select-none justify-center mb-8">
      <div className="relative w-10 h-10 flex items-center justify-center shrink-0">
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xs">
          <polygon
            points="50,4 93,25 93,75 50,96 7,75 7,25"
            fill="#EEF2FF"
            stroke="#4F46E5"
            strokeWidth="6"
          />
        </svg>
        <Brain className="w-5 h-5 text-indigo-600 absolute stroke-[2.2]" />
      </div>
      <div className="text-left">
        <div className={`font-black text-xl tracking-tight leading-none ${lightText ? 'text-white' : 'text-slate-900'}`}>
          COGNIVA
        </div>
      </div>
    </div>
  );
}

export default function AuthPages({ onLoginSuccess, onBackToSaaS }) {
  const [view, setView] = useState('selection'); // 'selection', 'login', 'signup'
  const [activeRole, setActiveRole] = useState(null); // 'employee', 'org_admin', 'cogniva_admin'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Login State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState(''); 
  
  // Cogniva Admin Default credentials (No longer used, pulling from local storage like other roles)
  // const defaultCognivaAdmin = 'akash.m@cogniva.ai';
  // const defaultCognivaPass = 'hashed_password';

  // Restore local storage on initial role select if applicable
  useEffect(() => {
    if (view === 'login') {
      setLoginEmail(localStorage.getItem('cogniva_saved_email') || '');
      setLoginPassword(localStorage.getItem('cogniva_saved_pass') || '');
    }
  }, [view, activeRole]);
  
  // Signup State (Dynamic for Cogniva Admin vs Org Admin)
  const [signupForm, setSignupForm] = useState({
    org_name: '', industry: '', admin_name: '', admin_email: '', admin_password: ''
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/login', { email: loginEmail, password: loginPassword });
      if (res.data.success) {
        const userObj = res.data.user;
        
        if (activeRole && userObj.user_type !== activeRole) {
          setError(`Unauthorized access. Please use the correct portal for your account role.`);
          setLoading(false);
          return;
        }
        
        localStorage.setItem('cogniva_user', JSON.stringify(userObj));
        localStorage.setItem('cogniva_saved_email', loginEmail);
        localStorage.setItem('cogniva_saved_pass', loginPassword);
        onLoginSuccess(userObj);
      } else {
        setError(res.data.message || 'Invalid credentials');
      }
    } catch (err) {
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError(err.response?.data?.message || 'Server connection error. Ensure backend is running.');
      }
    }
    setLoading(false);
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      let res;
      if (activeRole === 'cogniva_admin') {
        const payload = {
          admin_name: signupForm.admin_name,
          admin_email: signupForm.admin_email,
          admin_password: signupForm.admin_password
        };
        res = await api.post('/auth/register/cogniva-admin', payload);
      } else {
        const payload = {
          ...signupForm
        };
        res = await api.post('/auth/register/organization', payload);
      }
      if (res.data.success) {
        const loginRes = await api.post('/auth/login', { email: signupForm.admin_email, password: signupForm.admin_password });
        if (loginRes.data.success) {
          localStorage.setItem('cogniva_user', JSON.stringify(loginRes.data.user));
          localStorage.setItem('cogniva_saved_email', signupForm.admin_email);
          localStorage.setItem('cogniva_saved_pass', signupForm.admin_password);
          onLoginSuccess(loginRes.data.user);
        }
      } else {
        setError(res.data.message || 'Failed to register');
      }
    } catch (err) {
       if (err.response?.data?.detail) {
         setError(err.response.data.detail);
       } else {
         setError(err.response?.data?.message || 'Registration error. Email might be in use.');
       }
    }
    setLoading(false);
  };

  const getRoleConfig = () => {
    switch (activeRole) {
      case 'employee':
        return {
          title: 'Employee Portal',
          subtitle: 'Access the Knowledge Hub and Agents',
          icon: User,
          color: 'from-blue-600 to-blue-700',
          ring: 'focus:ring-blue-500',
          button: 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/30'
        };
      case 'org_admin':
        return {
          title: 'Organization Admin',
          subtitle: 'Manage workspace, users, and analytics',
          icon: Building,
          color: 'from-blue-600 to-blue-700',
          ring: 'focus:ring-blue-500',
          button: 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/30'
        };
      case 'cogniva_admin':
        return {
          title: 'Master System Admin',
          subtitle: 'Cogniva platform & infrastructure control',
          icon: Database,
          color: 'from-blue-600 to-blue-700',
          ring: 'focus:ring-blue-500',
          button: 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/30'
        };
      default:
        return {};
    }
  };

  const renderSelection = () => (
    <div className="w-full max-w-5xl mx-auto space-y-12 relative z-10 animate-fade-in-up">
      <div className="flex justify-between items-center mb-8 relative md:static -top-6">
         <button 
           onClick={onBackToSaaS}
           className="flex items-center text-slate-500 hover:text-slate-800 transition-colors text-sm font-bold bg-white/50 px-4 py-2.5 rounded-full border border-slate-200/80 shadow-sm cursor-pointer mx-auto md:mx-0"
         >
           <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
         </button>
      </div>

      <CognivaHexLogo />
      
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
          Select Access Level
        </h1>
        <p className="text-slate-500 font-medium text-lg max-w-xl mx-auto">
          Choose your designated role to enter the most advanced enterprise intelligence platform.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        {/* Employee Card */}
        <button 
          onClick={() => { setActiveRole('employee'); setView('login'); setError(''); }}
          className="group relative bg-white/80 backdrop-blur-xl border border-slate-200/80 hover:border-blue-300 rounded-3xl p-8 text-left transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/10 overflow-hidden cursor-pointer shadow-xl shadow-slate-200/30"
        >
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <User className="w-24 h-24 text-blue-600" />
          </div>
          <div className="w-14 h-14 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <User className="w-7 h-7 text-blue-600" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-2">Employee</h3>
          <p className="text-sm text-slate-500 font-medium leading-relaxed">
            Access contextual knowledge, interact with AI agents, and boost daily productivity.
          </p>
          <div className="mt-8 flex items-center text-blue-600 font-bold text-sm">
            <span>Login to Workspace</span>
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1.5 transition-transform" />
          </div>
        </button>

        {/* Org Admin Card */}
        <button 
          onClick={() => { setActiveRole('org_admin'); setView('login'); setError(''); }}
          className="group relative bg-white/80 backdrop-blur-xl border border-slate-200/80 hover:border-blue-300 rounded-3xl p-8 text-left transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/10 overflow-hidden cursor-pointer shadow-xl shadow-slate-200/30"
        >
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <Building className="w-24 h-24 text-blue-600" />
          </div>
          <div className="w-14 h-14 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Building className="w-7 h-7 text-blue-600" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-2">Org Admin</h3>
          <p className="text-sm text-slate-500 font-medium leading-relaxed">
            Manage your organization's document hub, oversee analytics, and control user access.
          </p>
          <div className="mt-8 flex items-center text-blue-600 font-bold text-sm">
            <span>Admin Control Panel</span>
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1.5 transition-transform" />
          </div>
        </button>

        {/* Cogniva Admin Card */}
        <button 
          onClick={() => { setActiveRole('cogniva_admin'); setView('login'); setError(''); }}
          className="group relative bg-white/80 backdrop-blur-xl border border-slate-200/80 hover:border-blue-300 rounded-3xl p-8 text-left transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/10 overflow-hidden cursor-pointer shadow-xl shadow-slate-200/30"
        >
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <Database className="w-24 h-24 text-blue-600" />
          </div>
          <div className="w-14 h-14 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Database className="w-7 h-7 text-blue-600" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-2">Cogniva Admin</h3>
          <p className="text-sm text-slate-500 font-medium leading-relaxed">
            Global system management, infrastructure oversight, and multi-tenant telemetry.
          </p>
          <div className="mt-8 flex items-center text-blue-600 font-bold text-sm">
            <span>Master System Login</span>
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1.5 transition-transform" />
          </div>
        </button>
      </div>
    </div>
  );

  const renderLogin = () => {
    const config = getRoleConfig();
    const Icon = config.icon;

    return (
      <div className="w-full max-w-md mx-auto relative z-10 animate-fade-in-up">
        <button 
          onClick={() => { setView('selection'); setError(''); }}
          className="mb-6 flex items-center text-slate-500 hover:text-slate-800 transition-colors text-sm font-bold bg-white/50 px-4 py-2.5 rounded-full border border-slate-200/80 shadow-sm w-fit cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Selection
        </button>

        <div className="bg-white/95 backdrop-blur-2xl border border-slate-200/80 rounded-3xl p-8 shadow-2xl shadow-slate-200/60 relative overflow-hidden">
          {/* Subtle gradient background ribbon based on role */}
          <div className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r ${config.color}`} />
          <div className={`absolute -top-32 -right-32 w-64 h-64 bg-gradient-to-br ${config.color} opacity-[0.03] blur-[80px] rounded-full pointer-events-none`} />

          <div className="text-center mb-8">
            <div className={`w-16 h-16 mx-auto bg-slate-50 border border-slate-100 shadow-sm rounded-2xl flex items-center justify-center mb-4`}>
              <div className="relative w-10 h-10 flex items-center justify-center shrink-0">
                <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xs">
                  <polygon
                    points="50,4 93,25 93,75 50,96 7,75 7,25"
                    fill="#EEF2FF"
                    stroke="#4F46E5"
                    strokeWidth="6"
                  />
                </svg>
                <Brain className="w-5 h-5 text-indigo-600 absolute stroke-[2.2]" />
              </div>
            </div>
            <h2 className="text-2xl font-black text-slate-900">{config.title}</h2>
            <p className="text-sm text-slate-500 mt-1.5 font-medium">{config.subtitle}</p>
          </div>

          <form className="space-y-5" onSubmit={handleLogin}>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="email" required
                  value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)}
                  className={`block w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 ${config.ring} focus:border-transparent transition-all shadow-inner`}
                  placeholder={`Enter your ${activeRole === 'cogniva_admin' ? 'master' : 'work'} email`}
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  {activeRole === 'cogniva_admin' ? <Key className="h-4 w-4 text-slate-400" /> : <Lock className="h-4 w-4 text-slate-400" />}
                </div>
                <input
                  type="password" required
                  value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)}
                  className={`block w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 ${config.ring} focus:border-transparent transition-all shadow-inner`}
                  placeholder="Enter password"
                />
              </div>
            </div>

            {error && (
              <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 flex items-start space-x-2">
                <ShieldCheck className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                <p className="text-xs font-bold text-rose-600">{error}</p>
              </div>
            )}

            <button
              type="submit" disabled={loading}
              className={`w-full flex justify-center items-center py-3.5 px-4 rounded-xl text-sm font-bold text-white transition-all cursor-pointer shadow-lg active:scale-95 ${config.button}`}
            >
              {loading ? (
                <Activity className="w-5 h-5 animate-spin" />
              ) : (
                'Authenticate & Proceed'
              )}
            </button>
            
            {/* Admin Sign Up Option */}
            {(activeRole === 'cogniva_admin' || activeRole === 'org_admin') && (
              <div className="pt-4 border-t border-slate-100 mt-6 !mt-8">
                <div className="text-center text-xs text-slate-500 mb-3 font-medium">System provisioning & setup</div>
                <button
                  type="button" onClick={() => { setView('signup'); setError(''); }}
                  className="w-full flex items-center justify-center py-3 px-4 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 bg-white hover:bg-slate-50 transition-all shadow-sm cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4 mr-2 text-slate-400" /> {activeRole === 'cogniva_admin' ? 'Register Cogniva Admin' : 'Onboard New Organization'}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    );
  };

  const renderSignup = () => (
    <div className="w-full max-w-lg mx-auto relative z-10 animate-fade-in-up">
      <button 
        onClick={() => { setView('login'); setError(''); }}
        className="mb-8 flex items-center text-slate-500 hover:text-slate-800 transition-colors text-sm font-bold bg-white/50 px-4 py-2.5 rounded-full border border-slate-200/80 shadow-sm w-fit cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Admin Login
      </button>

      <div className="bg-white/95 backdrop-blur-2xl border border-slate-200/80 rounded-3xl p-8 shadow-2xl shadow-slate-200/60 relative overflow-hidden">
        <div className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 to-blue-700`} />
        
        <div className="text-center mb-8">
          <div className={`w-16 h-16 mx-auto bg-blue-50 border-blue-100 shadow-sm rounded-2xl flex items-center justify-center mb-4`}>
            {activeRole === 'cogniva_admin' ? <Zap className="w-8 h-8 text-blue-500" /> : <Building className="w-8 h-8 text-blue-500" />}
          </div>
          <h2 className="text-2xl font-black text-slate-900">{activeRole === 'cogniva_admin' ? 'Cogniva' : 'Onboard Organization'}</h2>
          <p className="text-sm text-slate-500 mt-1 font-medium">{activeRole === 'cogniva_admin' ? 'Register Master System Administrator.' : 'Provision a new enterprise tenant workspace.'}</p>
        </div>

        <form className="space-y-4" onSubmit={handleSignup}>
          
          {activeRole === 'org_admin' && (
            <>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Organization Name</label>
                <input type="text" required value={signupForm.org_name} onChange={(e) => setSignupForm({...signupForm, org_name: e.target.value})} className="block w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner" placeholder="Acme Corp" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Industry Area</label>
                <input type="text" required value={signupForm.industry} onChange={(e) => setSignupForm({...signupForm, industry: e.target.value})} className="block w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner" placeholder="Finance" />
              </div>
            </>
          )}

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Admin Full Name</label>
            <input type="text" required value={signupForm.admin_name} onChange={(e) => setSignupForm({...signupForm, admin_name: e.target.value})} className={`block w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner`} placeholder="John Doe" />
          </div>
          
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Admin Email</label>
            <input type="email" required value={signupForm.admin_email} onChange={(e) => setSignupForm({...signupForm, admin_email: e.target.value})} className={`block w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner`} placeholder={activeRole === 'cogniva_admin' ? 'master@cogniva.ai' : 'admin@acme.com'} />
          </div>
          
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Admin Password</label>
            <input type="password" required value={signupForm.admin_password} onChange={(e) => setSignupForm({...signupForm, admin_password: e.target.value})} className={`block w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner`} placeholder="••••••••" />
          </div>

          {error && <p className="text-xs font-bold text-rose-600 py-1">{error}</p>}

          <button
            type="submit" disabled={loading}
            className={`w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white transition-all cursor-pointer mt-4 shadow-blue-500/30 bg-blue-600 hover:bg-blue-700 focus:ring-blue-500`}
          >
            {loading ? <Activity className="w-5 h-5 animate-spin" /> : (activeRole === 'cogniva_admin' ? 'Register System Configuration' : 'Provision Enterprise Tenant')}
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans relative overflow-hidden">
      {/* Light Dynamic Background Elements for cohesion with SaaS page */}
      <div className="absolute inset-0 z-0">
         <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-200/40 rounded-full blur-[100px] pointer-events-none" />
         <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-200/40 rounded-full blur-[100px] pointer-events-none" />
         <div className="absolute top-[30%] left-[60%] w-[30%] h-[30%] bg-blue-100/40 rounded-full blur-[120px] pointer-events-none" />
      </div>

      <div className="w-full relative z-10 px-4">
        {view === 'selection' && renderSelection()}
        {view === 'login' && renderLogin()}
        {view === 'signup' && renderSignup()}
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.5s ease-out forwards;
        }
      `}} />
    </div>
  );
}
