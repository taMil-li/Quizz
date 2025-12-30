import { useState } from "react";

import "../App.css";

const AddQuiz = (props) => {
  const { addQuiz, finishCreation } = props;
  let { currQuizList } = props;

  // const [quiz, setQuiz] = useState([]);
  const [question, setQuestion] = useState("");
  const [optA, setOptA] = useState("");
  const [optB, setOptB] = useState("");
  const [optC, setOptC] = useState("");
  const [optD, setOptD] = useState("");
  const [crtOption, setCrtOption] = useState("A"); // default

  const updateQuestion = (event) => {
    setQuestion(event.target.value);
  };

  const updateOptA = (event) => {
    setOptA(event.target.value);
  };

  const updateOptB = (event) => {
    setOptB(event.target.value);
  };

  const updateOptC = (event) => {
    setOptC(event.target.value);
  };

  const updateOptD = (event) => {
    setOptD(event.target.value);
  };

  const updateCrtOption = (event) => {
    setCrtOption(event.target.value);
  };

  const updateQuizList = (event) => {
    event.preventDefault();

    const newQuestion = {
      question: question,
      optionA: optA,
      optionB: optB,
      optionC: optC,
      optionD: optD,
      correctOption: crtOption,
    };

    addQuiz(newQuestion);

    setCrtOption("A");
    setOptA("");
    setOptB("");
    setOptC("");
    setOptD("");
    setQuestion("");
  };

  const finish = () => {
    finishCreation();
  };

  return (
    <div className="add-quiz-page">
      <form onSubmit={updateQuizList} className="form">
        <label className="label" htmlFor="question">
          {currQuizList.length + 1}. Question
        </label>
        <br />
        <input
          className="question"
          type="text"
          id="question"
          onChange={updateQuestion}
          value={question}
          required
        />
        <br />
        <div className="option-list">
          <div className="option">
            <input
              className="option-A radio"
              type="radio"
              value="A"
              name="option"
              onChange={updateCrtOption}
              checked={crtOption === 'A'}
            />
            <input
              className="option-A option-text"
              type="text"
              placeholder="Option A"
              onChange={updateOptA}
              value={optA}
              required
            />
          </div>
          <div className="option">
            <input
              className="option-B radio"
              type="radio"
              value="B"
              name="option"
              onChange={updateCrtOption}
              checked={crtOption === 'B'}
            />
            <input
              className="option-B option-text"
              type="text"
              placeholder="Option B"
              onChange={updateOptB}
              value={optB}
              required
            />
          </div>
          <div className="option">
            <input
              className="option-C radio"
              type="radio"
              value="C"
              name="option"
              onChange={updateCrtOption}
              checked={crtOption === 'C'}
            />
            <input
              className="option-C option-text"
              type="text"
              placeholder="Option C"
              onChange={updateOptC}
              value={optC}
              required
            />
          </div>
          <div className="option">
            <input
              className="option-D radio"
              type="radio"
              value="D"
              name="option"
              onChange={updateCrtOption}
              checked={crtOption === 'D'}
            />
            <input
              className="option-D option-text"
              type="text"
              placeholder="Option D"
              onChange={updateOptD}
              value={optD}
              required
            />
          </div>
        </div>
        <div className="button-box">
          <button className="add-btn" type="submit">
            Add
          </button>
          <div className="finish-creation-btn">
            <button className="finish-btn" type="button" onClick={finish}>
              Finish
            </button>
            {/* Operation has not been written yet to finish button */}
          </div>
        </div>
      </form>
    </div>
  );
};

export default AddQuiz;
