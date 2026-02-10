import { useState, useEffect } from 'react';
import { adminApi } from '../../api/admin';
import { ScrollText, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

const ACTION_BADGE = { create: 'badge-success', update: 'badge-info', delete: 'badge-danger' };
const ACTION_LABELS = { create: 'Création', update: 'Modification', delete: 'Suppression' };

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({});
  const [filters, setFilters] = useState({ resource_type: '', action_type: '' });
  const [selectedLog, setSelectedLog] = useState(null);

  useEffect(() => { loadLogs(); }, [page, filters]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const params = { page };
      if (filters.resource_type) params.resource_type = filters.resource_type;
      if (filters.action_type) params.action_type = filters.action_type;
      const res = await adminApi.getAuditLogs(params);
      setLogs(res.data.data || []);
      setMeta(res.data.meta || {});
    } catch {
      toast.error('Erreur lors du chargement des logs');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Audit Logs</h1>
          <p className="text-muted">Historique des actions sur la plateforme</p>
        </div>
        <span className="badge"><ScrollText size={12} /> {meta.total_count ?? logs.length} entrée(s)</span>
      </div>

      <div className="filters-bar">
        <div className="form-group" style={{ minWidth: 180 }}>
          <label>Type de ressource</label>
          <select value={filters.resource_type} onChange={e => { setFilters({ ...filters, resource_type: e.target.value }); setPage(1); }}>
            <option value="">Tous</option>
            <option value="Property">Bien immobilier</option>
            <option value="InvestmentProject">Projet</option>
            <option value="Investment">Investissement</option>
          </select>
        </div>
        <div className="form-group" style={{ minWidth: 180 }}>
          <label>Action</label>
          <select value={filters.action_type} onChange={e => { setFilters({ ...filters, action_type: e.target.value }); setPage(1); }}>
            <option value="">Toutes</option>
            <option value="create">Création</option>
            <option value="update">Modification</option>
            <option value="delete">Suppression</option>
          </select>
        </div>
      </div>

      <div className="admin-layout">
        <div>
          {loading ? (
            <div className="page-loading"><div className="spinner" /></div>
          ) : logs.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <ScrollText size={48} />
                <p>Aucun log d'audit</p>
              </div>
            </div>
          ) : (
            <>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr><th>Date</th><th>Utilisateur</th><th>Action</th><th>Ressource</th><th>ID</th></tr>
                  </thead>
                  <tbody>
                    {logs.map(log => {
                      const a = log.attributes || log;
                      return (
                        <tr key={log.id} onClick={() => setSelectedLog(log)} style={{ cursor: 'pointer' }} className={selectedLog?.id === log.id ? 'row-selected' : ''}>
                          <td>{a.created_at ? new Date(a.created_at).toLocaleString('fr-FR') : '—'}</td>
                          <td>{a.user_email || '—'}</td>
                          <td><span className={`badge ${ACTION_BADGE[a.action] || ''}`}>{ACTION_LABELS[a.action] || a.action}</span></td>
                          <td>{a.auditable_type}</td>
                          <td className="font-mono" style={{ fontSize: '.8rem' }}>{a.auditable_id}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {meta.total_pages > 1 && (
                <div className="pagination">
                  <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="btn btn-sm"><ChevronLeft size={16} /></button>
                  <span>Page {page} / {meta.total_pages}</span>
                  <button disabled={page >= meta.total_pages} onClick={() => setPage(page + 1)} className="btn btn-sm"><ChevronRight size={16} /></button>
                </div>
              )}
            </>
          )}
        </div>

        {selectedLog && (
          <div className="card user-detail-panel">
            <h3>Détails du log</h3>
            {(() => {
              const a = selectedLog.attributes || selectedLog;
              return (
                <>
                  <div className="detail-grid">
                    <div className="detail-row"><span>ID</span><span className="font-mono" style={{ fontSize: '.8rem' }}>{selectedLog.id}</span></div>
                    <div className="detail-row"><span>Action</span><span className={`badge ${ACTION_BADGE[a.action] || ''}`}>{ACTION_LABELS[a.action] || a.action}</span></div>
                    <div className="detail-row"><span>Ressource</span><span>{a.auditable_type} #{a.auditable_id}</span></div>
                    <div className="detail-row"><span>Utilisateur</span><span>{a.user_email || '—'}</span></div>
                    <div className="detail-row"><span>IP</span><span className="font-mono">{a.ip_address || '—'}</span></div>
                    <div className="detail-row"><span>Date</span><span>{a.created_at ? new Date(a.created_at).toLocaleString('fr-FR') : '—'}</span></div>
                  </div>
                  {a.changes_data && Object.keys(a.changes_data).length > 0 && (
                    <div style={{ marginTop: '1rem' }}>
                      <h4 style={{ fontSize: '.85rem', marginBottom: '.5rem', color: 'var(--text-secondary)' }}>Changements</h4>
                      <pre style={{ background: 'var(--bg)', padding: '.75rem', borderRadius: 'var(--radius-sm)', fontSize: '.78rem', overflow: 'auto', maxHeight: 200 }}>
                        {JSON.stringify(a.changes_data, null, 2)}
                      </pre>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
