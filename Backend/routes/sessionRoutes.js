const express = require("express");
const router = express.Router();
const {
  createSession,
  getUserSessions,
  getSession,
  startSession,
  completeQuestion,
  updateQuestionAttempts,
  finishSession,
  deleteSession,
  getSessionStats,
  setQuestionVerdict
} = require("../controllers/sessionController");

// Create a new session
router.post("/", createSession);

// Get all sessions for a user
router.get("/user/:username", getUserSessions);

// Get session statistics for a user
router.get("/user/:username/stats", getSessionStats);

// Get a specific session
router.get("/:sessionId", getSession);

// Start a session
router.put("/:sessionId/start", startSession);

// Mark a question as completed
router.post("/:sessionId/questions/:questionId/complete", completeQuestion);

// Update question attempts
router.put("/:sessionId/questions/:questionId/attempts", updateQuestionAttempts);

// Finish a session
router.post("/:sessionId/finish", finishSession);

// Delete a session
router.delete("/:sessionId", deleteSession);

router.post("/:sessionId/questions/:questionId/verdict", setQuestionVerdict);

module.exports = router;