// Signup page logic
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('signup-form');
  if (!form) return;

  // Already logged in? Redirect to dashboard
  if (getAuthToken()) {
    window.location.href = '/dashboard.html';
    return;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const alertEl = document.getElementById('signup-alert');
    alertEl.innerHTML = '';

    const name = document.getElementById('signup-name').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const phone = document.getElementById('signup-phone').value.trim();
    const password = document.getElementById('signup-password').value;
    const confirm = document.getElementById('signup-confirm').value;

    if (!name || !email || !password) { showAlert(alertEl, 'Please fill in all required fields'); return; }
    if (password.length < 8) { showAlert(alertEl, 'Password must be at least 8 characters'); return; }
    if (password !== confirm) { showAlert(alertEl, 'Passwords do not match'); return; }

    const btn = document.getElementById('signup-btn');
    btn.disabled = true;
    btn.querySelector('.btn-text').style.display = 'none';
    btn.querySelector('.btn-loading').style.display = 'inline-flex';

    try {
      const res = await API.post('/api/auth/signup', { name, email, phone, password });
      if (res.error) {
        showAlert(alertEl, res.error);
        btn.disabled = false;
        btn.querySelector('.btn-text').style.display = 'inline';
        btn.querySelector('.btn-loading').style.display = 'none';
        return;
      }
      setAuth(res.token, res.user);
      window.location.href = '/dashboard.html';
    } catch (err) {
      showAlert(alertEl, 'Network error. Please try again.');
      btn.disabled = false;
      btn.querySelector('.btn-text').style.display = 'inline';
      btn.querySelector('.btn-loading').style.display = 'none';
    }
  });
});