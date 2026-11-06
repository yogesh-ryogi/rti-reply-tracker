const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'User no longer exists' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Role '${req.user?.role}' is not allowed to perform this action`,
      });
    }
    next();
  };
};

// Ensure clerk/pdo can only access their own panchayat data
const samePanchayat = (req, res, next) => {
  if (req.user.role === 'citizen') return next();
  const target = req.params.panchayat || req.body.panchayat || req.query.panchayat;
  if (target && target !== req.user.panchayat) {
    return res.status(403).json({ message: 'Access denied to this panchayat' });
  }
  next();
};

module.exports = { protect, restrictTo, samePanchayat };
