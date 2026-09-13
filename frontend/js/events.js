let categories = [];
let locations = [];

async function loadFilters() {
  try {
    const res = await API.get('/api/events?limit=1');
    categories = res.categories || [];
    locations = res.locations || [];
    populateFilters(qs('category'), qs('location'));
  } catch (e) { console.error(e); }
}

function populateFilters(catSelVal, locSelVal) {
  const catSel = document.getElementById('category-filter');
  const locSel = document.getElementById('location-filter');
  if (catSel) {
    catSel.innerHTML = '<option value="">All Categories</option>';
    categories.forEach(c => { const o = document.createElement('option'); o.value = c; o.textContent = c; if (c === catSelVal) o.selected = true; catSel.appendChild(o); });
  }
  if (locSel) {
    locSel.innerHTML = '<option value="">All Nepal Locations</option>';
    locations.forEach(l => { const o = document.createElement('option'); o.value = l; o.textContent = l; if (l === locSelVal) o.selected = true; locSel.appendChild(o); });
  }
}

async function loadEvents() {
  const search = qs('search') || '';
  const category = qs('category') || '';
  const location = qs('location') || '';
  const date = qs('date') || '';
  if (document.getElementById('search-input')) document.getElementById('search-input').value = search;
  if (document.getElementById('date-filter')) document.getElementById('date-filter').value = date;

  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (category) params.set('category', category);
  if (location) params.set('location', location);
  if (date) params.set('date', date);

  const data = await API.get('/api/events?' + params.toString());
  categories = data.categories || [];
  locations = data.locations || [];
  populateFilters(category, location);
  renderEvents(document.getElementById('events-grid'), data.events || []);
}

async function loadContent() {
  try {
    const data = await API.get('/api/content');
    const c = data.content || {};
    if (document.getElementById('values-text')) document.getElementById('values-text').textContent = c.values_text || c.about_text || '';
    if (document.getElementById('ct-email')) document.getElementById('ct-email').textContent = c.contact_email || 'hello@gather.np';
    if (document.getElementById('ct-phone')) document.getElementById('ct-phone').textContent = c.contact_phone || '+977 1-4567890';
    if (document.getElementById('ct-address')) document.getElementById('ct-address').textContent = c.contact_address || 'Durbar Marg, Kathmandu 44600, Nepal';
    if (document.getElementById('footer-text')) document.getElementById('footer-text').textContent = c.footer_text || '© 2026 Gather Nepal. All rights reserved.';
  } catch (e) { console.error(e); }
}

function applyFilters() {
  const search = document.getElementById('search-input')?.value.trim() || '';
  const category = document.getElementById('category-filter')?.value || '';
  const location = document.getElementById('location-filter')?.value || '';
  const date = document.getElementById('date-filter')?.value || '';
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (category) params.set('category', category);
  if (location) params.set('location', location);
  if (date) params.set('date', date);
  window.location.href = '/events.html?' + params.toString();
}

function resetFilters() {
  window.location.href = '/events.html';
}

document.getElementById('search-btn')?.addEventListener('click', applyFilters);
document.getElementById('search-input')?.addEventListener('keydown', (e) => { if (e.key === 'Enter') applyFilters(); });
document.getElementById('reset-filters')?.addEventListener('click', resetFilters);
document.getElementById('category-filter')?.addEventListener('change', applyFilters);
document.getElementById('location-filter')?.addEventListener('change', applyFilters);
document.getElementById('date-filter')?.addEventListener('change', applyFilters);

Promise.all([loadEvents(), loadContent(), loadFilters()]).catch(e => console.error(e));