Admin.renderSidebar('bookings');

let bookings = [];

async function loadBookings() {
  const d = await Admin.api('/api/admin/bookings');
  bookings = d.bookings || [];
  const tbody = document.getElementById('bookings-tbody');
  if (!bookings.length) {
    tbody.innerHTML = '<tr><td colspan="9" class="empty">No bookings yet.</td></tr>';
    return;
  }
  tbody.innerHTML = bookings.map(b => `
    <tr>
      <td>${b.id}</td>
      <td><strong>${escapeHtml(b.name)}</strong></td>
      <td>${escapeHtml(b.email)}</td>
      <td>${escapeHtml(b.event_title || '(deleted)')}</td>
      <td>${b.tickets}</td>
      <td>${fmtMoney(b.total)}</td>
      <td><span class="badge badge-${b.status}">${b.status}</span></td>
      <td>${fmtDate(b.event_date) || '-'}</td>
      <td>
        <select onchange="changeStatus(${b.id}, this.value)">
          <option value="confirmed" ${b.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
          <option value="pending" ${b.status === 'pending' ? 'selected' : ''}>Pending</option>
          <option value="cancelled" ${b.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
        </select>
        <button class="btn btn-danger btn-sm" onclick="delBooking(${b.id})">Delete</button>
      </td>
    </tr>`).join('');
}

async function changeStatus(id, status) {
  try {
    await Admin.api('/api/admin/bookings/' + id + '/status', { method: 'PATCH', body: JSON.stringify({ status }) });
    showAlert(document.getElementById('bookings-alert'), 'Booking #' + id + ' marked ' + status, 'success');
    setTimeout(() => document.getElementById('bookings-alert').innerHTML = '', 2500);
  } catch (e) { alert(e.message); loadBookings(); }
}

async function delBooking(id) {
  if (!confirm('Delete booking #' + id + '?')) return;
  try {
    await Admin.api('/api/admin/bookings/' + id, { method: 'DELETE' });
    await loadBookings();
  } catch (e) { alert(e.message); }
}

loadBookings().catch(e => alert(e.message));