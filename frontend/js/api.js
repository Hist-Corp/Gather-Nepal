const API = {
  async get(url, token) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = 'Bearer ' + token;
    const res = await fetch(url, { headers });
    return res.json();
  },
  async post(url, body, token) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = 'Bearer ' + token;
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });
    return res.json();
  },
  async patch(url, body, token) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = 'Bearer ' + token;
    const res = await fetch(url, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(body)
    });
    return res.json();
  }
};

function getAuthToken() {
  return localStorage.getItem('gather_user_token');
}

function getUser() {
  try { return JSON.parse(localStorage.getItem('gather_user') || 'null'); }
  catch (e) { return null; }
}

function setAuth(token, user) {
  localStorage.setItem('gather_user_token', token);
  localStorage.setItem('gather_user', JSON.stringify(user));
}

function clearAuth() {
  localStorage.removeItem('gather_user_token');
  localStorage.removeItem('gather_user');
}

function fmtDate(d) {
  if (!d) return 'TBA';
  try { return new Date(d + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }); }
  catch (e) { return d; }
}

function fmtTime(t) {
  if (!t) return '';
  try {
    const [h, m] = t.split(':');
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hr = h % 12 || 12;
    return `${hr}:${m} ${ampm}`;
  } catch (e) { return t; }
}

function fmtMoney(n) {
  const num = Number(n || 0);
  if (num === 0) return 'Free';
  return 'Rs. ' + num.toLocaleString('en-IN');
}

function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function qs(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function showAlert(el, msg, type = 'error') {
  if (!el) return;
  const icons = {
    error: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
    success: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
    warning: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L21.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'
  };
  el.innerHTML = msg ? `<div class="alert alert-${type}">${icons[type] || ''}<div>${escapeHtml(msg)}</div></div>` : '';
}

function placeholderBox(text) {
  const d = document.createElement('div');
  d.className = 'placeholder';
  d.textContent = text;
  return d;
}

function eventCard(e) {
  const free = Number(e.price) === 0;
  const soldOut = e.capacity > 0 && Number(e.sold) >= Number(e.capacity);
  const card = document.createElement('a');
  card.className = 'event-card';
  card.href = '/event.html?id=' + e.id;
  card.setAttribute('role', 'listitem');

  const media = document.createElement('div');
  media.className = 'card-media';
  if (e.image) {
    const img = document.createElement('img');
    img.src = e.image; img.alt = e.title; img.loading = 'lazy';
    img.onerror = () => { media.innerHTML = ''; media.appendChild(placeholderBox('✦')); };
    media.appendChild(img);
  } else {
    media.appendChild(placeholderBox('✦'));
  }
  const badge = document.createElement('span');
  badge.className = 'card-badge badge ' + (soldOut ? 'badge-muted' : free ? 'badge-sage' : 'badge-amber');
  badge.textContent = soldOut ? 'Sold Out' : free ? 'Free' : fmtMoney(e.price);
  media.appendChild(badge);

  if (e.featured) {
    const featuredBadge = document.createElement('span');
    featuredBadge.className = 'card-badge-featured';
    featuredBadge.textContent = '★ Featured';
    media.appendChild(featuredBadge);
  }

  const content = document.createElement('div');
  content.className = 'card-content';
  content.innerHTML = `
    <span class="category">${escapeHtml(e.category)}</span>
    <h3>${escapeHtml(e.title)}</h3>
    <div class="event-meta">
      <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> ${fmtDate(e.date)}${e.time ? ' · ' + fmtTime(e.time) : ''}</span>
      <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> ${escapeHtml(e.location || e.venue || 'Venue TBA')}</span>
    </div>
    <div class="card-footer">
      <span class="event-price ${free ? 'free' : ''}">${free ? 'Free' : fmtMoney(e.price)}</span>
      <span class="btn btn-primary btn-sm">${soldOut ? 'Waitlist' : 'Book Now'}</span>
    </div>`;
  card.appendChild(media);
  card.appendChild(content);
  return card;
}

function renderEvents(container, events) {
  container.innerHTML = '';
  if (!events.length) {
    container.innerHTML = '<div class="empty-state"><h3>No events found</h3><p>Try adjusting your filters or check back soon.</p></div>';
    return;
  }
  events.forEach(e => container.appendChild(eventCard(e)));
}

// Update nav based on auth state
function updateAuthNav() {
  const token = getAuthToken();
  const user = getUser();
  const navAuth = document.querySelector('.nav-links');
  if (!navAuth) return;

  const signupLink = navAuth.querySelector('a[href="/signup.html"]');
  const loginLink = navAuth.querySelector('a[href="/login.html"]');
  const dashboardLink = navAuth.querySelector('a[href="/dashboard.html"]');
  const createLink = navAuth.querySelector('a[href="/create-event.html"]');
  const userDisplay = document.getElementById('user-name-display');
  const logoutBtn = document.getElementById('logout-btn');

  if (token && user) {
    if (signupLink) signupLink.style.display = 'none';
    if (loginLink) loginLink.style.display = 'none';
    if (dashboardLink) dashboardLink.style.display = 'inline-block';
    if (createLink) createLink.style.display = 'inline-block';
    if (userDisplay) userDisplay.textContent = user.name;
    if (logoutBtn) logoutBtn.style.display = 'inline-flex';
  } else {
    if (signupLink) signupLink.style.display = 'inline-block';
    if (loginLink) loginLink.style.display = 'inline-block';
    if (dashboardLink) dashboardLink.style.display = 'none';
    if (createLink) createLink.style.display = 'none';
    if (userDisplay) userDisplay.textContent = '';
    if (logoutBtn) logoutBtn.style.display = 'none';
  }
}

document.addEventListener('DOMContentLoaded', updateAuthNav);

document.addEventListener('click', (e) => {
  if (e.target.id === 'logout-btn') {
    clearAuth();
    updateAuthNav();
    window.location.href = '/';
  }
});

// Mobile nav toggle
document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('navToggle');
  const links = document.getElementById('navLinks');
  if (toggle && links) {
    toggle.addEventListener('click', () => {
      links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', links.classList.contains('open'));
    });
  }
  const navbar = document.getElementById('navbar');
  if (navbar) {
    window.addEventListener('scroll', () => {
      navbar.classList.toggle('scrolled', window.scrollY > 10);
    });
  }
});