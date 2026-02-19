export default function PowerCard({ label, value, subtitle, children }) {
  return (
    <div className="pf-power-card">
      {label && <div className="pf-power-card-label">{label}</div>}
      {value && <div className="pf-power-card-value">{value}</div>}
      {subtitle && <div className="pf-power-card-subtitle">{subtitle}</div>}
      {children}
    </div>
  );
}
