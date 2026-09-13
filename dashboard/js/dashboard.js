Admin.renderSidebar('index');

async function load() {
  const d = await Admin.api('/api/admin/stats');
  const s = d.stats;

  document.getElementById('stats-grid').innerHTML = `
    <div class="stat-card accent"><div class="label">Total Events</div><div class="value">${s.totalEvents}</div><div class="sub">${s.publishedEvents} published</div></div>
    <div class="stat-card green"><div class="label">Total Bookings</div><div class="value">${s.totalBookings}</div><div class="sub">${s.confirmedBookings} confirmed</div></div>
    <div class="stat-card accent"><div class="label">Tickets Sold</div><div class="value">${s.totalTickets}</div><div class="sub">across all events</div></div>
    <div class="stat-card amber"><div class="label">Revenue</div><div class="value">$${Number(s.revenue).toLocaleString()}</div><div class="sub">confirmed bookings</div></div>
    <div class="stat-card" style="border-color: var(--gold);"><div class="label">Pending Applications</div><div class="value" style="color: var(--gold);">${s.pendingApplications || 0}</div><div class="sub">awaiting review</div></div>`;

  renderChart(d.bookingsByDate || []);
  renderTopEvents(d.topEvents || []);
  renderRecentBookings(d.recentBookings || []);
}

function renderChart(data) {
  const el = document.getElementById('booking-chart');
  if (!data.length) { el.innerHTML = '<div class="empty">No bookings yet.</div>'; return; }
  const max = Math.max(...data.map(d => d.count), 1);
  el.innerHTML = data.map(d => {
    const h = Math.max((d.count / max) * 100, 4);
    const label = d.d ? new Date(d.d + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '';
    return `<div class="bar-wrap"><div class="bar" style="height:${h.toFixed(1)}%;" title="${d.d}: ${d.count} bookings"></div><div class="bar-label">${label}</div></div>`;
  }).join('');
}

function renderTopEvents(rows) {
  const el = document.getElementById('top-events');
  if (!rows.length) { el.innerHTML = '<tr><td colspan="5" class="empty">No events.</td></tr>'; return; }
  el.innerHTML = rows.map(e => `
    <tr>
      <td><strong>${escapeHtml(e.title)}</strong></td>
      <td>${escapeHtml(e.category)}</td>
      <td>${fmtDate(e.date)}</td>
      <td>${e.sold}</td>
      <td>${fmtMoney(e.revenue)}</td>
    </tr>`).join('');
}

function renderRecentBookings(rows) {
  const el = document.getElementById('recent-bookings');
  if (!rows.length) { el.innerHTML = '<tr><td colspan="6" class="empty">No bookings yet.</td></tr>'; return; }
  el.innerHTML = rows.map(b => `
    <tr>
      <td>${escapeHtml(b.name)}</td>
      <td>${escapeHtml(b.event_title || '(deleted event)')}</td>
      <td>${b.tickets}</td>
      <td>${fmtMoney(b.total)}</td>
      <td><span class="badge badge-${b.status}">${b.status}</span></td>
      <td>${fmtDate(b.event_date) || '-'}</td>
    </tr>`).join('');
}

load().catch(e => console.error(e));