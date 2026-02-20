import { useState, useEffect } from 'react';
import { delaysApi } from '../../api/delays';
import { investmentProjectsApi } from '../../api/investments';
import {
  AlertTriangle, Plus, Search, Eye, Edit, Trash2, Calendar, Clock,
} from 'lucide-react';
import toast from 'react-hot-toast';
import FormSelect from '../../components/FormSelect';
import { LoadingSpinner, Pagination } from '../../components/ui';
import {
  DELAY_TYPE_LABELS,
  DELAY_STATUS_LABELS,
  DELAY_STATUS_BADGES,
} from '../../utils';

const EMPTY_FORM = {
  project_id: '',
  title: '',
  delay_type: 'livraison',
  description: '',
  justification: '',
  original_date: '',
  new_estimated_date: '',
  supporting_documents: [],
};

export default function PorteurDelaysPage() {
  const [delays, setDelays] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', project_id: '' });
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [submitting, setSubmitting] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailDelay, setDetailDelay] = useState(null);

  useEffect(() => { loadDelays(); }, [page, filters]);
  useEffect(() => { loadProjects(); }, []);

  const loadDelays = async () => {
    setLoading(true);
    try {
      const params = { page };
      if (filters.status) params.status = filters.status;
      const res = filters.project_id
        ? await delaysApi.listByProject(filters.project_id, params)
        : await delaysApi.list(params);
      setDelays(res.data.data || []);
      setMeta(res.data.meta || {});
    } catch {
      toast.error('Erreur lors du chargement des retards');
    } finally {
      setLoading(false);
    }
  };

  const loadProjects = async () => {
    try {
      const res = await investmentProjectsApi.list();
      setProjects((res.data.data || []).filter((p) => {
        const s = (p.attributes || p).status;
        return !['draft', 'rejected'].includes(s);
      }));
    } catch { /* ignore */ }
  };

  const openCreateModal = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setShowModal(true);
  };

  const openEditModal = (delay) => {
    const a = delay.attributes || delay;
    setEditingId(delay.id);
    setForm({
      project_id: a.project_id || '',
      title: a.title || '',
      delay_type: a.delay_type || 'livraison',
      description: a.description || '',
      justification: a.justification || '',
      original_date: a.original_date || '',
      new_estimated_date: a.new_estimated_date || '',
      supporting_documents: [],
    });
    setShowModal(true);
  };

  const openDetailModal = (delay) => {
    setDetailDelay(delay);
    setShowDetailModal(true);
  };

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.description.trim() || !form.original_date || !form.new_estimated_date) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        title: form.title,
        delay_type: form.delay_type,
        description: form.description,
        justification: form.justification,
        original_date: form.original_date,
        new_estimated_date: form.new_estimated_date,
        supporting_documents: form.supporting_documents,
      };
      if (editingId) {
        await delaysApi.update(editingId, payload);
        toast.success('Retard modifie');
      } else {
        if (!form.project_id) { toast.error('Veuillez selectionner un projet'); setSubmitting(false); return; }
        await delaysApi.create(form.project_id, payload);
        toast.success('Retard declare');
      }
      setShowModal(false);
      setForm({ ...EMPTY_FORM });
      setEditingId(null);
      loadDelays();
    } catch (err) {
      toast.error(err.response?.data?.errors?.[0] || err.response?.data?.error || 'Erreur');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce retard ?')) return;
    try {
      await delaysApi.delete(id);
      toast.success('Retard supprime');
      loadDelays();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors de la suppression');
    }
  };

  const calcDays = (orig, est) => {
    if (!orig || !est) return '—';
    const diff = Math.round((new Date(est) - new Date(orig)) / (1000 * 60 * 60 * 24));
    return diff > 0 ? `${diff}j` : '—';
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Gestion des Retards</h1>
          <p className="text-muted">Declarez et suivez les retards de vos projets</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
          <span className="badge"><AlertTriangle size={12} /> {meta.total_count ?? delays.length} retard(s)</span>
          <button className="btn btn-primary" onClick={openCreateModal}>
            <Plus size={16} /> Declarer un retard
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'end' }}>
        <div className="form-group" style={{ marginBottom: 0, flex: '1 1 200px' }}>
          <label>Projet</label>
          <FormSelect
            value={filters.project_id}
            onChange={(e) => { setFilters({ ...filters, project_id: e.target.value }); setPage(1); }}
            placeholder="Tous les projets"
            options={projects.map((p) => ({ value: String(p.id), label: (p.attributes || p).title }))}
          />
        </div>
        <div className="form-group" style={{ marginBottom: 0, flex: '1 1 200px' }}>
          <label>Statut</label>
          <FormSelect
            value={filters.status}
            onChange={(e) => { setFilters({ ...filters, status: e.target.value }); setPage(1); }}
            placeholder="Tous les statuts"
            options={Object.entries(DELAY_STATUS_LABELS).map(([k, v]) => ({ value: k, label: v }))}
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <LoadingSpinner />
      ) : delays.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <Search size={48} />
            <p>Aucun retard declare</p>
          </div>
        </div>
      ) : (
        <>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Projet</th>
                  <th>Titre</th>
                  <th>Type</th>
                  <th>Date prevue</th>
                  <th>Nouvelle date</th>
                  <th>Retard</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {delays.map((d) => {
                  const a = d.attributes || d;
                  return (
                    <tr key={d.id}>
                      <td data-label="Projet" style={{ fontWeight: 550 }}>{a.project_title}</td>
                      <td data-label="Titre">{a.title}</td>
                      <td data-label="Type"><span className="badge">{DELAY_TYPE_LABELS[a.delay_type] || a.delay_type}</span></td>
                      <td data-label="Date prevue">{a.original_date ? new Date(a.original_date).toLocaleDateString('fr-FR') : '—'}</td>
                      <td data-label="Nouvelle date">{a.new_estimated_date ? new Date(a.new_estimated_date).toLocaleDateString('fr-FR') : '—'}</td>
                      <td data-label="Retard"><span style={{ fontWeight: 600, color: 'var(--danger)' }}>{a.delay_days ? `${a.delay_days}j` : calcDays(a.original_date, a.new_estimated_date)}</span></td>
                      <td data-label="Statut"><span className={`badge ${DELAY_STATUS_BADGES[a.status] || ''}`}>{DELAY_STATUS_LABELS[a.status] || a.status}</span></td>
                      <td data-label="Actions">
                        <div className="actions-cell">
                          <button className="btn-icon" title="Voir" onClick={() => openDetailModal(d)}><Eye size={16} /></button>
                          {a.status === 'declared' && (
                            <>
                              <button className="btn-icon" title="Modifier" onClick={() => openEditModal(d)}><Edit size={16} /></button>
                              <button className="btn-icon btn-danger" title="Supprimer" onClick={() => handleDelete(d.id)}><Trash2 size={16} /></button>
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

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <h3>{editingId ? 'Modifier le retard' : 'Declarer un retard'}</h3>
            <p className="text-muted" style={{ marginBottom: '1rem' }}>
              {editingId ? 'Modifiez les informations du retard.' : 'Renseignez les details du retard rencontre.'}
            </p>

            {!editingId && (
              <div className="form-group">
                <label>Projet *</label>
                <FormSelect
                  value={form.project_id}
                  onChange={(e) => setForm({ ...form, project_id: e.target.value })}
                  placeholder="Selectionnez un projet..."
                  options={projects.map((p) => ({ value: String(p.id), label: (p.attributes || p).title }))}
                />
              </div>
            )}

            <div className="form-group">
              <label>Titre *</label>
              <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ex: Retard livraison materiaux" />
            </div>

            <div className="form-group">
              <label>Type de retard</label>
              <FormSelect
                value={form.delay_type}
                onChange={(e) => setForm({ ...form, delay_type: e.target.value })}
                options={Object.entries(DELAY_TYPE_LABELS).map(([k, v]) => ({ value: k, label: v }))}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label><Calendar size={14} /> Date prevue *</label>
                <input type="date" value={form.original_date} onChange={(e) => setForm({ ...form, original_date: e.target.value })} />
              </div>
              <div className="form-group">
                <label><Clock size={14} /> Nouvelle date *</label>
                <input type="date" value={form.new_estimated_date} onChange={(e) => setForm({ ...form, new_estimated_date: e.target.value })} />
              </div>
            </div>

            {form.original_date && form.new_estimated_date && (
              <p style={{ fontSize: '.85rem', color: 'var(--danger)', fontWeight: 600, marginBottom: '1rem' }}>
                Retard estime : {calcDays(form.original_date, form.new_estimated_date)}
              </p>
            )}

            <div className="form-group">
              <label>Description *</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Decrivez le retard rencontre..." rows={3} />
            </div>

            <div className="form-group">
              <label>Justification</label>
              <textarea value={form.justification} onChange={(e) => setForm({ ...form, justification: e.target.value })}
                placeholder="Justifiez le retard (optionnel)..." rows={3} />
            </div>

            <div className="form-group">
              <label>Documents justificatifs</label>
              <input
                type="file"
                multiple
                onChange={(e) => setForm({ ...form, supporting_documents: Array.from(e.target.files) })}
              />
            </div>

            <div className="modal-actions">
              <button className="btn" onClick={() => setShowModal(false)}>Annuler</button>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Envoi...' : editingId ? 'Enregistrer' : 'Declarer le retard'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && detailDelay && (() => {
        const a = detailDelay.attributes || detailDelay;
        return (
          <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
              <h3>{a.title}</h3>
              <div className="detail-grid" style={{ marginTop: '1rem' }}>
                <div className="detail-row"><span>Projet</span><span>{a.project_title}</span></div>
                <div className="detail-row"><span>Type</span><span className="badge">{DELAY_TYPE_LABELS[a.delay_type] || a.delay_type}</span></div>
                <div className="detail-row"><span>Date prevue</span><span>{a.original_date ? new Date(a.original_date).toLocaleDateString('fr-FR') : '—'}</span></div>
                <div className="detail-row"><span>Nouvelle date</span><span>{a.new_estimated_date ? new Date(a.new_estimated_date).toLocaleDateString('fr-FR') : '—'}</span></div>
                <div className="detail-row"><span>Retard</span><span style={{ fontWeight: 600, color: 'var(--danger)' }}>{a.delay_days ? `${a.delay_days} jours` : '—'}</span></div>
                <div className="detail-row"><span>Statut</span><span className={`badge ${DELAY_STATUS_BADGES[a.status] || ''}`}>{DELAY_STATUS_LABELS[a.status] || a.status}</span></div>
                <div className="detail-row"><span>Declare par</span><span>{a.declared_by}</span></div>
                <div className="detail-row"><span>Date de declaration</span><span>{a.created_at ? new Date(a.created_at).toLocaleDateString('fr-FR') : '—'}</span></div>
                {a.resolved_at && <div className="detail-row"><span>Resolu le</span><span>{new Date(a.resolved_at).toLocaleDateString('fr-FR')}</span></div>}
              </div>
              {a.description && (
                <div style={{ marginTop: '1rem' }}>
                  <strong>Description</strong>
                  <p style={{ marginTop: '.25rem', whiteSpace: 'pre-wrap', background: 'rgba(0,0,0,0.03)', padding: '.75rem', borderRadius: '8px' }}>{a.description}</p>
                </div>
              )}
              {a.justification && (
                <div style={{ marginTop: '1rem' }}>
                  <strong>Justification</strong>
                  <p style={{ marginTop: '.25rem', whiteSpace: 'pre-wrap', background: 'rgba(0,0,0,0.03)', padding: '.75rem', borderRadius: '8px' }}>{a.justification}</p>
                </div>
              )}
              {a.supporting_documents?.length > 0 && (
                <div style={{ marginTop: '1rem' }}>
                  <strong>Documents ({a.supporting_documents.length})</strong>
                  <div style={{ marginTop: '.5rem', display: 'flex', flexDirection: 'column', gap: '.25rem' }}>
                    {a.supporting_documents.map((doc) => (
                      <a key={doc.id} href={doc.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '.85rem' }}>
                        {doc.filename}
                      </a>
                    ))}
                  </div>
                </div>
              )}
              <div className="modal-actions" style={{ marginTop: '1.5rem' }}>
                <button className="btn" onClick={() => setShowDetailModal(false)}>Fermer</button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
