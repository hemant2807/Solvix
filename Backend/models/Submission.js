
const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, index: true },
    questionName: { type: String, required: true },
    attempts: { type: Number, required: true },
    timeSpent: { type: Number, required: true }, // in seconds
    topics: [{ type: String }], // Array of algorithm topics
    difficulty: { type: String, enum: ["Easy", "Medium", "Hard"] },
    verdict: { type: String }, // e.g. "Accepted", "Wrong Answer"
    language: { type: String },
    timeComplexity: { type: String },
    spaceComplexity: { type: String },
    code: { type: String, required: true },
    submittedAt: { type: Date, default: Date.now },
    month: { type: String }, // Format: "YYYY-MM" for easy filtering
    year: { type: Number }
  },
  { timestamps: true }
);

submissionSchema.index({ username: 1, submittedAt: -1 });
submissionSchema.index({ username: 1, month: 1 });

module.exports = mongoose.model("Submission", submissionSchema);