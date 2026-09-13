const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'gather_super_secret_key_change_me';

function sign(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: '12h' });
}

function verify(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function verifyStaff(req, res, next) {
  verify(req, res, () => {
    if (!req.user.type || !['staff', 'admin'].includes(req.user.type)) {
      return res.status(403).json({ error: 'Staff access required' });
    }
    next();
  });
}

function verifyAdmin(req, res, next) {
  verify(req, res, () => {
    if (req.user.role !== 'admin' || req.user.type !== 'staff') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  });
}

module.exports = { sign, verify, verifyStaff, verifyAdmin, SECRET };