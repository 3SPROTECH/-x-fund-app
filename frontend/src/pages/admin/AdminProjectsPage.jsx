import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../../api/admin';
import {
  Briefcase, CheckCircle, XCircle, ChevronLeft,
  ChevronRight, Search, Plus, Eye, FileText,
} from 'lucide-react';
import toast from 'react-hot-toast';
import TableFilters from '../../components/TableFilters';

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
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', review_status: '' });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({});
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectId, setRejectId] = useState(null);
  const [rejectComment, setRejectComment] = useState('');

  useEffect(() => { load(); }, [page, filters, search]);

  const load = async () => {
    setLoading(true);
    try {
      const params = { page };
      if (filters.status) params.status = filters.status;
      if (filters.review_status) params.review_status = filters.review_status;
      if (search) params.search = search;
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
    } catch (err) {
      toast.error(err.response?.data?.errors?.[0] || err.response?.data?.error || 'Erreur lors du rejet');
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Gestion des Projets d'Investissement</h1>
          <p className="text-muted">Examinez, approuvez ou rejetez les projets soumis</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
          <span className="badge"><Briefcase size={12} /> {meta.total_count ?? projects.length} projet(s)</span>
          <button className="btn btn-primary" onClick={() => navigate('/projects/new')}>
            <Plus size={16} /> Créer un projet
          </button>
        </div>
      </div>

      <TableFilters
        filters={[
          { key: 'status', label: 'Statut', value: filters.status, options: [
            { value: '', label: 'Tous les statuts' },
            ...Object.entries(STATUS_LABELS).map(([k, v]) => ({ value: k, label: v })),
          ]},
          { key: 'review_status', label: 'Validation', value: filters.review_status, options: [
            { value: '', label: 'Toutes les validations' },
            ...Object.entries(REVIEW_LABELS).map(([k, v]) => ({ value: k, label: v })),
          ]},
        ]}
        onFilterChange={(key, value) => { setFilters({ ...filters, [key]: value }); setPage(1); }}
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Rechercher un projet..."
      />

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
                        <tr key={p.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/projects/${p.id}`)}>
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
                            <div className="actions-cell" onClick={(e) => e.stopPropagation()}>
                              <button className="btn-icon" title="Voir le détail" onClick={() => navigate(`/projects/${p.id}`)}><Eye size={16} /></button>
                              <button className="btn-icon" title="Rapport MVP" onClick={() => navigate(`/admin/projects/${p.id}/mvp-report`)}><FileText size={16} /></button>
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
