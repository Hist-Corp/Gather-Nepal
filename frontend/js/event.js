let currentEvent = null;

async function init() {
  const id = qs('id');
  if (!id) {
    document.getElementById('detail-root').innerHTML = '<div class="empty-state"><h3>No event selected</h3><p><a href="/events.html" style="color:var(--accent-light); font-weight:600;">Browse all events →</a></p></div>';
    return;
  }
  try {
    const [eventRes, contentRes] = await Promise.all([
      API.get('/api/events/' + id),
      API.get('/api/content')
    ]);
    const e = eventRes.event;
    if (!e) throw new Error('not found');
    currentEvent = e;
    const c = contentRes.content || {};
    document.title = e.title + ' — Gather Nepal';
    render(e);
  } catch (err) {
    document.getElementById('detail-root').innerHTML = '<div class="empty-state"><h3>Event not found</h3><p>This event may have been removed or updated.</p><p><a href="/events.html" style="color:var(--accent-light); font-weight:600;">Browse all Nepal events →</a></p></div>';
  }
}

function render(e) {
  const free = Number(e.price) === 0;
  const soldOut = e.capacity > 0 && Number(e.sold) >= Number(e.capacity);
  const remaining = Math.max(Number(e.capacity) - Number(e.sold), 0);

  const root = document.getElementById('detail-root');
  const wrap = document.createElement('div');
  wrap.className = 'event-detail';

  const heroContainer = document.createElement('div');

  const hero = document.createElement('div');
  hero.className = 'detail-hero';
  if (e.image) {
    const img = document.createElement('img');
    img.src = e.image; img.alt = e.title;
    img.onerror = () => { hero.innerHTML = ''; hero.appendChild(placeholderBox('✦')); };
    hero.appendChild(img);
  } else {
    hero.appendChild(placeholderBox('✦'));
  }

  const info = document.createElement('div');
  info.className = 'detail-info';
  info.innerHTML = `
    <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
      <span class="badge badge-sky">${escapeHtml(e.category)}</span>
      <span class="badge ${soldOut ? 'badge-muted' : free ? 'badge-success' : 'badge-amber'}">${soldOut ? 'Sold Out' : free ? 'Free Event' : fmtMoney(e.price)}</span>
    </div>
    <h1>${escapeHtml(e.title)}</h1>
    <div class="event-meta" style="font-size:1.05rem; gap:var(--space-lg); margin-top:8px;">
      <span>📅 ${fmtDate(e.date)}${e.time ? ' at ' + fmtTime(e.time) : ''}</span>
      <span>📍 ${escapeHtml(e.venue || '')}${e.location ? ', ' + escapeHtml(e.location) : ''}</span>
    </div>
    <div class="detail-description" style="margin-top:var(--space-md);">${escapeHtml(e.description).replace(/\n/g, '<br>')}</div>`;

  heroContainer.appendChild(hero);
  heroContainer.appendChild(info);

  // Booking card / Waitlist card
  const aside = document.createElement('div');
  aside.className = 'booking-card';

  if (soldOut) {
    const user = getUser();
    aside.innerHTML = `
      <h3>Event Sold Out</h3>
      <p style="color:var(--muted); font-size:0.92rem; margin-bottom:var(--space-md);">Join the official waitlist to get notified if tickets become available due to cancellations.</p>
      <div class="alert alert-warning">⚡ High demand: Seats filled.</div>
      <form id="waitlist-form" style="margin-top:var(--space-md);">
        <div class="field"><label>Full Name *</label><input type="text" name="name" required value="${escapeHtml((user || {}).name || '')}" /></div>
        <div class="field"><label>Email Address *</label><input type="email" name="email" required value="${escapeHtml((user || {}).email || '')}" /></div>
        <div class="field"><label>Phone (optional)</label><input type="tel" name="phone" placeholder="+977 9801234567" /></div>
        <div class="field"><label>Requested Tickets</label><input type="number" name="tickets" min="1" max="5" value="1" /></div>
        <div id="form-error"></div>
        <button type="submit" class="btn btn-primary" style="width:100%;">Join Waitlist</button>
      </form>`;
  } else {
    aside.innerHTML = `
      <h3>Book Your Tickets</h3>
      <div class="price-big ${free ? 'free' : ''}">${free ? 'Free' : fmtMoney(e.price) + ' <small style="font-size:.65em; color:var(--muted);">/ ticket</small>'}</div>
      <div class="stock">${e.capacity > 0 ? remaining + ' seats remaining' : 'Unlimited seats'}</div>
      <form id="booking-form">
        <div class="field"><label>Full Name *</label><input type="text" name="name" required value="${escapeHtml((getUser() || {}).name || '')}" /></div>
        <div class="field"><label>Email Address *</label><input type="email" name="email" required value="${escapeHtml((getUser() || {}).email || '')}" /></div>
        <div class="field"><label>Phone (optional)</label><input type="tel" name="phone" placeholder="+977 9801234567" /></div>
        <div class="field">
          <label>Number of Tickets</label>
          <div class="ticket-control">
            <button type="button" id="t-minus">−</button>
            <span id="t-count">1</span>
            <button type="button" id="t-plus">+</button>
          </div>
        </div>
        <div class="total-row"><span>Total Price</span><span id="total-amount">${free ? 'Free' : fmtMoney(e.price)}</span></div>
        <div id="form-error"></div>
        <button type="submit" class="btn btn-primary" style="width:100%;">Confirm Booking</button>
      </form>`;
  }

  wrap.appendChild(heroContainer);
  wrap.appendChild(aside);

  root.innerHTML = '';
  root.appendChild(wrap);

  if (soldOut) {
    const wlForm = document.getElementById('waitlist-form');
    wlForm.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const errBox = document.getElementById('form-error');
      errBox.innerHTML = '';
      const name = wlForm.querySelector('[name=name]').value.trim();
      const email = wlForm.querySelector('[name=email]').value.trim();
      const phone = wlForm.querySelector('[name=phone]').value.trim();
      const tickets = parseInt(wlForm.querySelector('[name=tickets]').value, 10) || 1;
      const user = getUser();
      const token = getAuthToken();

      if (!token) {
        errBox.innerHTML = '<div class="alert alert-warning">Please <a href="/login.html" style="color:var(--accent-light); font-weight:600;">Log In</a> to join the waitlist.</div>';
        return;
      }

      const btn = wlForm.querySelector('button[type=submit]');
      btn.disabled = true; btn.textContent = 'Joining Waitlist...';

      try {
        const res = await API.post(`/api/waitlist/${e.id}/join`, { name, email, phone, tickets, user_id: user ? user.id : null }, token);
        if (res.error) {
          errBox.innerHTML = '<div class="alert alert-error">' + escapeHtml(res.error) + '</div>';
          btn.disabled = false; btn.textContent = 'Join Waitlist';
        } else {
          aside.innerHTML = `
            <div class="alert alert-success">
              ✨ <strong>Added to Waitlist!</strong><br>
              You are position <strong>#${res.waitlist.position}</strong> in line for ${escapeHtml(e.title)}. We'll notify ${escapeHtml(email)} as soon as tickets free up.
            </div>
            <a href="/dashboard.html" class="btn btn-outline" style="width:100%;">View My Waitlist Status</a>`;
        }
      } catch (err) {
        errBox.innerHTML = '<div class="alert alert-error">Unable to join waitlist. Please try again.</div>';
        btn.disabled = false; btn.textContent = 'Join Waitlist';
      }
    });
    return;
  }

  let tickets = 1;
  const tCount = document.getElementById('t-count');
  const tTotal = document.getElementById('total-amount');
  const maxTickets = e.capacity > 0 ? Math.min(remaining, 10) : 10;

  function update() {
    tCount.textContent = tickets;
    tTotal.textContent = free ? 'Free' : fmtMoney(e.price * tickets);
  }

  document.getElementById('t-minus').addEventListener('click', () => { if (tickets > 1) { tickets--; update(); } });
  document.getElementById('t-plus').addEventListener('click', () => {
    if (tickets < maxTickets && (e.capacity === 0 || tickets < remaining)) { tickets++; update(); }
  });

  document.getElementById('booking-form').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const errBox = document.getElementById('form-error');
    errBox.innerHTML = '';
    const name = document.querySelector('[name=name]').value.trim();
    const email = document.querySelector('[name=email]').value.trim();
    const phone = document.querySelector('[name=phone]').value.trim();
    if (!name || !email) { errBox.innerHTML = '<div class="alert alert-error">Name and email are required.</div>'; return; }

    const btn = ev.target.querySelector('button[type=submit]');
    btn.disabled = true; btn.textContent = 'Processing Booking...';

    const user = getUser();
    const res = await API.post('/api/events/' + e.id + '/book', { name, email, phone, tickets, user_id: user ? user.id : null });
    if (res.error) {
      errBox.innerHTML = '<div class="alert alert-error">' + escapeHtml(res.error) + '</div>';
      btn.disabled = false; btn.textContent = 'Confirm Booking';
      return;
    }
    const p = new URLSearchParams();
    p.set('name', res.booking.name);
    p.set('event', res.booking.event_title);
    p.set('tickets', res.booking.tickets);
    p.set('total', res.booking.total);
    p.set('date', e.date);
    p.set('time', e.time);
    p.set('venue', e.venue || e.location || '');
    p.set('email', res.booking.email);
    window.location.href = '/success.html?' + p.toString();
  });
}

init();