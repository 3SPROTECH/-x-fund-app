export default function EmptyState({ icon: Icon, iconSize = 48, message, children }) {
  return (
    <div className="empty-state">
      {Icon && <Icon size={iconSize} />}
      <p>{message}</p>
      {children}
    </div>
  );
}
