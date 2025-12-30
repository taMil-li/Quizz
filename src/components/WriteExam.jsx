import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import Loader from "./Loader.jsx";
import "../App.css";

const WriteExam = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const jwt = Cookies.get("jwt_token");

  const [loading, setLoading] = useState(true);
  const [exam, setExam] = useState(null);
  const [answers, setAnswers] = useState([]); // { question, selectedOption }
  const [attemptId, setAttemptId] = useState(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!jwt) return navigate("/login");

    const fetchExam = async () => {
      try {
        const resp = await fetch(`https://quizz-backend-tadh.onrender.com/exam/${examId}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${jwt}`, 
            "Content-Type": "application/json" 
          },
        });

        const data = await resp.json();

        if (resp.status === 403) {
          // Already submitted or access denied
          alert(data.error || "Access denied");
          return navigate("/dashboard/student");
        }

        if (!resp.ok) {
          alert(data.error || "Failed to fetch exam");
          return navigate("/dashboard/student");
        }

        setExam(data);
        setLoading(false);
      } catch (err) {
        console.error(err);
        alert("Server error. Try later.");
        navigate("/dashboard/student");
      }
    };

    fetchExam();
  }, [examId, jwt, navigate]);

  const handleStart = async () => {
    if (!jwt) return navigate("/login");
    try {
      const resp = await fetch(`https://quizz-backend-tadh.onrender.com/start-exam/${examId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${jwt}`, "Content-Type": "application/json" },
      });

      const data = await resp.json();

      if (resp.ok) {
        setAttemptId(data.attemptId);
        setStarted(true);
        // initialize answers array with empty selections
        const initialAnswers = (exam.quizList || []).map((q) => ({ question: q.question, selectedOption: null }));
        setAnswers(initialAnswers);
      } else {
        if (data.error === "Already started") {
          // recover attempt id
          const r = await fetch(`https://quizz-backend-tadh.onrender.com/attempt/${examId}`, {
            method: "GET",
            headers: { Authorization: `Bearer ${jwt}`, "Content-Type": "application/json" },
          });
          const dd = await r.json();
          if (r.ok) {
            setAttemptId(dd.attemptId);
            setStarted(true);
            const initialAnswers = (exam.quizList || []).map((q) => ({ question: q.question, selectedOption: null }));
            // overlay any previously saved answers
            (dd.answers || []).forEach((a) => {
              const idx = initialAnswers.findIndex(i => i.question === a.question);
              if (idx !== -1) initialAnswers[idx].selectedOption = a.selectedOption;
            });
            setAnswers(initialAnswers);
          } else {
            alert(dd.error || "Unable to start/retrieve attempt");
          }
        } else {
          alert(data.error || "Failed to start exam");
        }
      }
    } catch (err) {
      console.error(err);
      alert("Server error");
    }
  };

  const handleSelect = (question, selectedOption) => {
    setAnswers((prev) => {
      const copy = prev.map((a) => (a.question === question ? { ...a, selectedOption } : a));
      return copy;
    });
  };

  const handleSubmit = async () => {
    if (!attemptId) return alert("Please start the exam first");
    try {
      const resp = await fetch(`https://quizz-backend-tadh.onrender.com/submit-exam/${attemptId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${jwt}`, "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });

      const data = await resp.json();

      if (resp.ok) {
        alert(`Exam submitted. Score: ${data.score}/${data.totalQuestions}`);
        navigate("/dashboard/student");
      } else {
        alert(data.error || "Failed to submit exam");
      }
    } catch (err) {
      console.error(err);
      alert("Server error. Try again later.");
    }
  };

  if (loading) return <Loader />;

  return (
    <main className="add-quiz-page main">
      <section className="form">
        <h2 className="label">{exam.name}</h2>
        <div className="d-flex" style={{justifyContent: 'flex-end'}}>
            <button className="finish-btn" type="button" onClick={handleStart} disabled={started}>
                {started ? "Started" : "Start Exam"}
            </button>
        </div>
        <div className="questions d-flex flex-column">
        {(exam.quizList || []).map((q, idx) => (
          <div key={idx} className="question">
            <p className="label">{idx + 1}. {q.question}</p>

            <div className="option d-flex">
              <label style={{ width: "10%" }}>
                <input
                  type="radio"
                  className="radio-input"
                  name={`q-${idx}`}
                  checked={answers[idx] && answers[idx].selectedOption === "A"}
                  onChange={() => handleSelect(q.question, "A")}
                  disabled={!started}
                />
              </label>
              <p className="option-text">A. {q.optionA}</p>
            </div>

            <div className="option d-flex">
              <label style={{ width: "10%" }}>
                <input
                  type="radio"
                  className="radio-input"
                  name={`q-${idx}`}
                  checked={answers[idx] && answers[idx].selectedOption === "B"}
                  onChange={() => handleSelect(q.question, "B")}
                  disabled={!started}
                />
              </label>
              <p className="option-text">B. {q.optionB}</p>
            </div>

            <div className="option d-flex">
              <label style={{ width: "10%" }}>
                <input
                  type="radio"
                  className="radio-input"
                  name={`q-${idx}`}
                  checked={answers[idx] && answers[idx].selectedOption === "C"}
                  onChange={() => handleSelect(q.question, "C")}
                  disabled={!started}
                />
              </label>
              <p className="option-text">C. {q.optionC}</p>
            </div>

            <div className="option d-flex">
              <label style={{ width: "10%" }}>
                <input
                  type="radio"
                  className="radio-input"
                  name={`q-${idx}`}
                  checked={answers[idx] && answers[idx].selectedOption === "D"}
                  onChange={() => handleSelect(q.question, "D")}
                  disabled={!started}
                />
              </label>
              <p className="option-text">D. {q.optionD}</p>
            </div>

          </div>
        ))}
        </div>
        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "16px" }}>

          <button className="finish-btn" type="button" onClick={handleSubmit} disabled={!started}>
            Submit Exam
          </button>
        </div>
      </section>
    </main>
  );
};

export default WriteExam;