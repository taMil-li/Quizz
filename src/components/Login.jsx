import { Link, useNavigate } from "react-router-dom";
import Cookies from 'js-cookie'
import "../App.css";
import { useState, useEffect, useContext } from "react";

import AuthContext from "../contexts/AuthContext.jsx";

const form = {
  SUCCESS: "SUCCESS",
  PENDING: "PENDING",
  ERROR: "ERROR",
  INITIAL: "INITIAL",
};

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isStudent, setIsStudent] = useState(true);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState(form.INITIAL);

  const jwt = Cookies.get("jwt_token");

  const navigate = useNavigate();
  const { setUser } = useContext(AuthContext);
  // Cookies.remove('jwt_token')

  useEffect(() => {
    const verifyToken = async () => {
      if (jwt) {
        const resp = await fetch("http://localhost:5000/jwt/verify-token", {
          method: "GET",
          headers: { authorization: jwt },
        });

        const res = await resp.json();
        if (resp.ok && res.valid) {
          setUser(res.user);
          navigate("/");
        }
      }
    };
    verifyToken();
  }, [jwt, navigate]);

  const onChangeEmail = (event) => setEmail(event.target.value);
  const onChangePassword = (event) => setPassword(event.target.value);
  const onChangeIsStudent = (event) =>
    setIsStudent(event.target.id === "student");

  const handleSubmit = async (event) => {
    event.preventDefault();
    const submitBtn = document.querySelector(".auth-submit");

    setStatus(form.PENDING);
    setMessage("Loading...");

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.style.opacity = "0.7";
    }

    const data = {
      email: email.trim(),
      password: password.trim(),
      isStudent: isStudent,
    };

    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    };
    try {
      const resp = await fetch("http://localhost:5000/auth/login", options);
      const res = await resp.json();

      if (resp.ok && res.jwt_token) {
        setStatus(form.SUCCESS);
        setMessage("Login successful redirecting...");
        Cookies.set("jwt_token", res.jwt_token, {
          expires: 1,
        });

        // Set the authenticated user in context for global access
        if (res.user) setUser(res.user);
        // console.log(res.user)
        navigate("/");
      } else {
        submitBtn.disabled = false;
        submitBtn.style.opacity = "1";
        setStatus(form.ERROR);
        setMessage(res.error || "Error logging in, Try again...");
      }
    } catch (err) {
      submitBtn.disabled = false;
      submitBtn.style.opacity = '1';
      setStatus(form.ERROR);
      setMessage("Error logging in, Try again...");

      setTimeout(()=> {
        setMessage("");
        console.log(err)
      }, 5000);
    } 
  };

  return (
      <div className="authenticate">
        <div className="auth-page login-page">
          <h2 className="auth-head">Login to Your Account</h2>
          <form className="auth-form" onSubmit={handleSubmit}>
            <section className="radio-field">
              <input
                type="radio"
                id="student"
                className="radio-input"
                name="loginRole"
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
                name="loginRole"
                onChange={onChangeIsStudent}
                checked={!isStudent}
              />
              <label htmlFor="admin" className="auth-label">
                Admin
              </label>
            </section>
            <br />
            <label htmlFor="email" className="auth-label">
              E-mail
            </label>
            <input
              type="email"
              id="email"
              className="auth-input"
              value={email}
              onChange={onChangeEmail}
              required
            />

            <label htmlFor="password" className="auth-label">
              Password
            </label>
            <input
              type="password"
              id="password"
              className="auth-input"
              value={password}
              onChange={onChangePassword}
              required
            />

            <button type="submit" className="auth-submit">
              Login
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
            Don’t have an account?{" "}
            <Link to="/signup" className="a">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
  );
};

export default Login;
