import { MapPin, FileEdit, Trash2, Clock } from 'lucide-react';

export default function DraftCard({ draft, onResume, onDelete }) {
  const fd = draft.form_data || {};
  const title = fd.presentation?.title || 'Projet sans nom';
  const updatedAt = draft.updated_at
    ? new Date(draft.updated_at).toLocaleDateString('fr-FR', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : '';

  return (
    <div className="project-card" onClick={onResume} style={{ cursor: 'pointer' }}>
      <div className="draft-overlay">
        <FileEdit size={40} opacity={0.25} color="var(--gold-color)" />
      </div>
      <div className="project-card-body">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '.25rem' }}>
          <h3 className="card-title">{title}</h3>
          <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}>
            <span className="badge badge-warning">Brouillon</span>
            <button
              className="card-delete-btn"
              onClick={(e) => { e.stopPropagation(); onDelete(draft.id, e); }}
              title="Supprimer le brouillon"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
        {fd.location?.city && (
          <div className="card-location"><MapPin size={14} /> {fd.location.city}</div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '.3rem', marginTop: 'auto', fontSize: '.8rem', color: 'var(--text-muted)' }}>
          <Clock size={12} />
          <span>Dernière modification : {updatedAt}</span>
        </div>
      </div>
    </div>
  );
}
