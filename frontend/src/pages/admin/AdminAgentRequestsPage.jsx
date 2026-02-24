import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../../api/admin';
import { Headphones, Search, Eye, UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import FormSelect from '../../components/FormSelect';
import {
  PROJECT_STATUS_LABELS as STATUS_LABELS,
  PROJECT_STATUS_BADGES as STATUS_BADGE,
} from '../../utils';
import { LoadingSpinner, Pagination } from '../../components/ui';

export default function AdminAgentRequestsPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({});
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [targetId, setTargetId] = useState(null);
  const [analysts, setAnalysts] = useState([]);
  const [selectedAnalystId, setSelectedAnalystId] = useState('');

  useEffect(() => { load(); }, [page, search]);

  const load = async () => {
    setLoading(true);
    try {
      const params = { page, needs_analyst: true };
      if (search) params.search = search;
      const res = await adminApi.getProjects(params);
      setProjects(res.data.data || []);
      setMeta(res.data.meta || {});
    } catch {
      toast.error('Erreur lors du chargement des demandes');
    } finally {
      setLoading(false);
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
      toast.error(err.response?.data?.errors?.[0] || "Erreur lors de l'assignation");
    }
  };

  return (
    <div className="page admin-projects-page">
      <div className="page-header">
        <div>
          <h1>Gestion des agents</h1>
          <p className="text-muted">Projets en attente d'assignation d'un analyste</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
          <span className="badge"><Headphones size={12} /> {meta.total_count ?? projects.length} demande(s)</span>
        </div>
      </div>

      <div className="table-filters">
        <div className="table-filters-search">
          <Search size={16} />
          <input
            type="text"
            placeholder="Rechercher un projet..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      <div className="admin-layout">
        <div>
          {loading ? (
            <LoadingSpinner />
          ) : projects.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <Headphones size={48} />
                <p>Aucune demande en attente</p>
                <small className="text-muted">Tous les projets ont un analyste assigne.</small>
              </div>
            </div>
          ) : (
            <>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Projet</th>
                      <th>Porteur</th>
                      <th>Statut</th>
                      <th>Date de soumission</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projects.map((p) => {
                      const a = p.attributes || p;
                      return (
                        <tr key={p.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/admin/projects/${p.id}`)}>
                          <td data-label="Projet" style={{ fontWeight: 550 }}>{a.title}</td>
                          <td data-label="Porteur">{a.owner_name || '—'}</td>
                          <td data-label="Statut">
                            <span className={`badge ${STATUS_BADGE[a.status] || ''}`}>
                              {STATUS_LABELS[a.status] || a.status}
                            </span>
                          </td>
                          <td data-label="Date">
                            {a.created_at ? new Date(a.created_at).toLocaleDateString('fr-FR') : '—'}
                          </td>
                          <td data-label="Actions">
                            <div className="actions-cell" onClick={(e) => e.stopPropagation()}>
                              <button className="btn-icon" title="Voir le detail" onClick={() => navigate(`/admin/projects/${p.id}`)}>
                                <Eye size={16} />
                              </button>
                              <button
                                className="btn-icon"
                                title="Assigner un analyste"
                                onClick={() => openAssignModal(p.id)}
                                style={{ color: '#DAA520' }}
                              >
                                <UserCheck size={16} />
                              </button>
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

      {showAssignModal && (
        <div className="modal-overlay" onClick={() => setShowAssignModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Assigner un analyste</h3>
            <p className="text-muted" style={{ marginBottom: '1rem' }}>
              Selectionnez l'analyste qui sera charge d'evaluer ce projet et d'accompagner le porteur.
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
    </div>
  );
}
