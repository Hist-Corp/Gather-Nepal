const path = require('path');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'event_management.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ---------- Schema ----------
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS staff (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'staff',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'General',
  location TEXT NOT NULL DEFAULT '',
  venue TEXT NOT NULL DEFAULT '',
  date TEXT NOT NULL,
  time TEXT NOT NULL DEFAULT '10:00',
  price REAL NOT NULL DEFAULT 0,
  capacity INTEGER NOT NULL DEFAULT 100,
  image TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'published',
  featured INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  event_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  tickets INTEGER NOT NULL DEFAULT 1,
  total REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'confirmed',
  refund_amount REAL DEFAULT 0,
  cancelled_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS event_applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'General',
  format TEXT NOT NULL DEFAULT 'in-person',
  venue TEXT NOT NULL DEFAULT '',
  location TEXT NOT NULL DEFAULT '',
  date TEXT NOT NULL,
  time TEXT NOT NULL DEFAULT '19:00',
  capacity INTEGER NOT NULL DEFAULT 100,
  price REAL NOT NULL DEFAULT 0,
  image TEXT NOT NULL DEFAULT '',
  tags TEXT NOT NULL DEFAULT '',
  host_name TEXT NOT NULL,
  host_email TEXT NOT NULL,
  host_bio TEXT NOT NULL DEFAULT '',
  host_links TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_by INTEGER,
  reviewed_at TEXT,
  review_notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (reviewed_by) REFERENCES staff(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS site_content (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS waitlist (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  event_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  tickets INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'waiting',
  notified_at TEXT,
  expires_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);
`);

// ---------- Migration: add missing columns to existing tables ----------
function runMigration() {
  // users: add phone column
  const userCols = db.prepare("PRAGMA table_info(users)").all().map(c => c.name);
  if (!userCols.includes('phone')) {
    db.exec('ALTER TABLE users ADD COLUMN phone TEXT NOT NULL DEFAULT \'\'');
  }

  // bookings: add user_id, refund_amount, cancelled_at
  const bookingCols = db.prepare("PRAGMA table_info(bookings)").all().map(c => c.name);
  if (!bookingCols.includes('user_id')) {
    db.exec('ALTER TABLE bookings ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE SET NULL');
  }
  if (!bookingCols.includes('refund_amount')) {
    db.exec('ALTER TABLE bookings ADD COLUMN refund_amount REAL DEFAULT 0');
  }
  if (!bookingCols.includes('cancelled_at')) {
    db.exec('ALTER TABLE bookings ADD COLUMN cancelled_at TEXT');
  }

  // events: ensure format column (for admin-created events compatibility)
  const eventCols = db.prepare("PRAGMA table_info(events)").all().map(c => c.name);
  if (!eventCols.includes('format')) {
    db.exec("ALTER TABLE events ADD COLUMN format TEXT NOT NULL DEFAULT 'in-person'");
  }

  // waitlist: ensure table exists (migration creates it if not exists)
  const waitlistExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='waitlist'").get();
  if (!waitlistExists) {
    db.exec(`CREATE TABLE waitlist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      event_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL DEFAULT '',
      tickets INTEGER NOT NULL DEFAULT 1,
      status TEXT NOT NULL DEFAULT 'waiting',
      notified_at TEXT,
      expires_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
    )`);
  }

  // site_content: ensure new branding keys exist
  const defaults = {
    site_name: 'Gather Nepal',
    hero_title: 'Events That Move You',
    hero_subtitle: 'Discover hand-picked gatherings across Nepal — from Himalayan music festivals to tech summits in Kathmandu & Pokhara. Every event on Gather is vetted for quality, community, and unforgettable moments.',
    hero_badge: 'Curated Nepal Experiences · Real Connections',
    about_title: 'Our Way',
    about_text: 'We believe the best moments happen offline. Every feature, every policy, every curated event serves one purpose: helping you connect with the vibrant communities of Nepal.',
    contact_email: 'hello@gather.np',
    contact_phone: '+977 1-4567890 / +977 9801234567',
    contact_address: 'Durbar Marg, Kathmandu 44600, Nepal',
    footer_text: '© 2026 Gather Nepal. All rights reserved.',
  };
  const upsert = db.prepare(`
    INSERT INTO site_content (key, value) VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value`);
  const tx = db.transaction(() => Object.entries(defaults).forEach(([k, v]) => upsert.run(k, v)));
  tx();
}

runMigration();

// ---------- Seed data ----------
const staffCount = db.prepare('SELECT COUNT(*) AS c FROM staff').get().c;
if (staffCount === 0) {
  const hash = bcrypt.hashSync('admin123', 10);
  const staffHash = bcrypt.hashSync('staff123', 10);
  const insert = db.prepare('INSERT INTO staff (name, email, password_hash, role) VALUES (?, ?, ?, ?)');
  insert.run('Administrator', 'admin@gather.events', hash, 'admin');
  insert.run('Staff Member', 'staff@gather.events', staffHash, 'staff');
  console.log('Seeded default staff (admin@gather.events / admin123, staff@gather.events / staff123)');
}

// Clean up old sample non-Nepal events if present and insert Nepal events
const nonNepalCount = db.prepare("SELECT COUNT(*) AS c FROM events WHERE location LIKE '%New York%' OR location LIKE '%San Francisco%' OR location LIKE '%Austin%' OR location LIKE '%Los Angeles%' OR location LIKE '%Portland%' OR location LIKE '%Seattle%'").get().c;
if (nonNepalCount > 0) {
  db.prepare("DELETE FROM events WHERE location LIKE '%New York%' OR location LIKE '%San Francisco%' OR location LIKE '%Austin%' OR location LIKE '%Los Angeles%' OR location LIKE '%Portland%' OR location LIKE '%Seattle%'").run();
}

const eventCount = db.prepare('SELECT COUNT(*) AS c FROM events').get().c;
if (eventCount === 0) {
  const insert = db.prepare(`INSERT INTO events
    (title, description, category, location, venue, date, time, price, capacity, image, status, featured)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  const samples = [
    ['Kathmandu Jazz & Fusion Heritage Night',
     'An unforgettable evening of smooth jazz blended with classic Nepali folk fusion instruments in the regal Patan Museum Courtyard. Sip artisanal Himalayan teas and fine beverages while world-class artists perform.',
     'Music', 'Lalitpur, Kathmandu Valley', 'Patan Museum Courtyard', '2026-10-15', '18:30', 1500.00, 120,
     'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?auto=format&fit=crop&w=1200&q=80', 'published', 1],
    ['Nepal Developers & AI Summit 2026',
     'Level up your technical expertise in Nepal\'s premier developer gathering. Featuring hands-on workshops on AI, Cloud Native architectures, React Next.js, and high-performance engineering.',
     'Conference', 'Kathmandu', 'Pragya Bhawan, Kamaladi', '2026-10-24', '09:30', 2500.00, 350,
     'https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?auto=format&fit=crop&w=1200&q=80', 'published', 1],
    ['Himalayan Sunrise Yoga & Mindfulness Retreat',
     'Experience serenity with a guided sunrise meditation and yoga session overlooking panoramic views of the Langtang & Jugal Himalayan ranges. Includes organic herbal tea and breakfast.',
     'Wellness', 'Nagarkot', 'Club Himalaya Resort, Nagarkot', '2026-10-12', '06:00', 1200.00, 45,
     'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=1200&q=80', 'published', 0],
    ['Pokhara Lakeside Indie Music Festival',
     'Two stages of live music, independent art installations, local craft displays, and food pop-ups right along the shores of Fewa Lake. Celebrate Nepal\'s indie music wave.',
     'Music', 'Pokhara', 'Pokhara Lakeside Promenade', '2026-11-08', '15:00', 800.00, 500,
     'https://images.unsplash.com/photo-1485810289946-67b8d5e3c46a?auto=format&fit=crop&w=1200&q=80', 'published', 1],
    ['Authentic Newari Culinary & Cultural Night',
     'A traditional 8-course Samay Baji culinary journey showcasing centuries of Newari heritage. Chef live demonstrations, classical Dhime performance, and traditional wine pairing.',
     'Food', 'Lalitpur', 'Traditional Durbar Square Heritage House', '2026-11-18', '19:00', 1800.00, 35,
     'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=80', 'published', 0],
    ['Kathmandu Tech Founders & Creators Meetup',
     'Monthly high-energy networking event for tech founders, creative designers, and indie developers in Nepal. Pitch demo sessions, lightning talks, and open collaboration.',
     'Social', 'Kathmandu', 'Hub Nepal, Thamel', '2026-10-28', '17:30', 0, 90,
     'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1200&q=80', 'published', 0]
  ];
  const tx = db.transaction(() => samples.forEach(s => insert.run(...s)));
  tx();
  console.log('Seeded sample Nepal events');
}

module.exports = db;