import React, { useState, useEffect } from 'react';
import { 
  Users, Key, Send, CheckCircle2, AlertTriangle, ShieldCheck, 
  UserPlus, BarChart2, User, Mail, Lock, PlusCircle, Activity, 
  Clock, FileText, ArrowRight, ShieldAlert, Eye, EyeOff 
} from 'lucide-react';
import api, { adminAPI } from '../../services/api';

export default function OrgManagement({ activeModule }) {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const currentUser = JSON.parse(localStorage.getItem('cogniva_user') || '{}');
  const userOrgId = currentUser?.org_id || 1;
  const isCognivaAdmin = currentUser?.user_type === 'cogniva_admin';

  // Employee Creation
  const [empForm, setEmpForm] = useState({
    full_name: '', email: '', password: '', department: '', role: '', org_id: userOrgId
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showCredPasswords, setShowCredPasswords] = useState({});
  const [recentCredentials, setRecentCredentials] = useState([]);
  const [empNotice, setEmpNotice] = useState('');

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    const data = await adminAPI.getEmployees(isCognivaAdmin ? null : userOrgId);
    setEmployees(data || []);
    setLoading(false);
  };

  const handleRevokeAccess = async (empId, empName) => {
    if (window.confirm(`Are you sure you want to revoke access for ${empName}? This action cannot be undone.`)) {
      setEmployees(employees.filter(emp => emp.id !== empId));
      await adminAPI.deleteEmployee(empId);
    }
  };
  
  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    if (!empForm.password || empForm.password.length < 8) {
      setEmpNotice('Security Error: Password must be at least 8 characters long.');
      setTimeout(() => setEmpNotice(''), 4000);
      return;
    }

    try {
      const res = await api.post('/auth/register/employee', {
        ...empForm,
        org_id: userOrgId
      });
      if (res.data.success) {
        setEmpNotice(res.data.message);
        
        // Add to secure delivery log for the admin to copy
        setRecentCredentials(prev => [{
          name: empForm.full_name,
          email: empForm.email,
          password: empForm.password,
          time: new Date().toLocaleTimeString()
        }, ...prev]);

        fetchEmployees();
        setEmpForm({ full_name: '', email: '', password: '', department: '', role: '', org_id: userOrgId });
      } else {
        setEmpNotice(`Error: ${res.data.message}`);
      }
      setTimeout(() => setEmpNotice(''), 4000);
    } catch {
       setEmpNotice('Failed to create employee credentials');
    }
  };

  return (
    <div className="w-full p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 select-none text-left font-sans max-w-full overflow-x-hidden">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 pb-4 border-b border-slate-200/80">
        <div className="flex items-center space-x-3 sm:space-x-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-sm shrink-0">
            <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                {isCognivaAdmin ? 'Master System Admin Panel' : 'Organization Admin Panel'}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                Workspace Control
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
              Manage employee credentials, access approvals, and monitor system telemetry.
            </p>
          </div>
        </div>
      </div>

      <div className="animate-in fade-in duration-300">
        
        {/* MODULE 1: PROVISIONING */}
        {activeModule === 'provisioning' && (
          <div className="max-w-2xl bg-white border border-slate-200 rounded-3xl p-4 sm:p-8 shadow-sm">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center border border-blue-100">
                <UserPlus className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Create Employee Credentials</h2>
                <p className="text-xs text-slate-500 font-medium">Generate secure access for a new organizational member.</p>
              </div>
            </div>

            {empNotice && (
              <div className={`mb-6 p-4 border rounded-xl flex items-center space-x-2 text-sm font-bold ${empNotice.includes('Error') ? 'bg-rose-50 text-rose-800 border-rose-200' : 'bg-blue-50 text-blue-800 border-blue-200'}`}>
                {empNotice.includes('Error') ? <AlertTriangle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
                <span>{empNotice}</span>
              </div>
            )}

            {recentCredentials.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 shadow-inner">
                 <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wider mb-2">Secure Credential Delivery Log</h3>
                 <p className="text-[10px] text-amber-700 mb-3">Copy these raw passwords now. They are irreversibly hashed and will vanish on refresh.</p>
                 <div className="space-y-2">
                   {recentCredentials.map((cred, idx) => (
                     <div key={idx} className="flex justify-between items-center bg-white border border-amber-100 px-3 py-2 rounded-lg shadow-xs text-xs font-mono">
                       <div className="flex space-x-4">
                          <span className="font-bold text-slate-900">{cred.name}</span>
                       </div>
                       <div className="flex items-center space-x-2">
                         <span className="text-[10px] font-sans text-slate-400 font-bold">PASSWORD:</span>
                         <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-bold tracking-wider">
                           {showCredPasswords[idx] ? cred.password : '••••••••••••'}
                         </span>
                         <button
                           type="button"
                           onClick={() => setShowCredPasswords(prev => ({ ...prev, [idx]: !prev[idx] }))}
                           className="text-amber-700 hover:text-amber-900 cursor-pointer p-1"
                           title={showCredPasswords[idx] ? "Hide password" : "Show password"}
                         >
                           {showCredPasswords[idx] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                         </button>
                       </div>
                     </div>
                   ))}
                 </div>
              </div>
            )}

            <form onSubmit={handleCreateEmployee} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Employee Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <User className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      type="text" required
                      value={empForm.full_name} onChange={(e) => setEmpForm({...empForm, full_name: e.target.value})}
                      className="block w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-inner"
                      placeholder="e.g. John Doe"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Work Email</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Mail className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      type="email" required
                      value={empForm.email} onChange={(e) => setEmpForm({...empForm, email: e.target.value})}
                      className="block w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-inner"
                      placeholder="john@organisation.com"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Temporary Password <span className="text-slate-400 normal-case">(min 8 characters)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={8}
                    value={empForm.password}
                    onChange={(e) => setEmpForm({...empForm, password: e.target.value})}
                    className="block w-full pl-10 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-inner"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Department</label>
                  <input
                    type="text" required
                    value={empForm.department} onChange={(e) => setEmpForm({...empForm, department: e.target.value})}
                    className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner"
                    placeholder="Engineering"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Role</label>
                  <input
                    type="text" required
                    value={empForm.role} onChange={(e) => setEmpForm({...empForm, role: e.target.value})}
                    className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner"
                    placeholder="Analyst"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full flex justify-center items-center py-3.5 px-4 bg-blue-600 hover:bg-blue-700 rounded-xl text-sm font-bold text-white transition-all cursor-pointer shadow-lg shadow-blue-500/30"
                >
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Generate & Approve Credentials
                </button>
              </div>
            </form>
          </div>
        )}

        {/* MODULE 2: DIRECTORY & ACCESS */}
        {activeModule === 'directory' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-8 shadow-sm">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center border border-blue-100 shrink-0">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900">{isCognivaAdmin ? 'Organization Admins Directory' : 'Employee Directory & Approvals'}</h2>
                <p className="text-xs text-slate-500 font-medium">Review credentials and active approvals across the {isCognivaAdmin ? 'platform' : 'organization'}.</p>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200/80">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="p-4">Employee Name</th>
                    <th className="p-4">Assigned Credentials (Email)</th>
                    <th className="p-4">Role & Dept</th>
                    <th className="p-4">Approval Status</th>
                    <th className="p-4 text-right">Access Controls</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(isCognivaAdmin 
                    ? employees.filter(emp => emp.role === 'Organization Admin') 
                    : employees.filter(emp => emp.role !== 'Organization Admin' && emp.role !== 'Master System Admin')
                  ).map((emp) => (
                    <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 font-bold text-slate-900 flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700 font-bold text-xs shrink-0 uppercase">
                          {emp.full_name?.charAt(0) || 'U'}
                        </div>
                        <span>{emp.full_name}</span>
                      </td>
                      <td className="p-4 font-mono text-xs text-slate-600">{emp.email}</td>
                      <td className="p-4">
                         <div className="flex flex-col space-y-0.5">
                            <span className="font-bold text-slate-800 text-xs">{emp.role}</span>
                            <span className="text-[10px] text-slate-500">{emp.department}</span>
                         </div>
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Approved</span>
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button 
                          onClick={() => handleRevokeAccess(emp.id, emp.full_name)}
                          className="px-3 py-1.5 bg-white hover:bg-rose-50 hover:text-rose-600 border border-slate-200 text-slate-600 font-bold rounded-lg text-xs transition-colors cursor-pointer inline-flex items-center space-x-1.5 shadow-xs"
                        >
                          <ShieldAlert className="w-3.5 h-3.5" />
                          <span>Revoke Access</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {employees.length === 0 && !loading && (
                     <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-400 font-medium text-sm">
                           No employees have been provisioned yet.
                        </td>
                     </tr>
                  )}
                  {loading && (
                     <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-400 font-medium text-sm">
                           Loading enterprise registry...
                        </td>
                     </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MODULE 3: PERFORMANCE REPORTS */}
        {activeModule === 'performance' && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-8 shadow-sm">
              <div className="flex items-center justify-between mb-6 sm:mb-8">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center border border-blue-100 shrink-0">
                    <Activity className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900">Employee Performance Metrics</h2>
                    <p className="text-xs text-slate-500 font-medium">Aggregated query processing and system engagement reports based on active employees.</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(isCognivaAdmin 
                  ? employees.filter(emp => emp.role === 'Organization Admin') 
                  : employees.filter(emp => emp.role !== 'Organization Admin' && emp.role !== 'Master System Admin' && emp.user_type !== 'cogniva_admin')
                ).map((emp) => (
                  <div key={emp.id} className="bg-slate-50/50 hover:bg-white border border-slate-200 rounded-2xl p-6 transition-all shadow-2xs hover:shadow-lg hover:shadow-slate-200/50 cursor-default">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-slate-900 text-base">{emp.full_name}</h3>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">{emp.email}</p>
                      </div>
                      <span className="w-8 h-8 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700 font-bold text-[10px] uppercase">
                        {emp.full_name?.charAt(0) || 'U'}
                      </span>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-slate-100/80">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2 text-slate-500">
                          <FileText className="w-4 h-4" />
                          <span className="text-xs font-bold">Queries Processed</span>
                        </div>
                        <span className="text-sm font-black text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md">
                          {emp.queries_processed ?? 0}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2 text-slate-500">
                          <Clock className="w-4 h-4" />
                          <span className="text-xs font-bold">System Engagement</span>
                        </div>
                        <span className="text-xs font-bold text-slate-700">
                           {emp.system_engagement ?? 0}h
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2 text-slate-500">
                          <Activity className="w-4 h-4" />
                          <span className="text-xs font-bold">Last Active</span>
                        </div>
                        <span className="text-xs font-bold text-slate-700">
                          {emp.last_active ?? 'Never'}
                        </span>
                      </div>
                    </div>

                  </div>
                ))}
                
                {employees.length === 0 && (
                   <div className="col-span-1 md:col-span-2 lg:col-span-3 py-12 text-center border-2 border-dashed border-slate-200 rounded-2xl">
                      <Activity className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm font-bold text-slate-500">No active telemetry found.</p>
                      <p className="text-xs text-slate-400">Provision employees to begin tracking metrics.</p>
                   </div>
                )}
              </div>
            </div>
          </div>
        )}
        
      </div>
    </div>
  );
}
