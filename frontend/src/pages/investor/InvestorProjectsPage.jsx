import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { investmentProjectsApi } from '../../api/investments';
import { TrendingUp, MapPin, Calendar, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { getImageUrl } from '../../api/client';
import TableFilters from '../../components/TableFilters';
import { formatCents, formatDate as fmtDate, PROJECT_STATUS_LABELS as STATUS_LABELS, PROJECT_STATUS_BADGES as STATUS_BADGE } from '../../utils';
import { LoadingSpinner, EmptyState, Pagination } from '../../components/ui';

export default function InvestorProjectsPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({});
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => { loadProjects(); }, [page, statusFilter, search]);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const params = { page };
      if (statusFilter) params.status = statusFilter;
      if (search) params.search = search;
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
      </div>

      <TableFilters
        filters={[
          { key: 'status', label: 'Statut', value: statusFilter, options: [
            { value: '', label: 'Tous' },
            { value: 'funding_active', label: 'En Collecte' },
            { value: 'funded', label: 'Financé' },
            { value: 'under_construction', label: 'En Travaux' },
            { value: 'operating', label: 'En Exploitation' },
            { value: 'repaid', label: 'Remboursé' },
          ]},
        ]}
        onFilterChange={(key, value) => { setStatusFilter(value); setPage(1); }}
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Rechercher un projet..."
      />

      {loading ? (
        <LoadingSpinner />
      ) : projects.length === 0 ? (
        <div className="card">
          <EmptyState icon={TrendingUp} message="Aucun projet disponible" />
        </div>
      ) : (
        <>
          <div className="project-grid">
            {projects.map(p => {
              const a = p.attributes || p;
              const progress = Math.min(a.funding_progress_percent || 0, 100);
              const firstImage = (a.images && a.images.length > 0) ? a.images[0] : (a.property_photos && a.property_photos.length > 0) ? a.property_photos[0] : null;

              return (
                <div key={p.id} className="project-card" onClick={() => navigate(`/investor/projects/${p.id}`)}>
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
          <Pagination page={page} totalPages={meta.total_pages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
