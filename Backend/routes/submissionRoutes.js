const express = require("express");
const router = express.Router();
const {
  createSubmission,
  getUserSubmissions,
  getSubmissionStats,
  getAvailableMonths,
  getHeatmapData,
  getLeaderboard
} = require("../controllers/submissionController");

router.post("/", createSubmission);
router.get("/leaderboard", getLeaderboard);
router.get("/user/:username", getUserSubmissions);
router.get("/user/:username/stats", getSubmissionStats);
router.get("/user/:username/months", getAvailableMonths);
router.get("/user/:username/heatmap", getHeatmapData);

module.exports = router;