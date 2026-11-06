const Scheme = require('../models/Scheme');
const Application = require('../models/Application');
const { DAY_MS, PANCHAYAT_MAP } = require('../utils/constants');

exports.listSchemes = async (req, res) => {
  try {
    const schemes = await Scheme.find().sort({ deadline: 1 });
    const now = new Date();
    const filter = req.query.filter || 'all'; // all | open | soon | closed

    let filtered = schemes;
    if (filter === 'open') {
      filtered = schemes.filter((s) => s.deadline >= now);
    } else if (filter === 'soon') {
      filtered = schemes.filter((s) => {
        const left = Math.ceil((s.deadline - now) / DAY_MS);
        return left >= 0 && left <= 14;
      });
    } else if (filter === 'closed') {
      filtered = schemes.filter((s) => s.deadline < now);
    }

    const data = filtered.map((s) => {
      const status = s.getStatus(now);
      return {
        id: s.displayId,
        _id: s._id,
        name: s.name,
        level: s.level,
        issuedAt: s.issuedAt,
        deadline: s.deadline,
        summary: s.summary,
        benefit: s.benefit,
        eligibility: s.eligibility,
        documents: s.documents,
        howToApply: s.howToApply,
        status: status.label,
        statusColor: status.color,
        daysLeft: status.daysLeft,
        isNew: Math.ceil((now - s.issuedAt) / DAY_MS) <= 7,
      };
    });

    res.json({ status: 'success', results: data.length, data: { schemes: data } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getScheme = async (req, res) => {
  try {
    const scheme = await Scheme.findOne({ displayId: req.params.id });
    if (!scheme) return res.status(404).json({ message: 'Scheme not found' });
    const status = scheme.getStatus();
    res.json({
      status: 'success',
      data: {
        scheme: {
          ...scheme.toObject(),
          id: scheme.displayId,
          status: status.label,
          statusColor: status.color,
          daysLeft: status.daysLeft,
        },
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
