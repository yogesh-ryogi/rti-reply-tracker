const RTI = require('../models/RTI');
const User = require('../models/User');
const { DAY_MS, PANCHAYAT_MAP } = require('../utils/constants');

// Helper to format response like prototype
const formatRTI = (rti, citizenNameMap = {}) => {
  const obj = rti.toObject ? rti.toObject({ virtuals: true }) : rti;
  const daysLeft = obj.status === 'replied' ? null : Math.ceil((new Date(obj.dueAt) - new Date()) / DAY_MS);
  let zone;
  if (obj.status === 'replied') zone = { label: 'Replied', color: 'mut' };
  else if (daysLeft < 0) zone = { label: 'Overdue', color: 'bad' };
  else if (daysLeft <= 2) zone = { label: 'Critical', color: 'crit' };
  else if (daysLeft <= 10) zone = { label: 'Due soon', color: 'warn' };
  else zone = { label: 'On track', color: 'ok' };

  return {
    id: obj.displayId,
    _id: obj._id,
    panchayat: obj.panchayat,
    panchayatName: PANCHAYAT_MAP[obj.panchayat],
    citizen: obj.citizen?._id || obj.citizen,
    citizenName: obj.citizen?.name || citizenNameMap[String(obj.citizen)] || 'Unknown',
    subject: obj.subject,
    filedAt: obj.filedAt,
    dueAt: obj.dueAt,
    status: obj.status,
    repliedAt: obj.repliedAt,
    repliedBy: obj.repliedBy?._id || obj.repliedBy,
    repliedByName: obj.repliedBy?.name || null,
    replyText: obj.replyText,
    nudge: obj.nudge,
    log: obj.log,
    daysLeft,
    zone,
    daysTaken: obj.status === 'replied' && obj.repliedAt
      ? Math.ceil((new Date(obj.repliedAt) - new Date(obj.filedAt)) / DAY_MS)
      : null,
  };
};

// POST /api/rti  – citizen files new RTI
exports.createRTI = async (req, res) => {
  try {
    if (req.user.role !== 'citizen') {
      return res.status(403).json({ message: 'Only citizens can file RTI requests' });
    }
    const { panchayat, subject } = req.body;
    if (!panchayat || !subject) {
      return res.status(400).json({ message: 'Panchayat and subject are required' });
    }
    if (!['alpha', 'beta', 'gamma'].includes(panchayat)) {
      return res.status(400).json({ message: 'Invalid panchayat' });
    }

    // Generate next displayId
    const last = await RTI.findOne().sort({ displayId: -1 }).select('displayId');
    let nextNum = 1;
    if (last && last.displayId) {
      const m = last.displayId.match(/RTI-(\d+)/);
      if (m) nextNum = parseInt(m[1], 10) + 1;
    }
    const displayId = `RTI-${String(nextNum).padStart(3, '0')}`;

    const now = new Date();
    const dueAt = new Date(now.getTime() + 30 * DAY_MS);

    const rti = await RTI.create({
      displayId,
      panchayat,
      citizen: req.user._id,
      subject: subject.trim(),
      filedAt: now,
      dueAt,
      status: 'open',
      log: [{ date: now, text: `Submitted by ${req.user.name}` }],
    });

    res.status(201).json({
      status: 'success',
      data: { rti: formatRTI(rti) },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create RTI', error: err.message });
  }
};

// GET /api/rti/mine  – citizen's own RTIs
exports.getMyRTIs = async (req, res) => {
  try {
    const rtis = await RTI.find({ citizen: req.user._id })
      .populate('repliedBy', 'name')
      .sort({ filedAt: -1 });

    res.json({
      status: 'success',
      results: rtis.length,
      data: { rtis: rtis.map((r) => formatRTI(r)) },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/rti/panchayat  – clerk/pdo see their panchayat RTIs
exports.getPanchayatRTIs = async (req, res) => {
  try {
    if (!['clerk', 'pdo'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Only clerks and PDOs can view panchayat RTIs' });
    }

    const filter = { panchayat: req.user.panchayat };
    if (req.query.status) filter.status = req.query.status;

    const rtis = await RTI.find(filter)
      .populate('citizen', 'name email phone')
      .populate('repliedBy', 'name')
      .sort({ filedAt: -1 });

    res.json({
      status: 'success',
      results: rtis.length,
      data: { rtis: rtis.map((r) => formatRTI(r)) },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/rti/:id/reply  – clerk replies
exports.replyRTI = async (req, res) => {
  try {
    if (req.user.role !== 'clerk') {
      return res.status(403).json({ message: 'Only clerks can reply to RTIs' });
    }
    const { replyText } = req.body;
    if (!replyText || !replyText.trim()) {
      return res.status(400).json({ message: 'Reply text is required' });
    }

    const rti = await RTI.findById(req.params.id);
    if (!rti) return res.status(404).json({ message: 'RTI not found' });
    if (rti.panchayat !== req.user.panchayat) {
      return res.status(403).json({ message: 'This RTI belongs to another panchayat' });
    }
    if (rti.status === 'replied') {
      return res.status(400).json({ message: 'Already replied' });
    }

    const now = new Date();
    rti.status = 'replied';
    rti.repliedAt = now;
    rti.repliedBy = req.user._id;
    rti.replyText = replyText.trim();
    rti.nudge = false;
    rti.log.push({ date: now, text: `Replied by ${req.user.name}` });
    await rti.save();

    await rti.populate('citizen', 'name');
    await rti.populate('repliedBy', 'name');

    res.json({
      status: 'success',
      data: { rti: formatRTI(rti) },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/rti/:id/nudge  – PDO reminds clerk
exports.nudgeRTI = async (req, res) => {
  try {
    if (req.user.role !== 'pdo') {
      return res.status(403).json({ message: 'Only PDOs can send reminders' });
    }
    const rti = await RTI.findById(req.params.id);
    if (!rti) return res.status(404).json({ message: 'RTI not found' });
    if (rti.panchayat !== req.user.panchayat) {
      return res.status(403).json({ message: 'Wrong panchayat' });
    }
    if (rti.status === 'replied') {
      return res.status(400).json({ message: 'Already replied' });
    }

    rti.nudge = true;
    rti.log.push({ date: new Date(), text: 'PDO reminded the clerk' });
    await rti.save();

    res.json({ status: 'success', data: { rti: formatRTI(rti) } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/rti/stats  – summary for dashboards
exports.getStats = async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === 'citizen') {
      filter.citizen = req.user._id;
    } else {
      filter.panchayat = req.user.panchayat;
    }

    const all = await RTI.find(filter);
    const open = all.filter((r) => r.status === 'open');
    const now = new Date();

    const dueSoon = open.filter((r) => {
      const left = Math.ceil((r.dueAt - now) / DAY_MS);
      return left >= 0 && left <= 10;
    }).length;
    const overdue = open.filter((r) => r.dueAt < now).length;
    const replied = all.length - open.length;

    res.json({
      status: 'success',
      data: {
        open: open.length,
        dueSoon,
        overdue,
        replied,
        total: all.length,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
