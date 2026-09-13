async function init() {
  try {
    const [contentRes, featuredRes, eventsRes] = await Promise.all([
      API.get('/api/content'),
      API.get('/api/events/featured?limit=6'),
      API.get('/api/events?limit=100')
    ]);

    const c = contentRes.content || {};

    // Update page content from DB
    const heroBadgeEl = document.getElementById('hero-badge');
    if (heroBadgeEl) heroBadgeEl.textContent = c.hero_badge || 'Kathmandu · Pokhara · Lalitpur · Nagarkot';
    const heroSubEl = document.getElementById('hero-subtitle');
    if (heroSubEl) heroSubEl.textContent = c.hero_subtitle || heroSubEl.textContent;
    const valuesTextEl = document.getElementById('values-text');
    if (valuesTextEl) valuesTextEl.textContent = c.about_text || valuesTextEl.textContent;
    if (document.getElementById('ct-email')) document.getElementById('ct-email').textContent = c.contact_email || 'hello@gather.np';
    if (document.getElementById('ct-phone')) document.getElementById('ct-phone').textContent = c.contact_phone || '+977 1-4567890';
    if (document.getElementById('ct-address')) document.getElementById('ct-address').textContent = c.contact_address || 'Durbar Marg, Kathmandu 44600, Nepal';
    if (document.getElementById('footer-text')) document.getElementById('footer-text').textContent = c.footer_text || '© 2026 Gather Nepal. Made by hand in Kathmandu.';
    document.title = (c.site_name || 'Gather Nepal') + ' — Events That Move You';

    // Hero stats with animated counters
    const allEvents = eventsRes.events || [];
    const totalAttendees = allEvents.reduce((sum, e) => sum + (Number(e.sold) || 0), 0);
    const cities = new Set(allEvents.map(e => (e.location || '').split(',')[0].trim()).filter(Boolean));

    // Observe stat elements and trigger on scroll
    const statEls = document.querySelectorAll('.stat-item .num');
    if (statEls.length) {
      const io = new IntersectionObserver((entries) => {
        if (entries.some(en => en.isIntersecting)) {
          const evEl = document.getElementById('stat-events');
          const ctEl = document.getElementById('stat-cities');
          const atEl = document.getElementById('stat-attendees');
          if (typeof animateCounter === 'function') {
            animateCounter(evEl, allEvents.length);
            animateCounter(ctEl, Math.max(cities.size, 4));
            animateCounter(atEl, Math.max(totalAttendees, 420));
          } else {
            if (evEl) evEl.textContent = allEvents.length;
            if (ctEl) ctEl.textContent = Math.max(cities.size, 4);
            if (atEl) atEl.textContent = Math.max(totalAttendees, 420).toLocaleString();
          }
          io.disconnect();
        }
      }, { threshold: 0.5 });
      statEls.forEach(el => io.observe(el));
    }

    // Populate category & location dropdowns
    populateHomeFilters(eventsRes.categories || [], eventsRes.locations || []);

    // Render featured events
    const featured = featuredRes.events || allEvents.filter(e => e.featured).slice(0, 6);
    renderEvents(document.getElementById('featured-grid'), featured.length ? featured : allEvents.slice(0, 6));

  } catch (e) {
    console.error('Initialization error:', e);
    const grid = document.getElementById('featured-grid');
    if (grid) grid.innerHTML = '<div class="empty-state"><h3>Unable to load events</h3><p>Please check the server connection and try again.</p></div>';
  }
}

function doSearch() {
  const q    = document.getElementById('home-search-input')?.value.trim() || '';
  const cat  = document.getElementById('home-category-filter')?.value || '';
  const loc  = document.getElementById('home-location-filter')?.value || '';
  const date = document.getElementById('home-date-filter')?.value || '';
  const params = new URLSearchParams();
  if (q)    params.set('search', q);
  if (cat)  params.set('category', cat);
  if (loc)  params.set('location', loc);
  if (date) params.set('date', date);
  window.location.href = '/events.html' + (params.toString() ? '?' + params.toString() : '');
}

function populateHomeFilters(categories, locations) {
  const catSel = document.getElementById('home-category-filter');
  const locSel = document.getElementById('home-location-filter');
  if (catSel && categories.length) {
    catSel.innerHTML = '<option value="">All Categories</option>';
    categories.forEach(c => {
      const o = document.createElement('option');
      o.value = c; o.textContent = c; catSel.appendChild(o);
    });
  }
  if (locSel && locations.length) {
    locSel.innerHTML = '<option value="">All Cities</option>';
    locations.forEach(l => {
      const o = document.createElement('option');
      o.value = l; o.textContent = l; locSel.appendChild(o);
    });
  }
}

document.getElementById('home-search-btn')?.addEventListener('click', doSearch);
document.getElementById('home-search-input')?.addEventListener('keydown', e => { if (e.key === 'Enter') doSearch(); });
document.getElementById('home-category-filter')?.addEventListener('change', doSearch);
document.getElementById('home-location-filter')?.addEventListener('change', doSearch);

const newsletterForm = document.getElementById('newsletter-form');
if (newsletterForm) {
  newsletterForm.addEventListener('submit', e => {
    e.preventDefault();
    const msgBox = document.getElementById('newsletter-msg');
    if (msgBox) {
      msgBox.innerHTML = '<div class="alert alert-success" style="padding:10px 14px; font-size:0.88rem;">✓ Subscribed! You\'ll hear about upcoming Nepal events first.</div>';
    }
    newsletterForm.reset();
  });
}

init();