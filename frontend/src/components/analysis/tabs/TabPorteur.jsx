import { User } from 'lucide-react';

export default function TabPorteur({ subTab }) {
  const labels = ['Identite', 'Experience & Track record'];

  return (
    <div className="an-placeholder">
      <div className="an-placeholder-icon">
        <User size={22} />
      </div>
      <h4>Porteur — {labels[subTab] || labels[0]}</h4>
      <p>
        Cette section affichera le profil du porteur de projet :
        structure juridique, experience, expertise et references.
      </p>
    </div>
  );
}
