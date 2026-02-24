export default function ProjectSection({ title, subtitle, count, emptyState, children }) {
  const isEmpty = count === 0;

  // Hide section entirely if empty and no emptyState provided
  if (isEmpty && !emptyState) return null;

  return (
    <section className="project-section">
      <div className="section-header">
        <h2 className="section-title">{title}</h2>
        <span className="section-count">{count}</span>
      </div>
      {subtitle && <p className="section-subtitle">{subtitle}</p>}
      {isEmpty ? emptyState : (
        <div className="project-grid">
          {children}
        </div>
      )}
    </section>
  );
}
