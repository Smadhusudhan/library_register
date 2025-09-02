// Library Management Frontend with MongoDB backend
// Pages separation:
// - login.html: handles Admin/Student login (login.js)
// - register.html: handles Student registration (register.js)
// - index.html: main app (this file) – requires an authenticated user

(function () {
  const STORAGE_KEYS = {
    activeUserId: 'lib_active_user_id',
    activeRole: 'lib_active_role',
    userData: 'lib_user_data',
    selectedStudentId: 'lib_selected_student_id'
  };

  // Common UI
  const messageEl = document.getElementById('message');
  const studentSelect = document.getElementById('studentSelect');
  const booksTbody = document.getElementById('booksTbody');

  // Quick student modal
  const registerDialog = document.getElementById('registerDialog');
  const registerForm = document.getElementById('registerForm');
  const btnRegisterStudent = document.getElementById('btnRegisterStudent');
  const cancelRegister = document.getElementById('cancelRegister');

  // Header auth info
  const activeUserNameHeader = document.getElementById('activeUserNameHeader');
  const activeUserMetaHeader = document.getElementById('activeUserMetaHeader');
  const btnLogoutHeader = document.getElementById('btnLogoutHeader');

  // ---------- Utilities ----------
  const formatDate = (d) => new Date(d).toLocaleDateString();

  function setMessage(text, type = '') { // type: success|warn|error
    if (!messageEl) return;
    messageEl.textContent = text || '';
    messageEl.className = `message ${type}`.trim();
  }

  function load(key, fallback) {
    try {
      const v = JSON.parse(localStorage.getItem(key));
      return v ?? fallback;
    } catch { return fallback; }
  }
  function save(key, value) { localStorage.setItem(key, JSON.stringify(value)); }

  // ---------- Auth helpers ----------
  function getActiveUserId() { return load(STORAGE_KEYS.activeUserId, ''); }
  function getActiveRole() { return load(STORAGE_KEYS.activeRole, ''); }
  function setActiveUserId(id) { save(STORAGE_KEYS.activeUserId, id || ''); }
  function setActiveRole(role) { save(STORAGE_KEYS.activeRole, role || ''); }
  function getActiveUser() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.userData)) || null;
    } catch {
      return null;
    }
  }
  function fullName(u) { return `${u.firstName} ${u.lastName}`.trim(); }

  function requireAuth() {
    const role = getActiveRole();
    const isAuthed = !!getActiveUserId() || role === 'admin';
    if (!isAuthed) {
      window.location.href = 'login.html';
      return false;
    }
    return true;
  }

  function renderHeader() {
    const role = getActiveRole();
    const user = getActiveUser();
    if (role === 'admin') {
      if (activeUserNameHeader) activeUserNameHeader.textContent = 'Admin';
      if (activeUserMetaHeader) activeUserMetaHeader.textContent = ' • admin session';
    } else if (user) {
      if (activeUserNameHeader) activeUserNameHeader.textContent = fullName(user);
      if (activeUserMetaHeader) activeUserMetaHeader.textContent = ` • ${user.username} • ${user.email} • Roll: ${user.rollNo}`;
    } else {
      if (activeUserNameHeader) activeUserNameHeader.textContent = '';
      if (activeUserMetaHeader) activeUserMetaHeader.textContent = '';
    }
  }

  // ---------- API Functions ----------
  async function fetchStudents() {
    try {
      const response = await fetch('/api/students');
      return await response.json();
    } catch (error) {
      console.error('Error fetching students:', error);
      return [];
    }
  }

  async function fetchBooks() {
    try {
      const response = await fetch('/api/books');
      return await response.json();
    } catch (error) {
      console.error('Error fetching books:', error);
      return [];
    }
  }

  async function borrowBookApi(bookId, studentId) {
    try {
      const response = await fetch('/api/books/borrow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ bookId, studentId })
      });
      return await response.json();
    } catch (error) {
      console.error('Error borrowing book:', error);
      return { success: false, message: 'Network error' };
    }
  }

  async function returnBookApi(bookId) {
    try {
      const response = await fetch('/api/books/return', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ bookId })
      });
      return await response.json();
    } catch (error) {
      console.error('Error returning book:', error);
      return { success: false, message: 'Network error' };
    }
  }

  async function addStudentApi(student) {
    try {
      const response = await fetch('/api/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(student)
      });
      return await response.json();
    } catch (error) {
      console.error('Error adding student:', error);
      return { success: false, message: 'Network error' };
    }
  }

  // ---------- Data (students/books) ----------
  function getSelectedStudentId() { return localStorage.getItem(STORAGE_KEYS.selectedStudentId) || ''; }
  function setSelectedStudentId(id) { localStorage.setItem(STORAGE_KEYS.selectedStudentId, id || ''); }
  function getSelectedStudent(students) {
    const id = getSelectedStudentId();
    return students.find(s => s.id === id) || null;
  }

  // Ensure the user also exists in Students list (by roll number as ID)
  async function ensureStudentFromUser(user) {
    if (!user?.rollNo) return;

    const students = await fetchStudents();
    const exists = students.some(s => String(s.id).toLowerCase() === String(user.rollNo).toLowerCase());

    if (!exists) {
      await addStudentApi({
        id: user.rollNo,
        name: fullName(user)
      });
    }

    setSelectedStudentId(user.rollNo);
  }

  // ---------- Fine calculation ----------
  function calculateFine(dueDate, returnDate) {
    const due = new Date(dueDate);
    const ret = new Date(returnDate);
    const lateDays = Math.ceil((ret - due) / (1000 * 60 * 60 * 24));
    return lateDays > 0 ? lateDays * 5 : 0; // Rs. 5 per day
  }

  // ---------- Rendering ----------
  async function renderStudents() {
    const students = await fetchStudents();
    const selected = getSelectedStudentId();

    studentSelect.innerHTML = '';
    const ph = document.createElement('option');
    ph.value = '';
    ph.textContent = 'Select student…';
    studentSelect.appendChild(ph);

    for (const s of students) {
      const opt = document.createElement('option');
      opt.value = s.id;
      opt.textContent = `${s.name} (${s.id})`;
      if (s.id === selected) opt.selected = true;
      studentSelect.appendChild(opt);
    }

    return students;
  }

  function bookRow(book, students) {
    const tr = document.createElement('tr');

    const tdTitle = document.createElement('td');
    tdTitle.textContent = book.title;
    tr.appendChild(tdTitle);

    const tdAuthor = document.createElement('td');
    tdAuthor.textContent = book.author;
    tr.appendChild(tdAuthor);

    const tdStatus = document.createElement('td');
    const badge = document.createElement('span');
    const now = new Date();
    let isOverdue = false;

    if (book.status === 'available') {
      badge.className = 'badge available';
      badge.textContent = 'Available';
    } else {
      if (book.dueDate && new Date(book.dueDate) < now) {
        badge.className = 'badge borrowed';
        badge.textContent = 'Overdue';
        isOverdue = true;
      } else {
        badge.className = 'badge borrowed';
        badge.textContent = 'Borrowed';
      }
    }
    tdStatus.appendChild(badge);
    tr.appendChild(tdStatus);

    const tdBorrower = document.createElement('td');
    if (book.borrowerId) {
      const s = students.find(x => x.id === book.borrowerId);
      tdBorrower.textContent = s ? `${s.name} (${s.id})` : book.borrowerId;
    } else tdBorrower.textContent = '-';
    tr.appendChild(tdBorrower);

    const tdDue = document.createElement('td');
    tdDue.textContent = book.dueDate ? formatDate(book.dueDate) : '-';
    tr.appendChild(tdDue);

    const tdActions = document.createElement('td');
    const currentStudent = getSelectedStudent(students);
    const role = getActiveRole();

    if (book.status === 'available') {
      const btn = document.createElement('button');
      btn.className = 'btn primary small';
      btn.textContent = 'Borrow';
      btn.disabled = !currentStudent;
      btn.title = currentStudent ? 'Borrow this book' : 'Select a student to borrow';
      btn.addEventListener('click', () => borrowBook(book.id));
      tdActions.appendChild(btn);
    } else {
      // Borrowed: Only admin can see the Return action
      if (role === 'admin') {
        const btnReturn = document.createElement('button');
        btnReturn.className = 'btn small';
        btnReturn.textContent = 'Return';
        btnReturn.title = 'Return this book (admin)';
        btnReturn.addEventListener('click', () => returnBook(book.id));
        tdActions.appendChild(btnReturn);
      }

      if (isOverdue && book.dueDate) {
        const fineAmt = calculateFine(book.dueDate, new Date());
        const fineEl = document.createElement('span');
        fineEl.style.marginLeft = '8px';
        fineEl.style.color = '#fca5a5';
        fineEl.textContent = `Fine: Rs. ${fineAmt}`;
        tdActions.appendChild(fineEl);
      }
    }

    tr.appendChild(tdActions);
    return tr;
  }

  async function renderBooks() {
    const books = await fetchBooks();
    const students = await fetchStudents();

    booksTbody.innerHTML = '';

    books.sort((a, b) => {
      if (a.status !== b.status) return a.status === 'available' ? -1 : 1;
      return a.title.localeCompare(b.title);
    });

    for (const b of books) {
      booksTbody.appendChild(bookRow(b, students));
    }
  }

  // ---------- Actions ----------
  async function borrowBook(bookId) {
    const studentId = getSelectedStudentId();
    if (!studentId) {
      setMessage('Please select a student first.', 'warn');
      return;
    }

    setMessage('Borrowing book...', '');

    const result = await borrowBookApi(bookId, studentId);

    if (!result.success) {
      setMessage(result.message || 'Failed to borrow book.', 'error');
      return;
    }

    await renderBooks();
    setMessage(`Borrowed "${result.book.title}". Due by ${formatDate(result.dueDate)}.`, 'success');
  }

  async function returnBook(bookId) {
    // Only admin can return
    const role = getActiveRole();
    if (role !== 'admin') {
      setMessage('Only admin can return books.', 'warn');
      return;
    }

    setMessage('Returning book...', '');

    const result = await returnBookApi(bookId);

    if (!result.success) {
      setMessage(result.message || 'Failed to return book.', 'error');
      return;
    }

    await renderBooks();

    if (result.fine > 0) {
      setMessage(`Late return for "${result.book.title}". Fine imposed: Rs. ${result.fine}.`, 'error');
    } else {
      setMessage(`Returned "${result.book.title}" successfully.`, 'success');
    }
  }

  // ---------- Quick student modal ----------
  function openRegister() { if (registerDialog?.showModal) registerDialog.showModal(); }
  function closeRegister() { if (registerDialog?.close) registerDialog.close(); }

  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = new FormData(registerForm);
      const name = String(form.get('studentName') || '').trim();
      const id = String(form.get('studentId') || '').trim();

      if (!name || !id) {
        setMessage('Please enter both name and student ID.', 'warn');
        return;
      }

      setMessage('Adding student...', '');

      const result = await addStudentApi({ id, name });

      if (!result.success) {
        setMessage(result.message || 'Failed to add student.', 'error');
        return;
      }

      setSelectedStudentId(id);
      await renderStudents();
      await renderBooks();

      setMessage(`Account created for ${name} (${id}).`, 'success');
      closeRegister();
      registerForm.reset();
    });
  }

  if (btnRegisterStudent) { btnRegisterStudent.addEventListener('click', openRegister); }
  if (cancelRegister) { cancelRegister.addEventListener('click', () => { closeRegister(); }); }

  // ---------- Event bindings ----------
  if (btnLogoutHeader) {
    btnLogoutHeader.addEventListener('click', () => {
      setActiveUserId('');
      setActiveRole('');
      localStorage.removeItem(STORAGE_KEYS.userData);
      window.location.href = 'login.html';
    });
  }

  studentSelect.addEventListener('change', async () => {
    const id = studentSelect.value;
    setSelectedStudentId(id);
    await renderBooks();
    if (id) {
      const students = await fetchStudents();
      const s = students.find(x => x.id === id);
      setMessage(`Active student: ${s ? s.name : id}`, '');
    } else setMessage('');
  });

  // ---------- Init ----------
  async function init() {
    if (!requireAuth()) return;

    // When student logs in, ensure they exist as a Student entry
    const user = getActiveUser();
    if (user) await ensureStudentFromUser(user);

    renderHeader();
    const students = await renderStudents();
    await renderBooks();

    const selected = getSelectedStudentId();
    if (selected) {
      studentSelect.value = selected;
    }
  }

  init();
})();