import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { investmentProjectsApi } from '../../api/investments';
import { useAuth } from '../../context/AuthContext';
import { TrendingUp, MapPin, ChevronLeft, ChevronRight, Plus, Calendar, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { getImageUrl } from '../../api/client';

const STATUS_LABELS = { brouillon: 'Brouillon', ouvert: 'Ouvert', finance: 'Financé', cloture: 'Clôturé', annule: 'Annulé' };
const STATUS_BADGE = { brouillon: 'badge-warning', ouvert: 'badge-success', finance: 'badge-info', cloture: '', annule: 'badge-danger' };

const formatCents = (c) => c == null ? '—' : new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(c / 100);
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—';

export default function ProjectsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({});
  const [statusFilter, setStatusFilter] = useState('');

  const canCreateProject = user?.role === 'porteur_de_projet' || user?.role === 'administrateur';

  useEffect(() => { loadProjects(); }, [page, statusFilter]);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const params = { page };
      if (statusFilter) params.status = statusFilter;
      const res = await investmentProjectsApi.list(params);
      setProjects(res.data.data || []);
      setMeta(res.data.meta || {});
    } catch {
      toast.error('Erreur lors du chargement des projets');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Projets d'investissement</h1>
          <p className="text-muted">Découvrez les opportunités et suivez l'avancement du financement</p>
        </div>
        {canCreateProject && (
          <button type="button" className="btn btn-primary" onClick={() => navigate('/projects/new')}>
            <Plus size={16} /> Créer un projet
          </button>
        )}
      </div>

      <div className="filters-bar">
        <div className="form-group" style={{ minWidth: 180 }}>
          <label>Statut</label>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="">Tous</option>
            <option value="ouvert">Ouvert</option>
            <option value="finance">Financé</option>
            <option value="cloture">Clôturé</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="page-loading"><div className="spinner" /></div>
      ) : projects.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <TrendingUp size={48} />
            <p>Aucun projet disponible</p>
            {canCreateProject && (
              <button type="button" className="btn btn-primary" onClick={() => navigate('/properties')}>
                <Plus size={16} /> Créer un projet depuis Mes biens
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="project-grid">
            {projects.map(p => {
              const a = p.attributes || p;
              const progress = Math.min(a.funding_progress_percent || 0, 100);
              const firstImage = (a.images && a.images.length > 0) ? a.images[0] : (a.property_photos && a.property_photos.length > 0) ? a.property_photos[0] : null;

              return (
                <div key={p.id} className="project-card" onClick={() => navigate(`/projects/${p.id}`)}>
                  {/* Image section */}
                  <div style={{
                    width: '100%',
                    aspectRatio: '16/9',
                    overflow: 'hidden',
                    borderRadius: '12px 12px 0 0',
                    backgroundColor: '#f5f5f5',
                  }}>
                    {firstImage ? (
                      <img
                        src={getImageUrl(firstImage.url)}
                        alt={a.title}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'contain',
                        }}
                      />
                    ) : (
                      <div style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--text-secondary)',
                        background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.1) 0%, rgba(124, 58, 237, 0.1) 100%)',
                      }}>
                        <ImageIcon size={40} opacity={0.3} />
                      </div>
                    )}
                  </div>

                  <div className="project-card-body">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '.5rem' }}>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 650, margin: 0 }}>{a.title}</h3>
                      <span className={`badge ${STATUS_BADGE[a.status] || ''}`}>{STATUS_LABELS[a.status] || a.status}</span>
                    </div>
                    {a.property_city && <p className="text-muted"><MapPin size={14} /> {a.property_city}</p>}
                    {/* Suivi de l'avancement du financement */}
                    <div className="progress-bar-container" style={{ marginTop: '.75rem' }} title={`${progress.toFixed(0)}% financé`}>
                      <div className="progress-bar" style={{ width: `${progress}%` }} />
                    </div>
                    <div className="progress-info">
                      <span>{formatCents(a.amount_raised_cents)} levés</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.35rem', marginTop: '.35rem', fontSize: '.8rem', color: 'var(--text-muted)' }}>
                      <Calendar size={12} />
                      <span>Levée : {fmtDate(a.funding_start_date)} → {fmtDate(a.funding_end_date)}</span>
                    </div>
                    <div className="property-card-stats" style={{ marginTop: '.75rem' }}>
                      <div className="property-card-stat">
                        <label>Objectif</label>
                        <span>{formatCents(a.total_amount_cents)}</span>
                      </div>
                      <div className="property-card-stat">
                        <label>Prix / part</label>
                        <span>{formatCents(a.share_price_cents)}</span>
                      </div>
                      <div className="property-card-stat">
                        <label>Parts dispo.</label>
                        <span>{a.available_shares ?? '—'}</span>
                      </div>
                      <div className="property-card-stat">
                        <label>Min / Max</label>
                        <span style={{ fontSize: '.8rem' }}>{formatCents(a.min_investment_cents)} / {a.max_investment_cents != null ? formatCents(a.max_investment_cents) : '—'}</span>
                      </div>
                      <div className="property-card-stat">
                        <label>Rendement</label>
                        <span className="yield">{a.net_yield_percent ?? a.gross_yield_percent ?? '—'}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="project-card-footer">
                    <span>Début : {fmtDate(a.funding_start_date)}</span>
                    <span>Fin : {fmtDate(a.funding_end_date)}</span>
                  </div>
                </div>
              );
            })}
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
  );
}
