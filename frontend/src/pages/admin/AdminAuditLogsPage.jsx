import { useState, useEffect } from 'react';
import { adminApi } from '../../api/admin';
import { ScrollText, X } from 'lucide-react';
import toast from 'react-hot-toast';
import TableFilters from '../../components/TableFilters';
import { ACTION_LABELS, ACTION_BADGES as ACTION_BADGE, RESOURCE_TYPE_LABELS } from '../../utils';
import { LoadingSpinner, Pagination, EmptyState } from '../../components/ui';

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({});
  const [filters, setFilters] = useState({ resource_type: '', action_type: '' });
  const [search, setSearch] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);

  useEffect(() => { loadLogs(); }, [page, filters, search]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const params = { page };
      if (filters.resource_type) params.resource_type = filters.resource_type;
      if (filters.action_type) params.action_type = filters.action_type;
      if (search) params.search = search;
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
        <span className="badge"><ScrollText size={12} /> {meta.total_count ?? logs.length} entree(s)</span>
      </div>

      <TableFilters
        filters={[
          { key: 'resource_type', label: 'Type de ressource', value: filters.resource_type, options: [
            { value: '', label: 'Tous' },
            { value: 'User', label: 'Utilisateur' },
            { value: 'InvestmentProject', label: 'Projet' },
            { value: 'Property', label: 'Bien immobilier' },
            { value: 'Investment', label: 'Investissement' },
            { value: 'Transaction', label: 'Transaction' },
            { value: 'Wallet', label: 'Portefeuille' },
            { value: 'Dividend', label: 'Dividende' },
            { value: 'DividendPayment', label: 'Paiement dividende' },
            { value: 'MvpReport', label: 'Rapport MVP' },
            { value: 'ProjectDelay', label: 'Retard' },
            { value: 'AnalystReport', label: 'Rapport analyste' },
            { value: 'Setting', label: 'Parametre' },
            { value: 'Company', label: 'Societe' },
          ]},
          { key: 'action_type', label: 'Action', value: filters.action_type, options: [
            { value: '', label: 'Toutes' },
            { value: 'create', label: 'Creation' },
            { value: 'update', label: 'Modification' },
            { value: 'delete', label: 'Suppression' },
            { value: 'approve_project', label: 'Approbation projet' },
            { value: 'reject_project', label: 'Rejet projet' },
            { value: 'request_info', label: 'Demande infos' },
            { value: 'assign_analyst', label: 'Assignation analyste' },
            { value: 'advance_status', label: 'Changement statut' },
            { value: 'verify_kyc', label: 'Validation KYC' },
            { value: 'reject_kyc', label: 'Rejet KYC' },
            { value: 'validate_report', label: 'Validation rapport' },
            { value: 'reject_report', label: 'Rejet rapport' },
          ]},
        ]}
        onFilterChange={(key, value) => { setFilters({ ...filters, [key]: value }); setPage(1); }}
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Rechercher dans les logs..."
      />

      <div className="admin-layout">
        <div>
          {loading ? (
            <LoadingSpinner />
          ) : logs.length === 0 ? (
            <div className="card">
              <EmptyState icon={ScrollText} message="Aucun log d'audit" />
            </div>
          ) : (
            <>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr><th>Date</th><th>Utilisateur</th><th>Action</th><th>Ressource</th><th>Detail</th></tr>
                  </thead>
                  <tbody>
                    {logs.map(log => {
                      const a = log.attributes || log;
                      return (
                        <tr key={log.id} onClick={() => setSelectedLog(log)} style={{ cursor: 'pointer' }} className={selectedLog?.id === log.id ? 'row-selected' : ''}>
                          <td data-label="Date">{a.created_at ? new Date(a.created_at).toLocaleString('fr-FR') : '\u2014'}</td>
                          <td data-label="Utilisateur">
                            <div>{a.user_name || '\u2014'}</div>
                            <small className="text-muted">{a.user_email}</small>
                          </td>
                          <td data-label="Action"><span className={`badge ${ACTION_BADGE[a.action] || 'badge-info'}`}>{ACTION_LABELS[a.action] || a.action}</span></td>
                          <td data-label="Ressource"><span className="badge">{RESOURCE_TYPE_LABELS[a.auditable_type] || a.auditable_type}</span></td>
                          <td data-label="Detail" style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {a.resource_label || `#${a.auditable_id}`}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <Pagination page={page} totalPages={meta.total_pages} onPageChange={setPage} />
            </>
          )}
        </div>

        {selectedLog && (
          <div className="card user-detail-panel">
            <button className="detail-panel-close" onClick={() => setSelectedLog(null)}><X size={20} /></button>
            <h3>Details du log</h3>
            {(() => {
              const a = selectedLog.attributes || selectedLog;
              return (
                <>
                  <div className="detail-grid">
                    <div className="detail-row"><span>ID</span><span className="font-mono" style={{ fontSize: '.8rem' }}>{selectedLog.id}</span></div>
                    <div className="detail-row"><span>Action</span><span className={`badge ${ACTION_BADGE[a.action] || 'badge-info'}`}>{ACTION_LABELS[a.action] || a.action}</span></div>
                    <div className="detail-row"><span>Ressource</span><span>{RESOURCE_TYPE_LABELS[a.auditable_type] || a.auditable_type} #{a.auditable_id}</span></div>
                    <div className="detail-row"><span>Detail</span><span>{a.resource_label || '\u2014'}</span></div>
                    <div className="detail-row"><span>Utilisateur</span><span>{a.user_name || '\u2014'} ({a.user_email || '\u2014'})</span></div>
                    <div className="detail-row"><span>IP</span><span className="font-mono">{a.ip_address || '\u2014'}</span></div>
                    <div className="detail-row"><span>Date</span><span>{a.created_at ? new Date(a.created_at).toLocaleString('fr-FR') : '\u2014'}</span></div>
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
