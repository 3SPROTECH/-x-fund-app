import { ArrowLeft, RefreshCw } from 'lucide-react';

function formatDateTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${d.toLocaleDateString('fr-FR')} a ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
}

export default function RedoHistoryView({ history, onBack }) {
  return (
    <div className="an-redo-view">
      <button className="an-redo-view-back" onClick={onBack}>
        <ArrowLeft size={14} /> Retour a l&apos;analyse
      </button>

      <div className="an-redo-view-header">
        <RefreshCw size={16} />
        <h3>Commentaires de reprise</h3>
      </div>

      <div className="an-redo-view-list">
        {history.map((entry, i) => (
          <div className="an-redo-entry" key={i}>
            <div className="an-redo-entry-header">
              <span className="an-redo-entry-author">{entry.admin_name || 'Administrateur'}</span>
              <span className="an-redo-entry-date">{formatDateTime(entry.created_at)}</span>
            </div>
            <div
              className="an-redo-entry-comment"
              dangerouslySetInnerHTML={{ __html: entry.comment }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
