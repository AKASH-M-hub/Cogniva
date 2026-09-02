import React, { useState, useEffect } from 'react';
import { Network, Building, ExternalLink, Activity } from 'lucide-react';
import api from '../../services/api';

export default function CognivaNetwork() {
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [orgToRemove, setOrgToRemove] = useState(null);

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

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center space-x-3">
          <Network className="w-6 h-6 text-blue-600" />
          <div>
            <h2 className="text-lg font-bold text-slate-900">Cogniva Global Network</h2>
            <p className="text-xs text-slate-500 font-medium">List of all active enterprise client organizations on the platform.</p>
          </div>
        </div>
        {!loading && (
          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Total Organizations</span>
            <span className="text-2xl font-black text-blue-600 leading-none">{orgs.length}</span>
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        {loading ? (
          <p className="text-sm font-semibold text-slate-400">Loading network telemetry...</p>
        ) : (
          <table className="w-full text-left text-xs font-sans">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <th className="p-3.5">Org ID</th>
                <th className="p-3.5">Organization Name</th>
                <th className="p-3.5">Industry Segment</th>
                <th className="p-3.5 text-right">Access Controls</th>
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
                  <td className="p-3.5 font-medium text-slate-600">{o.industry || 'Technology'}</td>
                  <td className="p-3.5 text-right">
                    <div className="flex items-center justify-end space-x-3">
                      <span className="px-2.5 py-1 bg-blue-50 border border-blue-200 font-bold flex items-center space-x-1 text-blue-700 text-[10px] rounded-full">
                         <Activity className="w-3 h-3" />
                         <span>Active Tenant</span>
                      </span>
                      <button 
                        onClick={() => setOrgToRemove(o)}
                        className="px-3 py-1.5 flex items-center space-x-1 text-[11px] font-bold text-rose-600 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-lg cursor-pointer transition-all shadow-xs"
                      >
                         <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
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

      {orgToRemove && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mb-4 border border-rose-200">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-rose-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
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
    </div>
  );
}
