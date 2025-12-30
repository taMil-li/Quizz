import { Link } from "react-router-dom"
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useContext } from "react";
import Cookies from "js-cookie";
import "../App.css";

import AuthContext, { AuthProvider } from "../contexts/AuthContext";
// Cookies.remove('jwt_token')
// localStorage.removeItem('user')

const Home = () => {
  const navigate = useNavigate();
  const jwt = Cookies.get("jwt_token");

  const { setUser } = useContext(AuthContext);

  const rawUser = (() => {
    try {
      return localStorage.getItem("user");
    } catch (e) {
      return null;
    }
  })();

  const [userObj, setUserObj] = useState(() => {
    try {
      return rawUser ? JSON.parse(rawUser) : null;
    } catch (e) {
      return null;
    }
  });

  const [loggedIn, setLoggedIn] = useState(!!jwt || !!userObj);

  useEffect(() => {
    const verifyToken = async () => {
      if (!jwt) return;
      try {
        const resp = await fetch("http://localhost:5000/jwt/verify-token", {
          method: "GET",
          headers: { authorization: jwt },
        });

        const res = await resp.json();
        if (resp.ok && res.valid) {
          setLoggedIn(true);
          if (setUser) setUser(res.user);
          setUserObj(res.user || userObj);
        } else {
          setLoggedIn(false);
          setUserObj(null);
          localStorage.removeItem("user");
        }
      } catch (err) {
        setLoggedIn(false);
      }
    };

    verifyToken();

    const handleUnload = (event) => {
      event.preventDefault();
      event.returnValue =
        "Are you sure you want to leave? Your changes may not be saved?";
    };

    window.addEventListener("beforeunload", handleUnload);

    return () => {
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, [jwt, navigate, setUser, userObj]);

  return (
    <main className="home-page main">
      <section className="landing">
        <h1 className="landing-title">Create Fun, Fast Quizzes — Learn & Compete</h1>
        <p className="landing-desc">
          Build and take interactive quizzes in seconds. Track scores, challenge friends, and
          sharpen your skills with bite-sized practice. Perfect for classrooms, study groups,
          or quick self-checks.
        </p>
        <div className="call-to-action">
          { !loggedIn && <Link to="/signup" className="btn btn-primary">Get Started{'>'}</Link>}
          { userObj && userObj.isStudent === true && <Link to="/dashboard/student" className="btn btn-primary">Go to Dashboard{'>'}</Link>}
          { userObj && userObj.isStudent === false && <Link to="/dashboard/admin" className="btn btn-primary">Go to Dashboard{'>'}</Link>  }
        </div>
      </section>
    </main>
  );
};

export default Home;
