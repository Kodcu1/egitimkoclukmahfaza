import React, { useEffect, useState } from 'react';
import { db } from '../../lib/db';
import { AuditLog } from '../../types';
import {
  ShieldCheck,
  Search,
  Filter,
  Clock,
  User,
  Activity,
  Code,
  CheckCircle2,
} from 'lucide-react';

export const AdminAuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const loadLogs = async () => {
    try {
      const data = await db.getAuditLogs();
      setLogs(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.entity_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.actor_name || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesAction = selectedAction === 'all' || log.action === selectedAction;
    return matchesSearch && matchesAction;
  });

  const uniqueActions = Array.from(new Set(logs.map((l) => l.action)));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-100 font-serif">
              Sistem Denetim & Güvenlik Kayıtları
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Değiştirilemez (immutable) RLS korumalı SaaS işlem ve güvenlik izleme kayıtları.
            </p>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="İşlem adı, tablo veya kullanıcı ara..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:border-amber-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:border-amber-500 focus:outline-none"
          >
            <option value="all">Tüm İşlemler ({logs.length})</option>
            {uniqueActions.map((action) => (
              <option key={action} value={action}>
                {action}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/70 text-slate-400 border-b border-slate-800 uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="px-5 py-3.5">İşlem & Tür</th>
                <th className="px-5 py-3.5">Hedef Varlık</th>
                <th className="px-5 py-3.5">Yetkili / Aktör</th>
                <th className="px-5 py-3.5">Tarih / Zaman</th>
                <th className="px-5 py-3.5 text-right">Detaylar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-slate-500">
                    Kayıtlı log bulunamadı.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <React.Fragment key={log.id}>
                    <tr className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-amber-400 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-xs">
                            {log.action}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 font-mono text-slate-300">
                        <span className="text-slate-400">{log.entity_type}</span>
                        {log.entity_id && (
                          <span className="text-[10px] text-slate-500 block truncate max-w-xs">
                            ID: {log.entity_id}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] text-amber-300">
                            <User className="w-3 h-3" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-200">{log.actor_name || 'Admin'}</p>
                            <p className="text-[10px] text-slate-500 uppercase">{log.actor_role}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-400 text-[11px] font-mono">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          <span>{new Date(log.created_at).toLocaleString('tr-TR')}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => setExpandedLogId(expandedLogId === log.id ? null : log.id)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium border border-slate-700 cursor-pointer"
                        >
                          {expandedLogId === log.id ? 'Gizle' : 'JSON İncele'}
                        </button>
                      </td>
                    </tr>

                    {/* Expandable JSON details */}
                    {expandedLogId === log.id && (
                      <tr className="bg-slate-950/80">
                        <td colSpan={5} className="px-6 py-4">
                          <div className="rounded-xl bg-slate-900 border border-slate-800 p-4 font-mono text-[11px] text-amber-300/90 overflow-x-auto">
                            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2 font-sans font-bold">
                              <Code className="w-4 h-4 text-amber-400" />
                              <span>Değişiklik ve İşlem Parametreleri (Payload)</span>
                            </div>
                            <pre>{JSON.stringify(log.details || {}, null, 2)}</pre>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
