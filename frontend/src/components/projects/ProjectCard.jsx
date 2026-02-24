import { MapPin, Image as ImageIcon, Users, Trash2, Clock, Bell } from 'lucide-react';
import { getImageUrl } from '../../api/client';
import { formatCents, formatDate } from '../../utils';

const STATUS_CATEGORIES = {
  active: ['funding_active'],
  upcoming: ['approved', 'legal_structuring', 'signing'],
  funded: ['funded', 'under_construction', 'operating', 'repaid'],
};

const FROSTED_LABELS = {
  funding_active: 'Ouvert',
  approved: 'Bientôt',
  legal_structuring: 'Bientôt',
  signing: 'Bientôt',
  funded: 'Financé',
  under_construction: 'En Travaux',
  operating: 'En Exploitation',
  repaid: 'Remboursé',
};

function getCategory(status) {
  for (const [cat, statuses] of Object.entries(STATUS_CATEGORIES)) {
    if (statuses.includes(status)) return cat;
  }
  return 'active';
}

function getRemainingDays(endDate) {
  if (!endDate) return null;
  const end = new Date(endDate);
  const now = new Date();
  const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
}

function getDurationMonths(startDate, endDate) {
  if (!startDate || !endDate) return null;
  const start = new Date(startDate);
  const end = new Date(endDate);
  const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  return months > 0 ? months : null;
}

function CardImage({ firstImage, title }) {
  return (
    <div className="card-image-wrap">
      {firstImage ? (
        <img src={getImageUrl(firstImage.url)} alt={title} />
      ) : (
        <div className="image-placeholder">
          <ImageIcon size={40} opacity={0.3} />
        </div>
      )}
    </div>
  );
}

function FrostedBadge({ status }) {
  const category = getCategory(status);
  const frostedClass =
    category === 'active' ? 'frosted-active' :
    category === 'upcoming' ? 'frosted-upcoming' : 'frosted-funded';

  return (
    <span className={`badge-frosted ${frostedClass}`}>
      {FROSTED_LABELS[status] || status}
    </span>
  );
}

function MetricsGrid({ children }) {
  return <div className="card-metrics">{children}</div>;
}

function Metric({ label, value, highlight = false }) {
  return (
    <div className="metric-item">
      <span className="metric-label">{label}</span>
      <span className={`metric-value${highlight ? ' highlight' : ''}`}>{value}</span>
    </div>
  );
}

/* ─── Active Card: "En cours de collecte" ─── */
function ActiveCard({ attrs, firstImage, onDelete, canDelete }) {
  const progress = Math.min(attrs.funding_progress_percent || 0, 100);
  const remaining = getRemainingDays(attrs.funding_end_date);
  const yieldVal = attrs.net_yield_percent ?? attrs.gross_yield_percent;

  return (
    <>
      <div style={{ position: 'relative' }}>
        <CardImage firstImage={firstImage} title={attrs.title} />
        <FrostedBadge status={attrs.status} />
      </div>
      <div className="project-card-body">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '.25rem' }}>
          <h3 className="card-title">{attrs.title}</h3>
          {canDelete && <DeleteBtn onDelete={onDelete} />}
        </div>
        {attrs.property_city && (
          <div className="card-location"><MapPin size={14} /> {attrs.property_city}</div>
        )}
        <MetricsGrid>
          <Metric label="Objectif" value={formatCents(attrs.total_amount_cents)} />
          <Metric label="Rendement" value={yieldVal != null ? `${yieldVal}%` : '—'} highlight />
          <Metric label="Prix / part" value={formatCents(attrs.share_price_cents)} />
        </MetricsGrid>
        <div className="progress-section">
          <div className="progress-header">
            <span>{formatCents(attrs.amount_raised_cents)} collectés</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
        <div className="project-card-footer" style={{ border: 'none', padding: '.75rem 0 0', background: 'none' }}>
          <div className="investor-count">
            <Users size={14} />
            <span>{attrs.investors_count ?? '—'} investisseurs</span>
          </div>
          <span>{remaining != null ? `Reste ${remaining} jours` : `Fin : ${formatDate(attrs.funding_end_date)}`}</span>
        </div>
      </div>
    </>
  );
}

/* ─── Upcoming Card: "Prochainement" ─── */
function UpcomingCard({ attrs, firstImage, onDelete, canDelete }) {
  const yieldVal = attrs.net_yield_percent ?? attrs.gross_yield_percent;
  const duration = getDurationMonths(attrs.funding_start_date, attrs.funding_end_date);
  const openDate = attrs.funding_start_date
    ? new Date(attrs.funding_start_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
    : null;

  return (
    <>
      <div style={{ position: 'relative' }}>
        <CardImage firstImage={firstImage} title={attrs.title} />
        <FrostedBadge status={attrs.status} />
      </div>
      <div className="project-card-body">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '.25rem' }}>
          <h3 className="card-title">{attrs.title}</h3>
          {canDelete && <DeleteBtn onDelete={onDelete} />}
        </div>
        {attrs.property_city && (
          <div className="card-location"><MapPin size={14} /> {attrs.property_city}</div>
        )}
        <MetricsGrid>
          <Metric label="Objectif" value={formatCents(attrs.total_amount_cents)} />
          <Metric label="Rendement" value={yieldVal != null ? `${yieldVal}%` : '—'} highlight />
          <Metric label="Durée" value={duration ? `${duration} mois` : '—'} />
        </MetricsGrid>
        <div className="progress-section">
          <div className="progress-header">
            <span>{openDate ? `Ouverture le ${openDate}` : 'Bientôt disponible'}</span>
            <span>0%</span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: '0%' }} />
          </div>
        </div>
        <div className="project-card-footer" style={{ border: 'none', padding: '.75rem 0 0', background: 'none' }}>
          <div className="investor-count">
            <Bell size={14} />
            <span>M'alerter</span>
          </div>
          <span>Analyse terminée</span>
        </div>
      </div>
    </>
  );
}

/* ─── Funded Card: "Déjà financés" ─── */
function FundedCard({ attrs, firstImage, onDelete, canDelete }) {
  const yieldVal = attrs.net_yield_percent ?? attrs.gross_yield_percent;
  const duration = getDurationMonths(attrs.funding_start_date, attrs.funding_end_date);
  const fundedDate = attrs.funding_end_date
    ? new Date(attrs.funding_end_date).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    : null;

  return (
    <>
      <div style={{ position: 'relative' }}>
        <CardImage firstImage={firstImage} title={attrs.title} />
        <FrostedBadge status={attrs.status} />
      </div>
      <div className="project-card-body">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '.25rem' }}>
          <h3 className="card-title">{attrs.title}</h3>
          {canDelete && <DeleteBtn onDelete={onDelete} />}
        </div>
        {attrs.property_city && (
          <div className="card-location"><MapPin size={14} /> {attrs.property_city}</div>
        )}
        <MetricsGrid>
          <Metric label="Objectif" value={formatCents(attrs.total_amount_cents)} />
          <Metric label="Rendement" value={yieldVal != null ? `${yieldVal}%` : '—'} highlight />
          <Metric label="Durée" value={duration ? `${duration} mois` : '—'} />
        </MetricsGrid>
        <div className="progress-section">
          <div className="progress-header">
            <span>Financé avec succès</span>
            <span style={{ color: 'var(--primary)' }}>100%</span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: '100%' }} />
          </div>
        </div>
        <div className="project-card-footer" style={{ border: 'none', padding: '.75rem 0 0', background: 'none' }}>
          <div className="investor-count">
            <Users size={14} />
            <span>{attrs.investors_count ?? '—'} investisseurs</span>
          </div>
          <span>{fundedDate || formatDate(attrs.funding_end_date)}</span>
        </div>
      </div>
    </>
  );
}

function DeleteBtn({ onDelete }) {
  return (
    <button className="card-delete-btn" onClick={onDelete} title="Supprimer">
      <Trash2 size={16} />
    </button>
  );
}

export default function ProjectCard({ project, user, onDelete, onClick }) {
  const attrs = project.attributes || project;
  const firstImage =
    (attrs.images?.length > 0) ? attrs.images[0] :
    (attrs.property_photos?.length > 0) ? attrs.property_photos[0] : null;

  const category = getCategory(attrs.status);

  const isAdmin = user?.role === 'administrateur';
  const isOwner = user?.id === attrs.owner_id;
  const canDelete = isAdmin || (user?.role === 'porteur_de_projet' && isOwner && attrs.status === 'draft');

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete?.(project.id, attrs.title, e);
  };

  const cardClassName = `project-card${category === 'funded' ? ' is-funded' : ''}`;

  const CardVariant =
    category === 'active' ? ActiveCard :
    category === 'upcoming' ? UpcomingCard : FundedCard;

  return (
    <div className={cardClassName} onClick={onClick}>
      <CardVariant
        attrs={attrs}
        firstImage={firstImage}
        onDelete={handleDelete}
        canDelete={canDelete}
      />
    </div>
  );
}

export { STATUS_CATEGORIES, getCategory };
