import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  User,
  Users,
  Zap,
  RefreshCw,
  CheckCircle2
} from 'lucide-react';
import { orchestratorAPI } from '../../services/api';

export default function AdminOrchestratorWorkspace() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUsersAndLogs();
  }, []);

  const fetchUsersAndLogs = async () => {
    setLoading(true);
    try {
      const userList = await orchestratorAPI.getAdminUsers();
      setUsers(userList || []);
      
      const defaultU = userList.length > 0 ? userList[0] : { user_id: 'default_user', name: 'Akash M (Product Manager)' };
      setSelectedUser(defaultU);

      const userLogs = await orchestratorAPI.getLogs(defaultU.user_id);
      setLogs(userLogs || []);
    } catch (e) {
      console.error('Admin Orchestrator fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUser = async (user) => {
    setSelectedUser(user);
    setLoading(true);
    try {
      const userLogs = await orchestratorAPI.getLogs(user.user_id);
      setLogs(userLogs || []);
    } catch (e) {
      console.error('Admin user logs fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 select-none text-left font-sans">
      {/* 1. Header & Admin Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-8 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center space-x-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                <span>Admin Inspector Route (/admin)</span>
              </span>
              <span className="text-xs text-slate-400 font-medium">• Enterprise User Orchestrator Audit</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              User AI Orchestrator Telemetry
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl font-medium leading-relaxed">
              Select any enterprise user below to inspect their particular AI Orchestrator execution logs, intent classifications, and agent routing history.
            </p>
          </div>

          <button
            onClick={fetchUsersAndLogs}
            disabled={loading}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold rounded-xl text-xs flex items-center space-x-2 transition-all backdrop-blur-xs cursor-pointer self-start lg:self-auto"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh User Telemetry</span>
          </button>
        </div>
      </div>

      {/* 2. Particular User Selection Bar */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
            <Users className="w-4 h-4 text-blue-600" />
            <span>Select Enterprise User to Inspect</span>
          </h2>
          <span className="text-xs text-slate-500 font-semibold">{users.length} Registered Enterprise Profiles</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {users.map((u) => {
            const isSelected = selectedUser?.user_id === u.user_id;
            return (
              <div
                key={u.user_id}
                onClick={() => handleSelectUser(u)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer space-y-2 text-left ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                    : 'bg-white text-slate-800 border-slate-200 hover:border-blue-300 hover:shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-600'
                  }`}>
                    <User className="w-4 h-4" />
                  </div>
                  {isSelected && <CheckCircle2 className="w-4 h-4 text-white" />}
                </div>
                <div>
                  <h3 className="font-bold text-sm truncate">{u.name}</h3>
                  <p className={`text-xs ${isSelected ? 'text-blue-100' : 'text-slate-500'} truncate`}>
                    {u.department}
                  </p>
                </div>
                <div className={`pt-2 border-t text-[11px] flex justify-between ${
                  isSelected ? 'border-white/20 text-blue-100' : 'border-slate-100 text-slate-500'
                }`}>
                  <span>{u.total_orchestrations || 0} Queries Logged</span>
                  <span>{u.avg_planning_time_ms || 4.2} ms avg</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Selected User AI Orchestrator Execution Log */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-5 text-left">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-2">
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
              <Zap className="w-5 h-5 text-blue-600" />
              <span>AI Orchestrator Execution Logs — {selectedUser?.name || 'Selected User'}</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Real database execution trace filtered for {selectedUser?.user_id}</p>
          </div>
          <span className="px-3 py-1 bg-slate-100 border border-slate-200 rounded-full text-xs font-bold text-slate-700">
            {logs.length} Orchestration Events
          </span>
        </div>

        {/* Logs Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <th className="p-3">User Query</th>
                <th className="p-3">Intent Classification</th>
                <th className="p-3">Agent Routing Order</th>
                <th className="p-3">Planning Latency</th>
                <th className="p-3">Total Time</th>
                <th className="p-3">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.length > 0 ? (
                logs.map((log) => (
                  <tr
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className="hover:bg-blue-50/50 transition-colors cursor-pointer"
                  >
                    <td className="p-3 font-semibold text-slate-900 max-w-xs truncate">{log.query}</td>
                    <td className="p-3">
                      <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-md font-bold text-[11px]">
                        {log.intent}
                      </span>
                    </td>
                    <td className="p-3 font-semibold text-indigo-700">
                      {Array.isArray(log.execution_plan) ? log.execution_plan.length : 4} Agents Dispatched
                    </td>
                    <td className="p-3 font-mono text-purple-700 font-bold">{log.planning_time_ms} ms</td>
                    <td className="p-3 font-mono text-emerald-700 font-bold">{log.total_execution_time_ms} ms</td>
                    <td className="p-3 text-slate-500 font-medium">{log.timestamp}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 font-medium">
                    No AI Orchestrator execution logs recorded for {selectedUser?.name} yet. Run a query in Search Agent or Response Agent to populate real user execution records.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
