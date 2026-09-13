// Login page logic
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('login-form');
  if (!form) return;

  // Already logged in? Redirect to dashboard
  if (getAuthToken()) {
    window.location.href = '/dashboard.html';
    return;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const alertEl = document.getElementById('login-alert');
    alertEl.innerHTML = '';

    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    if (!email || !password) { showAlert(alertEl, 'Please enter your email and password'); return; }

    const btn = document.getElementById('login-btn');
    btn.disabled = true;
    btn.querySelector('.btn-text').style.display = 'none';
    btn.querySelector('.btn-loading').style.display = 'inline-flex';

    try {
      const res = await API.post('/api/auth/login', { email, password });
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