const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db/database');
const { sign, verify } = require('../middleware/auth');

const router = express.Router();

// User signup
router.post('/signup', (req, res) => {
  const { name, email, password, phone } = req.body || {};
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }
  try {
    const hash = bcrypt.hashSync(password, 10);
    const info = db.prepare('INSERT INTO users (name, email, password_hash, phone) VALUES (?, ?, ?, ?)')
      .run(String(name).trim(), String(email).trim().toLowerCase(), hash, (phone || '').trim());
    const token = sign({ id: info.lastInsertRowid, name: String(name).trim(), email: String(email).trim().toLowerCase(), role: 'user', type: 'user' });
    res.status(201).json({
      token,
      user: { id: info.lastInsertRowid, name: String(name).trim(), email: String(email).trim().toLowerCase(), role: 'user', type: 'user' }
    });
  } catch (e) {
    if (String(e.message).includes('UNIQUE')) return res.status(409).json({ error: 'Email already registered' });
    throw e;
  }
});

// User login
router.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(String(email).trim().toLowerCase());
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  const token = sign({ id: user.id, name: user.name, email: user.email, role: user.role, type: 'user' });
  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role, type: 'user' }
  });
});

// Staff login
router.post('/staff/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  const user = db.prepare('SELECT * FROM staff WHERE email = ?').get(String(email).trim().toLowerCase());
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  const token = sign({ id: user.id, name: user.name, email: user.email, role: user.role, type: 'staff' });
  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role, type: 'staff' }
  });
});

// Get current user profile
router.get('/me', verify, (req, res) => {
  const table = req.user.type === 'staff' ? 'staff' : 'users';
  const user = db.prepare(`SELECT id, name, email, role, created_at FROM ${table} WHERE id = ?`).get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user: { ...user, type: req.user.type } });
});

module.exports = router;
