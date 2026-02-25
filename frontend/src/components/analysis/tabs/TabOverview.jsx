import { Eye } from 'lucide-react';

export default function TabOverview({ subTab }) {
  const labels = ['Fiche projet', 'Photos', 'Localisation'];

  return (
    <div className="an-placeholder">
      <div className="an-placeholder-icon">
        <Eye size={22} />
      </div>
      <h4>Vue d'ensemble — {labels[subTab] || labels[0]}</h4>
      <p>
        Cette section affichera les informations generales du projet soumis
        par le porteur : presentation, photos et localisation.
      </p>
    </div>
  );
}
