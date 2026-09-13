const express = require('express');
const db = require('../db/database');
const { verifyStaff } = require('../middleware/auth');

const router = express.Router();

router.use(verifyStaff);

function mapEvent(row) {
  const sold = db.prepare('SELECT COALESCE(SUM(tickets), 0) AS s FROM bookings WHERE event_id = ? AND status != ?').get(row.id, 'cancelled').s;
  return { ...row, sold: sold || 0 };
}

// Dashboard stats
router.get('/stats', (req, res) => {
  const totalEvents = db.prepare('SELECT COUNT(*) AS c FROM events').get().c;
  const publishedEvents = db.prepare("SELECT COUNT(*) AS c FROM events WHERE status='published'").get().c;
  const totalBookings = db.prepare('SELECT COUNT(*) AS c FROM bookings').get().c;
  const confirmedBookings = db.prepare("SELECT COUNT(*) AS c FROM bookings WHERE status='confirmed'").get().c;
  const revenue = db.prepare("SELECT COALESCE(SUM(total),0) AS t FROM bookings WHERE status='confirmed'").get().t;
  const totalTickets = db.prepare("SELECT COALESCE(SUM(tickets),0) AS t FROM bookings WHERE status='confirmed'").get().t;
  const pendingApplications = db.prepare("SELECT COUNT(*) AS c FROM event_applications WHERE status='pending'").get().c;

  const recentBookings = db.prepare(`
    SELECT b.*, e.title AS event_title, e.date AS event_date
    FROM bookings b LEFT JOIN events e ON e.id = b.event_id
    ORDER BY b.created_at DESC LIMIT 8`).all();

  const topEvents = db.prepare(`
    SELECT e.id, e.title, e.date, e.category,
      (SELECT COALESCE(SUM(tickets),0) FROM bookings b2 WHERE b2.event_id = e.id AND b2.status='confirmed') AS sold,
      (SELECT COALESCE(SUM(total),0) FROM bookings b3 WHERE b3.event_id = e.id AND b3.status='confirmed') AS revenue
    FROM events e ORDER BY revenue DESC LIMIT 5`).all();

  const bookingsByDate = db.prepare(`
    SELECT DATE(created_at) AS d, COUNT(*) AS count
    FROM bookings GROUP BY DATE(created_at) ORDER BY d ASC LIMIT 30`).all();

  res.json({
    stats: {
      totalEvents,
      publishedEvents,
      totalBookings,
      confirmedBookings,
      revenue,
      totalTickets,
      pendingApplications
    },
    recentBookings,
    topEvents,
    bookingsByDate
  });
});

// Events (admin)
router.get('/events', (req, res) => {
  const rows = db.prepare('SELECT * FROM events ORDER BY date ASC').all().map(mapEvent);
  res.json({ events: rows });
});

router.post('/events', (req, res) => {
  const { title, description, category, location, venue, date, time, price, capacity, image, status, featured, format } = req.body || {};
  if (!title || !date) return res.status(400).json({ error: 'Title and date are required' });
  const info = db.prepare(`INSERT INTO events
    (title, description, category, location, venue, date, time, price, capacity, image, status, featured, format)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(
      String(title).trim(), (description || '').trim(), (category || 'General').trim(),
      (location || '').trim(), (venue || '').trim(), String(date),
      String(time || '10:00'), +(price || 0), parseInt(capacity || 100, 10),
      (image || '').trim(), (status && status === 'draft' ? 'draft' : 'published'),
      featured ? 1 : 0, String(format || 'in-person').trim()
    );
  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ event: mapEvent(event) });
});

router.put('/events/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Event not found' });
  const b = req.body || {};
  const upto = (v, dflt) => (v === undefined ? dflt : v);

  db.prepare(`UPDATE events SET
    title=?, description=?, category=?, location=?, venue=?, date=?, time=?,
    price=?, capacity=?, image=?, status=?, featured=?, format=? WHERE id=?`)
    .run(
      String(upto(b.title, existing.title)).trim(),
      String(upto(b.description, existing.description)).trim(),
      String(upto(b.category, existing.category)).trim(),
      String(upto(b.location, existing.location)).trim(),
      String(upto(b.venue, existing.venue)).trim(),
      String(upto(b.date, existing.date)),
      String(upto(b.time, existing.time)),
      +(upto(b.price, existing.price)),
      parseInt(upto(b.capacity, existing.capacity), 10),
      String(upto(b.image, existing.image)).trim(),
      b.status && b.status === 'draft' ? 'draft' : 'published',
      b.featured ? 1 : 0,
      String(upto(b.format, existing.format)).trim(),
      req.params.id
    );
  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
  res.json({ event: mapEvent(event) });
});

router.delete('/events/:id', (req, res) => {
  const info = db.prepare('DELETE FROM events WHERE id = ?').run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: 'Event not found' });
  res.json({ message: 'Event deleted' });
});

// Bookings (admin)
router.get('/bookings', (req, res) => {
  const rows = db.prepare(`
    SELECT b.*, e.title AS event_title, e.date AS event_date
    FROM bookings b LEFT JOIN events e ON e.id = b.event_id
    ORDER BY b.created_at DESC`).all();
  res.json({ bookings: rows });
});

router.patch('/bookings/:id/status', (req, res) => {
  const { status } = req.body || {};
  if (!['confirmed', 'pending', 'cancelled'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  const info = db.prepare('UPDATE bookings SET status = ? WHERE id = ?').run(status, req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: 'Booking not found' });
  res.json({ message: 'Booking status updated' });
});

router.delete('/bookings/:id', (req, res) => {
  const info = db.prepare('DELETE FROM bookings WHERE id = ?').run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: 'Booking not found' });
  res.json({ message: 'Booking deleted' });
});

// Event Applications (admin)
router.get('/applications', (req, res) => {
  const rows = db.prepare(`
    SELECT ea.*, u.name AS user_name, u.email AS user_email,
           s.name AS reviewer_name
    FROM event_applications ea
    LEFT JOIN users u ON u.id = ea.user_id
    LEFT JOIN staff s ON s.id = ea.reviewed_by
    ORDER BY ea.created_at DESC`).all();
  res.json({ applications: rows });
});

router.patch('/applications/:id', (req, res) => {
  const { status, review_notes } = req.body || {};
  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  const app = db.prepare('SELECT * FROM event_applications WHERE id = ?').get(req.params.id);
  if (!app) return res.status(404).json({ error: 'Application not found' });

  db.prepare(`UPDATE event_applications SET status = ?, reviewed_by = ?, reviewed_at = datetime('now'), review_notes = ? WHERE id = ?`)
    .run(status, req.user.id, review_notes || '', req.params.id);

  // If approved, create the event
  if (status === 'approved') {
    const info = db.prepare(`INSERT INTO events
      (title, description, category, format, venue, location, date, time,
       capacity, price, image, status, featured)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', 0)`)
      .run(
        app.title, app.description, app.category, app.format, app.venue, app.location,
        app.date, app.time, app.capacity, app.price, app.image
      );
    // Link the created event to the application
    db.prepare('UPDATE event_applications SET review_notes = ? WHERE id = ?')
      .run((app.review_notes || '') + `\n\nCreated event ID: ${info.lastInsertRowid}`, req.params.id);
  }

  res.json({ message: `Application ${status}` });
});

// Content (admin)
router.put('/content', (req, res) => {
  const { content } = req.body || {};
  if (!content || typeof content !== 'object') return res.status(400).json({ error: 'content object required' });
  const upsert = db.prepare(`
    INSERT INTO site_content (key, value) VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value`);
  const tx = db.transaction(() => {
    Object.entries(content).forEach(([k, v]) => upsert.run(k, String(v)));
  });
  tx();
  res.json({ message: 'Content updated' });
});

// Staff users (admin only)
router.get('/staff', (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
  const rows = db.prepare('SELECT id, name, email, role, created_at FROM staff ORDER BY id ASC').all();
  res.json({ staff: rows });
});

router.post('/staff', (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
  const bcrypt = require('bcryptjs');
  const { name, email, password, role } = req.body || {};
  if (!name || !email || !password) return res.status(400).json({ error: 'Name, email, and password are required' });
  try {
    const hash = bcrypt.hashSync(String(password), 10);
    const info = db.prepare('INSERT INTO staff (name, email, password_hash, role) VALUES (?, ?, ?, ?)')
      .run(String(name).trim(), String(email).trim().toLowerCase(), hash, role === 'admin' ? 'admin' : 'staff');
    res.status(201).json({ staff: { id: info.lastInsertRowid, name: String(name).trim(), email: String(email).trim().toLowerCase(), role: role === 'admin' ? 'admin' : 'staff' } });
  } catch (e) {
    if (String(e.message).includes('UNIQUE')) return res.status(409).json({ error: 'Email already exists' });
    throw e;
  }
});

router.delete('/staff/:id', (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
  if (Number(req.params.id) === req.user.id) return res.status(400).json({ error: 'Cannot delete your own account' });
  const info = db.prepare('DELETE FROM staff WHERE id = ?').run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: 'Staff not found' });
  res.json({ message: 'Staff deleted' });
});

module.exports = router;
