
const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  leetcodeUrl: { type: String, required: true },
  difficulty: { 
    type: String, 
    enum: ['Easy', 'Medium', 'Hard'], 
    required: true 
  },
  completed: { type: Boolean, default: false },
  timeSpent: { type: Number, default: 0 }, // in milliseconds
  attempts: { type: Number, default: 0 }
});

const sessionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    username: { type: String, required: true },
    email: { type: String }, // Add this field
    sessionName: { type: String }, // Add this field (could be same as 'name')
    questions: [questionSchema],
    totalTimeSpent: { type: Number, default: 0 }, // in milliseconds
    completedQuestions: { type: Number, default: 0 },
    isActive: { type: Boolean, default: false },
    startedAt: { type: Date },
    finishedAt: { type: Date }
  },
  { timestamps: true }
);

// Index for efficient queries
sessionSchema.index({ username: 1, createdAt: -1 });

module.exports = mongoose.model("Session", sessionSchema);