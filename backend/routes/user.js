const express = require('express');
const db = require('../db/database');
const { verify } = require('../middleware/auth');

const router = express.Router();

router.use(verify);

// Get user's bookings (with event details)
router.get('/bookings', (req, res) => {
  const rows = db.prepare(`
    SELECT b.*, e.title AS event_title, e.date AS event_date, e.time AS event_time,
           e.venue, e.location, e.image, e.category
    FROM bookings b
    LEFT JOIN events e ON e.id = b.event_id
    WHERE b.user_id = ?
    ORDER BY b.created_at DESC
  `).all(req.user.id);
  res.json({ bookings: rows });
});

// Cancel a booking (25% fee, 75% refund)
router.post('/bookings/:id/cancel', (req, res) => {
  const booking = db.prepare('SELECT * FROM bookings WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!booking) return res.status(404).json({ error: 'Booking not found' });
  if (booking.status === 'cancelled') return res.status(400).json({ error: 'Already cancelled' });

  const event = db.prepare('SELECT date FROM events WHERE id = ?').get(booking.event_id);
  if (event && new Date(event.date) < new Date()) {
    return res.status(400).json({ error: 'Cannot cancel past events' });
  }

  const refundAmount = +(booking.total * 0.75).toFixed(2);
  const fee = +(booking.total * 0.25).toFixed(2);

  db.prepare(`UPDATE bookings SET status = 'cancelled', refund_amount = ?, cancelled_at = datetime('now') WHERE id = ?`)
    .run(refundAmount, req.params.id);

  res.json({
    message: 'Booking cancelled',
    refund: refundAmount,
    fee: fee,
    original_total: booking.total
  });
});

// Get user's event applications
router.get('/applications', (req, res) => {
  const rows = db.prepare(`
    SELECT ea.*, s.name AS reviewer_name
    FROM event_applications ea
    LEFT JOIN staff s ON s.id = ea.reviewed_by
    WHERE ea.user_id = ?
    ORDER BY ea.created_at DESC
  `).all(req.user.id);
  res.json({ applications: rows });
});

// Submit event application
router.post('/applications', (req, res) => {
  const {
    title, description, category, format, venue, location, date, time,
    capacity, price, image, tags,
    host_name, host_email, host_bio, host_links
  } = req.body || {};

  if (!title || !description || !date || !venue || !location || !host_name || !host_email || !host_bio) {
    return res.status(400).json({ error: 'All required fields must be filled' });
  }

  const info = db.prepare(`INSERT INTO event_applications
    (user_id, title, description, category, format, venue, location, date, time,
     capacity, price, image, tags, host_name, host_email, host_bio, host_links)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(
      req.user.id,
      String(title).trim(), String(description).trim(), String(category || 'General').trim(),
      String(format || 'in-person').trim(), String(venue).trim(), String(location).trim(),
      String(date), String(time || '19:00'),
      parseInt(capacity || 100, 10), +(price || 0), String(image || '').trim(),
      String(tags || '').trim(),
      String(host_name).trim(), String(host_email).trim().toLowerCase(),
      String(host_bio).trim(), String(host_links || '').trim()
    );

  res.status(201).json({
    message: 'Application submitted successfully',
    application: { id: info.lastInsertRowid, status: 'pending' }
  });
});

// Get user profile stats
router.get('/stats', (req, res) => {
  const totalBookings = db.prepare('SELECT COUNT(*) AS c FROM bookings WHERE user_id = ?').get(req.user.id).c;
  const upcomingBookings = db.prepare(`
    SELECT COUNT(*) AS c FROM bookings b
    JOIN events e ON e.id = b.event_id
    WHERE b.user_id = ? AND b.status = 'confirmed' AND date(e.date) >= date('now')
  `).get(req.user.id).c;
  const pastBookings = db.prepare(`
    SELECT COUNT(*) AS c FROM bookings b
    JOIN events e ON e.id = b.event_id
    WHERE b.user_id = ? AND b.status = 'confirmed' AND date(e.date) < date('now')
  `).get(req.user.id).c;
  const cancelledBookings = db.prepare('SELECT COUNT(*) AS c FROM bookings WHERE user_id = ? AND status = ?').get(req.user.id, 'cancelled').c;
  const totalSpent = db.prepare('SELECT COALESCE(SUM(total), 0) AS t FROM bookings WHERE user_id = ? AND status = ?').get(req.user.id, 'confirmed').t;

  res.json({
    stats: {
      totalBookings,
      upcoming: upcomingBookings,
      past: pastBookings,
      cancelled: cancelledBookings,
      totalSpent
    }
  });
});

module.exports = router;
