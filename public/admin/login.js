(function () {
  var form = document.getElementById('form');
  var err = document.getElementById('error');
  var btn = document.getElementById('submit');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    err.textContent = '';
    var email = form.email.value.trim();
    var password = form.password.value;
    if (!email || !password) { err.textContent = 'Enter your email and password.'; return; }
    btn.disabled = true;
    btn.textContent = 'Signing in…';
    fetch('/api/admin/login', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'tg' },
      body: JSON.stringify({ email: email, password: password })
    })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (d) { return { ok: r.ok, d: d }; }); })
      .then(function (res) {
        if (res.ok) { location.href = '/admin/dashboard'; return; }
        err.textContent = res.d.error || 'Could not sign in.';
        form.password.value = '';
        form.password.focus();
      })
      .catch(function () { err.textContent = 'Network error. Please try again.'; })
      .then(function () { btn.disabled = false; btn.textContent = 'Sign in'; });
  });
})();
