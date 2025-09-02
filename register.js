// register.js - unified registration (Student/Admin)
(function () {
  const STORAGE_KEYS = {
    activeUserId: 'lib_active_user_id',
    activeRole: 'lib_active_role',
    userData: 'lib_user_data'
  };

  const formEl = document.getElementById('unifiedRegisterForm');
  const messageEl = document.getElementById('message');
  const submitBtn = document.getElementById('btnUnifiedRegister');
  const roleEl = document.getElementById('regRole');
  const rollEl = document.getElementById('regRoll');

  function setMessage(text, type = '') {
    if (!messageEl) return;
    messageEl.textContent = text || '';
    messageEl.className = `message ${type}`.trim();
  }

  function save(key, value) { localStorage.setItem(key, JSON.stringify(value)); }

  // API function for user registration
  async function registerUser(userData) {
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });

      return await response.json();
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, message: 'Network error' };
    }
  }

  function toggleStudentOnly() {
    const isStudent = roleEl.value === 'student';
    // Toggle required attribute for roll number
    if (isStudent) { rollEl.setAttribute('required', 'required'); }
    else { rollEl.removeAttribute('required'); }
    // Enable/disable input visually is not necessary; label clarifies
  }

  function validate() {
    const form = new FormData(formEl);
    const role = String(form.get('role') || 'student');
    const firstName = String(form.get('firstName') || '').trim();
    const lastName = String(form.get('lastName') || '').trim();
    const email = String(form.get('email') || '').trim();
    const username = String(form.get('username') || '').trim();
    const password = String(form.get('password') || '');
    const password2 = String(form.get('password2') || '');
    const rollNo = String(form.get('rollNo') || '').trim();

    const baseFilled = firstName && lastName && email && username && password && password2;
    const studentOk = role === 'admin' || rollNo;
    const pwMatch = password && password2 && password === password2;

    submitBtn.disabled = !(baseFilled && pwMatch && studentOk);

    let msg = '';
    if (!baseFilled) msg = 'Fill all fields to enable Register.';
    else if (role === 'student' && !rollNo) msg = 'Roll number is required for students.';
    else if (!pwMatch) msg = 'Passwords do not match.';

    setMessage(msg, msg ? 'warn' : '');
  }

  if (formEl) {
    roleEl.addEventListener('change', () => { toggleStudentOnly(); validate(); });
    formEl.addEventListener('input', validate);
    formEl.addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = new FormData(formEl);
      const role = String(form.get('role') || 'student');

      const userData = {
        role,
        firstName: String(form.get('firstName') || '').trim(),
        lastName: String(form.get('lastName') || '').trim(),
        email: String(form.get('email') || '').trim(),
        username: String(form.get('username') || '').trim(),
        password: String(form.get('password') || '')
      };

      if (role === 'student') {
        userData.rollNo = String(form.get('rollNo') || '').trim();
      }

      setMessage('Registering...', '');

      const result = await registerUser(userData);

      if (!result.success) {
        setMessage(result.message || 'Registration failed. Please try again.', 'error');
        return;
      }

      // Save session data
      save(STORAGE_KEYS.activeUserId, result.user.id);
      save(STORAGE_KEYS.activeRole, result.role);
      save(STORAGE_KEYS.userData, JSON.stringify(result.user));

      setMessage(`${role === 'student' ? 'Student' : 'Admin'} registered successfully. Redirecting...`, 'success');
      window.location.href = 'index.html';
    });
  }

  function init() {
    toggleStudentOnly();
    validate();
  }
  init();
})();