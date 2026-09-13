// Dashboard logic: stats, booking tabs, waitlists, cancellation with 75% NPR refund
document.addEventListener('DOMContentLoaded', () => {
  const token = getAuthToken();
  const user = getUser();
  if (!token || !user) {
    window.location.href = '/login.html';
    return;
  }

  if (document.getElementById('user-name-display')) document.getElementById('user-name-display').textContent = user.name;
  if (document.getElementById('dashboard-greeting')) document.getElementById('dashboard-greeting').textContent = `Welcome back, ${user.name}! Here's your event journey in Nepal.`;

  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) logoutBtn.addEventListener('click', () => { clearAuth(); window.location.href = '/'; });

  // Tabs navigation
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.style.display = 'none');
      btn.classList.add('active');
      const panel = document.getElementById('panel-' + btn.dataset.tab);
      if (panel) panel.style.display = 'block';
    });
  });

  let bookings = [];
  let waitlists = [];

  async function loadAll() {
    try {
      const [statsRes, bookingsRes, appsRes, waitlistRes] = await Promise.all([
        API.get('/api/user/stats', token),
        API.get('/api/user/bookings', token),
        API.get('/api/user/applications', token),
        API.get('/api/waitlist', token)
      ]);

      const s = statsRes.stats || {};
      if (document.getElementById('stat-my-bookings')) document.getElementById('stat-my-bookings').textContent = s.totalBookings || 0;
      if (document.getElementById('stat-upcoming')) document.getElementById('stat-upcoming').textContent = s.upcoming || 0;
      if (document.getElementById('stat-past')) document.getElementById('stat-past').textContent = s.past || 0;
      if (document.getElementById('stat-total-spent')) document.getElementById('stat-total-spent').textContent = fmtMoney(s.totalSpent || 0);

      bookings = bookingsRes.bookings || [];
      waitlists = waitlistRes.waitlist || [];

      renderBookings();
      renderWaitlists();
      renderApplications(appsRes.applications || []);
    } catch (e) {
      if (String(e.message).includes('expired') || String(e.message).includes('Authentication')) {
        clearAuth();
        window.location.href = '/login.html';
        return;
      }
      showAlert(document.getElementById('dashboard-alert'), 'Unable to load dashboard data.');
    }
  }

  function isPast(dateStr) {
    try { return new Date(dateStr + 'T23:59:59') < new Date(); } catch (e) { return false; }
  }

  function bookingCard(b) {
    const cancelled = b.status === 'cancelled';
    const past = isPast(b.event_date);
    const free = Number(b.total) === 0;
    const card = document.createElement('div');
    card.className = 'card';
    card.style.cssText = 'display:flex; gap:var(--space-lg); padding:var(--space-lg); align-items:center; flex-wrap:wrap;';

    const media = document.createElement('div');
    media.style.cssText = 'width:120px; height:80px; border-radius:var(--radius-md); overflow:hidden; flex-shrink:0; background:var(--bg-surface);';
    if (b.image) {
      const img = document.createElement('img');
      img.src = b.image; img.alt = ''; img.style.cssText = 'width:100%; height:100%; object-fit:cover;';
      img.onerror = () => { media.innerHTML = '✦'; media.style.display = 'flex'; media.style.alignItems = 'center'; media.style.justifyContent = 'center'; media.style.fontSize = '1.5rem'; };
      media.appendChild(img);
    } else { media.textContent = '✦'; media.style.display = 'flex'; media.style.alignItems = 'center'; media.style.justifyContent = 'center'; media.style.fontSize = '1.5rem'; }

    const info = document.createElement('div');
    info.style.cssText = 'flex:1; min-width:200px;';
    info.innerHTML = `
      <h3 style="font-size:1.15rem; margin-bottom:4px; color:#fff;">${escapeHtml(b.event_title || 'Event unavailable')}</h3>
      <div class="event-meta" style="gap:var(--space-md);">
        <span>📅 ${fmtDate(b.event_date)}${b.event_time ? ' · ' + fmtTime(b.event_time) : ''}</span>
        <span>📍 ${escapeHtml(b.venue || b.location || '')}</span>
      </div>
      <div style="margin-top:10px; display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
        <span class="badge ${cancelled ? 'badge-muted' : past ? 'badge-teal' : 'badge-accent'}">${cancelled ? 'Cancelled' : past ? 'Attended' : 'Confirmed'}</span>
        <span style="font-size:.88rem; color:var(--ink-soft);">${b.tickets} ticket${b.tickets > 1 ? 's' : ''} · ${free ? 'Free' : fmtMoney(b.total)}</span>
        ${cancelled && b.refund_amount > 0 ? `<span style="font-size:.88rem; color:var(--emerald);">Refunded: ${fmtMoney(b.refund_amount)} (75%)</span>` : ''}
      </div>`;

    const actions = document.createElement('div');
    actions.style.cssText = 'display:flex; gap:var(--space-sm); flex-shrink:0;';
    if (!cancelled && !past) {
      const cancelBtn = document.createElement('button');
      cancelBtn.className = 'btn btn-outline btn-sm';
      cancelBtn.textContent = 'Cancel Booking';
      cancelBtn.addEventListener('click', () => openCancelModal(b));
      actions.appendChild(cancelBtn);
    }

    card.appendChild(media);
    card.appendChild(info);
    card.appendChild(actions);
    return card;
  }

  function renderBookings() {
    const upcoming = bookings.filter(b => b.status !== 'cancelled' && !isPast(b.event_date));
    const past = bookings.filter(b => b.status !== 'cancelled' && isPast(b.event_date));
    const cancelled = bookings.filter(b => b.status === 'cancelled');

    if (document.getElementById('tab-count-upcoming')) document.getElementById('tab-count-upcoming').textContent = upcoming.length;
    if (document.getElementById('tab-count-past')) document.getElementById('tab-count-past').textContent = past.length;
    if (document.getElementById('tab-count-cancelled')) document.getElementById('tab-count-cancelled').textContent = cancelled.length;

    const sections = { upcoming, past, cancelled };
    for (const [key, list] of Object.entries(sections)) {
      const el = document.getElementById('bookings-' + key);
      if (!el) continue;
      el.innerHTML = '';
      if (!list.length) {
        el.innerHTML = `<div class="empty-state"><p>No ${key} bookings found. <a href="/events.html" style="color:var(--accent-light); font-weight:600;">Browse Nepal events →</a></p></div>`;
        continue;
      }
      list.forEach(b => el.appendChild(bookingCard(b)));
    }
  }

  function renderWaitlists() {
    const el = document.getElementById('bookings-waitlist');
    if (document.getElementById('tab-count-waitlist')) document.getElementById('tab-count-waitlist').textContent = waitlists.length;
    if (!el) return;
    el.innerHTML = '';
    if (!waitlists.length) {
      el.innerHTML = '<div class="empty-state"><p>You are not currently on any event waitlists.</p></div>';
      return;
    }
    waitlists.forEach(w => {
      const card = document.createElement('div');
      card.className = 'card';
      card.style.cssText = 'display:flex; gap:var(--space-lg); padding:var(--space-lg); align-items:center; flex-wrap:wrap;';
      card.innerHTML = `
        <div style="flex:1; min-width:200px;">
          <div style="display:flex; gap:8px; align-items:center; margin-bottom:4px;">
            <span class="badge badge-gold">On Waitlist</span>
            <span style="font-size:0.85rem; color:var(--teal-light); font-weight:600;">Requested: ${w.tickets} Ticket(s)</span>
          </div>
          <h3 style="font-size:1.15rem; margin-bottom:4px; color:#fff;">${escapeHtml(w.event_title || 'Event')}</h3>
          <div class="event-meta">
            <span>📅 ${fmtDate(w.event_date)}</span>
            <span>📍 ${escapeHtml(w.venue || w.location || '')}</span>
          </div>
        </div>
        <div>
          <button class="btn btn-outline btn-sm leave-wl-btn" data-event-id="${w.event_id}">Leave Waitlist</button>
        </div>`;

      card.querySelector('.leave-wl-btn').addEventListener('click', async () => {
        try {
          const res = await fetch(`/api/waitlist/${w.event_id}/leave`, {
            method: 'DELETE',
            headers: { 'Authorization': 'Bearer ' + token }
          }).then(r => r.json());
          if (res.error) showAlert(document.getElementById('dashboard-alert'), res.error);
          else {
            showAlert(document.getElementById('dashboard-alert'), 'Removed from waitlist.', 'success');
            await loadAll();
          }
        } catch (e) {
          showAlert(document.getElementById('dashboard-alert'), 'Failed to leave waitlist.');
        }
      });

      el.appendChild(card);
    });
  }

  // ---- Cancellation modal (75% refund in NPR, 25% fee) ----
  const modal = document.getElementById('cancel-modal');
  let pendingCancel = null;

  function openCancelModal(b) {
    pendingCancel = b;
    const refund = +(b.total * 0.75).toFixed(2);
    const fee = +(b.total * 0.25).toFixed(2);
    document.getElementById('cancel-modal-details').innerHTML = `
      <strong style="font-size:1.1rem; color:#fff;">${escapeHtml(b.event_title || '')}</strong><br>
      ${b.tickets} ticket(s) · Total paid: <strong>${fmtMoney(b.total)}</strong><br>
      Cancellation fee (25%): <span style="color:var(--rose);">−${fmtMoney(fee)}</span><br>
      Estimated Refund: <strong style="color:var(--emerald);">${fmtMoney(refund)}</strong>`;
    modal.classList.add('open');
  }

  if (document.getElementById('cancel-modal-close')) document.getElementById('cancel-modal-close').addEventListener('click', () => modal.classList.remove('open'));
  if (document.getElementById('cancel-modal-no')) document.getElementById('cancel-modal-no').addEventListener('click', () => modal.classList.remove('open'));
  if (modal) modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('open'); });

  if (document.getElementById('cancel-modal-yes')) {
    document.getElementById('cancel-modal-yes').addEventListener('click', async () => {
      if (!pendingCancel) return;
      const btn = document.getElementById('cancel-modal-yes');
      btn.disabled = true; btn.textContent = 'Cancelling...';
      try {
        const res = await API.post(`/api/user/bookings/${pendingCancel.id}/cancel`, {}, token);
        if (res.error) {
          showAlert(document.getElementById('dashboard-alert'), res.error);
        } else {
          showAlert(document.getElementById('dashboard-alert'),
            `Booking cancelled. Refund of ${fmtMoney(res.refund)} (75%) will be processed within 3-5 business days.`, 'success');
          modal.classList.remove('open');
          await loadAll();
        }
      } catch (e) {
        showAlert(document.getElementById('dashboard-alert'), 'Failed to cancel booking.');
      } finally {
        btn.disabled = false; btn.textContent = 'Confirm Cancellation';
        pendingCancel = null;
      }
    });
  }

  // ---- Applications ----
  function renderApplications(apps) {
    const el = document.getElementById('my-applications');
    if (!el) return;
    el.innerHTML = '';
    if (!apps.length) {
      el.innerHTML = '<p style="color:var(--muted); font-size:.9rem;">No applications submitted yet. Submit one above to start hosting!</p>';
      return;
    }
    apps.forEach(a => {
      const statusClass = a.status === 'approved' ? 'badge-success' : a.status === 'rejected' ? 'badge-muted' : 'badge-gold';
      const row = document.createElement('div');
      row.style.cssText = 'display:flex; justify-content:space-between; align-items:center; gap:var(--space-md); padding:var(--space-md) 0; border-bottom:1px solid rgba(255,255,255,0.08); flex-wrap:wrap;';
      row.innerHTML = `
        <div>
          <strong style="color:#fff;">${escapeHtml(a.title)}</strong>
          <div style="font-size:.85rem; color:var(--muted);">${fmtDate(a.date)} · ${escapeHtml(a.venue)} (${escapeHtml(a.location)})</div>
        </div>
        <span class="badge ${statusClass}">${a.status}</span>`;
      el.appendChild(row);
    });
  }

  loadAll();
});