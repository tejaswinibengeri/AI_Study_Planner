# AI Study Planner 📚

A full-stack web application designed to help students automatically generate a study schedule based on their subjects, exam dates, difficulty levels, and available daily study hours.

## Requirements

- **Node.js**: Ensure Node.js is installed on your machine.
- **MySQL**: A running MySQL server is required.

---

## 🚀 Setup Instructions

### 1. Database Setup (MySQL)
1. Open your MySQL client (e.g., MySQL Workbench, phpMyAdmin, or terminal).
2. Copy the contents of `database.sql` and run the script in your MySQL environment.
   - This will create the database `ai_study_planner` and the three required tables (`Users`, `Subjects`, `Study_Plan`).

### 2. Backend Setup
1. Open a terminal and navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Install the required Node.js dependencies:
   ```bash
   npm install
   ```
3. Update the `.env` file inside the `backend` folder to match your MySQL database credentials if they differ from the defaults (Default: user=root, password=empty):
   ```env
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   ```
4. Start the backend server:
   ```bash
   npm start
   ```
   *The server should now be running on `http://localhost:5000`.*

### 3. Frontend Setup
1. Because the frontend uses vanilla HTML/CSS/JS with fetch API requests, you can simply open the `index.html` file located in the `frontend` directory in any modern web browser.
2. For the best experience, you can serve it via a simple live server like VSCode Live Server. 

---

## 🎨 Features
- **Registration & Login**: Secure JWT-based authentication.
- **Add Subjects**: Log your upcoming exams, their dates, and difficulty levels.
- **Generate AI Plan**: Enter your daily available hours and let the algorithm calculate a daily task breakdown for each subject based on its difficulty up until the exam date.
- **Progress Tracking**: Track your completion percentage directly on the beautiful dashboard.

## 💻 Tech Stack
- Frontend: HTML5, CSS3, Vanilla JavaScript (Single Page Application design).
- Backend: Node.js, Express.js.
- Database: MySQL (mysql2 connector).
- Security: bcryptjs for hashing, jsonwebtoken for session management.
