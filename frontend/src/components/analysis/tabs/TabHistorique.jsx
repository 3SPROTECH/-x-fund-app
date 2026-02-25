import { MessageSquare } from 'lucide-react';

export default function TabHistorique({ subTab }) {
  const labels = ['Demandes', 'Reponses'];

  return (
    <div className="an-placeholder">
      <div className="an-placeholder-icon">
        <MessageSquare size={22} />
      </div>
      <h4>Historique — {labels[subTab] || labels[0]}</h4>
      <p>
        Cette section affichera l'historique des echanges entre l'analyste
        et le porteur : demandes de complements et reponses.
      </p>
    </div>
  );
}
