// models/ExamAttempt.js
import mongoose from "mongoose";

const examAttemptSchema = new mongoose.Schema(
  {
    exam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exam",
      required: true
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true
    },
    answers: [
      {
        question: String,
        selectedOption: String
      }
    ],
    score: {
      type: Number,
      default: 0
    },
    submittedAt: Date
  },
  { timestamps: true }
);

// preventing multiple attempts
examAttemptSchema.index({ exam: 1, student: 1 }, { unique: true });

export const ExamAttempt = mongoose.model("ExamAttempt", examAttemptSchema);
