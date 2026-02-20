import { useState, useEffect } from 'react';
import { propertiesApi } from '../../api/properties';
import { investmentProjectsApi, investmentsApi } from '../../api/investments';
import { useAuth } from '../../context/AuthContext';
import { Building, MapPin, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCents as fmt, PROPERTY_STATUS_LABELS as STATUS_LABELS, PROPERTY_TYPE_LABELS as TYPE_LABELS } from '../../utils';
import { LoadingSpinner } from '../../components/ui';

export default function InvestorPropertiesPage() {
  const { user } = useAuth();
  const [properties, setProperties] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list');
  const [selected, setSelected] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [investAmount, setInvestAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [propRes, projRes] = await Promise.allSettled([
        propertiesApi.list(),
        investmentProjectsApi.list(),
      ]);
      if (propRes.status === 'fulfilled') setProperties(propRes.value.data.data || []);
      if (projRes.status === 'fulfilled') setProjects(projRes.value.data.data || []);
      if (propRes.status === 'rejected' && projRes.status === 'rejected') {
        toast.error('Erreur lors du chargement des données');
      }
    } catch {
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
          <span className={`badge badge-${a.status === 'en_gestion' || a.status === 'finance' ? 'success' : a.status === 'annule' ? 'danger' : 'info'}`}>
            {STATUS_LABELS[a.status] || a.status}
          </span>
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

                {user?.role === 'investisseur' && pa.status === 'funding_active' && (
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
      </div>

      {properties.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <Building size={48} />
            <p>Aucun bien immobilier disponible</p>
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
    </div>
  );
}
