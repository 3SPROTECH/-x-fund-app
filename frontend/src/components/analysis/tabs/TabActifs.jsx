import { Building } from 'lucide-react';

export default function TabActifs({ subTab }) {
  const labels = ['Details & Calendrier', 'Depenses', 'Lots & Revenus', 'Garanties'];

  return (
    <div className="an-placeholder">
      <div className="an-placeholder-icon">
        <Building size={22} />
      </div>
      <h4>Actifs — {labels[subTab] || labels[0]}</h4>
      <p>
        Cette section affichera le detail de chaque actif immobilier :
        caracteristiques, plan de depenses, lots et garanties associees.
      </p>
    </div>
  );
}
