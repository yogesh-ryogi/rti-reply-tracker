export default function Empty({ icon = '📭', children }) {
  return (
    <div className="empty">
      <div className="empty-icon">{icon}</div>
      <div>{children}</div>
    </div>
  );
}
