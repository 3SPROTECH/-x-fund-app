import { AlertCircle, Check, X, RefreshCw } from 'lucide-react';

export default function DecisionBanner({ onApprove, onReject, onRedo }) {
  return (
    <div className="apr-decision-banner apr-anim apr-d1">
      <div className="apr-decision-left">
        <div className="apr-decision-icon">
          <AlertCircle size={20} stroke="var(--apr-accent-warm)" />
        </div>
        <div className="apr-decision-text">
          <h3>Decision requise</h3>
          <p>L'analyste a soumis son rapport. Examinez les donnees et prenez une decision.</p>
        </div>
      </div>
      <div className="apr-decision-right">
        <button className="apr-btn apr-btn-approve" onClick={onApprove}>
          <Check size={14} /> Approuver
        </button>
        <button className="apr-btn apr-btn-reject" onClick={onReject}>
          <X size={14} /> Rejeter
        </button>
        <button className="apr-btn apr-btn-redo" onClick={onRedo}>
          <RefreshCw size={14} /> Reprendre
        </button>
      </div>
    </div>
  );
}
