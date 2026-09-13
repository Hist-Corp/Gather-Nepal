const express = require('express');
const db = require('../db/database');
const { verify } = require('../middleware/auth');

const router = express.Router();

router.use(verify);

// Join waitlist for an event
router.post('/:eventId/join', (req, res) => {
  const eventId = parseInt(req.params.eventId, 10);
  const { name, email, phone, tickets, user_id } = req.body || {};

  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(eventId);
  if (!event) return res.status(404).json({ error: 'Event not found' });
  if (event.status !== 'published') return res.status(400).json({ error: 'Event not available' });

  // Check if event is actually sold out
  const sold = db.prepare('SELECT COALESCE(SUM(tickets), 0) AS s FROM bookings WHERE event_id = ? AND status != ?').get(eventId, 'cancelled').s;
  if (event.capacity > 0 && sold < event.capacity) {
    return res.status(400).json({ error: 'Event still has availability. Please book directly.' });
  }

  if (!name || !email) return res.status(400).json({ error: 'Name and email are required' });
  const t = parseInt(tickets, 10) || 1;
  if (t < 1) return res.status(400).json({ error: 'At least 1 ticket required' });

  // Check if user already on waitlist
  const uid = user_id || req.user.id;
  const existing = db.prepare('SELECT * FROM waitlist WHERE event_id = ? AND user_id = ? AND status = ?').get(eventId, uid, 'waiting');
  if (existing) return res.status(409).json({ error: 'Already on waitlist for this event' });

  const info = db.prepare('INSERT INTO waitlist (user_id, event_id, name, email, phone, tickets) VALUES (?, ?, ?, ?, ?, ?)')
    .run(uid, eventId, String(name).trim(), String(email).trim().toLowerCase(), (phone || '').trim(), t);

  res.status(201).json({
    waitlist: {
      id: info.lastInsertRowid,
      event_id: eventId,
      event_title: event.title,
      name: String(name).trim(),
      email: String(email).trim().toLowerCase(),
      tickets: t,
      status: 'waiting',
      position: getWaitlistPosition(eventId, info.lastInsertRowid)
    },
    message: 'Added to waitlist'
  });
});

// Leave waitlist
router.delete('/:eventId/leave', (req, res) => {
  const eventId = parseInt(req.params.eventId, 10);
  const uid = req.user.id;

  const info = db.prepare('DELETE FROM waitlist WHERE event_id = ? AND user_id = ? AND status = ?').run(eventId, uid, 'waiting');
  if (info.changes === 0) return res.status(404).json({ error: 'Not on waitlist for this event' });

  res.json({ message: 'Removed from waitlist' });
});

// Get user's waitlist entries
router.get('/', (req, res) => {
  const rows = db.prepare(`
    SELECT w.*, e.title AS event_title, e.date AS event_date, e.venue, e.location, e.image
    FROM waitlist w
    LEFT JOIN events e ON e.id = w.event_id
    WHERE w.user_id = ? AND w.status = 'waiting'
    ORDER BY w.created_at ASC
  `).all(req.user.id);
  res.json({ waitlist: rows });
});

// Get waitlist position for specific event
router.get('/:eventId/position', (req, res) => {
  const eventId = parseInt(req.params.eventId, 10);
  const uid = req.user.id;

  const entry = db.prepare('SELECT * FROM waitlist WHERE event_id = ? AND user_id = ? AND status = ?').get(eventId, uid, 'waiting');
  if (!entry) return res.status(404).json({ error: 'Not on waitlist for this event' });

  const position = getWaitlistPosition(eventId, entry.id);
  res.json({ position, entry });
});

function getWaitlistPosition(eventId, entryId) {
  const row = db.prepare('SELECT COUNT(*) AS c FROM waitlist WHERE event_id = ? AND id <= ? AND status = ?').get(eventId, entryId, 'waiting');
  return row.c || 1;
}

module.exports = router;
