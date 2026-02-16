import { useState, useEffect } from 'react';
import { adminApi } from '../../api/admin';
import {
  Building, Trash2, ChevronLeft, ChevronRight,
  Search, MapPin, Home, Plus, Pencil, X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import TableFilters from '../../components/TableFilters';
import FormSelect from '../../components/FormSelect';

const STATUS_LABELS = {
  brouillon: 'Brouillon', en_financement: 'En financement', finance: 'Financé',
  en_gestion: 'En gestion', vendu: 'Vendu', annule: 'Annulé',
};
const STATUS_BADGE = {
  brouillon: 'badge-warning', en_financement: 'badge-info', finance: 'badge-success',
  en_gestion: 'badge-primary', vendu: 'badge', annule: 'badge-danger',
};
const TYPE_LABELS = {
  appartement: 'Appartement', maison: 'Maison', immeuble: 'Immeuble',
  commercial: 'Commercial', terrain: 'Terrain',
};

const EMPTY_PROPERTY = {
  title: '', description: '', property_type: 'appartement', address_line1: '', address_line2: '',
  city: '', postal_code: '', country: 'France', surface_area_sqm: '', acquisition_price_cents: '',
  estimated_value_cents: '', status: 'brouillon', number_of_lots: '', lots: [],
};

const fmt = (cents) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format((cents || 0) / 100);

export default function AdminPropertiesPage() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', property_type: '' });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({});
  const [selected, setSelected] = useState(null);

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ ...EMPTY_PROPERTY });
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { load(); }, [page, filters, search]);

  const load = async () => {
    setLoading(true);
    try {
      const params = { page };
      if (filters.status) params.status = filters.status;
      if (filters.property_type) params.property_type = filters.property_type;
      if (search) params.search = search;
      const res = await adminApi.getProperties(params);
      setProperties(res.data.data || []);
      setMeta(res.data.meta || {});
    } catch {
      toast.error('Erreur lors du chargement des biens');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Voulez-vous vraiment supprimer ce bien immobilier ?')) return;
    try {
      await adminApi.deleteProperty(id);
      toast.success('Bien supprimé');
      load();
      if (selected?.id === String(id)) setSelected(null);
    } catch (err) {
      toast.error(err.response?.data?.errors?.[0] || err.response?.data?.error || 'Erreur lors de la suppression');
    }
  };

  const loadDetail = async (id) => {
    try {
      const res = await adminApi.getProperty(id);
      setSelected(res.data.data || null);
    } catch {
      toast.error('Erreur lors du chargement');
    }
  };

  const openCreateModal = () => {
    setEditingId(null);
    setEditForm({ ...EMPTY_PROPERTY });
    setShowEditModal(true);
  };

  const openEditModal = (property) => {
    const a = property.attributes || property;
    setEditingId(property.id);
    setEditForm({
      title: a.title || '',
      description: a.description || '',
      property_type: a.property_type || 'appartement',
      address_line1: a.address_line1 || '',
      address_line2: a.address_line2 || '',
      city: a.city || '',
      postal_code: a.postal_code || '',
      country: a.country || 'France',
      surface_area_sqm: a.surface_area_sqm || '',
      acquisition_price_cents: a.acquisition_price_cents ? a.acquisition_price_cents / 100 : '',
      estimated_value_cents: a.estimated_value_cents ? a.estimated_value_cents / 100 : '',
      status: a.status || 'brouillon',
      number_of_lots: a.number_of_lots || '',
      lots: (a.lots || []).map(l => ({ id: l.id, lot_number: l.lot_number, surface_area_sqm: l.surface_area_sqm || '', description: l.description || '' })),
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const isImmeuble = editForm.property_type === 'immeuble';
    const lotsAttributes = isImmeuble
      ? editForm.lots.map(l => ({
          ...(l.id ? { id: l.id } : {}),
          lot_number: l.lot_number,
          surface_area_sqm: parseFloat(l.surface_area_sqm) || null,
          description: l.description || '',
        }))
      : [];
    const existingLotIds = (editForm.lots || []).filter(l => l.id).map(l => ({ id: l.id, _destroy: true }));
    const payload = {
      title: editForm.title,
      description: editForm.description,
      property_type: editForm.property_type,
      address_line1: editForm.address_line1,
      address_line2: editForm.address_line2,
      city: editForm.city,
      postal_code: editForm.postal_code,
      country: editForm.country,
      surface_area_sqm: parseFloat(editForm.surface_area_sqm) || 0,
      acquisition_price_cents: Math.round(parseFloat(editForm.acquisition_price_cents) * 100) || 0,
      estimated_value_cents: Math.round(parseFloat(editForm.estimated_value_cents) * 100) || 0,
      status: editForm.status,
      number_of_lots: isImmeuble ? (parseInt(editForm.number_of_lots) || null) : null,
      lots_attributes: isImmeuble ? lotsAttributes : existingLotIds,
    };
    try {
      if (editingId) {
        await adminApi.updateProperty(editingId, payload);
        toast.success('Bien mis à jour');
        if (selected?.id === String(editingId)) loadDetail(editingId);
      } else {
        await adminApi.createProperty(payload);
        toast.success('Bien créé avec succès');
      }
      setShowEditModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.errors?.[0] || (editingId ? 'Erreur lors de la mise à jour' : 'Erreur lors de la création'));
    } finally {
      setSubmitting(false);
    }
  };

  const setEF = (field) => (e) => {
    const value = e.target.value;
    setEditForm(prev => {
      const updated = { ...prev, [field]: value };
      if (field === 'number_of_lots') {
        const count = parseInt(value) || 0;
        const currentLots = prev.lots || [];
        const newLots = [];
        for (let i = 0; i < count; i++) {
          newLots.push(currentLots[i] || { lot_number: i + 1, surface_area_sqm: '', description: '' });
        }
        updated.lots = newLots;
      }
      if (field === 'property_type' && value !== 'immeuble') {
        updated.number_of_lots = '';
        updated.lots = [];
      }
      return updated;
    });
  };

  const setLotField = (index, field) => (e) => {
    setEditForm(prev => {
      const lots = [...prev.lots];
      lots[index] = { ...lots[index], [field]: e.target.value };
      return { ...prev, lots };
    });
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Gestion des Biens Immobiliers</h1>
          <p className="text-muted">Visualisez et gérez tous les biens de la plateforme</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
          <span className="badge"><Building size={12} /> {meta.total_count ?? properties.length} bien(s)</span>
          <button className="btn btn-primary" onClick={() => openCreateModal()}>
            <Plus size={16} /> Ajouter un bien
          </button>
        </div>
      </div>

      <TableFilters
        filters={[
          { key: 'status', label: 'Statut', value: filters.status, options: [
            { value: '', label: 'Tous les statuts' },
            ...Object.entries(STATUS_LABELS).map(([k, v]) => ({ value: k, label: v })),
          ]},
          { key: 'property_type', label: 'Type', value: filters.property_type, options: [
            { value: '', label: 'Tous les types' },
            ...Object.entries(TYPE_LABELS).map(([k, v]) => ({ value: k, label: v })),
          ]},
        ]}
        onFilterChange={(key, value) => { setFilters({ ...filters, [key]: value }); setPage(1); }}
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Rechercher un bien..."
      />

      <div className="admin-layout">
        <div>
          {loading ? (
            <div className="page-loading"><div className="spinner" /></div>
          ) : properties.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <Search size={48} />
                <p>Aucun bien trouvé</p>
              </div>
            </div>
          ) : (
            <>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr><th>Titre</th><th>Propriétaire</th><th>Ville</th><th>Type</th><th>Statut</th><th>Prix d'acquisition</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {properties.map((p) => {
                      const a = p.attributes || p;
                      return (
                        <tr key={p.id} style={{ cursor: 'pointer' }} onClick={() => loadDetail(p.id)}>
                          <td style={{ fontWeight: 550 }}>{a.title}</td>
                          <td>{a.owner_name || '—'}</td>
                          <td><span style={{ display: 'flex', alignItems: 'center', gap: '.3rem' }}><MapPin size={13} />{a.city}</span></td>
                          <td><span className="badge">{TYPE_LABELS[a.property_type] || a.property_type}</span></td>
                          <td><span className={`badge ${STATUS_BADGE[a.status] || ''}`}>{STATUS_LABELS[a.status] || a.status}</span></td>
                          <td>{fmt(a.acquisition_price_cents)}</td>
                          <td>
                            <div className="actions-cell" onClick={(e) => e.stopPropagation()}>
                              <button className="btn-icon" title="Modifier" onClick={() => openEditModal(p)}><Pencil size={16} /></button>
                              <button className="btn-icon btn-danger" title="Supprimer" onClick={() => handleDelete(p.id)}><Trash2 size={16} /></button>
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
          return (
            <div className="card user-detail-panel">
              <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                <div className="stat-icon stat-icon-info" style={{ margin: '0 auto .5rem', width: 48, height: 48 }}>
                  <Home size={24} />
                </div>
                <h3 style={{ marginBottom: '.15rem' }}>{a.title}</h3>
                <span className={`badge ${STATUS_BADGE[a.status] || ''}`}>{STATUS_LABELS[a.status] || a.status}</span>
              </div>
              <div className="divider" />
              <div className="detail-grid">
                <div className="detail-row"><span>ID</span><span className="font-mono" style={{ fontSize: '.8rem' }}>{selected.id}</span></div>
                <div className="detail-row"><span>Propriétaire</span><span>{a.owner_name || '—'}</span></div>
                <div className="detail-row"><span>Type</span><span>{TYPE_LABELS[a.property_type] || a.property_type}</span></div>
                <div className="detail-row"><span>Adresse</span><span>{[a.address_line1, a.city, a.postal_code].filter(Boolean).join(', ')}</span></div>
                <div className="detail-row"><span>Surface</span><span>{a.surface_area_sqm ? `${a.surface_area_sqm} m²` : '—'}</span></div>
                {a.property_type === 'immeuble' && a.number_of_lots && (
                  <div className="detail-row"><span>Nombre de lots</span><span>{a.number_of_lots}</span></div>
                )}
                <div className="detail-row"><span>Prix d'acquisition</span><span>{fmt(a.acquisition_price_cents)}</span></div>
                <div className="detail-row"><span>Valeur estimée</span><span>{fmt(a.estimated_value_cents)}</span></div>
                <div className="detail-row"><span>Projet lié</span><span>{a.has_investment_project ? 'Oui' : 'Non'}</span></div>
                <div className="detail-row"><span>Créé le</span><span>{new Date(a.created_at).toLocaleDateString('fr-FR')}</span></div>
              </div>

              {a.property_type === 'immeuble' && a.lots?.length > 0 && (
                <>
                  <div className="divider" />
                  <h4 style={{ fontSize: '.85rem', marginBottom: '.5rem' }}>Lots ({a.lots.length})</h4>
                  <div style={{ display: 'grid', gap: '.35rem' }}>
                    {a.lots.map((lot) => (
                      <div key={lot.id || lot.lot_number} style={{ display: 'flex', gap: '.75rem', padding: '.4rem .6rem', background: 'var(--bg)', borderRadius: 'var(--radius-sm)', fontSize: '.8rem' }}>
                        <span style={{ fontWeight: 600, minWidth: '40px' }}>Lot {lot.lot_number}</span>
                        {lot.surface_area_sqm && <span>{lot.surface_area_sqm} m²</span>}
                        {lot.description && <span style={{ color: 'var(--text-muted)' }}>{lot.description}</span>}
                      </div>
                    ))}
                  </div>
                </>
              )}

              <div className="divider" />
              <div className="detail-actions">
                <button className="btn btn-sm btn-primary" onClick={() => openEditModal(selected)}>
                  <Pencil size={14} /> Modifier
                </button>
                <button className="btn btn-sm btn-danger" onClick={() => handleDelete(selected.id)}>
                  <Trash2 size={14} /> Supprimer
                </button>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Edit Property Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h3 style={{ margin: 0 }}>{editingId ? 'Modifier le bien' : 'Ajouter un bien immobilier'}</h3>
              <button type="button" className="btn-icon" onClick={() => setShowEditModal(false)} aria-label="Fermer"><X size={18} /></button>
            </div>
            <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <div className="modal-body">
                <div className="form-section">
                  <div className="form-section-title">Informations générales</div>
                  <div className="form-group" style={{ marginBottom: '.75rem' }}>
                    <label>Titre</label>
                    <input value={editForm.title} onChange={setEF('title')} required placeholder="Ex: Appartement T3 Lyon" />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Type de bien</label>
                      <FormSelect
                        value={editForm.property_type}
                        onChange={setEF('property_type')}
                        name="property_type"
                        options={Object.entries(TYPE_LABELS).map(([k, v]) => ({ value: k, label: v }))}
                      />
                    </div>
                    <div className="form-group">
                      <label>Surface (m²)</label>
                      <input type="number" step="0.1" value={editForm.surface_area_sqm} onChange={setEF('surface_area_sqm')} required />
                    </div>
                    <div className="form-group">
                      <label>Statut</label>
                      <FormSelect
                        value={editForm.status}
                        onChange={setEF('status')}
                        name="status"
                        options={Object.entries(STATUS_LABELS).map(([k, v]) => ({ value: k, label: v }))}
                      />
                    </div>
                    {editForm.property_type === 'immeuble' && (
                      <div className="form-group">
                        <label>Nombre de lots</label>
                        <input type="number" min="1" max="50" step="1" value={editForm.number_of_lots} onChange={setEF('number_of_lots')} required placeholder="Ex: 4" />
                      </div>
                    )}
                  </div>
                  {editForm.property_type === 'immeuble' && editForm.lots.length > 0 && (
                    <div style={{ marginTop: '1rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '1rem' }}>
                      <div className="form-section-title">Détail des lots</div>
                      {editForm.lots.map((lot, i) => (
                        <div key={i} style={{ display: 'flex', gap: '.75rem', alignItems: 'flex-end', marginBottom: '.75rem' }}>
                          <div style={{ minWidth: '60px', fontWeight: 600, paddingBottom: '.5rem', color: 'var(--text-muted)' }}>
                            Lot {i + 1}
                          </div>
                          <div className="form-group" style={{ flex: 1 }}>
                            <label>Surface (m²)</label>
                            <input type="number" step="0.1" min="0" value={lot.surface_area_sqm} onChange={setLotField(i, 'surface_area_sqm')} placeholder="Surface" />
                          </div>
                          <div className="form-group" style={{ flex: 2 }}>
                            <label>Description</label>
                            <input value={lot.description} onChange={setLotField(i, 'description')} placeholder={`Ex: Appartement T${i + 2}`} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="form-group" style={{ marginTop: '.75rem' }}>
                    <label>Description</label>
                    <textarea value={editForm.description} onChange={setEF('description')} placeholder="Description du bien..." />
                  </div>
                </div>

                <div className="form-section">
                  <div className="form-section-title">Adresse</div>
                  <div className="form-group" style={{ marginBottom: '.75rem' }}>
                    <label>Adresse ligne 1</label>
                    <input value={editForm.address_line1} onChange={setEF('address_line1')} required />
                  </div>
                  <div className="form-group" style={{ marginBottom: '.75rem' }}>
                    <label>Adresse ligne 2</label>
                    <input value={editForm.address_line2} onChange={setEF('address_line2')} />
                  </div>
                  <div className="form-row">
                    <div className="form-group"><label>Ville</label><input value={editForm.city} onChange={setEF('city')} required /></div>
                    <div className="form-group"><label>Code postal</label><input value={editForm.postal_code} onChange={setEF('postal_code')} required /></div>
                    <div className="form-group"><label>Pays</label><input value={editForm.country} onChange={setEF('country')} /></div>
                  </div>
                </div>

                <div className="form-section">
                  <div className="form-section-title">Financier</div>
                  <div className="form-row">
                    <div className="form-group"><label>Prix d'acquisition (EUR)</label><input type="number" step="0.01" value={editForm.acquisition_price_cents} onChange={setEF('acquisition_price_cents')} required /></div>
                    <div className="form-group"><label>Valeur estimée (EUR)</label><input type="number" step="0.01" value={editForm.estimated_value_cents} onChange={setEF('estimated_value_cents')} required /></div>
                  </div>
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn" onClick={() => setShowEditModal(false)}>Annuler</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Enregistrement...' : (editingId ? 'Mettre à jour' : 'Créer le bien')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
