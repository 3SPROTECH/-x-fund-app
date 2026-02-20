import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { propertiesApi } from '../../api/properties';
import { investmentProjectsApi } from '../../api/investments';
import { useAuth } from '../../context/AuthContext';
import {
  Building, MapPin, ArrowLeft, Plus, Pencil, Trash2, TrendingUp,
} from 'lucide-react';
import toast from 'react-hot-toast';
import PropertyFormModal from '../../components/PropertyFormModal';
import { formatCents as fmt, PROPERTY_STATUS_LABELS as STATUS_LABELS, PROPERTY_TYPE_LABELS as TYPE_LABELS } from '../../utils';
import { LoadingSpinner } from '../../components/ui';

export default function PorteurPropertiesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list');
  const [selected, setSelected] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // CRUD state
  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [propRes, projRes] = await Promise.allSettled([
        propertiesApi.list(),
        investmentProjectsApi.list(),
      ]);
      if (propRes.status === 'fulfilled') setProperties(propRes.value.data.data || []);
      else if (propRes.reason?.response?.status !== 401) {
        console.warn('Erreur chargement propriétés:', propRes.reason);
      }
      if (projRes.status === 'fulfilled') setProjects(projRes.value.data.data || []);
      else if (projRes.reason?.response?.status !== 401) {
        console.warn('Erreur chargement projets:', projRes.reason);
      }
      if (propRes.status === 'rejected' && projRes.status === 'rejected') {
        toast.error('Erreur lors du chargement des données');
      }
    } catch (error) {
      console.error('Erreur inattendue:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const viewProperty = async (id) => {
    try {
      const res = await propertiesApi.get(id);
      setSelected(res.data.data);
      const proj = projects.find((p) => {
        const a = p.attributes || p;
        return String(a.property_id) === String(id);
      });
      setSelectedProject(proj || null);
      setView('detail');
    } catch {
      toast.error('Erreur');
    }
  };

  const openCreateProperty = () => {
    setEditingProperty(null);
    setShowPropertyModal(true);
  };

  const openEditProperty = (prop) => {
    setEditingProperty(prop);
    setShowPropertyModal(true);
  };

  const handleSaveProperty = async (formData) => {
    setSubmitting(true);
    try {
      const isImmeuble = formData.property_type === 'immeuble';
      const lotsAttributes = isImmeuble
        ? formData.lots.map(l => ({
          ...(l.id ? { id: l.id } : {}),
          lot_number: l.lot_number,
          surface_area_sqm: parseFloat(l.surface_area_sqm) || null,
          description: l.description || '',
        }))
        : [];
      const existingLotIds = (formData.lots || []).filter(l => l.id).map(l => ({ id: l.id, _destroy: true }));
      const data = {
        property: {
          ...formData,
          acquisition_price_cents: Math.round(parseFloat(formData.acquisition_price_cents) * 100) || 0,
          estimated_value_cents: Math.round(parseFloat(formData.estimated_value_cents) * 100) || 0,
          surface_area_sqm: parseFloat(formData.surface_area_sqm) || 0,
          number_of_lots: isImmeuble ? (parseInt(formData.number_of_lots) || null) : null,
          lots_attributes: isImmeuble ? lotsAttributes : existingLotIds,
        },
      };
      delete data.property.lots;
      if (editingProperty) {
        await propertiesApi.update(editingProperty.id, data);
        toast.success('Bien mis à jour');
      } else {
        await propertiesApi.create(data);
        toast.success('Bien créé');
      }
      setShowPropertyModal(false);
      loadData();
      if (editingProperty && selected?.id === editingProperty.id) {
        viewProperty(editingProperty.id);
      }
    } catch (err) {
      toast.error(err.response?.data?.errors?.join(', ') || 'Erreur');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProperty = async (id) => {
    if (!window.confirm('Voulez-vous vraiment supprimer ce bien ?')) return;
    try {
      await propertiesApi.delete(id);
      toast.success('Bien supprimé');
      setView('list');
      setSelected(null);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors de la suppression');
    }
  };

  const openCreateProject = (propertyId) => {
    if (!propertyId) {
      toast.error('Erreur: ID du bien non valide');
      return;
    }
    navigate(`/projects/new?propertyId=${propertyId}`);
  };

  if (loading) return <LoadingSpinner />;

  // === DETAIL VIEW ===
  if (view === 'detail' && selected) {
    const a = selected.attributes || selected;
    const pa = selectedProject?.attributes || selectedProject;
    return (
      <div className="page">
        <button className="btn btn-ghost" onClick={() => { setView('list'); setSelected(null); }}>
          <ArrowLeft size={16} /> Retour aux biens
        </button>

        <div className="page-header" style={{ marginTop: '1rem' }}>
          <div>
            <h1>{a.title}</h1>
            <p className="text-muted"><MapPin size={14} /> {[a.address_line1, a.city, a.postal_code].filter(Boolean).join(', ') || 'Adresse non renseignée'}</p>
          </div>
          <div className="page-header-actions">
            <span className={`badge badge-${a.status === 'en_gestion' || a.status === 'finance' ? 'success' : a.status === 'annule' ? 'danger' : 'info'}`}>
              {STATUS_LABELS[a.status] || a.status}
            </span>
            <button className="btn btn-sm" onClick={() => openEditProperty(selected)}><Pencil size={14} /> Modifier</button>
            <button className="btn btn-sm btn-ghost-danger" onClick={() => handleDeleteProperty(selected.id)}><Trash2 size={14} /></button>
          </div>
        </div>

        <div className="two-col">
          <div className="two-col-main">
            <div className="card">
              <h3>Informations du bien</h3>
              <div className="detail-grid">
                <div className="detail-row"><span>Type</span><span>{TYPE_LABELS[a.property_type] || a.property_type}</span></div>
                {a.property_type === 'immeuble' && a.number_of_lots && (
                  <div className="detail-row"><span>Nombre de lots</span><span>{a.number_of_lots}</span></div>
                )}
                <div className="detail-row"><span>Surface totale</span><span>{a.surface_area_sqm} m²</span></div>
                <div className="detail-row"><span>Prix d'acquisition</span><span>{fmt(a.acquisition_price_cents)}</span></div>
                <div className="detail-row"><span>Valeur estimée</span><span>{fmt(a.estimated_value_cents)}</span></div>
                {pa && <div className="detail-row"><span>Rendement net annuel</span><span className="text-success">{pa.net_yield_percent ?? '—'}%</span></div>}
                {pa && pa.funding_start_date && pa.funding_end_date && (
                  <div className="detail-row">
                    <span>Période de financement</span>
                    <span>{new Date(pa.funding_start_date).toLocaleDateString('fr-FR')} - {new Date(pa.funding_end_date).toLocaleDateString('fr-FR')}</span>
                  </div>
                )}
              </div>
              {a.description && (
                <>
                  <div className="divider" />
                  <p style={{ fontSize: '.9rem', color: 'var(--text-secondary)' }}>{a.description}</p>
                </>
              )}
              {a.property_type === 'immeuble' && a.lots?.length > 0 && (
                <>
                  <div className="divider" />
                  <h4 style={{ marginBottom: '.75rem' }}>Lots ({a.lots.length})</h4>
                  <div style={{ display: 'grid', gap: '.5rem' }}>
                    {a.lots.map((lot) => (
                      <div key={lot.id} style={{ display: 'flex', gap: '1rem', padding: '.5rem .75rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
                        <span style={{ fontWeight: 600, minWidth: '50px' }}>Lot {lot.lot_number}</span>
                        {lot.surface_area_sqm && <span>{lot.surface_area_sqm} m²</span>}
                        {lot.description && <span style={{ color: 'var(--text-muted)' }}>{lot.description}</span>}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {pa && (
              <div className="card">
                <div className="card-header">
                  <h3>Projet : {pa.title}</h3>
                  <span className={`badge badge-${pa.status === 'funding_active' ? 'success' : pa.status === 'rejected' ? 'danger' : 'info'}`}>
                    {pa.status}
                  </span>
                </div>
                <div className="detail-grid">
                  <div className="detail-row"><span>Montant total</span><span>{fmt(pa.total_amount_cents)}</span></div>
                  <div className="detail-row"><span>Prix par part</span><span>{fmt(pa.share_price_cents)}</span></div>
                  <div className="detail-row"><span>Parts totales</span><span>{pa.total_shares ?? '—'}</span></div>
                  <div className="detail-row"><span>Parts disponibles</span><span>{pa.available_shares ?? '—'}</span></div>
                </div>
                {pa.funding_progress_percent != null && (
                  <div style={{ marginTop: '1rem' }}>
                    <div className="progress-bar-container">
                      <div className="progress-bar" style={{ width: `${Math.min(pa.funding_progress_percent, 100)}%` }} />
                    </div>
                    <div className="progress-info">
                      <span>{pa.funding_progress_percent}% financé</span>
                      <span>{fmt(pa.total_amount_cents)}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {!pa && (
              <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
                <TrendingUp size={32} style={{ color: 'var(--text-muted)', marginBottom: '.5rem' }} />
                <p className="text-muted" style={{ marginBottom: '.75rem' }}>Aucun projet d'investissement associé</p>
                <button className="btn btn-primary" onClick={() => openCreateProject(selected.id)}>
                  <Plus size={16} /> Créer un projet d'investissement
                </button>
              </div>
            )}
          </div>

          <div className="two-col-side">
            <div className="card">
              <h3>Résumé</h3>
              <div className="detail-grid">
                <div className="detail-row"><span>ID</span><span className="font-mono" style={{ fontSize: '.8rem' }}>{selected.id}</span></div>
                <div className="detail-row"><span>Statut</span><span className={`badge badge-${a.status === 'en_gestion' ? 'success' : 'info'}`}>{STATUS_LABELS[a.status] || a.status}</span></div>
                <div className="detail-row"><span>Type</span><span>{TYPE_LABELS[a.property_type] || a.property_type}</span></div>
                {pa && <div className="detail-row"><span>Rendement net</span><span className="text-success">{pa.net_yield_percent ?? '—'}%</span></div>}
              </div>
            </div>
          </div>
        </div>

        <PropertyFormModal
          isOpen={showPropertyModal}
          onClose={() => setShowPropertyModal(false)}
          onSubmit={handleSaveProperty}
          initialData={editingProperty}
          submitting={submitting}
        />
      </div>
    );
  }

  // === LIST VIEW ===
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Biens Immobiliers</h1>
          <p className="text-muted">Gérez vos biens et créez des projets d'investissement</p>
        </div>
        <button className="btn btn-primary" onClick={openCreateProperty}>
          <Plus size={16} /> Ajouter un bien
        </button>
      </div>

      {properties.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <Building size={48} />
            <p>Aucun bien immobilier disponible</p>
            <button className="btn btn-primary" onClick={openCreateProperty}>
              <Plus size={16} /> Ajouter votre premier bien
            </button>
          </div>
        </div>
      ) : (
        <div className="property-grid">
          {properties.map((p) => {
            const a = p.attributes || p;
            return (
              <div key={p.id} className="property-card card-hover" onClick={() => viewProperty(p.id)}>
                <div className="property-card-body">
                  <div className="property-card-header">
                    <Building size={20} style={{ color: 'var(--primary)' }} />
                    <span className={`badge badge-${a.status === 'en_gestion' || a.status === 'finance' ? 'success' : a.status === 'annule' ? 'danger' : 'info'}`}>
                      {STATUS_LABELS[a.status] || a.status}
                    </span>
                  </div>
                  <h3>{a.title}</h3>
                  <p className="text-muted"><MapPin size={14} /> {a.city || 'Non renseigné'}</p>
                  <div className="property-card-meta">
                    <span className="property-type">{TYPE_LABELS[a.property_type] || a.property_type}</span>
                    <span className="property-type">{a.surface_area_sqm} m²</span>
                  </div>
                  <div className="property-card-stats">
                    <div className="property-card-stat">
                      <label>Valeur estimée</label>
                      <span>{fmt(a.estimated_value_cents)}</span>
                    </div>
                    <div className="property-card-stat">
                      <label>Statut</label>
                      <span className={`badge badge-${a.status === 'en_gestion' ? 'success' : 'info'}`}>{STATUS_LABELS[a.status] || a.status}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <PropertyFormModal
        isOpen={showPropertyModal}
        onClose={() => setShowPropertyModal(false)}
        onSubmit={handleSaveProperty}
        initialData={editingProperty}
        submitting={submitting}
      />
    </div>
  );
}
