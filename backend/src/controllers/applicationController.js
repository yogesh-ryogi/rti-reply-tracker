const Application = require('../models/Application');
const Scheme = require('../models/Scheme');
const { DAY_MS, PANCHAYAT_MAP } = require('../utils/constants');

const formatApp = (app) => {
  const o = app.toObject ? app.toObject() : app;
  return {
    id: o.displayId,
    _id: o._id,
    scheme: o.scheme?._id || o.scheme,
    schemeId: o.schemeDisplayId || o.scheme?.displayId,
    schemeName: o.scheme?.name || null,
    schemeLevel: o.scheme?.level || null,
    citizen: o.citizen?._id || o.citizen,
    citizenName: o.citizen?.name || null,
    citizenEmail: o.citizen?.email || null,
    citizenPhone: o.citizen?.phone || null,
    panchayat: o.panchayat,
    panchayatName: PANCHAYAT_MAP[o.panchayat],
    status: o.status,
    note: o.note,
    payment: o.payment,
    reply: o.reply,
    sanctionRef: o.sanctionRef,
    completedBy: o.completedBy,
    filedAt: o.filedAt,
    log: o.log,
  };
};

// POST /api/applications  – citizen applies
exports.createApplication = async (req, res) => {
  try {
    if (req.user.role !== 'citizen') {
      return res.status(403).json({ message: 'Only citizens can apply' });
    }
    const { schemeId, panchayat, note } = req.body;
    if (!schemeId || !panchayat) {
      return res.status(400).json({ message: 'schemeId and panchayat are required' });
    }

    const scheme = await Scheme.findOne({ displayId: schemeId });
    if (!scheme) return res.status(404).json({ message: 'Scheme not found' });
    if (scheme.deadline < new Date()) {
      return res.status(400).json({ message: 'Applications are closed for this scheme' });
    }

    const existing = await Application.findOne({
      scheme: scheme._id,
      citizen: req.user._id,
    });
    if (existing) {
      return res.status(400).json({ message: 'You have already applied to this scheme' });
    }

    const last = await Application.findOne().sort({ displayId: -1 }).select('displayId');
    let nextNum = 1;
    if (last?.displayId) {
      const m = last.displayId.match(/APP-(\d+)/);
      if (m) nextNum = parseInt(m[1], 10) + 1;
    }
    const displayId = `APP-${String(nextNum).padStart(3, '0')}`;
    const now = new Date();

    const app = await Application.create({
      displayId,
      scheme: scheme._id,
      schemeDisplayId: scheme.displayId,
      citizen: req.user._id,
      panchayat,
      status: 'Submitted',
      note: note || '',
      filedAt: now,
      log: [
        {
          date: now,
          text: `Applied by ${req.user.name}${note ? ` (note: ${note})` : ''}`,
        },
      ],
    });

    await app.populate('scheme', 'name level displayId');

    res.status(201).json({
      status: 'success',
      message: `Application submitted to ${PANCHAYAT_MAP[panchayat]}. The clerk can now see it.`,
      data: { application: formatApp(app) },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// GET /api/applications/mine
exports.getMyApplications = async (req, res) => {
  try {
    const apps = await Application.find({ citizen: req.user._id })
      .populate('scheme', 'name level displayId deadline')
      .sort({ filedAt: -1 });

    res.json({
      status: 'success',
      results: apps.length,
      data: { applications: apps.map(formatApp) },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/applications/panchayat  – clerk view
exports.getPanchayatApplications = async (req, res) => {
  try {
    if (req.user.role !== 'clerk') {
      return res.status(403).json({ message: 'Only clerks can manage applications' });
    }
    const apps = await Application.find({ panchayat: req.user.panchayat })
      .populate('scheme', 'name level displayId deadline')
      .populate('citizen', 'name email phone')
      .sort({ filedAt: -1 });

    res.json({
      status: 'success',
      results: apps.length,
      data: { applications: apps.map(formatApp) },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/applications/:id/status
exports.updateStatus = async (req, res) => {
  try {
    if (req.user.role !== 'clerk') {
      return res.status(403).json({ message: 'Only clerks can update status' });
    }
    const { status, remark } = req.body;
    const allowed = {
      Submitted: ['Under review', 'Approved', 'Rejected'],
      'Under review': ['Under review', 'Approved', 'Rejected'],
      'Payment requested': ['Rejected'],
    };

    const app = await Application.findById(req.params.id);
    if (!app) return res.status(404).json({ message: 'Application not found' });
    if (app.panchayat !== req.user.panchayat) {
      return res.status(403).json({ message: 'Wrong panchayat' });
    }
    if (!(allowed[app.status] || []).includes(status)) {
      return res.status(400).json({ message: `Cannot change from ${app.status} to ${status}` });
    }

    app.status = status;
    app.log.push({
      date: new Date(),
      text: `Status changed to ${status} by ${req.user.name}${remark ? `: ${remark}` : ''}`,
    });
    await app.save();
    await app.populate('scheme', 'name level displayId');
    await app.populate('citizen', 'name email phone');

    res.json({ status: 'success', data: { application: formatApp(app) } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/applications/:id/request-payment
exports.requestPayment = async (req, res) => {
  try {
    if (req.user.role !== 'clerk') {
      return res.status(403).json({ message: 'Only clerks can request payment' });
    }
    const { amount, reason, days } = req.body;
    const amt = Math.round(Number(amount));
    const dy = Math.round(Number(days)) || 7;
    if (!amt || amt < 1 || !reason) {
      return res.status(400).json({ message: 'amount and reason are required' });
    }

    const app = await Application.findById(req.params.id);
    if (!app) return res.status(404).json({ message: 'Application not found' });
    if (app.panchayat !== req.user.panchayat) {
      return res.status(403).json({ message: 'Wrong panchayat' });
    }
    if (!['Submitted', 'Under review'].includes(app.status)) {
      return res.status(400).json({ message: 'Payment can only be requested from Submitted or Under review' });
    }

    const now = new Date();
    app.payment = {
      amount: amt,
      reason,
      requestedAt: now,
      dueAt: new Date(now.getTime() + dy * DAY_MS),
      paid: false,
    };
    app.status = 'Payment requested';
    app.log.push({
      date: now,
      text: `Payment of ₹${amt.toLocaleString('en-IN')} requested by ${req.user.name} (${reason}). Pay by ${app.payment.dueAt.toLocaleDateString('en-IN')}`,
    });
    await app.save();
    await app.populate('scheme', 'name level displayId');
    await app.populate('citizen', 'name email phone');

    res.json({ status: 'success', data: { application: formatApp(app) } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/applications/:id/pay  – citizen pays (demo)
exports.pay = async (req, res) => {
  try {
    if (req.user.role !== 'citizen') {
      return res.status(403).json({ message: 'Only the applicant can pay' });
    }
    const { method } = req.body;
    const app = await Application.findById(req.params.id);
    if (!app) return res.status(404).json({ message: 'Application not found' });
    if (String(app.citizen) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not your application' });
    }
    if (app.status !== 'Payment requested' || !app.payment || app.payment.paid) {
      return res.status(400).json({ message: 'No pending payment' });
    }

    const now = new Date();
    // Generate demo txn id
    const count = await Application.countDocuments({ 'payment.paid': true });
    const txnId = `TXN-${1000 + count + 1}`;

    app.payment.paid = true;
    app.payment.paidAt = now;
    app.payment.method = method || 'UPI';
    app.payment.txnId = txnId;
    app.status = 'Payment received';
    app.log.push({
      date: now,
      text: `Payment of ₹${app.payment.amount.toLocaleString('en-IN')} paid by ${req.user.name} via ${app.payment.method} (${txnId})`,
    });
    await app.save();
    await app.populate('scheme', 'name level displayId');

    res.json({
      status: 'success',
      message: `Payment of ₹${app.payment.amount.toLocaleString('en-IN')} received. Transaction ${txnId}.`,
      data: { application: formatApp(app) },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/applications/:id/complete  – clerk completes after payment
exports.complete = async (req, res) => {
  try {
    if (req.user.role !== 'clerk') {
      return res.status(403).json({ message: 'Only clerks can complete' });
    }
    const { reply } = req.body;
    if (!reply || !reply.trim()) {
      return res.status(400).json({ message: 'Reply is required' });
    }

    const app = await Application.findById(req.params.id);
    if (!app) return res.status(404).json({ message: 'Application not found' });
    if (app.panchayat !== req.user.panchayat) {
      return res.status(403).json({ message: 'Wrong panchayat' });
    }
    if (app.status !== 'Payment received') {
      return res.status(400).json({ message: 'Can only complete after payment is received' });
    }

    const count = await Application.countDocuments({ status: 'Approved', sanctionRef: { $exists: true } });
    const ref = `SAN-${String(count + 1).padStart(3, '0')}`;

    app.status = 'Approved';
    app.reply = reply.trim();
    app.sanctionRef = ref;
    app.completedBy = req.user._id;
    app.log.push({
      date: new Date(),
      text: `Request completed by ${req.user.name}. Sanction ref ${ref}. Reply: ${reply.trim()}`,
    });
    await app.save();
    await app.populate('scheme', 'name level displayId');
    await app.populate('citizen', 'name email phone');

    res.json({ status: 'success', data: { application: formatApp(app) } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
