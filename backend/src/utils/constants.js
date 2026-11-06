const PANCHAYATS = [
  { key: 'alpha', name: 'Alpha Gram Panchayat' },
  { key: 'beta', name: 'Beta Gram Panchayat' },
  { key: 'gamma', name: 'Gamma Gram Panchayat' },
];

const PANCHAYAT_MAP = Object.fromEntries(PANCHAYATS.map((p) => [p.key, p.name]));

const DAY_MS = 86400000;

module.exports = {
  PANCHAYATS,
  PANCHAYAT_MAP,
  DAY_MS,
};
