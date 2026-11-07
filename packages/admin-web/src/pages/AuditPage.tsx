import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { FileClock, ShieldCheck, UserCheck, RefreshCw } from 'lucide-react';

export const AuditPage: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const res = await api.getAuditLogs();
      setLogs(res.data || []);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-display text-slate-900 tracking-tight flex items-center gap-2">
            <FileClock className="w-5 h-5 text-brand-600" />
            <span>Compliance & Administrative Audit Trails</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Immutable system audit logs tracking KYC approvals, fee changes, account suspensions, and administrative operations.
          </p>
        </div>
        <button
          onClick={loadLogs}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/75 border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-6 py-3.5">Timestamp</th>
                <th className="px-6 py-3.5">Action Executed</th>
                <th className="px-6 py-3.5">Entity Type</th>
                <th className="px-6 py-3.5">Target Entity ID</th>
                <th className="px-6 py-3.5">Executed By</th>
                <th className="px-6 py-3.5">Log Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    No audit logs recorded yet. All administrative actions are automatically committed here.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4 font-mono text-[11px] text-slate-500">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-900 px-2 py-0.5 rounded-md bg-slate-100 text-[11px]">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-700">{log.entityType}</td>
                    <td className="px-6 py-4 font-mono text-[11px] text-slate-500">
                      {log.entityId}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {log.user?.fullName || 'SuperAdmin'}
                    </td>
                    <td className="px-6 py-4 font-mono text-[10px] text-slate-500 max-w-xs truncate">
                      {log.details || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

