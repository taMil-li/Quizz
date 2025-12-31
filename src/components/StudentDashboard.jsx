import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import viewIcon from "../assets/link-3801.png";

import "../App.css";

import Loader from "./Loader.jsx";

const apiStatus = {
  SUCCESS: "SUCCESS",
  PENDING: "PENDING",
  FAILED: "FAILED",
  INITIAL: "INITIAL",
};

const StudentDashboard = () => {
  const navigate = useNavigate();
  const jwt = Cookies.get("jwt_token");

  const [status, setStatus] = useState(apiStatus.INITIAL);
  const [data, setData] = useState({});
  const [loggedIn, setLoggedIn] = useState(false);

  let user = localStorage.getItem("user");

  useEffect(() => {
    setStatus(apiStatus.PENDING);
    const verifyToken = async () => {
      if (!jwt || jwt === undefined) navigate("/login");
      else {
        const resp = await fetch("https://quizz-backend-tadh.onrender.com/jwt/verify-token", {
          method: "GET",
          headers: { authorization: jwt },
        });

        const res = await resp.json();
        if (!(resp.ok && res.valid)) {
          navigate("/login");
        }
        getStudentData();
      }
    };

    verifyToken();
    try {
      if (user) {
        user = JSON.parse(user);
        setLoggedIn(true);
      } else {
        user = {
          email: null,
          name: null,
          isStudent: null,
        };
        setLoggedIn(false);
      }
    } catch (err) {
      user = {
        email: null,
        name: null,
        isStudent: null,
      };
      setLoggedIn(false);
    }

    const handleUnload = (event) => {
      event.preventDefault();
      event.returnValue =
        "Are you sure you want to leave? Your changes may not be saved?";
    };

    window.addEventListener("beforeunload", handleUnload);

    return () => {
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, [jwt, navigate]);

  const getStudentData = async () => {
    try {
      const options = {
        method: "GET",
        headers: {
          Authorization: `Bearer ${jwt}`,
          "Content-Type": "application/json",
        },
      };

      const resp = await fetch(
        "https://quizz-backend-tadh.onrender.com/dashboard/student",
        options
      );
      const res = await resp.json();

      if (resp.ok) {
        console.log(res);
        setData(res);
        setStatus(apiStatus.SUCCESS);
      } else {
        setStatus(apiStatus.FAILED);
      }
    } catch (err) {
      setStatus(apiStatus.FAILED);
    }
  };

  if (status === apiStatus.PENDING) {
    return <Loader />;
  }

  const { dashboard, student } = data;

  return (
    <main className="student-dashboard-main">
      {status === apiStatus.SUCCESS && (
        <>
          <section className="overall-details d-flex">
            <div className="overall-card">
              <p className="overall-text-p">Total Exams Attended</p>
              <h4 className="overall-text-h4">{dashboard.length}</h4>
            </div>
          </section>
          <section className="exams-section d-flex flex-column">
            <h1>Exams</h1>
            {dashboard && dashboard.length > 0 ? (
              <ul type="none" className="exams d-flex flex-column">
                {dashboard.map((exam) => (
                  <li key={exam.examId} className="exam-item d-flex">
                    <div className="left-part d-flex flex-column">
                      <strong>{exam.name}</strong>
                      <h6 className="total-questions">
                        Total Questions: {exam.totalQuestions}
                      </h6>
                      <h5 className="total-score">Score: {exam.score}</h5>
                    </div>
                    <div className="right-part d-flex flex-column">
                      {exam.status !== "SUBMITTED" && (
                        <a
                          className="view-exam-text"
                          href={`/exam/write/${exam.examId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Write <img className="view-icon" src={viewIcon} alt="view icon" />
                        </a>
                      )}

                      <h6 className={`status ${exam.status === "SUBMITTED"? "submitted": "not-submitted"}`}>
                        {exam.status}
                      </h6>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="no-exams">You have not attended any exams yet.</p>
            )}
          </section>
        </>
      )}
      {status === apiStatus.FAILED && (
        <div>
          <h2 className="no-exams">
            Failed to load dashboard data. Please try again later.
          </h2>
        </div>
      )}
    </main>
  );
};

export default StudentDashboard;
