import { useState, useEffect } from 'react';
import { propertiesApi } from '../../api/properties';
import { investmentProjectsApi, investmentsApi } from '../../api/investments';
import { useAuth } from '../../context/AuthContext';
import {
  Building, MapPin, ArrowLeft, Plus, Pencil, Trash2, TrendingUp, X,
} from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_LABELS = {
  brouillon: 'Brouillon', en_financement: 'En financement', finance: 'Financé',
  en_gestion: 'En gestion', vendu: 'Vendu', annule: 'Annulé',
};
const TYPE_LABELS = {
  appartement: 'Appartement', maison: 'Maison', immeuble: 'Immeuble',
  commercial: 'Commercial', terrain: 'Terrain',
};

const EMPTY_PROPERTY = {
  title: '', description: '', property_type: 'appartement', address_line1: '', address_line2: '',
  city: '', postal_code: '', country: 'France', surface_area_sqm: '', acquisition_price_cents: '',
  estimated_value_cents: '', estimated_annual_yield_percent: '', investment_duration_months: '',
};

const EMPTY_PROJECT = {
  title: '', description: '', total_amount_cents: '', share_price_cents: '',
  total_shares: '', min_investment_cents: '', max_investment_cents: '',
  start_date: '', end_date: '',
};

export default function PropertiesPage() {
  const { user } = useAuth();
  const [properties, setProperties] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list');
  const [selected, setSelected] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [investAmount, setInvestAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // CRUD state
  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null);
  const [propertyForm, setPropertyForm] = useState({ ...EMPTY_PROPERTY });
  const [projectForm, setProjectForm] = useState({ ...EMPTY_PROJECT });

  const isOwner = user?.role === 'porteur_de_projet' || user?.role === 'administrateur';

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [propRes, projRes] = await Promise.allSettled([
        propertiesApi.list(),
        investmentProjectsApi.list(),
      ]);
      if (propRes.status === 'fulfilled') setProperties(propRes.value.data.data || []);
      if (projRes.status === 'fulfilled') setProjects(projRes.value.data.data || []);
    } catch {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const fmt = (cents) => {
    if (cents == null) return '—';
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(cents / 100);
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

  const handleInvest = async (projectId) => {
    const cents = Math.round(parseFloat(investAmount) * 100);
    if (!cents || cents <= 0) { toast.error('Montant invalide'); return; }
    setSubmitting(true);
    try {
      await investmentsApi.create(projectId, cents);
      toast.success('Investissement effectué !');
      setInvestAmount('');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.errors?.join(', ') || 'Erreur');
    } finally {
      setSubmitting(false);
    }
  };

  // === Property CRUD ===
  const openCreateProperty = () => {
    setEditingProperty(null);
    setPropertyForm({ ...EMPTY_PROPERTY });
    setShowPropertyModal(true);
  };

  const openEditProperty = (prop) => {
    const a = prop.attributes || prop;
    setEditingProperty(prop);
    setPropertyForm({
      title: a.title || '', description: a.description || '', property_type: a.property_type || 'appartement',
      address_line1: a.address_line1 || '', address_line2: a.address_line2 || '',
      city: a.city || '', postal_code: a.postal_code || '', country: a.country || 'France',
      surface_area_sqm: a.surface_area_sqm || '', acquisition_price_cents: a.acquisition_price_cents ? a.acquisition_price_cents / 100 : '',
      estimated_value_cents: a.estimated_value_cents ? a.estimated_value_cents / 100 : '',
      estimated_annual_yield_percent: a.estimated_annual_yield_percent || '',
      investment_duration_months: a.investment_duration_months || '',
    });
    setShowPropertyModal(true);
  };

  const handleSaveProperty = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const data = {
        property: {
          ...propertyForm,
          acquisition_price_cents: Math.round(parseFloat(propertyForm.acquisition_price_cents) * 100) || 0,
          estimated_value_cents: Math.round(parseFloat(propertyForm.estimated_value_cents) * 100) || 0,
          surface_area_sqm: parseFloat(propertyForm.surface_area_sqm) || 0,
          estimated_annual_yield_percent: parseFloat(propertyForm.estimated_annual_yield_percent) || 0,
          investment_duration_months: parseInt(propertyForm.investment_duration_months) || 0,
        },
      };
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

  // === Investment Project CRUD ===
  const openCreateProject = (propertyId) => {
    setProjectForm({ ...EMPTY_PROJECT });
    setShowProjectModal(propertyId);
  };

  const handleSaveProject = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const data = {
        ...projectForm,
        total_amount_cents: Math.round(parseFloat(projectForm.total_amount_cents) * 100) || 0,
        share_price_cents: Math.round(parseFloat(projectForm.share_price_cents) * 100) || 0,
        total_shares: parseInt(projectForm.total_shares) || 0,
        min_investment_cents: Math.round(parseFloat(projectForm.min_investment_cents) * 100) || 0,
        max_investment_cents: Math.round(parseFloat(projectForm.max_investment_cents) * 100) || 0,
      };
      await investmentProjectsApi.create(showProjectModal, data);
      toast.success("Projet d'investissement créé");
      setShowProjectModal(false);
      loadData();
      if (selected) viewProperty(selected.id);
    } catch (err) {
      toast.error(err.response?.data?.errors?.join(', ') || 'Erreur');
    } finally {
      setSubmitting(false);
    }
  };

  const setPF = (field) => (e) => setPropertyForm({ ...propertyForm, [field]: e.target.value });
  const setPJ = (field) => (e) => setProjectForm({ ...projectForm, [field]: e.target.value });

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;

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
            {isOwner && (
              <>
                <button className="btn btn-sm" onClick={() => openEditProperty(selected)}><Pencil size={14} /> Modifier</button>
                <button className="btn btn-sm btn-ghost-danger" onClick={() => handleDeleteProperty(selected.id)}><Trash2 size={14} /></button>
              </>
            )}
          </div>
        </div>

        <div className="two-col">
          <div className="two-col-main">
            <div className="card">
              <h3>Informations du bien</h3>
              <div className="detail-grid">
                <div className="detail-row"><span>Type</span><span>{TYPE_LABELS[a.property_type] || a.property_type}</span></div>
                <div className="detail-row"><span>Surface</span><span>{a.surface_area_sqm} m²</span></div>
                <div className="detail-row"><span>Prix d'acquisition</span><span>{fmt(a.acquisition_price_cents)}</span></div>
                <div className="detail-row"><span>Valeur estimée</span><span>{fmt(a.estimated_value_cents)}</span></div>
                <div className="detail-row"><span>Rendement annuel</span><span className="text-success">{a.estimated_annual_yield_percent}%</span></div>
                <div className="detail-row"><span>Durée d'investissement</span><span>{a.investment_duration_months} mois</span></div>
              </div>
              {a.description && (
                <>
                  <div className="divider" />
                  <p style={{ fontSize: '.9rem', color: 'var(--text-secondary)' }}>{a.description}</p>
                </>
              )}
            </div>

            {pa && (
              <div className="card">
                <div className="card-header">
                  <h3>Projet : {pa.title}</h3>
                  <span className={`badge badge-${pa.status === 'ouvert' ? 'success' : pa.status === 'cloture' ? 'danger' : 'info'}`}>
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

                {user?.role === 'investisseur' && pa.status === 'ouvert' && (
                  <div className="invest-form">
                    <h4>Investir dans ce projet</h4>
                    {pa.min_investment_cents && (
                      <div className="invest-constraints">
                        <span>Min : {fmt(pa.min_investment_cents)}</span>
                        {pa.max_investment_cents && <span>Max : {fmt(pa.max_investment_cents)}</span>}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: '.75rem' }}>
                      <div className="form-group" style={{ flex: 1 }}>
                        <input type="number" step="0.01" min="0.01" value={investAmount}
                          onChange={(e) => setInvestAmount(e.target.value)} placeholder="Montant en EUR" />
                      </div>
                      <button className="btn btn-primary" disabled={submitting}
                        onClick={() => handleInvest(selectedProject.id)}>
                        {submitting ? '...' : 'Investir'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {isOwner && !pa && (
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
                <div className="detail-row"><span>Rendement</span><span className="text-success">{a.estimated_annual_yield_percent}%</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // === LIST VIEW ===
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Biens Immobiliers</h1>
          <p className="text-muted">Découvrez les opportunités d'investissement immobilier</p>
        </div>
        {isOwner && (
          <button className="btn btn-primary" onClick={openCreateProperty}>
            <Plus size={16} /> Ajouter un bien
          </button>
        )}
      </div>

      {properties.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <Building size={48} />
            <p>Aucun bien immobilier disponible</p>
            {isOwner && (
              <button className="btn btn-primary" onClick={openCreateProperty}>
                <Plus size={16} /> Ajouter votre premier bien
              </button>
            )}
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
                      <label>Rendement</label>
                      <span className="yield">{a.estimated_annual_yield_percent}%</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Property Modal */}
      {showPropertyModal && (
        <div className="modal-overlay" onClick={() => setShowPropertyModal(false)}>
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0 }}>{editingProperty ? 'Modifier le bien' : 'Ajouter un bien immobilier'}</h3>
              <button className="btn-icon" onClick={() => setShowPropertyModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSaveProperty}>
              <div className="form-section">
                <div className="form-section-title">Informations générales</div>
                <div className="form-group" style={{ marginBottom: '.75rem' }}>
                  <label>Titre</label>
                  <input value={propertyForm.title} onChange={setPF('title')} required placeholder="Ex: Appartement T3 Lyon" />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Type de bien</label>
                    <select value={propertyForm.property_type} onChange={setPF('property_type')}>
                      <option value="appartement">Appartement</option>
                      <option value="maison">Maison</option>
                      <option value="immeuble">Immeuble</option>
                      <option value="commercial">Commercial</option>
                      <option value="terrain">Terrain</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Surface (m²)</label>
                    <input type="number" step="0.1" value={propertyForm.surface_area_sqm} onChange={setPF('surface_area_sqm')} required />
                  </div>
                </div>
                <div className="form-group" style={{ marginTop: '.75rem' }}>
                  <label>Description</label>
                  <textarea value={propertyForm.description} onChange={setPF('description')} placeholder="Description du bien..." />
                </div>
              </div>

              <div className="form-section">
                <div className="form-section-title">Adresse</div>
                <div className="form-group" style={{ marginBottom: '.75rem' }}>
                  <label>Adresse ligne 1</label>
                  <input value={propertyForm.address_line1} onChange={setPF('address_line1')} required />
                </div>
                <div className="form-group" style={{ marginBottom: '.75rem' }}>
                  <label>Adresse ligne 2</label>
                  <input value={propertyForm.address_line2} onChange={setPF('address_line2')} />
                </div>
                <div className="form-row">
                  <div className="form-group"><label>Ville</label><input value={propertyForm.city} onChange={setPF('city')} required /></div>
                  <div className="form-group"><label>Code postal</label><input value={propertyForm.postal_code} onChange={setPF('postal_code')} required /></div>
                  <div className="form-group"><label>Pays</label><input value={propertyForm.country} onChange={setPF('country')} /></div>
                </div>
              </div>

              <div className="form-section">
                <div className="form-section-title">Financier</div>
                <div className="form-row">
                  <div className="form-group"><label>Prix d'acquisition (EUR)</label><input type="number" step="0.01" value={propertyForm.acquisition_price_cents} onChange={setPF('acquisition_price_cents')} required /></div>
                  <div className="form-group"><label>Valeur estimée (EUR)</label><input type="number" step="0.01" value={propertyForm.estimated_value_cents} onChange={setPF('estimated_value_cents')} required /></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label>Rendement annuel (%)</label><input type="number" step="0.01" value={propertyForm.estimated_annual_yield_percent} onChange={setPF('estimated_annual_yield_percent')} /></div>
                  <div className="form-group"><label>Durée investissement (mois)</label><input type="number" value={propertyForm.investment_duration_months} onChange={setPF('investment_duration_months')} /></div>
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn" onClick={() => setShowPropertyModal(false)}>Annuler</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Enregistrement...' : editingProperty ? 'Mettre à jour' : 'Créer le bien'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Investment Project Modal */}
      {showProjectModal && (
        <div className="modal-overlay" onClick={() => setShowProjectModal(false)}>
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0 }}>Créer un projet d'investissement</h3>
              <button className="btn-icon" onClick={() => setShowProjectModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSaveProject}>
              <div className="form-section">
                <div className="form-section-title">Informations du projet</div>
                <div className="form-group" style={{ marginBottom: '.75rem' }}>
                  <label>Titre</label>
                  <input value={projectForm.title} onChange={setPJ('title')} required placeholder="Ex: Projet d'investissement Lyon T3" />
                </div>
                <div className="form-group" style={{ marginBottom: '.75rem' }}>
                  <label>Description</label>
                  <textarea value={projectForm.description} onChange={setPJ('description')} placeholder="Description du projet..." />
                </div>
              </div>

              <div className="form-section">
                <div className="form-section-title">Paramètres financiers</div>
                <div className="form-row">
                  <div className="form-group"><label>Montant total (EUR)</label><input type="number" step="0.01" value={projectForm.total_amount_cents} onChange={setPJ('total_amount_cents')} required /></div>
                  <div className="form-group"><label>Prix par part (EUR)</label><input type="number" step="0.01" value={projectForm.share_price_cents} onChange={setPJ('share_price_cents')} required /></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label>Nombre total de parts</label><input type="number" value={projectForm.total_shares} onChange={setPJ('total_shares')} required /></div>
                  <div className="form-group"><label>Investissement min (EUR)</label><input type="number" step="0.01" value={projectForm.min_investment_cents} onChange={setPJ('min_investment_cents')} /></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label>Investissement max (EUR)</label><input type="number" step="0.01" value={projectForm.max_investment_cents} onChange={setPJ('max_investment_cents')} /></div>
                </div>
              </div>

              <div className="form-section">
                <div className="form-section-title">Dates</div>
                <div className="form-row">
                  <div className="form-group"><label>Date de début</label><input type="date" value={projectForm.start_date} onChange={setPJ('start_date')} /></div>
                  <div className="form-group"><label>Date de fin</label><input type="date" value={projectForm.end_date} onChange={setPJ('end_date')} /></div>
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn" onClick={() => setShowProjectModal(false)}>Annuler</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Création...' : 'Créer le projet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
