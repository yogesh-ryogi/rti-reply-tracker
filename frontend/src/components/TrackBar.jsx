export default function TrackBar({ filedAt, dueAt, status }) {
  const now = Date.now();
  const start = new Date(filedAt).getTime();
  const elapsed = Math.min(30, Math.max(0, Math.floor((now - start) / 86400000)));
  const cells = [];
  for (let k = 0; k < 30; k++) {
    let bg = '';
    if (k < elapsed) {
      if (status === 'replied') bg = 'var(--mut)';
      else if (k >= 28) bg = 'var(--crit)';
      else if (k >= 20) bg = 'var(--warn)';
      else bg = 'var(--ok)';
    }
    cells.push(<i key={k} style={bg ? { background: bg } : undefined} />);
  }
  return <div className="track" aria-hidden="true">{cells}</div>;
}
