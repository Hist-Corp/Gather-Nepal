Admin.renderSidebar('users');

const me = Admin.getUser();

async function loadUsers() {
  const d = await Admin.api('/api/admin/users');
  const users = d.users || [];
  const tbody = document.getElementById('users-tbody');
  tbody.innerHTML = users.map(u => `
    <tr>
      <td><strong>${escapeHtml(u.name)}</strong>${u.id === me.id ? ' <span class="badge badge-confirmed">You</span>' : ''}</td>
      <td>${escapeHtml(u.email)}</td>
      <td><span class="badge ${u.role === 'admin' ? 'badge-published' : 'badge-pending'}">${u.role}</span></td>
      <td>${u.created_at}</td>
      <td>${u.id === me.id ? '<span style="color:var(--muted)">—</span>' : `<button class="btn btn-danger btn-sm" onclick="delUser(${u.id})">Delete</button>`}</td>
    </tr>`).join('');
}

async function delUser(id) {
  if (!confirm('Delete this staff account?')) return;
  try {
    await Admin.api('/api/admin/users/' + id, { method: 'DELETE' });
    await loadUsers();
  } catch (e) { alert(e.message); }
}

function openAdd() {
  const root = document.getElementById('modal-root');
  root.innerHTML = `
    <div class="modal-backdrop" id="modal-backdrop">
      <div class="modal">
        <h2>Add Staff Member</h2>
        <div id="modal-alert"></div>
        <form id="user-form" class="form-grid">
          <div class="field full"><label>Full Name *</label><input name="name" required /></div>
          <div class="field full"><label>Email *</label><input type="email" name="email" required /></div>
          <div class="field"><label>Password *</label><input type="password" name="password" required /></div>
          <div class="field"><label>Role</label>
            <select name="role"><option value="staff">Staff</option><option value="admin">Admin</option></select>
          </div>
        </form>
        <div class="modal-actions">
          <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
          <button class="btn btn-primary" id="save-user-btn">Create Account</button>
        </div>
      </div>
    </div>`;
  document.getElementById('modal-backdrop').addEventListener('click', ev => { if (ev.target.id === 'modal-backdrop') closeModal(); });
  document.getElementById('save-user-btn').addEventListener('click', saveUser);
}

function closeModal() { document.getElementById('modal-root').innerHTML = ''; }

async function saveUser() {
  const f = document.getElementById('user-form');
  const fd = new FormData(f);
  const data = Object.fromEntries(fd.entries());
  const alertBox = document.getElementById('modal-alert');
  try {
    await Admin.api('/api/admin/users', { method: 'POST', body: JSON.stringify(data) });
    closeModal();
    showAlert(document.getElementById('users-alert'), 'Staff account created', 'success');
    setTimeout(() => document.getElementById('users-alert').innerHTML = '', 3000);
    await loadUsers();
  } catch (e) { showAlert(alertBox, e.message); }
}

document.getElementById('add-user-btn').addEventListener('click', openAdd);
loadUsers().catch(e => {
  if (e.message.includes('Admin access')) alert('Only admins can manage team members.');
  else alert(e.message);
});