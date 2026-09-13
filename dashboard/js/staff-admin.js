Admin.renderSidebar('staff');

const me = Admin.getUser();

async function loadStaff() {
  const d = await Admin.api('/api/admin/staff');
  const staff = d.staff || [];
  const tbody = document.getElementById('staff-tbody');
  tbody.innerHTML = staff.map(s => `
    <tr>
      <td><strong>${escapeHtml(s.name)}</strong>${s.id === me.id ? ' <span class="badge badge-success">You</span>' : ''}</td>
      <td>${escapeHtml(s.email)}</td>
      <td><span class="badge ${s.role === 'admin' ? 'badge-success' : 'badge-accent'}">${s.role}</span></td>
      <td>${s.created_at}</td>
      <td>${s.id === me.id ? '<span style="color:var(--muted)">—</span>' : `<button class="btn btn-danger btn-sm" onclick="delStaff(${s.id})">Delete</button>`}</td>
    </tr>`).join('');
}

async function delStaff(id) {
  if (!confirm('Delete this staff account?')) return;
  try {
    await Admin.api('/api/admin/staff/' + id, { method: 'DELETE' });
    await loadStaff();
  } catch (e) { alert(e.message); }
}

function openAdd() {
  const root = document.getElementById('modal-root');
  root.innerHTML = `
    <div class="modal-backdrop" id="modal-backdrop">
      <div class="modal">
        <h2>Add Staff Member</h2>
        <div id="modal-alert"></div>
        <form id="staff-form" class="form-grid">
          <div class="field full"><label>Full Name *</label><input name="name" required /></div>
          <div class="field full"><label>Email *</label><input type="email" name="email" required /></div>
          <div class="field"><label>Password *</label><input type="password" name="password" required /></div>
          <div class="field"><label>Role</label>
            <select name="role"><option value="staff">Staff</option><option value="admin">Admin</option></select>
          </div>
        </form>
        <div class="modal-actions">
          <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
          <button class="btn btn-primary" id="save-staff-btn">Create Account</button>
        </div>
      </div>
    </div>`;
  document.getElementById('modal-backdrop').addEventListener('click', ev => { if (ev.target.id === 'modal-backdrop') closeModal(); });
  document.getElementById('save-staff-btn').addEventListener('click', saveStaff);
}

function closeModal() { document.getElementById('modal-root').innerHTML = ''; }

async function saveStaff() {
  const f = document.getElementById('staff-form');
  const fd = new FormData(f);
  const data = Object.fromEntries(fd.entries());
  const alertBox = document.getElementById('modal-alert');
  try {
    await Admin.api('/api/admin/staff', { method: 'POST', body: JSON.stringify(data) });
    closeModal();
    showAlert(document.getElementById('staff-alert'), 'Staff account created', 'success');
    setTimeout(() => document.getElementById('staff-alert').innerHTML = '', 3000);
    await loadStaff();
  } catch (e) { showAlert(alertBox, e.message); }
}

document.getElementById('add-staff-btn').addEventListener('click', openAdd);
loadStaff().catch(e => {
  if (e.message.includes('Admin access')) alert('Only admins can manage staff members.');
  else alert(e.message);
});