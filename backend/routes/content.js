const express = require('express');
const db = require('../db/database');

const router = express.Router();

// Public: read all site content (server-rendered values)
router.get('/', (req, res) => {
  const rows = db.prepare('SELECT key, value FROM site_content').all();
  const content = {};
  rows.forEach(r => (content[r.key] = r.value));
  res.json({ content });
});

module.exports = router;
