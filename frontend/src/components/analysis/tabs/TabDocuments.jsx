import { FileText } from 'lucide-react';

export default function TabDocuments({ subTab }) {
  const labels = ['Justificatifs', 'Preuves garanties'];

  return (
    <div className="an-placeholder">
      <div className="an-placeholder-icon">
        <FileText size={22} />
      </div>
      <h4>Documents — {labels[subTab] || labels[0]}</h4>
      <p>
        Cette section affichera les documents justificatifs charges par
        le porteur : rapports d'expertise, permis, business plan, etc.
      </p>
    </div>
  );
}
