const express = require('express');
const db = require('../db/database');
const { verify } = require('../middleware/auth');

const router = express.Router();

function eventWithSold(id) {
  const sold = db.prepare('SELECT COALESCE(SUM(tickets), 0) AS sold FROM bookings WHERE event_id = ? AND status != ?').get(id, 'cancelled');
  return sold.sold || 0;
}

function mapEvent(row) {
  return { ...row, sold: eventWithSold(row.id) };
}

// -------- Public --------
router.get('/', (req, res) => {
  const { search, category, location, date, limit } = req.query;
  let sql = 'SELECT * FROM events WHERE status = ?';
  const params = ['published'];
  if (search) {
    sql += ' AND (title LIKE ? OR description LIKE ? OR location LIKE ? OR venue LIKE ?)';
    const q = `%${search}%`;
    params.push(q, q, q, q);
  }
  if (category) {
    sql += ' AND category = ?';
    params.push(category);
  }
  if (location) {
    sql += ' AND (location LIKE ? OR venue LIKE ?)';
    const q = `%${location}%`;
    params.push(q, q);
  }
  if (date) {
    if (date === 'this-week') {
      sql += " AND date(date) BETWEEN date('now') AND date('now', '+7 days')";
    } else if (date === 'this-month') {
      sql += " AND date(date) BETWEEN date('now') AND date('now', '+1 month')";
    } else if (date === 'next-month') {
      sql += " AND date(date) BETWEEN date('now', '+1 month') AND date('now', '+2 months')";
    }
  }
  sql += ' ORDER BY date ASC';
  if (limit) {
    sql += ' LIMIT ?';
    params.push(parseInt(limit, 10));
  }
  const rows = db.prepare(sql).all(...params).map(mapEvent);

  const categories = db.prepare("SELECT DISTINCT category FROM events WHERE status='published' ORDER BY category").all().map(r => r.category);
  const locations = db.prepare("SELECT DISTINCT location FROM events WHERE status='published' ORDER BY location").all().map(r => r.location);

  res.json({ events: rows, categories, locations });
});

router.get('/featured', (req, res) => {
  const rows = db.prepare("SELECT * FROM events WHERE status='published' AND featured=1 ORDER BY date ASC").all().map(mapEvent);
  res.json({ events: rows });
});

router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Event not found' });
  res.json({ event: mapEvent(row) });
});

// -------- Public booking creation (supports optional user_id) --------
router.post('/:id/book', (req, res) => {
  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
  if (!event || event.status !== 'published') return res.status(404).json({ error: 'Event not found' });

  const { name, email, phone, tickets, user_id } = req.body || {};
  if (!name || !email) return res.status(400).json({ error: 'Name and email are required' });
  const t = parseInt(tickets, 10) || 1;
  if (t < 1) return res.status(400).json({ error: 'At least 1 ticket required' });

  const sold = eventWithSold(event.id);
  if (event.capacity > 0 && (sold + t) > event.capacity) {
    return res.status(400).json({ error: `Only ${Math.max(event.capacity - sold, 0)} tickets remaining` });
  }

  const total = +(event.price * t).toFixed(2);
  const uid = user_id || null;
  const info = db.prepare('INSERT INTO bookings (event_id, user_id, name, email, phone, tickets, total) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(event.id, uid, String(name).trim(), String(email).trim().toLowerCase(), (phone || '').trim(), t, total);

  res.status(201).json({
    booking: {
      id: info.lastInsertRowid,
      event_id: event.id,
      event_title: event.title,
      name: String(name).trim(),
      email: String(email).trim().toLowerCase(),
      phone: (phone || '').trim(),
      tickets: t,
      total
    },
    message: 'Booking confirmed'
  });
});

module.exports = router;
