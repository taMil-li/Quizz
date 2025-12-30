// models/Exam.js
import mongoose from "mongoose";

const examSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    sno: {
      type: Number,
      required: true
    },
    quizList: [
      {
        question: {
          type: String,
          required: true
        },
        optionA: {
          type: String,
          required: true
        },
        optionB: {
          type: String,
          required: true
        },
        optionC: {
          type: String,
          required: true
        },
        optionD: {
          type: String,
          required: true
        },
        correctOption: {
          type: String,
          enum: ["A", "B", "C", "D"],
          required: true
        }
      }
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true
    }
  },
  { timestamps: true }
);

// preventing duplicate sno
examSchema.index({ createdBy: 1, sno: 1 }, { unique: true });

export const Exam = mongoose.model("Exam", examSchema);
