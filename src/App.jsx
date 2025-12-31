import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Header from "./components/Header.jsx";
import Home from "./components/Home.jsx";
import AdminDashboard from "./components/AdminDashboard.jsx";
import StudentDashboard from "./components/StudentDashboard.jsx";
import WriteExam from "./components/WriteExam.jsx";
import { AuthProvider } from "./contexts/AuthContext.jsx";

import Login from "./components/Login.jsx";
import Signup from './components/Signup.jsx'

import "./App.css";

function App() {
  return (
    <div className="site-container">
      <AuthProvider>
        <BrowserRouter>
          <Header />
          <Routes>
            <Route exact path="/login" element={<Login />} />
            <Route excat path="/signup" element={<Signup />} />
            <Route exact path="/" element={<Home />} />
            <Route path="/dashboard/admin" element={<AdminDashboard />} />
            <Route path="/dashboard/student" element={<StudentDashboard />} />
            <Route path="/exam/write/:examId" element={<WriteExam />} />
            <Route path="*" element={<Navigate to='/' replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </div>
  );
}

export default App;
