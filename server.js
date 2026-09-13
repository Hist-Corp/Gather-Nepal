const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes
app.use('/api/auth', require('./backend/routes/auth'));
app.use('/api/user', require('./backend/routes/user'));
app.use('/api/events', require('./backend/routes/events'));
app.use('/api/waitlist', require('./backend/routes/waitlist'));
app.use('/api/content', require('./backend/routes/content'));
app.use('/api/admin', require('./backend/routes/admin'));

// Static frontend (public website)
app.use(express.static(path.join(__dirname, 'frontend')));

// Static admin dashboard (separate area)
app.use('/admin', express.static(path.join(__dirname, 'dashboard')));

// API 404 handler
app.use('/api', (req, res) => res.status(404).json({ error: 'API route not found' }));

// Frontend fallback (SPA-style navigation)
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log('==============================================');
  console.log('  Gather — Events That Move You');
  console.log(`  Frontend:  http://localhost:${PORT}`);
  console.log(`  Dashboard: http://localhost:${PORT}/admin/login.html`);
  console.log('==============================================');
});