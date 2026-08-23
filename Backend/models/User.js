
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    avatar: { type: String },
    ranking: { type: Number },
    email: { type: String },
    timezone: { type: String, default: "UTC" },
    preferences: {
      practiceReminders: {
        enabled: { type: Boolean, default: false },
        time: { type: String, default: "09:00" }
      },
      goals: {
        dailyQuestions: { type: Number, default: 1 },
        focusTopics: { type: [String], default: [] }
      },
      emailNotifications: {
        weeklyReport: { type: Boolean, default: false },
        monthlyReport: { type: Boolean, default: true },
        sessionSummary: { type: Boolean, default: true },
        dailyProgressReport: { type: Boolean, default: false }
      }
    },
    dailyReport: {
      enabled: { type: Boolean, default: false },
      email: { type: String },
      lastSentDate: { type: Date }
    },
    github: {
      connected: { type: Boolean, default: false },
      accessToken: { type: String }, // Encrypted in production
      username: { type: String },
      repo: { type: String },
      branch: { type: String, default: "main" }
    },
    streak: {
      current: { type: Number, default: 0 },
      lastActivityDate: { type: Date }
    },
    stats: {
      totalQuestions: { type: Number, default: 0 }
    },
    onboarding: {
      completed: { type: Boolean, default: false },
      completedAt: { type: Date },
      experienceLevel: { type: String },
      motivation: { type: String },
      dailyTarget: { type: Number },
      focusTopics: { type: [String], default: [] }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);