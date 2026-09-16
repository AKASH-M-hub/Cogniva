import React, { useState, useEffect } from 'react';
import { 
  Network, 
  Building, 
  Activity, 
  BarChart3, 
  FileText, 
  Users, 
  Download, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  AlertCircle, 
  X, 
  Printer, 
  Database, 
  Sparkles, 
  Trash2, 
  Calendar, 
  TrendingUp, 
  Layers,
  Search,
  ExternalLink,
  KeyRound,
  Copy,
  Check
} from 'lucide-react';
import api, { adminAPI } from '../../services/api';

export default function CognivaNetwork() {
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [orgToRemove, setOrgToRemove] = useState(null);

  // Organization Report State
  const [selectedOrgForReport, setSelectedOrgForReport] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [activeReportTab, setActiveReportTab] = useState('overview'); // 'overview', 'staff', 'documents', 'gaps'
  const [staffSearchQuery, setStaffSearchQuery] = useState('');

  // Org Admin Password Reveal (Code: 34)
  const [orgAdminPassTarget, setOrgAdminPassTarget] = useState(null);
  const [orgAdminCodeInput, setOrgAdminCodeInput] = useState('');
  const [revealedOrgAdminPass, setRevealedOrgAdminPass] = useState(null);
  const [orgAdminPassError, setOrgAdminPassError] = useState('');
  const [orgAdminPassLoading, setOrgAdminPassLoading] = useState(false);
  const [copiedOrgPass, setCopiedOrgPass] = useState(false);

  useEffect(() => {
    fetchOrgs();
  }, []);

  const fetchOrgs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/admin/organizations');
      if (res.data) setOrgs(res.data);
    } catch {
      console.error("Failed to fetch organizations");
    }
    setLoading(false);
  };

  const handleOpenReport = async (org) => {
    setSelectedOrgForReport(org);
    setReportLoading(true);
    setActiveReportTab('overview');
    setStaffSearchQuery('');
    try {
      const data = await adminAPI.getOrgReport(org.id);
      setReportData(data);
    } catch (e) {
      console.error("Error fetching org report:", e);
    } finally {
      setReportLoading(false);
    }
  };

  const exportReportCSV = () => {
    if (!reportData || !reportData.employees) return;
    const headers = ["Employee Name", "Email", "Role", "Department", "User Type", "Queries Processed", "Documents Uploaded", "Engagement Hours", "Last Active"];
    const rows = reportData.employees.map(emp => [
      `"${emp.full_name}"`,
      `"${emp.email}"`,
      `"${emp.role}"`,
      `"${emp.department}"`,
      `"${emp.user_type}"`,
      emp.queries_processed,
      emp.documents_uploaded,
      emp.system_engagement,
      `"${emp.last_active}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${selectedOrgForReport?.name || 'organization'}_telemetry_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredEmployees = reportData?.employees?.filter(emp => 
    emp.full_name.toLowerCase().includes(staffSearchQuery.toLowerCase()) ||
    emp.email.toLowerCase().includes(staffSearchQuery.toLowerCase()) ||
    emp.department.toLowerCase().includes(staffSearchQuery.toLowerCase()) ||
    emp.role.toLowerCase().includes(staffSearchQuery.toLowerCase())
  ) || [];

  const handleInitiateOrgAdminPassword = (org) => {
    setOrgAdminPassTarget(org);
    setOrgAdminCodeInput('');
    setRevealedOrgAdminPass(null);
    setOrgAdminPassError('');
    setCopiedOrgPass(false);
  };

  const handleVerifyAndRevealOrgAdmin = async (e) => {
    if (e) e.preventDefault();
    if (!orgAdminCodeInput.trim()) {
      setOrgAdminPassError('Master verification code is required.');
      return;
    }
    if (orgAdminCodeInput.trim() !== '34') {
      setOrgAdminPassError('Invalid master security code. Access denied.');
      return;
    }

    setOrgAdminPassLoading(true);
    setOrgAdminPassError('');
    try {
      const res = await adminAPI.revealOrgAdminPassword(orgAdminPassTarget.id, orgAdminCodeInput.trim());
      setRevealedOrgAdminPass(res);
    } catch (err) {
      setOrgAdminPassError(err.response?.data?.detail || 'Verification failed. Access denied.');
    } finally {
      setOrgAdminPassLoading(false);
    }
  };

  const copyOrgPasswordToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedOrgPass(true);
    setTimeout(() => setCopiedOrgPass(false), 2500);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-2xs space-y-6 max-w-full overflow-x-hidden">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center space-x-3">
          <Network className="w-6 h-6 text-blue-600 shrink-0" />
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">Cogniva Global Network</h2>
            <p className="text-xs text-slate-500 font-medium">List of all active enterprise client organizations on the platform.</p>
          </div>
        </div>
        {!loading && (
          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Total Organizations</span>
            <span className="text-xl sm:text-2xl font-black text-blue-600 leading-none">{orgs.length}</span>
          </div>
        )}
      </div>

      {/* Global Network Table */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center space-y-2">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-sm font-semibold text-slate-400">Loading network telemetry...</p>
          </div>
        ) : (
          <table className="w-full text-left text-xs font-sans">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <th className="p-3.5">Org ID</th>
                <th className="p-3.5">Organization Name</th>
                <th className="p-3.5">Industry Segment</th>
                <th className="p-3.5 text-right">Access Controls & Intelligence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {orgs.map((o) => (
                <tr key={o.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3.5 font-mono text-slate-400 font-bold">#{o.id}</td>
                  <td className="p-3.5 font-bold text-slate-900 border-l-[3px] border-blue-500 my-2 block ml-2 pl-2">
                    <span className="flex items-center space-x-1.5">
                      <Building className="w-3.5 h-3.5 text-blue-600" />
                      <span>{o.name}</span>
                    </span>
                  </td>
                  <td className="p-3.5 font-medium text-slate-600">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[11px]">
                      {o.industry || 'Technology'}
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    <div className="flex items-center justify-end space-x-2.5">
                      {/* Active Tenant Badge */}
                      <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 font-bold flex items-center space-x-1 text-emerald-700 text-[10px] rounded-full">
                         <Activity className="w-3 h-3 text-emerald-600" />
                         <span>Active Tenant</span>
                      </span>

                      {/* Reports & Analytics Section Button (Beside Active Tenant) */}
                      <button 
                        onClick={() => handleOpenReport(o)}
                        className="px-3 py-1.5 flex items-center space-x-1.5 text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 hover:border-indigo-300 rounded-lg cursor-pointer transition-all shadow-2xs group"
                        title={`View reports and real-time telemetry for ${o.name}`}
                      >
                         <BarChart3 className="w-3.5 h-3.5 text-indigo-600 group-hover:scale-110 transition-transform" />
                         <span>Reports & Analytics</span>
                      </button>

                      {/* Show Org Admin Password Button (Code: 34) */}
                      <button 
                        onClick={() => handleInitiateOrgAdminPassword(o)}
                        className="px-3 py-1.5 flex items-center space-x-1.5 text-[11px] font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 hover:border-purple-300 rounded-lg cursor-pointer transition-all shadow-2xs group"
                        title={`Show Organization Admin password for ${o.name} (Master Code: 34)`}
                      >
                         <KeyRound className="w-3.5 h-3.5 text-purple-600 group-hover:scale-110 transition-transform" />
                         <span>Show Password</span>
                      </button>

                      {/* Disband Platform Action */}
                      <button 
                        onClick={() => setOrgToRemove(o)}
                        className="px-3 py-1.5 flex items-center space-x-1 text-[11px] font-bold text-rose-600 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-lg cursor-pointer transition-all shadow-xs"
                      >
                         <Trash2 className="w-3.5 h-3.5" />
                         <span>Disband Platform</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ========================================================================= */}
      {/* ORGANIZATION REPORTS & TELEMETRY MODAL SECTION */}
      {/* ========================================================================= */}
      {selectedOrgForReport && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-scaleIn">
            
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-200 bg-gradient-to-r from-slate-50 via-indigo-50/20 to-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-3.5">
                <div className="w-11 h-11 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shrink-0">
                  <Building className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-xl font-black tracking-tight text-slate-900">
                      {selectedOrgForReport.name}
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-100 text-indigo-800 border border-indigo-200">
                      Org #{selectedOrgForReport.id}
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center space-x-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span>Active Tenant</span>
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-0.5 flex items-center space-x-2">
                    <span>Segment: <strong>{selectedOrgForReport.industry || 'Technology'}</strong></span>
                    <span>•</span>
                    <span>Dedicated Enterprise Intelligence Report</span>
                  </p>
                </div>
              </div>

              {/* Action Bar (Export, Print, Close) */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={exportReportCSV}
                  disabled={!reportData}
                  className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg flex items-center space-x-1.5 cursor-pointer shadow-xs transition-colors disabled:opacity-50"
                  title="Export member & usage data as CSV"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span className="hidden sm:inline">Export CSV</span>
                </button>

                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg flex items-center space-x-1.5 cursor-pointer shadow-xs transition-colors"
                  title="Print or Save Report as PDF"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-500" />
                  <span className="hidden sm:inline">Print / PDF</span>
                </button>

                <button
                  onClick={() => {
                    setSelectedOrgForReport(null);
                    setReportData(null);
                  }}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                  title="Close report modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body Container */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {reportLoading ? (
                <div className="py-20 text-center space-y-3">
                  <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <h4 className="text-sm font-bold text-slate-700">Gathering Real-Time Organization Telemetry...</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">Querying isolated database records, user metrics, and knowledge base logs.</p>
                </div>
              ) : reportData ? (
                <>
                  {/* KPI Stat Cards Grid */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Personnel */}
                    <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 shadow-2xs">
                      <div className="flex items-center justify-between text-slate-500 mb-2">
                        <span className="text-[11px] uppercase font-bold tracking-wider">Total Members</span>
                        <Users className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="text-2xl font-black text-slate-900">{reportData.metrics.total_employees}</div>
                      <div className="mt-2 flex items-center text-[10px] font-bold text-emerald-600">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        <span>{reportData.metrics.adoption_rate} Adoption Rate</span>
                      </div>
                    </div>

                    {/* Documents */}
                    <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 shadow-2xs">
                      <div className="flex items-center justify-between text-slate-500 mb-2">
                        <span className="text-[11px] uppercase font-bold tracking-wider">Knowledge Assets</span>
                        <Database className="w-4 h-4 text-indigo-600" />
                      </div>
                      <div className="text-2xl font-black text-slate-900">{reportData.metrics.total_documents}</div>
                      <div className="mt-2 flex items-center text-[10px] font-bold text-indigo-600">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        <span>Isolated Multi-Tenant Space</span>
                      </div>
                    </div>

                    {/* Searches / AI Handled */}
                    <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 shadow-2xs">
                      <div className="flex items-center justify-between text-slate-500 mb-2">
                        <span className="text-[11px] uppercase font-bold tracking-wider">AI Queries Processed</span>
                        <Sparkles className="w-4 h-4 text-amber-500" />
                      </div>
                      <div className="text-2xl font-black text-slate-900">{reportData.metrics.total_queries}</div>
                      <div className="mt-2 flex items-center text-[10px] font-bold text-amber-600">
                        <Activity className="w-3 h-3 mr-1" />
                        <span>Live Hybrid RAG Searches</span>
                      </div>
                    </div>

                    {/* Engagement Hours */}
                    <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 shadow-2xs">
                      <div className="flex items-center justify-between text-slate-500 mb-2">
                        <span className="text-[11px] uppercase font-bold tracking-wider">System Engagement</span>
                        <Clock className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div className="text-2xl font-black text-slate-900">{reportData.metrics.total_engagement_hours} <span className="text-xs font-semibold text-slate-500">hrs</span></div>
                      <div className="mt-2 flex items-center text-[10px] font-bold text-emerald-600">
                        <ShieldCheck className="w-3 h-3 mr-1" />
                        <span>{reportData.metrics.health_score} Platform Health</span>
                      </div>
                    </div>
                  </div>

                  {/* Tab Navigation */}
                  <div className="flex border-b border-slate-200 space-x-1">
                    <button
                      onClick={() => setActiveReportTab('overview')}
                      className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center space-x-2 cursor-pointer ${
                        activeReportTab === 'overview'
                          ? 'border-indigo-600 text-indigo-600'
                          : 'border-transparent text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <Layers className="w-4 h-4" />
                      <span>Executive Overview</span>
                    </button>

                    <button
                      onClick={() => setActiveReportTab('staff')}
                      className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center space-x-2 cursor-pointer ${
                        activeReportTab === 'staff'
                          ? 'border-indigo-600 text-indigo-600'
                          : 'border-transparent text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <Users className="w-4 h-4" />
                      <span>Organization Personnel ({reportData.employees?.length || 0})</span>
                    </button>

                    <button
                      onClick={() => setActiveReportTab('documents')}
                      className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center space-x-2 cursor-pointer ${
                        activeReportTab === 'documents'
                          ? 'border-indigo-600 text-indigo-600'
                          : 'border-transparent text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <FileText className="w-4 h-4" />
                      <span>Knowledge Documents ({reportData.recent_documents?.length || 0})</span>
                    </button>

                    <button
                      onClick={() => setActiveReportTab('gaps')}
                      className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center space-x-2 cursor-pointer ${
                        activeReportTab === 'gaps'
                          ? 'border-indigo-600 text-indigo-600'
                          : 'border-transparent text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <AlertCircle className="w-4 h-4" />
                      <span>Knowledge Gaps ({reportData.knowledge_gaps?.length || 0})</span>
                    </button>
                  </div>

                  {/* TAB 1: EXECUTIVE OVERVIEW */}
                  {activeReportTab === 'overview' && (
                    <div className="space-y-6 animate-fadeIn">
                      {/* Department Breakdown */}
                      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
                        <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center space-x-2">
                          <Building className="w-4 h-4 text-blue-600" />
                          <span>Departmental Distribution</span>
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                          {reportData.departments?.length > 0 ? (
                            reportData.departments.map((dept, i) => (
                              <div key={i} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                                <span className="text-xs font-semibold text-slate-700">{dept.name}</span>
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 font-bold text-xs rounded-md">
                                  {dept.count} {dept.count === 1 ? 'member' : 'members'}
                                </span>
                              </div>
                            ))
                          ) : (
                            <p className="text-xs text-slate-400 italic">No departmental distribution recorded yet.</p>
                          )}
                        </div>
                      </div>

                      {/* Security & Multi-Tenant Audit */}
                      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3">
                        <h4 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                          <ShieldCheck className="w-4 h-4 text-emerald-600" />
                          <span>Enterprise Tenant Isolation & Compliance Audit</span>
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                          <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-lg">
                            <span className="font-bold text-emerald-900 block mb-0.5">Strict RBAC Partitioning</span>
                            <span className="text-slate-500">Employee queries and document chunks are isolated to Org #{selectedOrgForReport.id}.</span>
                          </div>
                          <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-lg">
                            <span className="font-bold text-indigo-900 block mb-0.5">Vector Chunks Encryption</span>
                            <span className="text-slate-500">Document embeddings stored with tenant identifier and SHA-256 validation.</span>
                          </div>
                          <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-lg">
                            <span className="font-bold text-blue-900 block mb-0.5">Real-Time Telemetry Sync</span>
                            <span className="text-slate-500">Live search tracker and n8n proxy metrics operating with 99.8% SLA.</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: STAFF & MEMBERS */}
                  {activeReportTab === 'staff' && (
                    <div className="space-y-4 animate-fadeIn">
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                        <div className="relative flex-1 max-w-sm">
                          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                          <input
                            type="text"
                            placeholder="Filter personnel by name, email, department..."
                            value={staffSearchQuery}
                            onChange={(e) => setStaffSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500 shadow-2xs font-sans"
                          />
                        </div>
                        <span className="text-xs text-slate-400 font-medium">
                          Showing {filteredEmployees.length} of {reportData.employees?.length || 0} provisioned accounts
                        </span>
                      </div>

                      <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                            <tr>
                              <th className="p-3">Member</th>
                              <th className="p-3">Role & Dept</th>
                              <th className="p-3">Account Type</th>
                              <th className="p-3 text-center">Queries</th>
                              <th className="p-3 text-center">Docs Uploaded</th>
                              <th className="p-3 text-center">Engagement</th>
                              <th className="p-3 text-right">Last Active</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {filteredEmployees.length > 0 ? (
                              filteredEmployees.map((emp) => (
                                <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                                  <td className="p-3">
                                    <div className="font-bold text-slate-900">{emp.full_name}</div>
                                    <div className="text-[11px] text-slate-400 font-mono">{emp.email}</div>
                                  </td>
                                  <td className="p-3">
                                    <div className="font-medium text-slate-700">{emp.role}</div>
                                    <div className="text-[11px] text-slate-400">{emp.department}</div>
                                  </td>
                                  <td className="p-3">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                      emp.user_type === 'org_admin' 
                                        ? 'bg-purple-100 text-purple-700 border border-purple-200'
                                        : emp.user_type === 'cogniva_admin'
                                        ? 'bg-rose-100 text-rose-700 border border-rose-200'
                                        : 'bg-blue-100 text-blue-700 border border-blue-200'
                                    }`}>
                                      {emp.user_type === 'org_admin' ? 'Org Admin' : emp.user_type === 'cogniva_admin' ? 'System Admin' : 'Employee'}
                                    </span>
                                  </td>
                                  <td className="p-3 text-center font-mono font-bold text-slate-800">{emp.queries_processed}</td>
                                  <td className="p-3 text-center font-mono font-bold text-slate-800">{emp.documents_uploaded}</td>
                                  <td className="p-3 text-center font-mono text-indigo-600 font-bold">{emp.system_engagement} hrs</td>
                                  <td className="p-3 text-right text-slate-500 font-mono text-[11px]">{emp.last_active}</td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={7} className="p-8 text-center text-slate-400 font-medium">
                                  No members matching the filter.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: TENANT DOCUMENTS */}
                  {activeReportTab === 'documents' && (
                    <div className="space-y-4 animate-fadeIn">
                      <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                            <tr>
                              <th className="p-3">Document Title</th>
                              <th className="p-3">Format</th>
                              <th className="p-3">Department</th>
                              <th className="p-3">Uploaded By</th>
                              <th className="p-3 text-center">Chunks</th>
                              <th className="p-3 text-right">Upload Date</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {reportData.recent_documents?.length > 0 ? (
                              reportData.recent_documents.map((doc) => (
                                <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors">
                                  <td className="p-3 font-bold text-slate-900 flex items-center space-x-2">
                                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                                    <span>{doc.title || doc.filename}</span>
                                  </td>
                                  <td className="p-3 font-mono text-[10px] uppercase font-bold text-slate-600">{doc.file_type}</td>
                                  <td className="p-3 text-slate-600">{doc.department}</td>
                                  <td className="p-3 text-slate-600 font-medium">{doc.uploaded_by}</td>
                                  <td className="p-3 text-center font-mono font-bold text-indigo-600">{doc.total_chunks}</td>
                                  <td className="p-3 text-right text-slate-500 font-mono text-[11px]">{doc.upload_date}</td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={6} className="p-8 text-center text-slate-400 font-medium">
                                  No knowledge base documents indexed for this organization yet.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* TAB 4: KNOWLEDGE GAPS */}
                  {activeReportTab === 'gaps' && (
                    <div className="space-y-4 animate-fadeIn">
                      <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                            <tr>
                              <th className="p-3">Unanswered Query</th>
                              <th className="p-3">Department</th>
                              <th className="p-3 text-center">Attempts</th>
                              <th className="p-3 text-center">Status</th>
                              <th className="p-3 text-right">Logged Date</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {reportData.knowledge_gaps?.length > 0 ? (
                              reportData.knowledge_gaps.map((gap) => (
                                <tr key={gap.id} className="hover:bg-slate-50/80 transition-colors">
                                  <td className="p-3 font-bold text-slate-900">{gap.query}</td>
                                  <td className="p-3 text-slate-600">{gap.department}</td>
                                  <td className="p-3 text-center font-mono font-bold text-slate-800">{gap.attempt_count}</td>
                                  <td className="p-3 text-center">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                      gap.status === 'Resolved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                    }`}>
                                      {gap.status}
                                    </span>
                                  </td>
                                  <td className="p-3 text-right text-slate-500 font-mono text-[11px]">{gap.created_at}</td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={5} className="p-8 text-center text-slate-400 font-medium">
                                  No unresolved knowledge gaps reported for this organization.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="p-12 text-center text-rose-500 font-semibold">
                  Failed to load report data. Please verify tenant connectivity.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-slate-500">
                Data dynamically fetched from Cogniva Multi-Tenant Core Engine.
              </div>
              <button
                onClick={() => {
                  setSelectedOrgForReport(null);
                  setReportData(null);
                }}
                className="w-full sm:w-auto px-5 py-2 font-bold text-xs bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors shadow-xs cursor-pointer"
              >
                Close Report
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Disband Organization Modal */}
      {orgToRemove && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mb-4 border border-rose-200">
                <Trash2 className="w-6 h-6 text-rose-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Disband Organization</h3>
              <p className="text-sm text-slate-500 font-medium">
                Are you absolutely sure you want to permanently delete <strong className="text-slate-700">{orgToRemove.name}</strong>? This will revoke all active tenant telemetry.
              </p>
            </div>
            <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-end space-x-3">
              <button 
                onClick={() => setOrgToRemove(null)}
                className="px-4 py-2 font-bold text-xs bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer shadow-xs"
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  try {
                    await api.delete(`/api/admin/organizations/${orgToRemove.id}`);
                    setOrgs(orgs.filter(org => org.id !== orgToRemove.id));
                    setOrgToRemove(null);
                  } catch (e) {
                    console.error('Failed to remove organization', e);
                    alert("Failed to delete organization.");
                  }
                }}
                className="px-4 py-2 font-bold text-xs bg-rose-600 border border-rose-600 text-white rounded-xl hover:bg-rose-700 transition-colors shadow-xs cursor-pointer"
              >
                Disband Tenant
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Org Admin Password Reveal Modal with Master Code [34] */}
      {orgAdminPassTarget && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-200 animate-scaleIn">
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">
                      Organization Admin Credentials
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Master decrypt for {orgAdminPassTarget.name}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setOrgAdminPassTarget(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {!revealedOrgAdminPass ? (
                <form onSubmit={handleVerifyAndRevealOrgAdmin} className="space-y-4 pt-1">
                  <p className="text-xs text-slate-600 font-medium leading-relaxed">
                    Enter the authorized master security code <span className="font-mono font-black text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">[ 34 ]</span> to retrieve the Organization Administrator credentials for <strong className="text-slate-800">{orgAdminPassTarget.name}</strong>:
                  </p>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-extrabold uppercase text-slate-500 tracking-wider block">
                      Master Security Code
                    </label>
                    <input
                      type="password"
                      autoFocus
                      placeholder="Enter security code [34]"
                      value={orgAdminCodeInput}
                      onChange={(e) => {
                        setOrgAdminCodeInput(e.target.value);
                        setOrgAdminPassError('');
                      }}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-center font-black text-base text-slate-900 tracking-widest focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                  </div>

                  {orgAdminPassError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-xl flex items-center space-x-2 animate-fadeIn">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{orgAdminPassError}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-end space-x-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setOrgAdminPassTarget(null)}
                      className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={orgAdminPassLoading}
                      className="px-5 py-2 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
                    >
                      {orgAdminPassLoading ? 'Verifying...' : 'Unlock Admin Password'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4 pt-1 animate-fadeIn">
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2">
                    <div className="flex items-center space-x-1.5 text-emerald-800 font-extrabold text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Authorized • Credentials Decrypted</span>
                    </div>
                    <div className="space-y-1 text-xs">
                      <div><span className="text-slate-500 font-medium">Organization:</span> <strong className="text-slate-900">{revealedOrgAdminPass.org_name}</strong></div>
                      <div><span className="text-slate-500 font-medium">Admin Name:</span> <strong className="text-slate-900">{revealedOrgAdminPass.admin_name}</strong></div>
                      <div><span className="text-slate-500 font-medium">Admin Email:</span> <strong className="text-slate-900">{revealedOrgAdminPass.email}</strong></div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-extrabold uppercase text-slate-500 tracking-wider block">
                      Organization Admin Password
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        readOnly
                        value={revealedOrgAdminPass.password}
                        className="flex-1 p-3 bg-slate-100 border border-slate-300 rounded-xl font-mono font-black text-sm text-slate-900 select-all"
                      />
                      <button
                        type="button"
                        onClick={() => copyOrgPasswordToClipboard(revealedOrgAdminPass.password)}
                        className="p-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl cursor-pointer transition-colors shadow-xs"
                        title="Copy password to clipboard"
                      >
                        {copiedOrgPass ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setOrgAdminPassTarget(null)}
                      className="px-5 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl cursor-pointer transition-colors"
                    >
                      Done / Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
