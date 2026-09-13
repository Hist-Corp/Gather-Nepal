const p = new URLSearchParams(window.location.search);
const name    = p.get('name')    || '';
const event   = p.get('event')   || '';
const tickets = p.get('tickets') || '1';
const total   = p.get('total')   || '0';
const date    = p.get('date')    || '';
const time    = p.get('time')    || '';
const venue   = p.get('venue')   || '';
const email   = p.get('email')   || '';

const passNumber = 'GNP-' + Math.floor(100000 + Math.random() * 900000);

const root = document.getElementById('success-root');
if (!root) throw new Error('No root element');

root.innerHTML = `
  <div style="max-width:640px; margin:0 auto;">

    <!-- Success header -->
    <div style="text-align:center; margin-bottom:var(--2xl);">
      <div style="width:80px; height:80px; border-radius:50%; background:rgba(90,143,110,0.2); border:1px solid rgba(90,143,110,0.4); color:var(--sage-light); display:flex; align-items:center; justify-content:center; margin:0 auto var(--lg); font-size:2rem;">✓</div>
      <span class="badge badge-success" style="margin-bottom:var(--md);">Booking Confirmed</span>
      <h1 style="font-size:2.4rem; margin-bottom:var(--sm);">You're all set!</h1>
      <p style="color:var(--text-soft); font-size:1rem;">
        Thank you, <strong style="color:var(--white);">${escapeHtml(name)}</strong>. 
        Your tickets for <strong style="color:var(--white);">${escapeHtml(event)}</strong> are confirmed.
      </p>
    </div>

    <!-- Digital Ticket Pass -->
    <div class="card" style="padding:var(--xl); border-color:rgba(232,168,56,0.2); margin-bottom:var(--xl);">
      <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:var(--lg); flex-wrap:wrap; gap:var(--md);">
        <div>
          <div style="font-size:0.7rem; text-transform:uppercase; letter-spacing:0.1em; color:var(--amber); font-weight:700; font-family:var(--font-display); margin-bottom:6px;">
            ✦ Official Ticket Pass · Gather Nepal
          </div>
          <h2 style="font-size:1.3rem; color:var(--white);">${escapeHtml(event)}</h2>
        </div>
        <div style="background:var(--amber); color:#0a0b0f; padding:6px 14px; border-radius:var(--r-full); font-family:monospace; font-size:0.82rem; font-weight:700; flex-shrink:0;">
          ${passNumber}
        </div>
      </div>

      <!-- Dashed divider -->
      <div style="border-top:1.5px dashed rgba(232,168,56,0.25); margin-bottom:var(--lg);"></div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:var(--lg);">
        <div>
          <div style="font-size:0.72rem; text-transform:uppercase; letter-spacing:0.08em; color:var(--text-dim); font-family:var(--font-display); margin-bottom:4px;">Date &amp; Time</div>
          <div style="font-weight:600; color:var(--white); font-size:0.95rem;">${escapeHtml(fmtDate(date))}${time ? ' · ' + escapeHtml(fmtTime(time)) : ''}</div>
        </div>
        <div>
          <div style="font-size:0.72rem; text-transform:uppercase; letter-spacing:0.08em; color:var(--text-dim); font-family:var(--font-display); margin-bottom:4px;">Venue</div>
          <div style="font-weight:600; color:var(--white); font-size:0.95rem;">${escapeHtml(venue) || 'See event details'}</div>
        </div>
        <div>
          <div style="font-size:0.72rem; text-transform:uppercase; letter-spacing:0.08em; color:var(--text-dim); font-family:var(--font-display); margin-bottom:4px;">Pass Holder</div>
          <div style="font-weight:600; color:var(--white); font-size:0.95rem;">${escapeHtml(name)}</div>
        </div>
        <div>
          <div style="font-size:0.72rem; text-transform:uppercase; letter-spacing:0.08em; color:var(--text-dim); font-family:var(--font-display); margin-bottom:4px;">Tickets Issued</div>
          <div style="font-weight:600; color:var(--white); font-size:0.95rem;">${escapeHtml(tickets)} Ticket(s)</div>
        </div>
      </div>

      <!-- Dashed divider -->
      <div style="border-top:1.5px dashed rgba(232,168,56,0.25); margin:var(--lg) 0;"></div>

      <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:var(--md);">
        <div>
          <div style="font-size:0.72rem; text-transform:uppercase; letter-spacing:0.08em; color:var(--text-dim); font-family:var(--font-display); margin-bottom:4px;">Total Paid</div>
          <div style="font-family:var(--font-serif); font-size:1.6rem; font-weight:600; color:var(--amber);">${escapeHtml(fmtMoney(Number(total)))}</div>
        </div>
        <!-- Simulated QR code -->
        <div style="background:#fff; padding:6px; border-radius:var(--r-sm);">
          <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#0a0b0f" stroke-width="1.8">
            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
            <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="3" height="3"/>
            <rect x="18" y="14" width="3" height="3"/><rect x="14" y="18" width="7" height="3"/>
          </svg>
        </div>
      </div>
    </div>

    <p style="text-align:center; font-size:0.85rem; color:var(--text-dim); margin-bottom:var(--xl);">
      A confirmation has been sent to <strong style="color:var(--text-soft);">${escapeHtml(email)}</strong>. 
      Please bring this pass or your email on event day.
    </p>

    <div style="display:flex; gap:var(--md); justify-content:center; flex-wrap:wrap;">
      <button onclick="window.print()" class="btn btn-secondary">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
        Print Pass
      </button>
      <a class="btn btn-primary" href="/events.html">Browse More Events</a>
      <a class="btn btn-outline" href="/dashboard.html">My Dashboard</a>
    </div>
  </div>`;