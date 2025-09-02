// register.js - unified registration (Student/Admin)
(function(){
  const STORAGE_KEYS = {
    users: 'lib_users',          // students
    admins: 'lib_admins',        // admins
    students: 'lib_students',    // for student entity list
    activeUserId: 'lib_active_user_id',
    activeRole: 'lib_active_role'
  };

  const formEl = document.getElementById('unifiedRegisterForm');
  const messageEl = document.getElementById('message');
  const submitBtn = document.getElementById('btnUnifiedRegister');
  const roleEl = document.getElementById('regRole');
  const rollEl = document.getElementById('regRoll');

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

  function fullName(u){ return `${u.firstName} ${u.lastName}`.trim(); }

  function ensureStudentFromUser(user){
    const students = load(STORAGE_KEYS.students, []);
    const exists = students.some(s => String(s.id).toLowerCase() === String(user.rollNo).toLowerCase());
    if (!exists){
      students.push({ id: user.rollNo, name: fullName(user) });
      save(STORAGE_KEYS.students, students);
    }
  }

  function toggleStudentOnly(){
    const isStudent = roleEl.value === 'student';
    // Toggle required attribute for roll number
    if (isStudent){ rollEl.setAttribute('required', 'required'); }
    else { rollEl.removeAttribute('required'); }
    // Enable/disable input visually is not necessary; label clarifies
  }

  function validate(){
    const form = new FormData(formEl);
    const role = String(form.get('role')||'student');
    const firstName = String(form.get('firstName')||'').trim();
    const lastName = String(form.get('lastName')||'').trim();
    const email = String(form.get('email')||'').trim();
    const username = String(form.get('username')||'').trim();
    const password = String(form.get('password')||'');
    const password2 = String(form.get('password2')||'');
    const rollNo = String(form.get('rollNo')||'').trim();

    const users = load(STORAGE_KEYS.users, []);
    const admins = load(STORAGE_KEYS.admins, []);

    let emailUsed=false, usernameUsed=false, rollUsed=false;
    if (role === 'student'){
      emailUsed = users.some(u => u.email.toLowerCase() === email.toLowerCase());
      usernameUsed = users.some(u => u.username.toLowerCase() === username.toLowerCase());
      rollUsed = users.some(u => String(u.rollNo).toLowerCase() === rollNo.toLowerCase());
    } else {
      emailUsed = admins.some(a => a.email.toLowerCase() === email.toLowerCase());
      usernameUsed = admins.some(a => a.username.toLowerCase() === username.toLowerCase());
    }

    const baseFilled = firstName && lastName && email && username && password && password2;
    const studentOk = role === 'admin' || (rollNo && !rollUsed);
    const pwMatch = password && password2 && password === password2;

    submitBtn.disabled = !(baseFilled && pwMatch && studentOk) || emailUsed || usernameUsed;

    let msg = '';
    if (!baseFilled) msg = 'Fill all fields to enable Register.';
    else if (role === 'student' && !rollNo) msg = 'Roll number is required for students.';
    else if (!pwMatch) msg = 'Passwords do not match.';
    else if (emailUsed) msg = 'Email already in use.';
    else if (usernameUsed) msg = 'Username already in use.';
    else if (rollUsed) msg = 'Roll number already in use.';

    setMessage(msg, msg ? 'warn' : '');
  }

  if (formEl){
    roleEl.addEventListener('change', () => { toggleStudentOnly(); validate(); });
    formEl.addEventListener('input', validate);
    formEl.addEventListener('submit', (e) => {
      e.preventDefault();
      const form = new FormData(formEl);
      const role = String(form.get('role')||'student');

      if (role === 'student'){
        const newUser = {
          id: `u_${Math.random().toString(36).slice(2,9)}`,
          firstName: String(form.get('firstName')||'').trim(),
          lastName: String(form.get('lastName')||'').trim(),
          email: String(form.get('email')||'').trim(),
          rollNo: String(form.get('rollNo')||'').trim(),
          username: String(form.get('username')||'').trim(),
          password: String(form.get('password')||'')
        };
        const users = load(STORAGE_KEYS.users, []);
        users.push(newUser);
        save(STORAGE_KEYS.users, users);
        ensureStudentFromUser(newUser);
        save(STORAGE_KEYS.activeUserId, newUser.id);
        save(STORAGE_KEYS.activeRole, 'student');
        setMessage('Student registered. Redirecting...', 'success');
      } else {
        const newAdmin = {
          id: `adm_${Math.random().toString(36).slice(2,9)}`,
          firstName: String(form.get('firstName')||'').trim(),
          lastName: String(form.get('lastName')||'').trim(),
          email: String(form.get('email')||'').trim(),
          username: String(form.get('username')||'').trim(),
          password: String(form.get('password')||'')
        };
        const admins = load(STORAGE_KEYS.admins, []);
        admins.push(newAdmin);
        save(STORAGE_KEYS.admins, admins);
        save(STORAGE_KEYS.activeUserId, newAdmin.id);
        save(STORAGE_KEYS.activeRole, 'admin');
        setMessage('Admin registered. Redirecting...', 'success');
      }

      window.location.href = 'index.html';
    });
  }

  function init(){
    toggleStudentOnly();
    validate();
  }
  init();
})();