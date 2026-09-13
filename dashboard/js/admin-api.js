const TOKEN_KEY = 'gather_admin_token';
const USER_KEY = 'gather_admin_user';
const ADMIN_ROOT = '/admin/login.html';

const Admin = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: t => localStorage.setItem(TOKEN_KEY, t),
  getTokenFresh: () => {
    const t = localStorage.getItem(TOKEN_KEY);
    if (!t) window.location.href = ADMIN_ROOT;
    return t;
  },
  getUser: () => {
    try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null'); }
    catch (e) { return null; }
  },
  setUser: u => localStorage.setItem(USER_KEY, JSON.stringify(u)),
  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    window.location.href = ADMIN_ROOT;
  },
  async api(path, opts = {}) {
    const token = this.getTokenFresh();
    const res = await fetch(path, {
      ...opts,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token,
        ...(opts.headers || {})
      }
    });
    if (res.status === 401) {
      this.logout();
      throw new Error('Session expired');
    }
    const data = await res.json().catch(() => ({}));
    if (res.status === 403 && data.error) throw new Error(data.error);
    if (!res.ok && data.error) throw new Error(data.error);
    return data;
  },
  nav: [
    { href: '/admin/index.html', icon: '📊', label: 'Dashboard', key: 'index' },
    { href: '/admin/events.html', icon: '🎟️', label: 'Events', key: 'events' },
    { href: '/admin/bookings.html', icon: '📅', label: 'Bookings', key: 'bookings' },
    { href: '/admin/applications.html', icon: '📝', label: 'Applications', key: 'applications' },
    { href: '/admin/content.html', icon: '🖼️', label: 'Site Content', key: 'content' },
    { href: '/admin/staff.html', icon: '👥', label: 'Staff', key: 'staff' }
  ],
  renderSidebar(activeKey) {
    this.getTokenFresh();
    const user = this.getUser();
    const root = document.getElementById('sidebar-root');
    if (!root) return;

    const links = this.nav.map(n =>
      `<a href="${n.href}" data-key="${n.key}" class="${n.key === activeKey ? 'active' : ''}"><span class="ic">${n.icon}</span><span>${n.label}</span></a>`
    ).join('');

    root.innerHTML = `
      <aside class="sidebar">
        <div class="brand">Gather<span>.</span></div>
        <div class="nav">${links}</div>
        <div class="user-box">
          <div class="name">${escapeHtml((user && user.name) || 'Staff')}</div>
          <div class="role">${escapeHtml((user && user.role) || 'staff')}</div>
          <button class="logout" onclick="AdminLogout()">Sign out</button>
        </div>
      </aside>`;
  }
};

function AdminLogout() { Admin.logout(); }
function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '\u0026amp;')
    .replace(/</g, '\u0026lt;')
    .replace(/>/g, '\u0026gt;')
    .replace(/"/g, '\u0026quot;')
    .replace(/'/g, '\u0026#39;');
}
function fmtMoney(n) { return 'Rs. ' + Number(n || 0).toLocaleString('en-IN'); }
function fmtDate(d) {
  if (!d) return '';
  try { return new Date(d + 'T00:00:00').toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }); }
  catch (e) { return d; }
}
function fmtTime(t) {
  if (!t) return '';
  const [h, m] = String(t).split(':');
  const ampm = h >= 12 ? 'PM' : 'AM';
  return (h % 12 || 12) + ':' + m + ' ' + ampm;
}
function showAlert(el, msg, type) {
  el.innerHTML = msg ? `<div class="alert alert-${type || 'error'}">${escapeHtml(msg)}</div>` : '';
}