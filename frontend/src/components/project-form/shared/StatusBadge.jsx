import { Check, Info, AlertTriangle } from 'lucide-react';

const config = {
  complete: {
    icon: <Check size={14} />,
    label: 'Complet',
  },
  incomplete: {
    icon: <AlertTriangle size={14} />,
    label: 'Incomplet',
  },
  pending: {
    icon: <Info size={14} />,
    label: 'En attente',
  },
};

export default function StatusBadge({ status = 'pending' }) {
  const { icon, label } = config[status] || config.pending;

  return (
    <span className={`pf-status-badge ${status}`}>
      {icon}
      {label}
    </span>
  );
}
