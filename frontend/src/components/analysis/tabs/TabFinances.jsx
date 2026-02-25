import { DollarSign } from 'lucide-react';

export default function TabFinances({ subTab }) {
  const labels = ['Structure', 'Projections'];

  return (
    <div className="an-placeholder">
      <div className="an-placeholder-icon">
        <DollarSign size={22} />
      </div>
      <h4>Finances — {labels[subTab] || labels[0]}</h4>
      <p>
        Cette section affichera la structure financiere du projet :
        montants, marges, rendements et projections de financement.
      </p>
    </div>
  );
}
