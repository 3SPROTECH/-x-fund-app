export default function StatusBadge({ status, labels = {}, badges = {} }) {
  const label = labels[status] || status;
  const badgeClass = badges[status] || '';
  return <span className={`badge ${badgeClass}`}>{label}</span>;
}
