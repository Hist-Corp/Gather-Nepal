// Event application form logic
document.addEventListener('DOMContentLoaded', () => {
  const token = getAuthToken();
  const user = getUser();
  if (!token || !user) {
    window.location.href = '/login.html';
    return;
  }

  document.getElementById('user-name-display').textContent = user.name;

  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) logoutBtn.addEventListener('click', () => { clearAuth(); window.location.href = '/'; });

  // Prefill host info from logged-in user
  document.getElementById('host-name').value = user.name || '';
  document.getElementById('host-email').value = user.email || '';

  // Min date = today
  const dateInput = document.getElementById('event-date');
  dateInput.min = new Date().toISOString().split('T')[0];

  const form = document.getElementById('create-event-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const alertEl = document.getElementById('create-alert');
    alertEl.innerHTML = '';

    const fd = new FormData(form);
    const data = Object.fromEntries(fd.entries());

    if (!data.title || !data.category || !data.description || !data.date || !data.venue || !data.location) {
      showAlert(alertEl, 'Please fill in all required event fields.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (!data.hostName || !data.hostEmail || !data.hostBio) {
      showAlert(alertEl, 'Please fill in all host information fields.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (!fd.get('terms')) {
      showAlert(alertEl, 'Please agree to the Host Terms & Conditions.');
      return;
    }

    const btn = document.getElementById('submit-event-btn');
    btn.disabled = true;
    btn.querySelector('.btn-text').style.display = 'none';
    btn.querySelector('.btn-loading').style.display = 'inline-flex';

    try {
      const res = await API.post('/api/user/applications', {
        title: data.title,
        description: data.description,
        category: data.category,
        format: data.format,
        venue: data.venue,
        location: data.location,
        date: data.date,
        time: data.time,
        capacity: data.capacity,
        price: data.price,
        image: data.image,
        tags: data.tags,
        host_name: data.hostName,
        host_email: data.hostEmail,
        host_bio: data.hostBio,
        host_links: data.hostLinks
      }, token);

      if (res.error) {
        showAlert(alertEl, res.error);
      } else {
        showAlert(alertEl, 'Application submitted! Our team will review it within 3-5 business days and notify you via email.', 'success');
        form.reset();
        document.getElementById('host-name').value = user.name || '';
        document.getElementById('host-email').value = user.email || '';
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      showAlert(alertEl, 'Network error. Please try again.');
    } finally {
      btn.disabled = false;
      btn.querySelector('.btn-text').style.display = 'inline';
      btn.querySelector('.btn-loading').style.display = 'none';
    }
  });
});