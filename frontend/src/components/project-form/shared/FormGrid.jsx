export default function FormGrid({ full, children }) {
  return <div className={`pf-form-grid${full ? ' full' : ''}`}>{children}</div>;
}
