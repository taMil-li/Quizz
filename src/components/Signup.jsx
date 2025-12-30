import { Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import Cookies from 'js-cookie'
import "../App.css";
import { useState } from "react";

const form = {
  SUCCESS: "SUCCESS",
  PENDING: "PENDING",
  ERROR: "ERROR",
  INITIAL: "INITIAL",
};

const Signup = () => {
  const navigate = useNavigate();

  const jwt = Cookies.get("jwt_token")

  useEffect(() => {
    const verifyToken = async () => {
      if (jwt) {
        const resp = await fetch("https://quizz-backend-tadh.onrender.com/jwt/verify-token", {
          method: "GET",
          headers: { authorization: jwt },
        });

        const res = await resp.json();
        if (resp.ok && res.valid) {
          navigate("/login");
        }
      }
    };
    verifyToken();
  }, [jwt, navigate]);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [reenteredPassword, setReenteredPassword] = useState("");
  const [isStudent, setIsStudent] = useState(true);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState(form.INITIAL);

  const onChangeName = (event) => setName(event.target.value);
  const onChangeEmail = (event) => setEmail(event.target.value);
  const onChangePassword = (event) => setPassword(event.target.value);
  const onChangeReenteredPassword = (event) =>
    setReenteredPassword(event.target.value);
  const onChangeIsStudent = (event) =>
    setIsStudent(event.target.id === "student");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus(form.PENDING);
    if (password !== reenteredPassword) {
      setStatus(form.ERROR);
      setMessage("❌ Passwords do not match.");
      return;
    }
    setMessage("Loading...");
    const submitBtn = document.querySelector(".auth-submit");
    submitBtn.disabled = true;
    submitBtn.style.opacity = "0.7";

    const data = {
      name: name.trim(),
      email: email.trim(),
      password: password.trim(),
      isStudent: isStudent,
    };

    try {
      const options = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      };

      const resp = await fetch("https://quizz-backend-tadh.onrender.com/auth/signup", options);
      const res = await resp.json();
      if (resp.ok) {
        setStatus(form.SUCCESS);
        setMessage("✅ Account created. Redirecting to login...");
        setTimeout(() => navigate("/login"), 1000);
      } else {
        setStatus(form.ERROR);
        setMessage(`❌ Signup failed ${res.error || "Unknown error"}`);
      }
    } catch (err) {
      setStatus(form.ERROR);
      setMessage("❌ Network error. Please try again.");
    } finally {
      submitBtn.disabled = false;
      submitBtn.style.opacity = "1";
    }
  };

  return (
    <div className="authenticate">
      <div className="auth-page signup-page">
        <h2 className="auth-head">Create Your Account</h2>
        <form className="auth-form" onSubmit={handleSubmit}>
          <section className="radio-field">
            <input
              type="radio"
              id="student"
              className="radio-input"
              name="signupRole"
              onChange={onChangeIsStudent}
              checked={isStudent}
            />
            <label htmlFor="student" className="auth-label">
              Student
            </label>
            <input
              type="radio"
              id="admin"
              className="radio-input"
              name="signupRole"
              onChange={onChangeIsStudent}
              checked={!isStudent}
            />
            <label htmlFor="admin" className="auth-label">
              Admin
            </label>
          </section>
          <br />
          <label htmlFor="name" className="auth-label">
            Full Name
          </label>
          <input
            type="text"
            id="name"
            className="auth-input"
            onChange={onChangeName}
            value={name}
            required
          />

          <label htmlFor="email" className="auth-label">
            E-mail
          </label>
          <input
            type="email"
            id="email"
            className="auth-input"
            onChange={onChangeEmail}
            value={email}
            required
          />

          <label htmlFor="password" className="auth-label">
            Password
          </label>
          <input
            type="password"
            id="password"
            className="auth-input"
            onChange={onChangePassword}
            value={password}
            required
          />

          <label htmlFor="reenter_password" className="auth-label">
            Re-enter Password
          </label>
          <input
            type="password"
            id="reenter_password"
            className="auth-input"
            onChange={onChangeReenteredPassword}
            value={reenteredPassword}
            required
          />

          <button type="submit" className="auth-submit">
            Sign Up
          </button>
        </form>
        <p
          className={`message ${status === form.SUCCESS && "auth-success"} ${
            status === form.ERROR && "auth-error"
          }`}
        >
          {message}
        </p>
        <p className="auth-text">
          Already have an account?{" "}
          <Link to="/login" className="a">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
