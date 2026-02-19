export default function FormField({ label, error, warning, full, children }) {
  return (
    <div className={`pf-form-group${full ? ' full' : ''}`}>
      {label && <label>{label}</label>}
      {children}
      {error && <span className="pf-error-message">{error}</span>}
      {warning && !error && <span className="pf-warning-message">{warning}</span>}
    </div>
  );
}
