import { useState, useEffect, useRef } from 'react';
import { MapPin, Calendar, User, Clock, FileText, Edit, Trash2, Upload, MoreVertical } from 'lucide-react';
import { PROJECT_STATUS_LABELS } from '../../utils/constants';
import { formatDate } from '../../utils/formatters';

const OPERATION_TYPE_LABELS = {
  marchand_de_biens: 'Marchand de biens',
  immobilier_locatif: 'Locatif',
  promotion_immobiliere: 'Promotion',
  rehabilitation_lourde: 'Rehabilitation',
  division_fonciere: 'Division fonciere',
  transformation_usage: "Transformation d'usage",
};

const PROPERTY_TYPE_LABELS = {
  appartement: 'Appartement',
  maison: 'Maison',
  immeuble: 'Immeuble',
  commercial: 'Commercial',
  terrain: 'Terrain',
};

export default function HeroSection({ project, onNavigateReport, onEdit, onDelete }) {
  const a = project?.attributes || project || {};
  const snapshot = a.form_snapshot || {};
  const pres = snapshot.presentation || {};
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const operationType = pres.operationType || a.operation_type;
  const propertyType = pres.propertyType || a.property_type;

  return (
    <header className="apr-hero apr-anim">
      <div>
        <div className="apr-hero-badges">
          <span className="apr-badge apr-badge-status">
            <span className="apr-badge-dot" />
            {PROJECT_STATUS_LABELS[a.status] || a.status}
          </span>
          {operationType && OPERATION_TYPE_LABELS[operationType] && (
            <span className="apr-badge apr-badge-type">
              {OPERATION_TYPE_LABELS[operationType]}
            </span>
          )}
          {propertyType && PROPERTY_TYPE_LABELS[propertyType] && (
            <span className="apr-badge apr-badge-type">
              {PROPERTY_TYPE_LABELS[propertyType]}
            </span>
          )}
        </div>
        <h1 className="apr-hero-title">{a.title}</h1>
        {(a.property_title || a.property_city) && (
          <div className="apr-hero-location">
            <MapPin size={14} />
            {[a.property_title, a.property_city].filter(Boolean).join(', ')}
            {a.property_country ? ` — ${a.property_country}` : ''}
          </div>
        )}
        <div className="apr-hero-meta">
          {a.analyst_reviewed_at && (
            <div className="apr-meta-item">
              <Calendar size={13} />
              Soumis le <strong>{formatDate(a.analyst_reviewed_at)}</strong>
            </div>
          )}
          {a.analyst_name && (
            <div className="apr-meta-item">
              <User size={13} />
              Analyste: <strong>{a.analyst_name}</strong>
            </div>
          )}
          {(a.duration_months || pres.durationMonths) && (
            <div className="apr-meta-item">
              <Clock size={13} />
              Duree: <strong>{a.duration_months || pres.durationMonths} mois</strong>
            </div>
          )}
        </div>
      </div>
      <div className="apr-hero-actions">
        {a.has_analyst_report && (
          <button className="apr-btn apr-btn-secondary" onClick={onNavigateReport}>
            <FileText size={14} />
            Voir le rapport
          </button>
        )}
        <div className="apr-overflow-wrapper" ref={menuRef}>
          <button
            className="apr-btn apr-btn-ghost"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Plus d'options"
          >
            <MoreVertical size={18} />
          </button>
          <div className={`apr-overflow-menu${menuOpen ? ' open' : ''}`}>
            <button className="apr-overflow-item" onClick={() => { setMenuOpen(false); onEdit?.(); }}>
              <Edit size={14} /> Modifier le projet
            </button>
            <button className="apr-overflow-item" onClick={() => { setMenuOpen(false); }}>
              <Upload size={14} /> Exporter en PDF
            </button>
            <div className="apr-overflow-sep" />
            <button className="apr-overflow-item danger" onClick={() => { setMenuOpen(false); onDelete?.(); }}>
              <Trash2 size={14} /> Supprimer le projet
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
