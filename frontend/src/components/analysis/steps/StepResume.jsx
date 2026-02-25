import { ClipboardList } from 'lucide-react';

export default function StepResume() {
  return (
    <div className="an-placeholder">
      <div className="an-placeholder-icon">
        <ClipboardList size={22} />
      </div>
      <h4>Resume</h4>
      <p>
        Synthese de l'analyse : points forts, points de vigilance,
        recommandations et conclusion generale sur le dossier.
      </p>
    </div>
  );
}
