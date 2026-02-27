import { useState } from 'react';
import { X, RefreshCw } from 'lucide-react';
import { RichTextEditor } from '../ui';

function isContentEmpty(html) {
  if (!html) return true;
  return !html.replace(/<[^>]*>/g, '').trim();
}

export default function RedoModal({ onConfirm, onClose, submitting }) {
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (isContentEmpty(comment)) {
      setError('Veuillez fournir une raison pour la reprise.');
      return;
    }
    setError('');
    onConfirm(comment);
  };

  return (
    <div className="apr-modal-overlay" onClick={onClose}>
      <div className="apr-modal" onClick={(e) => e.stopPropagation()}>
        <div className="apr-modal-header">
          <div className="apr-modal-header-left">
            <div className="apr-modal-icon">
              <RefreshCw size={16} />
            </div>
            <h3>Demander une reprise d&apos;analyse</h3>
          </div>
          <button className="apr-modal-close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="apr-modal-body">
          <p className="apr-modal-desc">
            L&apos;analyste recevra ce commentaire et devra reprendre son analyse en tenant compte de vos remarques.
          </p>

          <label className="apr-modal-label">
            Commentaire <span style={{ color: 'var(--apr-red)' }}>*</span>
          </label>
          <RichTextEditor
            value={comment}
            onChange={(val) => { setComment(val); if (error) setError(''); }}
            placeholder="Decrivez les points a reprendre ou a approfondir..."
            minHeight={160}
            className={error ? 'rte-error' : ''}
          />
          {error && <span className="apr-modal-error">{error}</span>}
        </div>

        <div className="apr-modal-footer">
          <button className="apr-btn apr-btn-secondary" onClick={onClose} disabled={submitting}>
            Annuler
          </button>
          <button className="apr-btn apr-btn-redo" onClick={handleSubmit} disabled={submitting}>
            <RefreshCw size={14} />
            {submitting ? 'Envoi...' : "Envoyer la demande"}
          </button>
        </div>
      </div>
    </div>
  );
}
