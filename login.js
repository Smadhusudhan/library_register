// login.js - handles Admin/Student login page
(function(){
  const STORAGE_KEYS = {
    users: 'lib_users', // students
    admins: 'lib_admins',
    activeUserId: 'lib_active_user_id',
    activeRole: 'lib_active_role'
  };

  const messageEl = document.getElementById('message');
  const loginForm = document.getElementById('loginForm');
  const adminRegisterForm = document.getElementById('adminRegisterForm');
  const btnAdminRegister = document.getElementById('btnAdminRegister');

  function setMessage(text, type=''){
    if (!messageEl) return;
    messageEl.textContent = text || '';
    messageEl.className = `message ${type}`.trim();
  }

  function load(key, fallback){
    try { const v = JSON.parse(localStorage.getItem(key)); return v ?? fallback; }
    catch { return fallback; }
  }
  function save(key, value){ localStorage.setItem(key, JSON.stringify(value)); }

  // Seed an admin if none exists (demo only)
  function seedAdmin(){
    const admins = load(STORAGE_KEYS.admins, []);
    if (admins.length === 0){
      admins.push({ id: 'admin-1', username: 'admin', email: 'admin@example.com', password: 'admin123', firstName: 'Library', lastName: 'Admin' });
      save(STORAGE_KEYS.admins, admins);
    }
  }

  function findStudent(identifier, password){
    const users = load(STORAGE_KEYS.users, []);
    return users.find(u => (u.email?.toLowerCase() === identifier.toLowerCase() || u.username?.toLowerCase() === identifier.toLowerCase()) && u.password === password) || null;
  }
  function findAdmin(identifier, password){
    const admins = load(STORAGE_KEYS.admins, []);
    return admins.find(a => (a.email?.toLowerCase() === identifier.toLowerCase() || a.username?.toLowerCase() === identifier.toLowerCase()) && a.password === password) || null;
  }

  if (loginForm){
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const form = new FormData(loginForm);
      const role = String(form.get('role')||'student');
      const identifier = String(form.get('identifier')||'').trim();
      const password = String(form.get('password')||'');

      if (!identifier || !password){ setMessage('Enter credentials.', 'warn'); return; }

      let account = null;
      if (role === 'admin') account = findAdmin(identifier, password);
      else account = findStudent(identifier, password);

      if (!account){ setMessage('Invalid credentials. Try again or register.', 'error'); return; }

      // Save session
      if (role === 'admin'){
        save(STORAGE_KEYS.activeUserId, account.id);
        save(STORAGE_KEYS.activeRole, 'admin');
      } else {
        save(STORAGE_KEYS.activeUserId, account.id);
        save(STORAGE_KEYS.activeRole, 'student');
      }

      setMessage('Login successful. Redirecting...', 'success');
      window.location.href = 'index.html';
    });
  }

  // ------- Admin Registration -------
  function validateAdminForm(){
    if (!adminRegisterForm || !btnAdminRegister) return;
    const form = new FormData(adminRegisterForm);
    const firstName = String(form.get('firstName')||'').trim();
    const lastName = String(form.get('lastName')||'').trim();
    const email = String(form.get('email')||'').trim();
    const username = String(form.get('username')||'').trim();
    const password = String(form.get('password')||'');
    const password2 = String(form.get('password2')||'');

    const admins = load(STORAGE_KEYS.admins, []);
    const emailUsed = admins.some(a => a.email.toLowerCase() === email.toLowerCase());
    const usernameUsed = admins.some(a => a.username.toLowerCase() === username.toLowerCase());

    const allFilled = firstName && lastName && email && username && password && password2;
    const pwMatch = password && password2 && password === password2;

    btnAdminRegister.disabled = !(allFilled && pwMatch) || emailUsed || usernameUsed;

    let msg = '';
    if (!allFilled) msg = 'Fill all admin fields to enable Register Admin.';
    else if (!pwMatch) msg = 'Admin passwords do not match.';
    else if (emailUsed) msg = 'Admin email already in use.';
    else if (usernameUsed) msg = 'Admin username already in use.';

    setMessage(msg, msg ? 'warn' : '');
  }

  if (adminRegisterForm){
    adminRegisterForm.addEventListener('input', validateAdminForm);
    adminRegisterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const form = new FormData(adminRegisterForm);
      const newAdmin = {
        id: `adm_${Math.random().toString(36).slice(2,9)}`,
        firstName: String(form.get('firstName')||'').trim(),
        lastName: String(form.get('lastName')||'').trim(),
        email: String(form.get('email')||'').trim(),
        username: String(form.get('username')||'').trim(),
        password: String(form.get('password')||'')
      };

      const admins = load(STORAGE_KEYS.admins, []);
      if (admins.some(a => a.email.toLowerCase() === newAdmin.email.toLowerCase())){ setMessage('Admin email already in use.', 'error'); return; }
      if (admins.some(a => a.username.toLowerCase() === newAdmin.username.toLowerCase())){ setMessage('Admin username already in use.', 'error'); return; }

      admins.push(newAdmin);
      save(STORAGE_KEYS.admins, admins);

      // Auto-login as admin
      save(STORAGE_KEYS.activeUserId, newAdmin.id);
      save(STORAGE_KEYS.activeRole, 'admin');

      setMessage('Admin registered successfully. Redirecting...', 'success');
      window.location.href = 'index.html';
    });
  }

  function init(){
    seedAdmin();
    validateAdminForm();
  }

  init();
})();