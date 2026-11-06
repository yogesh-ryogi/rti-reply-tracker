export const formatDate = (d) => {
  if (!d) return '-';
  const date = new Date(d);
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

export const rupees = (n) => '₹' + Number(n).toLocaleString('en-IN');

export const PANCHAYATS = [
  { key: 'alpha', name: 'Alpha Gram Panchayat' },
  { key: 'beta', name: 'Beta Gram Panchayat' },
  { key: 'gamma', name: 'Gamma Gram Panchayat' },
];

export const zoneColor = (color) => {
  const map = {
    mut: 'var(--mut)',
    bad: 'var(--bad)',
    crit: 'var(--crit)',
    warn: 'var(--warn)',
    ok: 'var(--ok)',
    ac: 'var(--ac)',
  };
  return map[color] || 'var(--mut)';
};
