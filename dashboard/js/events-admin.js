Admin.renderSidebar('events');

let events = [];

async function loadEvents() {
  const d = await Admin.api('/api/admin/events');
  events = d.events || [];
  const tbody = document.getElementById('events-tbody');
  if (!events.length) {
    tbody.innerHTML = '<tr><td colspan="9" class="empty">No events yet. Click "Add Event".</td></tr>';
    return;
  }
  tbody.innerHTML = events.map(e => `
    <tr>
      <td><strong>${escapeHtml(e.title)}</strong></td>
      <td>${escapeHtml(e.category)}</td>
      <td>${e.format}</td>
      <td>${fmtDate(e.date)}</td>
      <td>${Number(e.price) === 0 ? 'Free' : fmtMoney(e.price)}</td>
      <td>${e.sold} / ${e.capacity || '∞'}</td>
      <td><span class="badge badge-${e.status}">${e.status}</span></td>
      <td>${e.featured ? '★ Yes' : '—'}</td>
      <td>
        <button class="btn btn-primary btn-sm" onclick="openModal(${e.id})">Edit</button>
        <button class="btn btn-danger btn-sm" onclick="delEvent(${e.id})">Delete</button>
      </td>
    </tr>`).join('');
}

function fieldHtml(e) {
  e = e || {};
  return `
    <form id="event-form">
      <div class="form-grid">
        <div class="field full"><label>Title *</label><input name="title" value="${escapeHtml(e.title || '')}" required /></div>
        <div class="field full"><label>Description</label><textarea name="description">${escapeHtml(e.description || '')}</textarea></div>
        <div class="field"><label>Category</label>
          <select name="category">
            ${['Music','Conference','Workshop','Food','Wellness','Art','Tech','Social','General'].map(c => `<option ${e.category === c ? 'selected' : ''}>${c}</option>`).join('')}
          </select>
        </div>
        <div class="field"><label>Format</label>
          <select name="format">
            ${['in-person','virtual','hybrid'].map(f => `<option ${e.format === f ? 'selected' : ''}>${f}</option>`).join('')}
          </select>
        </div>
        <div class="field"><label>Price (0 = free)</label><input type="number" step="0.01" min="0" name="price" value="${e.price ?? 0}" /></div>
        <div class="field"><label>Date *</label><input type="date" name="date" value="${e.date || ''}" required /></div>
        <div class="field"><label>Time</label><input type="time" name="time" value="${e.time || '10:00'}" /></div>
        <div class="field"><label>Venue</label><input name="venue" value="${escapeHtml(e.venue || '')}" /></div>
        <div class="field"><label>Location</label><input name="location" value="${escapeHtml(e.location || '')}" /></div>
        <div class="field"><label>Capacity (0 = unlimited)</label><input type="number" min="0" name="capacity" value="${e.capacity ?? 100}" /></div>
        <div class="field"><label>Image URL</label><input name="image" value="${escapeHtml(e.image || '')}" /><div class="hint">Direct link to an image (leave blank for gradient placeholder)</div></div>
        <div class="field full">
          <label>Status</label>
          <select name="status">
            <option value="published" ${(!e.status || e.status === 'published') ? 'selected' : ''}>Published</option>
            <option value="draft" ${e.status === 'draft' ? 'selected' : ''}>Draft</option>
          </select>
        </div>
        <div class="field full">
          <label><input type="checkbox" name="featured" ${e.featured ? 'checked' : ''} style="width:auto; margin-right:8px;" /> Featured on homepage</label>
        </div>
      </div>
    </form>`;
}

function openModal(id) {
  const e = id ? events.find(x => x.id === id) : null;
  const root = document.getElementById('modal-root');
  root.innerHTML = `
    <div class="modal-backdrop" id="modal-backdrop">
      <div class="modal">
        <h2>${e ? 'Edit Event' : 'Add Event'}</h2>
        <div id="modal-alert"></div>
        ${fieldHtml(e)}
        <div class="modal-actions">
          <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
          <button class="btn btn-primary" id="save-event-btn">Save Event</button>
        </div>
      </div>
    </div>`;

  document.getElementById('modal-backdrop').addEventListener('click', ev => { if (ev.target.id === 'modal-backdrop') closeModal(); });
  document.getElementById('save-event-btn').addEventListener('click', () => saveEvent(e ? e.id : null));
}

function closeModal() { document.getElementById('modal-root').innerHTML = ''; }

function collect() {
  const f = document.getElementById('event-form');
  const fd = new FormData(f);
  const data = Object.fromEntries(fd.entries());
  data.price = data.price === '' ? 0 : parseFloat(data.price);
  data.capacity = data.capacity === '' ? 0 : parseInt(data.capacity, 10);
  data.featured = fd.get('featured') === 'on';
  return data;
}

async function saveEvent(id) {
  const alertBox = document.getElementById('modal-alert');
  const data = collect();
  if (!data.title || !data.date) { showAlert(alertBox, 'Title and date are required'); return; }
  try {
    if (id) await Admin.api('/api/admin/events/' + id, { method: 'PUT', body: JSON.stringify(data) });
    else await Admin.api('/api/admin/events', { method: 'POST', body: JSON.stringify(data) });
    closeModal();
    showAlert(document.getElementById('events-alert'), 'Event saved successfully', 'success');
    setTimeout(() => document.getElementById('events-alert').innerHTML = '', 3000);
    await loadEvents();
  } catch (e) { showAlert(alertBox, e.message); }
}

async function delEvent(id) {
  if (!confirm('Delete this event and all its bookings?')) return;
  try {
    await Admin.api('/api/admin/events/' + id, { method: 'DELETE' });
    await loadEvents();
  } catch (e) { alert(e.message); }
}

document.getElementById('add-event-btn').addEventListener('click', () => openModal(null));
loadEvents().catch(e => alert(e.message));