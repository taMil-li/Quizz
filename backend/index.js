const express = require("express");
const cors = require("cors");
const { MongoClient, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
const { Worker, workerData } = require("worker_threads");
const path = require("path");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const mongoUri = process.env.MONGODB_URI;
const mongoDbName = process.env.DB_NAME || "QuizApp";

let mongoClient = null;
let studentCollection = null;
let adminCollection = null;
let examCollection = null;
let examAttemptCollection = null;

const ITER_COUNT = 12;

// Helper Functions

const initMongo = async () => {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();

  db = client.db(process.env.DB_NAME);

  studentCollection = db.collection("Student");
  adminCollection = db.collection("Admin");
  examCollection = db.collection("Exam");
  examAttemptCollection = db.collection("ExamAttempt");

  // indexes (IMPORTANT)
  try {
    const indexes = await examCollection.indexes();
    const oldIdx = indexes.find(
      (idx) => idx.key && ((idx.key.createdBy === 1 && idx.key.sno === 1) || (idx.key.createdBy === 1 && idx.key.name === 1)) && idx.unique
    );
    if (oldIdx && oldIdx.name) {
      try {
        await examCollection.dropIndex(oldIdx.name);
        console.log(`Dropped old unique index ${oldIdx.name} on Exam collection`);
      } catch (dropErr) {
        console.warn('Failed to drop old unique index', dropErr);
      }
    }
  } catch (err) {
    console.warn('Error checking/dropping old exam indexes', err);
  }

  // Create a non-unique compound index for querying by admin and name (non-unique)
  await examCollection.createIndex({ createdBy: 1, name: 1 });

  await examAttemptCollection.createIndex(
    { exam: 1, student: 1 },
    { unique: true }
  );

  console.log("Mongo Native connected + indexes ready");
}

const validateData = (data) => {
  const { name, email, password, isStudent } = data;

  if (!name || typeof name !== "string" || name.length < 2)
    return "Invalid name";
  if (!email || typeof email !== "string" || !email.includes("@"))
    return "Invalid email";
  if (!password || typeof password !== "string" || password.length < 8)
    return "Password must be at least 8 characters";
  if (typeof isStudent !== "boolean")
    return "Please Choose your role correctly";
  return null;
};

const getUserFromToken = async (req) => {
  const { email, isStudent } = req.user;

  return isStudent
    ? await studentCollection.findOne({ email })
    : await adminCollection.findOne({ email });
};


// middleware 

const jwtAuthenticate = (req, res, next) => {
    const jwtToken = req.headers['authorization'];
    if(!jwtToken) 
      return res.status(401).json({ error: "Unauthorized"});

    let token = jwtToken.split(" ")[1];

    if(!token) 
      return res.status(401).json({ error: "Unauthorized"});

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if(err) return res.status(401).json({ error: "Unauthorized"});
      req.user = decoded;
      // console.log(decoded)
      next();
    })
}

// REST APIs

// verify jwt token
app.get("/jwt/verify-token", (req, res) => {
  const token = req.headers["authorization"];
  if (!token) {
    return res.status(401).json({ valid: false });
  }
  
  jwt.verify(token, process.env.JWT_SECRET || "jwt_secret", (err, decoded) => {
    if (err) return res.status(401).json({ valid: false });
    res.status(200).json({ valid: true, user: {email: decoded.email, isStudent: decoded.isStudent, name: decoded.name} });
  });
});


//Login
app.post("/auth/login", async (req, res) => {
  if (!req.body || typeof req.body !== "object") {
    return res.status(400).json({ error: "No login data received." });
  }

  const { email, password, isStudent } = req.body;

  let exist;

  if (isStudent) {
    exist = await studentCollection.findOne({ email });
    if (!exist) {
      return res.status(401).json({ error: "Email not exists." });
    }
  } else {
    exist = await adminCollection.findOne({ email });
    if (!exist) {
      return res.status(401).json({ error: "Email not exists." });
    }
  }

  const worker = new Worker(path.join(__dirname, "worker.js"));

  worker.postMessage({
    workerData: {
      password: password,
      hashedPassword: exist.password,
      work: "compare password",
    },
  });

  worker.on("message", (data) => {
    // console.log(data);
    if (!data.passwordMatch) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const payload = {
      email: exist.email,
      isStudent: isStudent,
      name: exist.name
    };

    const jwtToken = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "24h",
    });

    res.status(200).json({
      message: "Login Successful",
      success: true,
      jwt_token: jwtToken,
      user: {
        name: exist.name,
        email: exist.email,
        isStudent: isStudent,
      }
    });
    worker.terminate()
  });

  worker.on("error", (err) => {
    console.log("Something went wrong!");
  });

  worker.on("exit", () => {
    console.log("Work Completed by worker.");
  });
  
});

// Signup
app.post("/auth/signup", async (req, res) => {
  if (!req.body || typeof req.body !== "object")
    return res.status(400).json({ error: "No signup data received." });

  const { name, email, password, isStudent } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: "Missing required signup data." });

  const validationError = validateData(req.body);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  if (isStudent) {
    const exist = await studentCollection.findOne({ email });
    if (exist) {
      return res.status(400).json({ error: "Email already exists." });
    }
  } else {
    const exist = await adminCollection.findOne({ email });
    if (exist) {
      return res.status(400).json({ error: "Email already exists." });
    }
  }

  const worker = new Worker(path.join(__dirname, "worker.js"));

  let hashedPassword = null;
  worker.postMessage({
    workerData: { password, ITER_COUNT, work: "hash password" },
  });

  worker.on("message", async (data) => {
    hashedPassword = data.hashedPassword;
    // res.status(200).json({ hashedPassword })
    if (isStudent) {
      await studentCollection.insertOne({
        name,
        email,
        password: hashedPassword,
        createdAt: new Date(),
      });
    } else {
      await adminCollection.insertOne({
        name,
        email,
        password: hashedPassword,
        createdAt: new Date(),
      });
    }

    res.status(201).json({
      message: "Account Created Successfully",
      success: true,
    });
    worker.terminate()
  });

  worker.on("error", (err) => {
    console.log("Something went wrong!");
  });

  worker.on("exit", () => {
    console.log("Work Completed by worker.");
  });
});

// create exam
app.post("/create-exam", jwtAuthenticate, async (req, res) => {
  try {
    if (req.user.isStudent) {
      return res.status(403).json({ error: "Admin only" });
    }

    const admin = await getUserFromToken(req);
    if (!admin) {
      return res.status(401).json({ error: "Admin not found" });
    }

    const { name, quizList } = req.body;

    if (!name || !Array.isArray(quizList) || quizList.length === 0) {
      return res.status(400).json({ error: "Invalid data" });
    }

    // Validate each question has its own sno and complete data
    const seenSnos = new Set();
    for (const q of quizList) {
      if (
        typeof q.sno !== "number" ||
        !Number.isInteger(q.sno) ||
        q.sno < 1 ||
        !q.question ||
        !q.optionA ||
        !q.optionB ||
        !q.optionC ||
        !q.optionD ||
        !q.correctOption
      ) {
        return res.status(400).json({
          error: "Each question must have a numeric sno (>=1) and complete data"
        });
      }

      if (seenSnos.has(q.sno)) {
        return res.status(400).json({ error: "Duplicate question sno found" });
      }
      seenSnos.add(q.sno);
    }

    const exam = {
      name,
      quizList,
      createdBy: admin._id,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await examCollection.insertOne(exam);

    res.status(201).json({
      message: "Exam created",
      examId: result.insertedId
    });

  } catch (err) {
    console.error("CREATE EXAM ERROR 👉", err);
    res.status(500).json({ error: "Server error" });
  }
});


// Exam Attempt 
app.post("/start-exam/:examId", jwtAuthenticate, async (req, res) => {
  try {
    if (!req.user.isStudent) {
      return res.status(403).json({ error: "Students only" });
    }

    const student = await getUserFromToken(req);

    const attempt = {
      exam: new ObjectId(req.params.examId),
      student: student._id,
      score: 0,
      createdAt: new Date()
    };

    const result = await examAttemptCollection.insertOne(attempt);

    res.status(201).json({
      message: "Exam started",
      attemptId: result.insertedId
    });

  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: "Already started" });
    }
    res.status(500).json({ error: "Server error" });
  }
});


// Submit Exam
app.post("/submit-exam/:attemptId", jwtAuthenticate, async (req, res) => {
  try {
    if (!req.user.isStudent) {
      return res.status(403).json({ error: "Students only" });
    }

    const student = await getUserFromToken(req);
    const { answers } = req.body;

    const attempt = await examAttemptCollection.findOne({
      _id: new ObjectId(req.params.attemptId),
      student: student._id
    });

    if (!attempt) {
      return res.status(404).json({ error: "Attempt not found" });
    }

    if (attempt.submittedAt) {
      return res.status(400).json({ error: "Already submitted" });
    }

    const exam = await examCollection.findOne({
      _id: attempt.exam
    });

    let score = 0;
    exam.quizList.forEach(q => {
      const submitted = answers.find(a => a.question === q.question);
      if (submitted && submitted.selectedOption === q.correctOption) {
        score++;
      }
    });

    await examAttemptCollection.updateOne(
      { _id: attempt._id },
      {
        $set: {
          answers,
          score,
          submittedAt: new Date()
        }
      }
    );

    res.json({
      message: "Exam submitted",
      score,
      totalQuestions: exam.quizList.length
    });

  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Get attempt for an exam (student's current attempt)
app.get("/attempt/:examId", jwtAuthenticate, async (req, res) => {
  try {
    if (!req.user.isStudent) {
      return res.status(403).json({ error: "Students only" });
    }

    const student = await getUserFromToken(req);

    const attempt = await examAttemptCollection.findOne({
      exam: new ObjectId(req.params.examId),
      student: student._id
    });

    if (!attempt) {
      return res.status(404).json({ error: "Attempt not found" });
    }

    res.json({
      attemptId: attempt._id,
      score: attempt.score || 0,
      submittedAt: attempt.submittedAt || null,
      answers: attempt.answers || []
    });

  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Get questions
app.get("/exam/:examId", jwtAuthenticate, async (req, res) => {
  try {
    const { examId } = req.params;

    // Validation
    if (!ObjectId.isValid(examId)) {
      return res.status(400).json({ error: "Invalid examId" });
    }

    // If student -> check submission status
    if (req.user.isStudent) {
      const student = await getUserFromToken(req);

      if (!student) {
        return res.status(401).json({ error: "Only students can access exams." });
      }

      const attempt = await examAttemptCollection.findOne({
        exam: new ObjectId(examId),
        student: student._id
      });

      // Stop if already submitted
      if (attempt && attempt.submittedAt) {
        return res.status(403).json({
          error: "Exam already submitted. Access denied."
        });
      }
    }

    // Fetching exam
    const exam = await examCollection.findOne({
      _id: new ObjectId(examId)
    });

    if (!exam) {
      return res.status(404).json({ error: "Exam not found" });
    }

    // Not Sending correctOption
    const safeQuizList = exam.quizList.map(q => ({
      _id: q._id,
      question: q.question,
      optionA: q.optionA,
      optionB: q.optionB,
      optionC: q.optionC,
      optionD: q.optionD
    }));


    res.json({
      examId: exam._id,
      name: exam.name,
      sno: exam.sno,
      totalQuestions: safeQuizList.length,
      quizList: safeQuizList
    });

  } catch (err) {
    console.error("GET EXAM ERROR ", err);
    res.status(500).json({ error: "Server error" });
  }
});


// Admin Dashboard Info
app.get("/dashboard/admin", jwtAuthenticate, async (req, res) => { 
  // have to change this to '/dashboard/admin'
  try {
    const admin = await getUserFromToken(req);

    if (!admin || admin.isStudent) {
      return res.status(403).json({ error: "Admin only route" });
    }

    // Find all exams created by this admin
    const exams = await examCollection.find({ createdBy: admin._id }).toArray();

    // For each exam, calculate attendance and average score
    const dashboard = await Promise.all(
      exams.map(async exam => {
        const attempts = await examAttemptCollection.find({ exam: exam._id }).toArray();

        const totalAttended = attempts.length;
        const averageScore =
          attempts.length > 0
            ? attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length
            : 0;

        return {
          examId: exam._id,
          name: exam.name,
          // sno: exam.sno,
          totalQuestions: exam.quizList.length,
          totalAttended,
          averageScore: averageScore.toFixed(2)
        };
      })
    );

    res.json({
      admin: { name: admin.name, email: admin.email },
      dashboard
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Student Dashboard Info
app.get("/dashboard/student", jwtAuthenticate, async (req, res) => {
  try {
    // 1️⃣ Allow only students
    if (!req.user.isStudent) {
      return res.status(403).json({ error: "Student only route" });
    }

    // 2️⃣ Get student from token
    const student = await getUserFromToken(req);
    if (!student) {
      return res.status(401).json({ error: "Student not found" });
    }

    // 3️⃣ Get all attempts of this student
    const attempts = await examAttemptCollection
      .find({ student: student._id })
      .toArray();

    // 4️⃣ Collect examIds
    const examIds = attempts.map(a => a.exam);

    // 5️⃣ Fetch corresponding exams
    const exams = examIds.length
      ? await examCollection
          .find({ _id: { $in: examIds } })
          .toArray()
      : [];

    // 6️⃣ Build dashboard response
    const dashboard = exams.map(exam => {
      const attempt = attempts.find(
        a => a.exam.toString() === exam._id.toString()
      );

      let status = "NOT_STARTED";
      if (attempt) {
        status = attempt.submittedAt ? "SUBMITTED" : "IN_PROGRESS";
      }

      return {
        examId: exam._id,
        name: exam.name,
        totalQuestions: exam.quizList.length,
        status,
        score: attempt && attempt.submittedAt ? attempt.score : null,
        submittedAt: attempt ? attempt.submittedAt || null : null
      };
    });

    res.json({
      student: {
        name: student.name,
        email: student.email
      },
      dashboard
    });

  } catch (err) {
    console.error("STUDENT DASHBOARD ERROR 👉", err);
    res.status(500).json({ error: "Server error" });
  }
});

// testing 

app.post("/test/insert-exam-attempt", async (req, res) => {
  try {
    const result = await examAttemptCollection.insertOne({
      exam: new ObjectId(req.body.examId),
      student: new ObjectId(req.body.studentId),
      answers: req.body.answers || [],
      score: req.body.score || 0,
      createdAt: new Date(),
      submittedAt: req.body.submittedAt ? new Date(req.body.submittedAt) : null
    });

    res.json({
      message: "ExamAttempt inserted",
      attemptId: result.insertedId
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Insert failed" });
  }
});


(async () => {
  try {
    await initMongo();
    const port = process.env.PORT || 5000;
    app.listen(port, () => {
      console.log("Server running on port:", port);
    });
  } catch (err) {
    console.error("Failed to start server:", err.message);
    process.exit(1);
  }
})();
