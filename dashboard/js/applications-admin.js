Admin.renderSidebar('applications');

async function loadApplications() {
  const d = await Admin.api('/api/admin/applications');
  const apps = d.applications || [];
  const tbody = document.getElementById('apps-tbody');
  if (!apps.length) {
    tbody.innerHTML = '<tr><td colspan="8" class="empty">No applications yet.</td></tr>';
    return;
  }
  tbody.innerHTML = apps.map(a => `
    <tr>
      <td><strong>${escapeHtml(a.title)}</strong></td>
      <td>${escapeHtml(a.host_name)} <${escapeHtml(a.host_email)}></td>
      <td>${escapeHtml(a.category)}</td>
      <td>${fmtDate(a.date)}</td>
      <td>${a.format}</td>
      <td>${fmtDate(a.created_at)}</td>
      <td><span class="badge ${a.status === 'approved' ? 'badge-success' : a.status === 'rejected' ? 'badge-muted' : 'badge-gold'}">${a.status}</span></td>
      <td>
        ${a.status === 'pending' ? `
          <button class="btn btn-primary btn-sm" onclick="openReview(${a.id}, 'approve')">Approve</button>
          <button class="btn btn-outline btn-sm" onclick="openReview(${a.id}, 'reject')">Reject</button>
        ` : '<span style="color:var(--muted); font-size:.8rem;">Processed</span>'}
      </td>
    </tr>`).join('');
}

function openReview(id, action) {
  const root = document.getElementById('modal-root');
  root.innerHTML = `
    <div class="modal-backdrop" id="modal-backdrop">
      <div class="modal">
        <h2>${action === 'approve' ? 'Approve Application' : 'Reject Application'}</h2>
        <div id="modal-alert"></div>
        <form id="review-form">
          <div class="field"><label>Review Notes (optional)</label><textarea name="review_notes" rows="4" placeholder="Internal notes or feedback to applicant..."></textarea></div>
        </form>
        <div class="modal-actions">
          <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
          <button class="btn ${action === 'approve' ? 'btn-primary' : 'btn-danger'}" id="submit-review">${action === 'approve' ? 'Approve & Create Event' : 'Reject Application'}</button>
        </div>
      </div>
    </div>`;
  document.getElementById('modal-backdrop').addEventListener('click', e => { if (e.target.id === 'modal-backdrop') closeModal(); });
  document.getElementById('submit-review').addEventListener('click', () => submitReview(id, action));
}

function closeModal() { document.getElementById('modal-root').innerHTML = ''; }

async function submitReview(id, action) {
  const alertBox = document.getElementById('modal-alert');
  const review_notes = document.querySelector('[name=review_notes]').value.trim();
  try {
    await Admin.api('/api/admin/applications/' + id, { method: 'PATCH', body: JSON.stringify({ status: action === 'approve' ? 'approved' : 'rejected', review_notes }) });
    closeModal();
    showAlert(document.getElementById('apps-alert'), `Application ${action}d successfully`, 'success');
    setTimeout(() => document.getElementById('apps-alert').innerHTML = '', 3000);
    await loadApplications();
  } catch (e) { showAlert(alertBox, e.message); }
}

loadApplications().catch(e => alert(e.message));