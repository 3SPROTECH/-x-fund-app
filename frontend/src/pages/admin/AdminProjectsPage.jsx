import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../../api/admin';
import {
  Briefcase, CheckCircle, XCircle,
  Search, Eye, FileText, AlertCircle, ArrowRight, UserCheck, RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import TableFilters from '../../components/TableFilters';
import FormSelect from '../../components/FormSelect';
import {
  formatBalance as fmt,
  PROJECT_STATUS_LABELS as STATUS_LABELS,
  PROJECT_STATUS_BADGES as STATUS_BADGE,
  ANALYST_OPINION_LABELS,
  ANALYST_OPINION_BADGES,
} from '../../utils';
import { LoadingSpinner, Pagination } from '../../components/ui';

export default function AdminProjectsPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', owner_id: '', analyst_id: '', analyst_opinion: '' });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({});
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [targetId, setTargetId] = useState(null);
  const [modalComment, setModalComment] = useState('');
  const [advanceStatus, setAdvanceStatus] = useState('');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [analysts, setAnalysts] = useState([]);
  const [selectedAnalystId, setSelectedAnalystId] = useState('');
  const [ownerOptions, setOwnerOptions] = useState([]);
  const [analystOptions, setAnalystOptions] = useState([]);

  // Fetch filter options on mount
  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        const [ownerRes, analystRes] = await Promise.all([
          adminApi.getUsers({ role: 'porteur_de_projet', per_page: 200 }),
          adminApi.getUsers({ role: 'analyste', per_page: 200 }),
        ]);
        setOwnerOptions((ownerRes.data.data || []).map((u) => {
          const a = u.attributes || u;
          return { value: String(u.id), label: `${a.first_name} ${a.last_name}` };
        }));
        setAnalystOptions((analystRes.data.data || []).map((u) => {
          const a = u.attributes || u;
          return { value: String(u.id), label: `${a.first_name} ${a.last_name}` };
        }));
      } catch { /* silent */ }
    };
    loadFilterOptions();
  }, []);

  useEffect(() => { load(); }, [page, filters, search]);

  const load = async () => {
    setLoading(true);
    try {
      const params = { page };
      if (filters.status) params.status = filters.status;
      if (filters.owner_id) params.owner_id = filters.owner_id;
      if (filters.analyst_id) params.analyst_id = filters.analyst_id;
      if (filters.analyst_opinion) params.analyst_opinion = filters.analyst_opinion;
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
    if (!window.confirm('Voulez-vous approuver ce projet ?')) return;
    try {
      await adminApi.approveProject(id);
      toast.success('Projet approuvé');
      load();
    } catch (err) {
      toast.error(err.response?.data?.errors?.[0] || err.response?.data?.error || 'Erreur lors de l\'approbation');
    }
  };

  const handleReject = async () => {
    if (!modalComment.trim()) { toast.error('Veuillez fournir un commentaire'); return; }
    try {
      await adminApi.rejectProject(targetId, modalComment);
      toast.success('Projet rejeté');
      setShowRejectModal(false);
      setModalComment('');
      setTargetId(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.errors?.[0] || err.response?.data?.error || 'Erreur lors du rejet');
    }
  };

  const handleRequestInfo = async () => {
    if (!modalComment.trim()) { toast.error('Veuillez fournir un commentaire'); return; }
    try {
      await adminApi.requestInfo(targetId, modalComment);
      toast.success('Demande de compléments envoyée');
      setShowInfoModal(false);
      setModalComment('');
      setTargetId(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.errors?.[0] || err.response?.data?.error || 'Erreur');
    }
  };

  const openAssignModal = async (projectId) => {
    setTargetId(projectId);
    setSelectedAnalystId('');
    try {
      const res = await adminApi.getUsers({ role: 'analyste', per_page: 100 });
      setAnalysts(res.data.data || []);
    } catch {
      toast.error('Erreur lors du chargement des analystes');
    }
    setShowAssignModal(true);
  };

  const handleAssignAnalyst = async () => {
    if (!selectedAnalystId) { toast.error('Veuillez selectionner un analyste'); return; }
    try {
      await adminApi.assignAnalyst(targetId, selectedAnalystId);
      toast.success('Analyste assigne avec succes');
      setShowAssignModal(false);
      setTargetId(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.errors?.[0] || 'Erreur lors de l\'assignation');
    }
  };

  const handleAdvanceStatus = async () => {
    if (!advanceStatus) { toast.error('Veuillez sélectionner un statut'); return; }
    try {
      await adminApi.advanceStatus(targetId, advanceStatus, modalComment);
      toast.success(`Statut mis à jour: ${STATUS_LABELS[advanceStatus]}`);
      setShowAdvanceModal(false);
      setModalComment('');
      setAdvanceStatus('');
      setTargetId(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.errors?.[0] || err.response?.data?.error || 'Erreur');
    }
  };

  return (
    <div className="page admin-projects-page">
      <div className="page-header">
        <div>
          <h1>Gestion des Projets d'Investissement</h1>
          <p className="text-muted">Examinez, approuvez ou rejetez les projets soumis</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
          <span className="badge"><Briefcase size={12} /> {meta.total_count ?? projects.length} projet(s)</span>
        </div>
      </div>

      <TableFilters
        filters={[
          { key: 'status', label: 'Statut', value: filters.status, options: [
            { value: '', label: 'Tous les statuts' },
            ...Object.entries(STATUS_LABELS).map(([k, v]) => ({ value: k, label: v })),
          ]},
          { key: 'owner_id', label: 'Porteur', value: filters.owner_id, searchable: true, options: [
            { value: '', label: 'Tous les porteurs' },
            ...ownerOptions,
          ]},
          { key: 'analyst_id', label: 'Analyste', value: filters.analyst_id, searchable: true, options: [
            { value: '', label: 'Tous les analystes' },
            ...analystOptions,
          ]},
          { key: 'analyst_opinion', label: 'Avis', value: filters.analyst_opinion, options: [
            { value: '', label: 'Tous les avis' },
            ...Object.entries(ANALYST_OPINION_LABELS).map(([k, v]) => ({ value: k, label: v })),
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
            <LoadingSpinner />
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
                      <th>Titre</th><th>Porteur</th><th>Statut</th>
                      <th>Analyste</th><th>Avis</th>
                      <th>Montant total</th><th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projects.map((p) => {
                      const a = p.attributes || p;
                      const progress = a.funding_progress_percent || 0;
                      return (
                        <tr key={p.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/admin/projects/${p.id}`)}>
                          <td data-label="Titre" style={{ fontWeight: 550 }}>{a.title}</td>
                          <td data-label="Porteur">{a.owner_name || '—'}</td>
                          <td data-label="Statut"><span className={`badge ${STATUS_BADGE[a.status] || ''}`}>{STATUS_LABELS[a.status] || a.status}</span></td>
                          <td data-label="Analyste">{a.analyst_name || <span className="text-muted">—</span>}</td>
                          <td data-label="Avis">
                            {a.analyst_id ? (
                              <span className={`badge ${ANALYST_OPINION_BADGES[a.analyst_opinion] || ''}`}>
                                {ANALYST_OPINION_LABELS[a.analyst_opinion] || '—'}
                              </span>
                            ) : '—'}
                          </td>
                          <td data-label="Montant">{fmt(a.total_amount_cents)}</td>
                          <td data-label="Actions">
                            <div className="actions-cell" onClick={(e) => e.stopPropagation()}>
                              <button className="btn-icon" title="Voir le détail" onClick={() => navigate(`/admin/projects/${p.id}`)}><Eye size={16} /></button>
                              <button className="btn-icon" title="Changer le statut" onClick={() => { setTargetId(p.id); setAdvanceStatus(a.status); setShowAdvanceModal(true); }}><RefreshCw size={16} /></button>
                              {(a.status === 'pending_analysis' || a.status === 'info_requested') && (
                                <button className="btn-icon" title="Assigner un analyste" onClick={() => openAssignModal(p.id)} style={{ color: '#DAA520' }}><UserCheck size={16} /></button>
                              )}
                              {(a.status === 'pending_analysis' || a.status === 'analyst_approved') && (
                                <>
                                  <button className="btn-icon btn-success" title="Approuver" onClick={() => handleApprove(p.id)}><CheckCircle size={16} /></button>
                                  <button className="btn-icon btn-danger" title="Rejeter" onClick={() => { setTargetId(p.id); setShowRejectModal(true); }}><XCircle size={16} /></button>
                                  <button className="btn-icon" title="Demander des complements" onClick={() => { setTargetId(p.id); setShowInfoModal(true); }}><AlertCircle size={16} /></button>
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

              <Pagination page={page} totalPages={meta.total_pages} onPageChange={setPage} />
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
              <textarea value={modalComment} onChange={(e) => setModalComment(e.target.value)}
                placeholder="Décrivez les raisons du rejet..." rows={4} />
            </div>
            <div className="modal-actions">
              <button className="btn" onClick={() => setShowRejectModal(false)}>Annuler</button>
              <button className="btn btn-danger" onClick={handleReject}>Rejeter le projet</button>
            </div>
          </div>
        </div>
      )}

      {showInfoModal && (
        <div className="modal-overlay" onClick={() => setShowInfoModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Demander des compléments</h3>
            <p className="text-muted" style={{ marginBottom: '1rem' }}>
              Précisez les informations ou documents manquants. Le porteur pourra modifier son projet.
            </p>
            <div className="form-group">
              <label>Commentaire</label>
              <textarea value={modalComment} onChange={(e) => setModalComment(e.target.value)}
                placeholder="Décrivez les informations manquantes..." rows={4} />
            </div>
            <div className="modal-actions">
              <button className="btn" onClick={() => setShowInfoModal(false)}>Annuler</button>
              <button className="btn btn-primary" onClick={handleRequestInfo}>Envoyer la demande</button>
            </div>
          </div>
        </div>
      )}

      {showAssignModal && (
        <div className="modal-overlay" onClick={() => setShowAssignModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Assigner un analyste</h3>
            <p className="text-muted" style={{ marginBottom: '1rem' }}>
              Selectionnez l'analyste qui sera charge d'evaluer ce projet.
            </p>
            <div className="form-group">
              <label>Analyste</label>
              <FormSelect
                value={selectedAnalystId}
                onChange={(e) => setSelectedAnalystId(e.target.value)}
                placeholder="Selectionnez un analyste..."
                options={analysts.map((a) => {
                  const attrs = a.attributes || a;
                  return { value: String(a.id), label: `${attrs.first_name} ${attrs.last_name} (${attrs.email})` };
                })}
              />
              {analysts.length === 0 && (
                <p className="text-muted" style={{ fontSize: '.8rem', marginTop: '.25rem' }}>
                  Aucun analyste disponible. Creez d'abord un analyste dans la gestion des utilisateurs.
                </p>
              )}
            </div>
            <div className="modal-actions">
              <button className="btn" onClick={() => setShowAssignModal(false)}>Annuler</button>
              <button className="btn btn-primary" onClick={handleAssignAnalyst} disabled={!selectedAnalystId}>
                Assigner
              </button>
            </div>
          </div>
        </div>
      )}

      {showAdvanceModal && (
        <div className="modal-overlay" onClick={() => setShowAdvanceModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Changer le statut</h3>
            <p className="text-muted" style={{ marginBottom: '1rem' }}>
              Selectionnez le nouveau statut pour ce projet.
            </p>
            <div className="form-group">
              <label>Nouveau statut</label>
              <FormSelect
                value={advanceStatus}
                onChange={(e) => setAdvanceStatus(e.target.value)}
                placeholder="Selectionnez un statut..."
                options={Object.entries(STATUS_LABELS).map(([k, v]) => ({ value: k, label: v }))}
              />
            </div>
            <div className="form-group">
              <label>Commentaire (optionnel)</label>
              <textarea value={modalComment} onChange={(e) => setModalComment(e.target.value)}
                placeholder="Ajoutez un commentaire..." rows={3} />
            </div>
            <div className="modal-actions">
              <button className="btn" onClick={() => { setShowAdvanceModal(false); setModalComment(''); }}>Annuler</button>
              <button className="btn btn-primary" onClick={handleAdvanceStatus} disabled={!advanceStatus}>
                Mettre a jour
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
