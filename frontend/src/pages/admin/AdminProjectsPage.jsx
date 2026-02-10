import { useState, useEffect } from 'react';
import { adminApi } from '../../api/admin';
import {
  Briefcase, Eye, CheckCircle, XCircle, ChevronLeft,
  ChevronRight, Search, Clock, ShieldCheck, ShieldX,
} from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_LABELS = {
  brouillon: 'Brouillon', ouvert: 'Ouvert', finance: 'Financé',
  cloture: 'Clôturé', annule: 'Annulé',
};
const STATUS_BADGE = {
  brouillon: 'badge-warning', ouvert: 'badge-info', finance: 'badge-success',
  cloture: 'badge', annule: 'badge-danger',
};
const REVIEW_LABELS = { en_attente: 'En attente', approuve: 'Approuvé', rejete: 'Rejeté' };
const REVIEW_BADGE = { en_attente: 'badge-warning', approuve: 'badge-success', rejete: 'badge-danger' };

const fmt = (cents) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format((cents || 0) / 100);

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', review_status: '' });
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({});
  const [selected, setSelected] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectId, setRejectId] = useState(null);
  const [rejectComment, setRejectComment] = useState('');

  useEffect(() => { load(); }, [page, filters]);

  const load = async () => {
    setLoading(true);
    try {
      const params = { page };
      if (filters.status) params.status = filters.status;
      if (filters.review_status) params.review_status = filters.review_status;
      const res = await adminApi.getProjects(params);
      setProjects(res.data.data || []);
      setMeta(res.data.meta || {});
    } catch {
      toast.error('Erreur lors du chargement des projets');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    if (!window.confirm('Voulez-vous approuver ce projet ? Il sera automatiquement ouvert aux investisseurs.')) return;
    try {
      await adminApi.approveProject(id);
      toast.success('Projet approuvé et ouvert aux investisseurs');
      load();
      if (selected?.id === String(id)) loadDetail(id);
    } catch (err) {
      toast.error(err.response?.data?.errors?.[0] || err.response?.data?.error || 'Erreur lors de l\'approbation');
    }
  };

  const handleReject = async () => {
    if (!rejectComment.trim()) { toast.error('Veuillez fournir un commentaire'); return; }
    try {
      await adminApi.rejectProject(rejectId, rejectComment);
      toast.success('Projet rejeté');
      setShowRejectModal(false);
      setRejectComment('');
      setRejectId(null);
      load();
      if (selected?.id === String(rejectId)) loadDetail(rejectId);
    } catch (err) {
      toast.error(err.response?.data?.errors?.[0] || err.response?.data?.error || 'Erreur lors du rejet');
    }
  };

  const loadDetail = async (id) => {
    try {
      const res = await adminApi.getProject(id);
      setSelected(res.data.data || null);
    } catch {
      toast.error('Erreur lors du chargement');
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Gestion des Projets d'Investissement</h1>
          <p className="text-muted">Examinez, approuvez ou rejetez les projets soumis</p>
        </div>
        <span className="badge"><Briefcase size={12} /> {meta.total_count ?? projects.length} projet(s)</span>
      </div>

      <div className="filters-bar">
        <div className="form-group" style={{ minWidth: 180 }}>
          <label>Statut</label>
          <select value={filters.status} onChange={(e) => { setFilters({ ...filters, status: e.target.value }); setPage(1); }}>
            <option value="">Tous les statuts</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div className="form-group" style={{ minWidth: 180 }}>
          <label>Validation</label>
          <select value={filters.review_status} onChange={(e) => { setFilters({ ...filters, review_status: e.target.value }); setPage(1); }}>
            <option value="">Toutes les validations</option>
            {Object.entries(REVIEW_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
      </div>

      <div className="admin-layout">
        <div>
          {loading ? (
            <div className="page-loading"><div className="spinner" /></div>
          ) : projects.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <Search size={48} />
                <p>Aucun projet trouvé</p>
              </div>
            </div>
          ) : (
            <>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Titre</th><th>Propriété</th><th>Porteur</th><th>Statut</th>
                      <th>Validation</th><th>Montant total</th><th>Progression</th><th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projects.map((p) => {
                      const a = p.attributes || p;
                      const progress = a.funding_progress_percent || 0;
                      return (
                        <tr key={p.id} className={selected?.id === p.id ? 'row-selected' : ''}>
                          <td style={{ fontWeight: 550 }}>{a.title}</td>
                          <td>{a.property_title || '—'}</td>
                          <td>{a.owner_name || '—'}</td>
                          <td><span className={`badge ${STATUS_BADGE[a.status] || ''}`}>{STATUS_LABELS[a.status] || a.status}</span></td>
                          <td><span className={`badge ${REVIEW_BADGE[a.review_status] || ''}`}>{REVIEW_LABELS[a.review_status] || a.review_status}</span></td>
                          <td>{fmt(a.total_amount_cents)}</td>
                          <td>
                            <div style={{ minWidth: 80 }}>
                              <div className="progress-bar-container">
                                <div className="progress-bar" style={{ width: `${Math.min(progress, 100)}%` }} />
                              </div>
                              <span style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>{progress}%</span>
                            </div>
                          </td>
                          <td>
                            <div className="actions-cell">
                              <button className="btn-icon" title="Voir" onClick={() => loadDetail(p.id)}><Eye size={16} /></button>
                              {a.review_status === 'en_attente' && (
                                <>
                                  <button className="btn-icon btn-success" title="Approuver" onClick={() => handleApprove(p.id)}><CheckCircle size={16} /></button>
                                  <button className="btn-icon btn-danger" title="Rejeter" onClick={() => { setRejectId(p.id); setShowRejectModal(true); }}><XCircle size={16} /></button>
                                </>
                              )}
                            </div>
                          </td>
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

        {selected && (() => {
          const a = selected.attributes || selected;
          const progress = a.funding_progress_percent || 0;
          return (
            <div className="card user-detail-panel">
              <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                <div className="stat-icon stat-icon-primary" style={{ margin: '0 auto .5rem', width: 48, height: 48 }}>
                  <Briefcase size={24} />
                </div>
                <h3 style={{ marginBottom: '.15rem' }}>{a.title}</h3>
                <div style={{ display: 'flex', gap: '.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <span className={`badge ${STATUS_BADGE[a.status] || ''}`}>{STATUS_LABELS[a.status] || a.status}</span>
                  <span className={`badge ${REVIEW_BADGE[a.review_status] || ''}`}>{REVIEW_LABELS[a.review_status] || a.review_status}</span>
                </div>
              </div>
              <div className="divider" />

              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.8rem', color: 'var(--text-muted)', marginBottom: '.25rem' }}>
                  <span>Progression du financement</span>
                  <span>{progress}%</span>
                </div>
                <div className="progress-bar-container">
                  <div className="progress-bar" style={{ width: `${Math.min(progress, 100)}%` }} />
                </div>
                <div className="progress-info">
                  <span>{fmt(a.amount_raised_cents)}</span>
                  <span>{fmt(a.total_amount_cents)}</span>
                </div>
              </div>

              <div className="detail-grid">
                <div className="detail-row"><span>ID</span><span className="font-mono" style={{ fontSize: '.8rem' }}>{selected.id}</span></div>
                <div className="detail-row"><span>Propriété</span><span>{a.property_title} ({a.property_city})</span></div>
                <div className="detail-row"><span>Porteur</span><span>{a.owner_name || '—'}</span></div>
                <div className="detail-row"><span>Prix de part</span><span>{fmt(a.share_price_cents)}</span></div>
                <div className="detail-row"><span>Parts vendues</span><span>{a.shares_sold} / {a.total_shares}</span></div>
                <div className="detail-row"><span>Invest. min</span><span>{fmt(a.min_investment_cents)}</span></div>
                {a.max_investment_cents && <div className="detail-row"><span>Invest. max</span><span>{fmt(a.max_investment_cents)}</span></div>}
                <div className="detail-row"><span>Frais de gestion</span><span>{a.management_fee_percent}%</span></div>
                {a.gross_yield_percent && <div className="detail-row"><span>Rendement brut</span><span className="text-success">{a.gross_yield_percent}%</span></div>}
                {a.net_yield_percent && <div className="detail-row"><span>Rendement net</span><span className="text-success">{a.net_yield_percent}%</span></div>}
                <div className="detail-row"><span>Début financement</span><span>{a.funding_start_date ? new Date(a.funding_start_date).toLocaleDateString('fr-FR') : '—'}</span></div>
                <div className="detail-row"><span>Fin financement</span><span>{a.funding_end_date ? new Date(a.funding_end_date).toLocaleDateString('fr-FR') : '—'}</span></div>
                <div className="detail-row"><span>Créé le</span><span>{new Date(a.created_at).toLocaleDateString('fr-FR')}</span></div>
              </div>

              {a.review_comment && (
                <>
                  <div className="divider" />
                  <div>
                    <span style={{ fontSize: '.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>Commentaire de validation</span>
                    <p style={{ fontSize: '.85rem', marginTop: '.25rem', color: a.review_status === 'rejete' ? 'var(--danger)' : 'var(--text)' }}>
                      {a.review_comment}
                    </p>
                    {a.reviewer_name && <span style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>Par {a.reviewer_name} le {a.reviewed_at ? new Date(a.reviewed_at).toLocaleDateString('fr-FR') : ''}</span>}
                  </div>
                </>
              )}

              {a.review_status === 'en_attente' && (
                <div className="detail-actions">
                  <button className="btn btn-success btn-sm" onClick={() => handleApprove(selected.id)}>
                    <ShieldCheck size={14} /> Approuver
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => { setRejectId(selected.id); setShowRejectModal(true); }}>
                    <ShieldX size={14} /> Rejeter
                  </button>
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {showRejectModal && (
        <div className="modal-overlay" onClick={() => setShowRejectModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Rejeter le projet</h3>
            <p className="text-muted" style={{ marginBottom: '1rem' }}>
              Indiquez la raison du rejet. Le porteur de projet sera informé.
            </p>
            <div className="form-group">
              <label>Commentaire de rejet</label>
              <textarea value={rejectComment} onChange={(e) => setRejectComment(e.target.value)}
                placeholder="Décrivez les raisons du rejet..." rows={4} />
            </div>
            <div className="modal-actions">
              <button className="btn" onClick={() => setShowRejectModal(false)}>Annuler</button>
              <button className="btn btn-danger" onClick={handleReject}>Rejeter le projet</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
