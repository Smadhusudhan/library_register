const mongoose = require('mongoose');

// MongoDB connection string
const MONGODB_URI = 'mongodb://localhost:27017/admin';

// Connect to MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

// Define schemas and models
const userSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    rollNo: { type: String, sparse: true }
});

const adminSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});

const studentSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true }
});

const bookSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    author: { type: String, required: true },
    status: { type: String, enum: ['available', 'borrowed'], default: 'available' },
    borrowerId: { type: String, default: null },
    dueDate: { type: Date, default: null }
});

// Create models
const User = mongoose.model('User', userSchema);
const Admin = mongoose.model('Admin', adminSchema);
const Student = mongoose.model('Student', studentSchema);
const Book = mongoose.model('Book', bookSchema);

// Seed initial admin if none exists
const seedAdmin = async () => {
    try {
        const adminCount = await Admin.countDocuments();
        if (adminCount === 0) {
            await Admin.create({
                id: 'admin-1',
                username: 'admin',
                email: 'admin@example.com',
                password: 'admin123',
                firstName: 'Library',
                lastName: 'Admin'
            });
            console.log('Default admin account created');
        }
    } catch (error) {
        console.error('Error seeding admin:', error);
    }
};

// Seed initial books if none exist
const seedBooks = async () => {
    try {
        const bookCount = await Book.countDocuments();
        if (bookCount === 0) {
            const demoBooks = [
                { id: `b_${Math.random().toString(36).slice(2, 9)}`, title: 'The Pragmatic Programmer', author: 'Andrew Hunt, David Thomas', status: 'available' },
                { id: `b_${Math.random().toString(36).slice(2, 9)}`, title: 'Clean Code', author: 'Robert C. Martin', status: 'available' },
                { id: `b_${Math.random().toString(36).slice(2, 9)}`, title: 'Atomic Habits', author: 'James Clear', status: 'available' },
                { id: `b_${Math.random().toString(36).slice(2, 9)}`, title: 'Deep Work', author: 'Cal Newport', status: 'available' }
            ];
            await Book.insertMany(demoBooks);
            console.log('Demo books created');
        }
    } catch (error) {
        console.error('Error seeding books:', error);
    }
};

module.exports = {
    connectDB,
    seedAdmin,
    seedBooks,
    models: {
        User,
        Admin,
        Student,
        Book
    }
};