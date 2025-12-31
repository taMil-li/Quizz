import { useState, useEffect, useRef } from "react";
import { MdContentCopy } from "react-icons/md";
import { IoCheckmarkDoneSharp } from "react-icons/io5";
import { BsPlusLg } from "react-icons/bs";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";

import "../App.css";
// import RenderCreatedQuiz from "./RenderCreatedQuiz.jsx";
import AddQuiz from "./AddQuiz.jsx";
import Loader from "./Loader.jsx";

const apiStatus = {
  SUCCESS: "SUCCESS",
  PENDING: "PENDING",
  FAILED: "FAILED",
  INITIAL: "INITIAL",
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const jwt = Cookies.get("jwt_token");

  const [quizList, setQuizList] = useState([]);
  const [isWorking, setIsWorking] = useState(false);
  const [workingInSno, setWorkingInSno] = useState(1);
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
        getExams();
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

  const getExams = async () => {
    try {
      const options = {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`,
        },
      };
      const resp = await fetch(
        "https://quizz-backend-tadh.onrender.com/dashboard/admin",
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

  const createNew = () => {
    let name;
    while (!name) {
      name = prompt("Name of the exam");
      if (name === null) return;
    }

    const newExam = {
      sno: quizList.length + 1,
      name: name,
      quizList: [],
      // server fields (filled after successful creation)
      createdBy: null,
      createdAt: null,
      updatedAt: null,
      examId: null,
    };

    setWorkingInSno(quizList.length + 1);
    setQuizList([...quizList, newExam]);
    setIsWorking(true);
  };

  const getCurrentQuizList = () => {
    if (!quizList || quizList.length === 0) return [];
    if (workingInSno === quizList.length) {
      return quizList[quizList.length - 1].quizList || [];
    } else {
      const index = quizList.findIndex((each) => each.sno === workingInSno);
      return index === -1 ? [] : quizList[index].quizList || [];
    }
  };

  const addQuiz = (quiz) => {
    // Assign sno to the question based on current quiz length
    const updatedQuizList = quizList.map((q) => {
      if (q.sno === workingInSno) {
        const nextSno =
          q.quizList && q.quizList.length ? q.quizList.length + 1 : 1;
        const questionWithSno = { ...quiz, sno: nextSno };
        return {
          ...q,
          quizList: [...(q.quizList || []), questionWithSno],
        };
      }
      return q;
    });

    setQuizList(updatedQuizList);
  };

  const finishCreation = async () => {
    const index = quizList.findIndex((q) => q.sno === workingInSno);
    if (index === -1) return alert("No exam found to finish");

    const currentExam = quizList[index];

    if (
      !Array.isArray(currentExam.quizList) ||
      currentExam.quizList.length === 0
    )
      return alert("Quiz list is empty");

    for (const q of currentExam.quizList) {
      if (
        typeof q.sno !== "number" ||
        !q.question ||
        !q.optionA ||
        !q.optionB ||
        !q.optionC ||
        !q.optionD ||
        !q.correctOption
      ) {
        return alert(
          "Each question must have sno, question, options A-D and correctOption"
        );
      }
    }

    // console.log(quizList);

    try {
      const resp = await fetch("https://quizz-backend-tadh.onrender.com/create-exam", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify({
          name: currentExam.name,
          quizList: currentExam.quizList,
        }),
      });

      const data = await resp.json();
      if (resp.ok) {
        const updatedExam = {
          ...currentExam,
          examId: data.examId,
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString(),
        };

        const updatedQuizList = [...quizList];
        updatedQuizList[index] = updatedExam;
        setQuizList(updatedQuizList);
        setIsWorking(false);
        getExams();
        alert("Exam created successfully");
      } else {
        alert(data.error || "Failed to create exam");
      }
    } catch (err) {
      console.error("CREATE EXAM ERROR 👉", err);
      alert("Server error, try again later");
    }
  };

  const timersRef = useRef({});
  const [copiedMap, setCopiedMap] = useState({});

 const copyUrl = async (examId) => {
  const examUrl = `${window.location.origin}/exam/write/${examId}`;

  setCopiedMap((prev) => ({ ...prev, [examId]: true }));

  if (timersRef.current[examId]) clearTimeout(timersRef.current[examId]);

  try {
    await navigator.clipboard.writeText(examUrl);

    timersRef.current[examId] = setTimeout(() => {
      setCopiedMap((prev) => ({ ...prev, [examId]: false }));
      delete timersRef.current[examId];
    }, 2000);
  } catch (err) {
    console.error("Clipboard copy failed", err);
    setCopiedMap((prev) => ({ ...prev, [examId]: false }));
    alert("Failed to copy URL");
  }
};

  useEffect(() => {
    return () => {
      // clear timers on unmount
      Object.values(timersRef.current).forEach((t) => clearTimeout(t));
      timersRef.current = {};
    };
  }, []);

  console.log(data)

  return (
    <>
      {status === apiStatus.PENDING && <Loader />}
      {status === apiStatus.SUCCESS && (
        <main className="create-quiz-page main">
          {!isWorking ? (
            <>
              <section className="overall-details d-flex">
                {user && user.name && <small>Welcome, {user.name}</small>}
                <div className="overall-card">
                  <p className="overall-text-p">Total Exams</p>
                  <h4 className="overall-text-h4">{data.dashboard.length}</h4>
                </div>
                <div className="overall-card">
                  <p className="overall-text-p">Total Attended</p>
                  <h4 className="overall-text-h4">
                    {data.dashboard.reduce(
                      (acc, each) => each.totalAttended + acc,
                      0
                    )}
                  </h4>
                </div>
              </section>
              <section className="exams-section">
                <h1 className="exams-head">Exams</h1>
                {
                  data.dashboard.length === 0 ? <div className="no-exams">
                    <p>Create your first exam</p>
                    <button
                    className="create-quiz"
                    type="button"
                    style={{position: 'relative', marginTop: '1rem'}}
                    onClick={createNew}
                  >
                    <BsPlusLg className="create-quiz-btn" />
                  </button>
                  </div> : null
                }
                { data.dashboard.length > 0 &&
                  <ul type="none" className="exams d-flex flex-column">
                  {data.dashboard.map((each) => (
                    <li
                      className="exam-item d-flex flex-column"
                      key={each.examId}
                    >
                      <h4 className="exam-name">{each.name}</h4>
                      <h6 className="total-questions">
                        Total Questions: {each.totalQuestions}
                      </h6>
                      <h6 className="exam-url d-flex align-center">Copy shareable URL{'  '}
                        {!copiedMap[each.examId] ? (
                          <button
                            type="button"
                            className="copy-button"
                            title="Copy URL"
                            onClick={() => copyUrl(each.examId)}
                          >
                            <MdContentCopy className="copy-icon" />
                          </button>
                        ) : (
                          <IoCheckmarkDoneSharp className="copied-icon" />
                        )}
                      </h6>
                      <h6 className="total-attended">
                        Total Attended: {each.totalAttended}
                      </h6>
                    </li>
                  ))}
                </ul>}
              </section>
              <section className="workspace">
                {!isWorking && data.dashboard.length > 0 && (
                  <button
                    className="create-quiz"
                    type="button"
                    onClick={createNew}
                  >
                    <BsPlusLg className="create-quiz-btn" />
                  </button>
                )}
              </section>
            </>
          ) : (
            <section className="workspace">
              {isWorking && (
                <AddQuiz
                  sno={workingInSno}
                  currQuizList={getCurrentQuizList()}
                  addQuiz={addQuiz}
                  finishCreation={finishCreation}
                />
              )}
            </section>
          )}
        </main>
      )}
    </>
  );
};

export default AdminDashboard;
