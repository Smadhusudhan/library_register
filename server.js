const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const { connectDB, seedAdmin, seedBooks, models } = require('./db');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '/')));

// Connect to MongoDB
connectDB().then(() => {
    // Seed initial data
    seedAdmin();
    seedBooks();
});

// Routes

// Authentication
app.post('/api/login', async (req, res) => {
    try {
        const { role, identifier, password } = req.body;

        if (role === 'admin') {
            const admin = await models.Admin.findOne({
                $or: [
                    { email: identifier.toLowerCase() },
                    { username: identifier.toLowerCase() }
                ],
                password
            });

            if (admin) {
                return res.json({ success: true, user: admin, role: 'admin' });
            }
        } else {
            const user = await models.User.findOne({
                $or: [
                    { email: identifier.toLowerCase() },
                    { username: identifier.toLowerCase() }
                ],
                password
            });

            if (user) {
                return res.json({ success: true, user, role: 'student' });
            }
        }

        res.status(401).json({ success: false, message: 'Invalid credentials' });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Register user
app.post('/api/register', async (req, res) => {
    try {
        const { role, firstName, lastName, email, username, password, rollNo } = req.body;

        if (role === 'admin') {
            // Check if admin already exists
            const adminExists = await models.Admin.findOne({
                $or: [
                    { email: email.toLowerCase() },
                    { username: username.toLowerCase() }
                ]
            });

            if (adminExists) {
                return res.status(400).json({
                    success: false,
                    message: 'Admin with this email or username already exists'
                });
            }

            // Create new admin
            const admin = await models.Admin.create({
                id: `adm_${Math.random().toString(36).slice(2, 9)}`,
                firstName,
                lastName,
                email: email.toLowerCase(),
                username: username.toLowerCase(),
                password
            });

            res.json({ success: true, user: admin, role: 'admin' });
        } else {
            // Check if user already exists
            const userExists = await models.User.findOne({
                $or: [
                    { email: email.toLowerCase() },
                    { username: username.toLowerCase() },
                    { rollNo }
                ]
            });

            if (userExists) {
                return res.status(400).json({
                    success: false,
                    message: 'User with this email, username or roll number already exists'
                });
            }

            // Create new user
            const user = await models.User.create({
                id: `u_${Math.random().toString(36).slice(2, 9)}`,
                firstName,
                lastName,
                email: email.toLowerCase(),
                username: username.toLowerCase(),
                password,
                rollNo
            });

            // Ensure student entry exists
            await models.Student.create({
                id: rollNo,
                name: `${firstName} ${lastName}`.trim()
            });

            res.json({ success: true, user, role: 'student' });
        }
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get students
app.get('/api/students', async (req, res) => {
    try {
        const students = await models.Student.find();
        res.json(students);
    } catch (error) {
        console.error('Error fetching students:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Add student
app.post('/api/students', async (req, res) => {
    try {
        const { id, name } = req.body;

        // Check if student already exists
        const studentExists = await models.Student.findOne({ id });
        if (studentExists) {
            return res.status(400).json({
                success: false,
                message: 'Student with this ID already exists'
            });
        }

        // Create new student
        const student = await models.Student.create({ id, name });
        res.json({ success: true, student });
    } catch (error) {
        console.error('Error adding student:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get books
app.get('/api/books', async (req, res) => {
    try {
        const books = await models.Book.find();
        res.json(books);
    } catch (error) {
        console.error('Error fetching books:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Borrow book
app.post('/api/books/borrow', async (req, res) => {
    try {
        const { bookId, studentId } = req.body;

        // Find the book
        const book = await models.Book.findOne({ id: bookId });
        if (!book) {
            return res.status(404).json({ success: false, message: 'Book not found' });
        }

        // Check if book is available
        if (book.status !== 'available') {
            return res.status(400).json({ success: false, message: 'Book is not available' });
        }

        // Find the student
        const student = await models.Student.findOne({ id: studentId });
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        // Calculate due date (7 days from now)
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 7);

        // Update book status
        book.status = 'borrowed';
        book.borrowerId = studentId;
        book.dueDate = dueDate;
        await book.save();

        res.json({
            success: true,
            book,
            dueDate: dueDate.toISOString()
        });
    } catch (error) {
        console.error('Error borrowing book:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Return book
app.post('/api/books/return', async (req, res) => {
    try {
        const { bookId } = req.body;

        // Find the book
        const book = await models.Book.findOne({ id: bookId });
        if (!book) {
            return res.status(404).json({ success: false, message: 'Book not found' });
        }

        // Calculate fine if overdue
        let fine = 0;
        if (book.dueDate) {
            const dueDate = new Date(book.dueDate);
            const today = new Date();
            const diffTime = today - dueDate;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays > 0) {
                fine = diffDays * 5; // Rs. 5 per day
            }
        }

        // Update book status
        book.status = 'available';
        book.borrowerId = null;
        book.dueDate = null;
        await book.save();

        res.json({
            success: true,
            book,
            fine
        });
    } catch (error) {
        console.error('Error returning book:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Serve static files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'register.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});