// Library Management Frontend (no backend) using localStorage
// Pages separation:
// - login.html: handles Admin/Student login (login.js)
// - register.html: handles Student registration (register.js)
// - index.html: main app (this file) – requires an authenticated user

(function(){
  const STORAGE_KEYS = {
    students: 'lib_students',
    books: 'lib_books',
    users: 'lib_users',
    selectedStudentId: 'lib_selected_student_id',
    activeUserId: 'lib_active_user_id',
    activeRole: 'lib_active_role'
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
  const uid = (prefix='id') => `${prefix}_${Math.random().toString(36).slice(2,9)}`;
  const today = () => new Date();
  const formatDate = (d) => new Date(d).toLocaleDateString();

  function setMessage(text, type=''){ // type: success|warn|error
    if (!messageEl) return;
    messageEl.textContent = text || '';
    messageEl.className = `message ${type}`.trim();
  }

  function load(key, fallback){
    try {
      const v = JSON.parse(localStorage.getItem(key));
      return Array.isArray(fallback) && !Array.isArray(v) ? fallback : (v ?? fallback);
    } catch { return fallback; }
  }
  function save(key, value){ localStorage.setItem(key, JSON.stringify(value)); }

  // ---------- Auth helpers ----------
  function getUsers(){ return load(STORAGE_KEYS.users, []); }
  function getActiveUserId(){ return load(STORAGE_KEYS.activeUserId, ''); }
  function getActiveRole(){ return load(STORAGE_KEYS.activeRole, ''); }
  function setActiveUserId(id){ save(STORAGE_KEYS.activeUserId, id || ''); }
  function setActiveRole(role){ save(STORAGE_KEYS.activeRole, role || ''); }
  function getActiveUser(){
    const id = getActiveUserId();
    return getUsers().find(u => u.id === id) || null;
  }
  function fullName(u){ return `${u.firstName} ${u.lastName}`.trim(); }

  function requireAuth(){
    const role = getActiveRole();
    const isAuthed = !!getActiveUserId() || role === 'admin';
    if (!isAuthed){
      window.location.href = 'login.html';
      return false;
    }
    return true;
  }

  function renderHeader(){
    const role = getActiveRole();
    const user = getActiveUser();
    if (role === 'admin'){
      if (activeUserNameHeader) activeUserNameHeader.textContent = 'Admin';
      if (activeUserMetaHeader) activeUserMetaHeader.textContent = ' • admin session';
    } else if (user){
      if (activeUserNameHeader) activeUserNameHeader.textContent = fullName(user);
      if (activeUserMetaHeader) activeUserMetaHeader.textContent = ` • ${user.username} • ${user.email} • Roll: ${user.rollNo}`;
    } else {
      if (activeUserNameHeader) activeUserNameHeader.textContent = '';
      if (activeUserMetaHeader) activeUserMetaHeader.textContent = '';
    }
  }

  // ---------- Data (students/books) ----------
  function seedIfEmpty(){
    const students = load(STORAGE_KEYS.students, []);
    const books = load(STORAGE_KEYS.books, []);
    if (students.length === 0){
      const demo = [
        { id: 'STU-001', name: 'Aarav Kumar' },
        { id: 'STU-002', name: 'Diya Patel' }
      ];
      save(STORAGE_KEYS.students, demo);
    }
    if (books.length === 0){
      const demoBooks = [
        { id: uid('b'), title: 'The Pragmatic Programmer', author: 'Andrew Hunt, David Thomas', status: 'available' },
        { id: uid('b'), title: 'Clean Code', author: 'Robert C. Martin', status: 'available' },
        { id: uid('b'), title: 'Atomic Habits', author: 'James Clear', status: 'available' },
        { id: uid('b'), title: 'Deep Work', author: 'Cal Newport', status: 'available' }
      ];
      save(STORAGE_KEYS.books, demoBooks);
    }
  }

  function getStudents(){ return load(STORAGE_KEYS.students, []); }
  function setStudents(list){ save(STORAGE_KEYS.students, list); }
  function getBooks(){ return load(STORAGE_KEYS.books, []); }
  function setBooks(list){ save(STORAGE_KEYS.books, list); }

  function getSelectedStudentId(){ return localStorage.getItem(STORAGE_KEYS.selectedStudentId) || ''; }
  function setSelectedStudentId(id){ localStorage.setItem(STORAGE_KEYS.selectedStudentId, id || ''); }
  function getSelectedStudent(){
    const id = getSelectedStudentId();
    return getStudents().find(s => s.id === id) || null;
  }

  // Ensure the user also exists in Students list (by roll number as ID)
  function ensureStudentFromUser(user){
    if (!user?.rollNo) return;
    const students = getStudents();
    const exists = students.some(s => String(s.id).toLowerCase() === String(user.rollNo).toLowerCase());
    if (!exists){
      students.push({ id: user.rollNo, name: fullName(user) });
      setStudents(students);
    }
    setSelectedStudentId(user.rollNo);
  }

  // ---------- Fine calculation ----------
  const LOAN_DAYS = 7;
  const FINE_PER_DAY = 5; // currency unit

  function addDays(date, days){
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  }

  function calculateFine(dueDate, returnDate){
    const due = new Date(dueDate);
    const ret = new Date(returnDate);
    const lateDays = Math.ceil((ret - due) / (1000*60*60*24));
    return lateDays > 0 ? lateDays * FINE_PER_DAY : 0;
  }

  // ---------- Rendering ----------
  function renderStudents(){
    const students = getStudents();
    const selected = getSelectedStudentId();

    studentSelect.innerHTML = '';
    const ph = document.createElement('option');
    ph.value = '';
    ph.textContent = 'Select student…';
    studentSelect.appendChild(ph);

    for (const s of students){
      const opt = document.createElement('option');
      opt.value = s.id;
      opt.textContent = `${s.name} (${s.id})`;
      if (s.id === selected) opt.selected = true;
      studentSelect.appendChild(opt);
    }
  }

  function bookRow(book){
    const tr = document.createElement('tr');

    const tdTitle = document.createElement('td');
    tdTitle.textContent = book.title;
    tr.appendChild(tdTitle);

    const tdAuthor = document.createElement('td');
    tdAuthor.textContent = book.author;
    tr.appendChild(tdAuthor);

    const tdStatus = document.createElement('td');
    const badge = document.createElement('span');
    const now = today();
    let isOverdue = false;

    if (book.status === 'available'){
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
    if (book.borrowerId){
      const s = getStudents().find(x => x.id === book.borrowerId);
      tdBorrower.textContent = s ? `${s.name} (${s.id})` : book.borrowerId;
    } else tdBorrower.textContent = '-';
    tr.appendChild(tdBorrower);

    const tdDue = document.createElement('td');
    tdDue.textContent = book.dueDate ? formatDate(book.dueDate) : '-';
    tr.appendChild(tdDue);

    const tdActions = document.createElement('td');
    const currentStudent = getSelectedStudent();
    const role = getActiveRole();

    if (book.status === 'available'){
      const btn = document.createElement('button');
      btn.className = 'btn primary small';
      btn.textContent = 'Borrow';
      btn.disabled = !currentStudent;
      btn.title = currentStudent ? 'Borrow this book' : 'Select a student to borrow';
      btn.addEventListener('click', () => borrowBook(book.id));
      tdActions.appendChild(btn);
    } else {
      // Borrowed: Only admin can see the Return action
      if (role === 'admin'){
        const btnReturn = document.createElement('button');
        btnReturn.className = 'btn small';
        btnReturn.textContent = 'Return';
        btnReturn.title = 'Return this book (admin)';
        btnReturn.addEventListener('click', () => returnBook(book.id));
        tdActions.appendChild(btnReturn);
      }

      if (isOverdue && book.dueDate){
        const fineAmt = calculateFine(book.dueDate, today());
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

  function renderBooks(){
    booksTbody.innerHTML = '';
    const books = getBooks();

    books.sort((a,b) => {
      if (a.status !== b.status) return a.status === 'available' ? -1 : 1;
      return a.title.localeCompare(b.title);
    });

    for (const b of books){
      booksTbody.appendChild(bookRow(b));
    }
  }

  // ---------- Actions ----------
  function borrowBook(bookId){
    const student = getSelectedStudent();
    if (!student) { setMessage('Please select a student first.', 'warn'); return; }

    const books = getBooks();
    const book = books.find(b => b.id === bookId);
    if (!book) { setMessage('Book not found.', 'error'); return; }
    if (book.status !== 'available') { setMessage('Book is not available.', 'warn'); return; }

    const due = addDays(today(), LOAN_DAYS);
    book.status = 'borrowed';
    book.borrowerId = student.id;
    book.dueDate = due.toISOString();
    setBooks(books);

    renderBooks();
    setMessage(`Borrowed "${book.title}". Due by ${formatDate(due)}.`, 'success');
  }

  function returnBook(bookId){
    // Only admin can return
    const role = getActiveRole();
    if (role !== 'admin'){
      setMessage('Only admin can return books.', 'warn');
      return;
    }

    const books = getBooks();
    const book = books.find(b => b.id === bookId);
    if (!book) { setMessage('Book not found.', 'error'); return; }

    let fine = 0;
    if (book.dueDate){
      fine = calculateFine(book.dueDate, today());
    }

    book.status = 'available';
    book.borrowerId = null;
    book.dueDate = null;
    setBooks(books);
    renderBooks();

    if (fine > 0){
      setMessage(`Late return for "${book.title}". Fine imposed: Rs. ${fine}.`, 'error');
    } else {
      setMessage(`Returned "${book.title}" successfully.`, 'success');
    }
  }

  // ---------- Quick student modal ----------
  function openRegister(){ if (registerDialog?.showModal) registerDialog.showModal(); }
  function closeRegister(){ if (registerDialog?.close) registerDialog.close(); }

  if (registerForm){
    registerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const form = new FormData(registerForm);
      const name = String(form.get('studentName') || '').trim();
      const id = String(form.get('studentId') || '').trim();

      if (!name || !id){ setMessage('Please enter both name and student ID.', 'warn'); return; }

      const students = getStudents();
      if (students.some(s => String(s.id).toLowerCase() === id.toLowerCase())){
        setMessage('Student ID already exists.', 'error');
        return;
      }

      students.push({ id, name });
      setStudents(students);
      setSelectedStudentId(id);
      renderStudents();
      renderBooks();

      setMessage(`Account created for ${name} (${id}).`, 'success');
      closeRegister();
      registerForm.reset();
    });
  }

  if (btnRegisterStudent){ btnRegisterStudent.addEventListener('click', openRegister); }
  if (cancelRegister){ cancelRegister.addEventListener('click', () => { closeRegister(); }); }

  // ---------- Event bindings ----------
  if (btnLogoutHeader){
    btnLogoutHeader.addEventListener('click', () => {
      setActiveUserId('');
      setActiveRole('');
      window.location.href = 'login.html';
    });
  }

  studentSelect.addEventListener('change', () => {
    const id = studentSelect.value;
    setSelectedStudentId(id);
    renderBooks();
    if (id){
      const s = getStudents().find(x => x.id === id);
      setMessage(`Active student: ${s ? s.name : id}`, '');
    } else setMessage('');
  });

  // ---------- Init ----------
  function init(){
    if (!requireAuth()) return;
    seedIfEmpty();

    // When student logs in, ensure they exist as a Student entry
    const user = getActiveUser();
    if (user) ensureStudentFromUser(user);

    renderHeader();
    renderStudents();
    renderBooks();

    const selected = getSelectedStudentId();
    if (selected){ studentSelect.value = selected; }
  }

  init();
})();