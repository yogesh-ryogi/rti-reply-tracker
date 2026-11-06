const COLOR = {
  mut: 'var(--mut)',
  bad: 'var(--bad)',
  crit: 'var(--crit)',
  warn: 'var(--warn)',
  ok: 'var(--ok)',
  ac: 'var(--ac)',
};

export default function Tag({ label, color = 'mut' }) {
  return (
    <span className="tag" style={{ background: COLOR[color] || COLOR.mut }}>
      {label}
    </span>
  );
}
