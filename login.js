// login.js - handles Admin/Student login page
(function () {
  // Session storage keys
  const STORAGE_KEYS = {
    activeUserId: 'lib_active_user_id',
    activeRole: 'lib_active_role',
    userData: 'lib_user_data'
  };

  const messageEl = document.getElementById('message');
  const loginForm = document.getElementById('loginForm');
  const adminRegisterForm = document.getElementById('adminRegisterForm');
  const btnAdminRegister = document.getElementById('btnAdminRegister');

  function setMessage(text, type = '') {
    if (!messageEl) return;
    messageEl.textContent = text || '';
    messageEl.className = `message ${type}`.trim();
  }

  function load(key, fallback) {
    try { const v = JSON.parse(localStorage.getItem(key)); return v ?? fallback; }
    catch { return fallback; }
  }
  function save(key, value) { localStorage.setItem(key, JSON.stringify(value)); }

  // API functions
  async function loginUser(role, identifier, password) {
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role, identifier, password })
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Network error' };
    }
  }

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = new FormData(loginForm);
      const role = String(form.get('role') || 'student');
      const identifier = String(form.get('identifier') || '').trim();
      const password = String(form.get('password') || '');

      if (!identifier || !password) { setMessage('Enter credentials.', 'warn'); return; }

      setMessage('Logging in...', '');

      // Call API for login
      const result = await loginUser(role, identifier, password);

      if (!result.success) {
        setMessage(result.message || 'Invalid credentials. Try again or register.', 'error');
        return;
      }

      // Save session
      save(STORAGE_KEYS.activeUserId, result.user.id);
      save(STORAGE_KEYS.activeRole, result.role);
      save(STORAGE_KEYS.userData, JSON.stringify(result.user));

      setMessage('Login successful. Redirecting...', 'success');
      window.location.href = 'index.html';
    });
  }

  // API function for admin registration
  async function registerAdmin(userData) {
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          role: 'admin',
          ...userData
        })
      });

      return await response.json();
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, message: 'Network error' };
    }
  }

  // ------- Admin Registration -------
  function validateAdminForm() {
    if (!adminRegisterForm || !btnAdminRegister) return;
    const form = new FormData(adminRegisterForm);
    const firstName = String(form.get('firstName') || '').trim();
    const lastName = String(form.get('lastName') || '').trim();
    const email = String(form.get('email') || '').trim();
    const username = String(form.get('username') || '').trim();
    const password = String(form.get('password') || '');
    const password2 = String(form.get('password2') || '');

    const allFilled = firstName && lastName && email && username && password && password2;
    const pwMatch = password && password2 && password === password2;

    btnAdminRegister.disabled = !(allFilled && pwMatch);

    let msg = '';
    if (!allFilled) msg = 'Fill all admin fields to enable Register Admin.';
    else if (!pwMatch) msg = 'Admin passwords do not match.';

    setMessage(msg, msg ? 'warn' : '');
  }

  if (adminRegisterForm) {
    adminRegisterForm.addEventListener('input', validateAdminForm);
    adminRegisterForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = new FormData(adminRegisterForm);
      const userData = {
        firstName: String(form.get('firstName') || '').trim(),
        lastName: String(form.get('lastName') || '').trim(),
        email: String(form.get('email') || '').trim(),
        username: String(form.get('username') || '').trim(),
        password: String(form.get('password') || '')
      };

      setMessage('Registering admin...', '');

      const result = await registerAdmin(userData);

      if (!result.success) {
        setMessage(result.message || 'Registration failed. Please try again.', 'error');
        return;
      }

      // Auto-login as admin
      save(STORAGE_KEYS.activeUserId, result.user.id);
      save(STORAGE_KEYS.activeRole, 'admin');
      save(STORAGE_KEYS.userData, JSON.stringify(result.user));

      setMessage('Admin registered successfully. Redirecting...', 'success');
      window.location.href = 'index.html';
    });
  }

  function init() {
    validateAdminForm();
  }

  init();
})();