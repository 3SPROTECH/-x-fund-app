import { ChevronRight } from 'lucide-react';

export default function AccordionSection({ title, subtotal, defaultOpen = false, icon, children }) {
  return (
    <details className="pf-ledger-card" open={defaultOpen || undefined}>
      <summary>
        <span className="pf-ledger-title">
          {icon}
          {title}
        </span>
        {subtotal !== undefined && subtotal !== null && (
          <span className="pf-ledger-subtotal">{subtotal}</span>
        )}
        {!subtotal && subtotal !== 0 && <ChevronRight size={18} />}
      </summary>
      <div className="pf-ledger-content">
        {children}
      </div>
    </details>
  );
}
