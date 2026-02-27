import { createPortal } from 'react-dom';
import { Send, X } from 'lucide-react';

export default function ConfirmSubmitModal({ onConfirm, onClose, submitting }) {
  return createPortal(
    <div className="an-modal-overlay" onClick={onClose}>
      <div className="an-modal" onClick={(e) => e.stopPropagation()}>
        <div className="an-modal-header">
          <h3>Confirmer la soumission</h3>
          <button className="an-modal-close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="an-modal-body">
          <p>
            Voulez-vous soumettre votre analyse ?
            Cette action est <strong>definitive</strong> et ne pourra pas etre annulee.
          </p>
        </div>

        <div className="an-modal-footer">
          <button className="an-modal-btn secondary" onClick={onClose} disabled={submitting}>
            Annuler
          </button>
          <button className="an-modal-btn primary" onClick={onConfirm} disabled={submitting}>
            <Send size={14} />
            {submitting ? 'Soumission...' : 'Soumettre'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
