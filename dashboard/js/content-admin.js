Admin.renderSidebar('content');

async function loadContent() {
  const res = await fetch('/api/content');
  const d = await res.json();
  const c = d.content || {};
  const form = document.getElementById('content-form');
  for (const el of form.elements) {
    if (el.name && c[el.name] !== undefined) el.value = c[el.name];
  }
}

document.getElementById('save-content-btn').addEventListener('click', async () => {
  const form = document.getElementById('content-form');
  const fd = new FormData(form);
  const content = Object.fromEntries(fd.entries());
  const btn = document.getElementById('save-content-btn');
  btn.disabled = true; btn.textContent = 'Saving...';
  try {
    await Admin.api('/api/admin/content', { method: 'PUT', body: JSON.stringify({ content }) });
    showAlert(document.getElementById('content-alert'), 'Content updated successfully', 'success');
    setTimeout(() => document.getElementById('content-alert').innerHTML = '', 3000);
  } catch (e) { showAlert(document.getElementById('content-alert'), e.message); }
  finally { btn.disabled = false; btn.textContent = 'Save Changes'; }
});

loadContent().catch(e => alert(e.message));