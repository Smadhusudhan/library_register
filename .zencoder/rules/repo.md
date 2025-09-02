---
description: Repository Information Overview
alwaysApply: true
---

# Library Management System Information

## Summary
A library management system that uses MongoDB for data persistence. The application allows for student and admin registration, book borrowing and returning, and includes features like fine calculation for overdue books.

## Structure
- **index.html**: Main application interface for managing books and students
- **login.html**: Authentication page for students and admins
- **register.html**: Registration page for new students and admins
- **app.js**: Main application logic for the library management system
- **login.js**: Handles authentication logic
- **register.js**: Handles user registration logic
- **style.css**: Styling for the application
- **db.js**: MongoDB connection and database operations

## Language & Runtime
**Language**: JavaScript (ES6+)
**Runtime**: Node.js with Express for backend
**Database**: MongoDB
**UI Framework**: Vanilla JavaScript with HTML5 and CSS3

## Dependencies
**Backend**:
- Express.js: Web server framework
- MongoDB: Database
- Mongoose: MongoDB object modeling
- Body-parser: Request parsing middleware

**Frontend**:
- Browser APIs:
  - DOM manipulation for UI rendering
  - FormData for form handling
  - Dialog element for modals
  - Fetch API for server communication

## Features
**User Management**:
- Student and admin registration
- Authentication system with role-based access
- Student profile management

**Book Management**:
- Book listing with availability status
- Book borrowing and returning
- Due date tracking
- Automatic fine calculation for overdue books

**Data Persistence**:
- All data stored in MongoDB
- Data collections include:
  - Users (students)
  - Admins
  - Books
  - Borrowing records

## Usage
The application requires:
1. MongoDB running on localhost:27017
2. Node.js server to handle API requests
3. Browser to access the frontend

**Default Admin Credentials**:
- Username: admin
- Password: admin123

## Application Flow
1. Users register or login through the authentication pages
2. Students can browse available books and borrow them
3. Books have a 7-day loan period, after which fines are calculated
4. Admins can return books and see fine calculations
5. Student accounts are automatically linked to the borrowing system

## Database Structure
The application uses the following MongoDB collections:
- `students`: List of students for selection
- `books`: Book inventory with status
- `users`: Student user accounts
- `admins`: Admin user accounts