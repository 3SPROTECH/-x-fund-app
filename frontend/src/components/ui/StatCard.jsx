export default function StatCard({ icon: Icon, iconClass = 'stat-icon-primary', iconStyle, value, label, onClick, style }) {
  return (
    <div className="stat-card" onClick={onClick} style={onClick ? { cursor: 'pointer', ...style } : style}>
      <div className={`stat-icon ${iconClass}`} style={iconStyle}>
        <Icon size={20} />
      </div>
      <div className="stat-content">
        <span className="stat-value">{value}</span>
        <span className="stat-label">{label}</span>
      </div>
    </div>
  );
}
