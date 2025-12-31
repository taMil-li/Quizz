# Quizz — Modern Quiz Platform ✅

A lightweight, extensible quiz application built with **React (Vite)** for the frontend and **Node.js (Express)** + **MongoDB** for the backend. This project supports role-based authentication (Admin / Student), secure password hashing, JWT-based sessions, exam creation, attempt tracking, and automatic scoring.

---

## ✨ Key Features

- Role-based authentication (Admins and Students)
- Create and manage exams (Admins)
- Start, submit, and score exams (Students)
- Per-user dashboards with progress and stats
- Secure password hashing using worker threads
- JWT authentication for API protection
- Clean, component-driven React frontend (Vite) and a lightweight Express API

---

## 🔗 Live

The application is deployed and available at: https://quizz-6.netlify.app/

---

## 🧭 Architecture Overview

- Frontend: React + Vite, located at the project root (scripts in `package.json`).
- Backend: Express API in `backend/` (routes in `backend/index.js`).
- Database: MongoDB (native driver) with collections for `Admin`, `Student`, `Exam`, and `ExamAttempt`.

---

## 🚀 Quick Start (Local Development)

### Prerequisites

- Node.js (v18+ recommended)
- npm or yarn
- A running MongoDB instance (local or cloud)

### 1) Clone the repo

```bash
git clone <your-repo-url>
cd quizz
```

### 2) Backend — install & run

```bash
cd backend
npm install
# Create a .env file (see example below)
npm run start
```

The backend listens on `PORT` (default `5000`).

### 3) Frontend — install & run

From the project root:

```bash
npm install
npm run dev
```

The frontend dev server runs on `5173` by default (Vite). Visit `http://localhost:5173`.

---

## ⚙️ Environment Variables

Create a `backend/.env` file with the following variables (example):

```
MONGODB_URI=mongodb://localhost:27017
DB_NAME=QuizApp
JWT_SECRET=your_strong_secret_here
PORT=5000
```

> Note: The server will refuse to start if `MONGODB_URI` is missing. For production, set a strong `JWT_SECRET`.

---

## 📋 Available Scripts

Frontend (project root):

- `npm run dev` — start Vite dev server
- `npm run build` — build production assets
- `npm run preview` — preview the build
- `npm run lint` — run ESLint
- `npm run start` — serve built assets (via `serve`)

Backend (`backend/`):

- `npm run start` — start the server (uses `nodemon` in development)

---

## 🔌 API Overview

All endpoints that require authentication expect an `Authorization: Bearer <token>` header.

- POST `/auth/signup` — Create a new user (body: `{ name, email, password, isStudent }`).
- POST `/auth/login` — Authenticate and receive `{ jwt_token }` (body: `{ email, password, isStudent }`).
- GET `/jwt/verify-token` — Verify a JWT token.
- POST `/create-exam` — **Admin only** — Create an exam (`{ name, quizList }`).
- GET `/exam/:examId` — Get exam questions (hides correct answers).
- POST `/start-exam/:examId` — **Student only** — Start an attempt (creates `ExamAttempt`).
- POST `/submit-exam/:attemptId` — **Student only** — Submit answers and get score.
- GET `/attempt/:examId` — Get a student's current attempt for an exam.
- GET `/dashboard/admin` — **Admin only** — Get stats for exams created by the admin.
- GET `/dashboard/student` — **Student only** — Get student's attempts, status, and scores.

---

## 🗂 Data Models (Summary)

- Exam: `{ name, quizList[], createdBy, createdAt }`
- ExamAttempt: `{ exam, student, answers, score, submittedAt }`
- Student / Admin: `{ name, email, password(hashed), createdAt }`

---

## 🔒 Security Notes

- Passwords are hashed using `bcrypt` in a worker thread to keep the main event loop responsive.
- JWT is used for authentication — keep `JWT_SECRET` secure and rotate it for production.
- The API enforces role checks (admin vs student) for restricted endpoints.

---

## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a pull request with a clear description of your changes. Keep changes small and focused — add tests when applicable.

---

## 📄 License

This project is provided under the MIT License — see `LICENSE` or add one if needed.

---

## 💬 Contact

If you have questions or need help, open an issue in this repository.

Thank you for using **Quizz** — a fast, simple platform to build and take quizzes. 🎉
