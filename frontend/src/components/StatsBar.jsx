export default function StatsBar({ stats }) {
  if (!stats) return null;
  return (
    <div className="stats">
      <div><b>{stats.open ?? 0}</b>Open</div>
      <div><b>{stats.dueSoon ?? 0}</b>Due soon</div>
      <div><b>{stats.overdue ?? 0}</b>Overdue</div>
      <div><b>{stats.replied ?? 0}</b>Replied</div>
    </div>
  );
}
