const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { PANCHAYAT_MAP } = require('../utils/constants');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const safe = user.toSafeJSON();
  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user: {
        ...safe,
        panchayatName: safe.panchayat ? PANCHAYAT_MAP[safe.panchayat] : null,
      },
    },
  });
};

// POST /api/auth/register  (citizens only)
exports.register = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      phone: phone || '',
      password,
      role: 'citizen',
    });

    createSendToken(user, 201, res);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Registration failed', error: err.message });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password, role, panchayat } = req.body;

    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }

    let user;

    if (role === 'pdo') {
      if (!panchayat) {
        return res.status(400).json({ message: 'Panchayat is required for PDO login' });
      }
      user = await User.findOne({ role: 'pdo', panchayat }).select('+password');
      if (!user || !(await user.comparePassword(password))) {
        return res.status(401).json({ message: `Incorrect password for the ${PANCHAYAT_MAP[panchayat] || panchayat} PDO` });
      }
    } else {
      if (!email) {
        return res.status(400).json({ message: 'Email is required' });
      }
      user = await User.findOne({ email: email.toLowerCase() }).select('+password');
      if (!user || !(await user.comparePassword(password))) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }
      if (role && user.role !== role) {
        return res.status(401).json({ message: `This is not a ${role} account` });
      }
      if ((user.role === 'clerk' || user.role === 'pdo') && panchayat && user.panchayat !== panchayat) {
        return res.status(401).json({ message: `This account does not belong to ${PANCHAYAT_MAP[panchayat]}` });
      }
    }

    createSendToken(user, 200, res);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Login failed', error: err.message });
  }
};

// GET /api/auth/me
exports.getMe = async (req, res) => {
  const safe = req.user.toSafeJSON();
  res.json({
    status: 'success',
    data: {
      user: {
        ...safe,
        panchayatName: safe.panchayat ? PANCHAYAT_MAP[safe.panchayat] : null,
      },
    },
  });
};

// GET /api/auth/clerks?panchayat=alpha  (for login dropdown)
exports.listClerks = async (req, res) => {
  const { panchayat } = req.query;
  if (!panchayat) {
    return res.status(400).json({ message: 'panchayat query required' });
  }
  const clerks = await User.find({ role: 'clerk', panchayat }).select('email name');
  res.json({
    status: 'success',
    data: { clerks },
  });
};
