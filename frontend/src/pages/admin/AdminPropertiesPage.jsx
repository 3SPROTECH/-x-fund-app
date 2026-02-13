import { useState, useEffect } from 'react';
import { adminApi } from '../../api/admin';
import {
  Building, Eye, Trash2, ChevronLeft, ChevronRight,
  Search, MapPin, Home,
} from 'lucide-react';
import toast from 'react-hot-toast';

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

const fmt = (cents) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format((cents || 0) / 100);

export default function AdminPropertiesPage() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', property_type: '' });
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({});
  const [selected, setSelected] = useState(null);

  useEffect(() => { load(); }, [page, filters]);

  const load = async () => {
    setLoading(true);
    try {
      const params = { page };
      if (filters.status) params.status = filters.status;
      if (filters.property_type) params.property_type = filters.property_type;
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

  const handleStatusChange = async (id, status) => {
    try {
      await adminApi.updateProperty(id, { status });
      toast.success('Statut mis à jour');
      load();
      if (selected?.id === String(id)) loadDetail(id);
    } catch (err) {
      toast.error(err.response?.data?.errors?.[0] || 'Erreur lors de la mise à jour');
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Gestion des Biens Immobiliers</h1>
          <p className="text-muted">Visualisez et gérez tous les biens de la plateforme</p>
        </div>
        <span className="badge"><Building size={12} /> {meta.total_count ?? properties.length} bien(s)</span>
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
          <label>Type</label>
          <select value={filters.property_type} onChange={(e) => { setFilters({ ...filters, property_type: e.target.value }); setPage(1); }}>
            <option value="">Tous les types</option>
            {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
      </div>

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
                        <tr key={p.id} className={selected?.id === p.id ? 'row-selected' : ''}>
                          <td style={{ fontWeight: 550 }}>{a.title}</td>
                          <td>{a.owner_name || '—'}</td>
                          <td><span style={{ display: 'flex', alignItems: 'center', gap: '.3rem' }}><MapPin size={13} />{a.city}</span></td>
                          <td><span className="badge">{TYPE_LABELS[a.property_type] || a.property_type}</span></td>
                          <td><span className={`badge ${STATUS_BADGE[a.status] || ''}`}>{STATUS_LABELS[a.status] || a.status}</span></td>
                          <td>{fmt(a.acquisition_price_cents)}</td>
                          <td>
                            <div className="actions-cell">
                              <button className="btn-icon" title="Voir" onClick={() => loadDetail(p.id)}><Eye size={16} /></button>
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
                <div className="detail-row"><span>Prix d'acquisition</span><span>{fmt(a.acquisition_price_cents)}</span></div>
                <div className="detail-row"><span>Valeur estimée</span><span>{fmt(a.estimated_value_cents)}</span></div>
                <div className="detail-row"><span>Projet lié</span><span>{a.has_investment_project ? 'Oui' : 'Non'}</span></div>
                <div className="detail-row"><span>Créé le</span><span>{new Date(a.created_at).toLocaleDateString('fr-FR')}</span></div>
              </div>

              <div className="divider" />
              <div className="form-group">
                <label>Changer le statut</label>
                <select value={a.status} onChange={(e) => handleStatusChange(selected.id, e.target.value)}>
                  {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
