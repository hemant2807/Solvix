// Backend/routes/leetcodeRoutes.js
const express = require("express");
const router = express.Router();
const {
  fetchLeetCodeUserProfile,
  fetchRecentSubmissions,
  fetchContestRanking,
  fetchLanguageStats,
  fetchProblemsByTopic,
  fetchCalendarData,
  getComprehensiveUserStats
} = require("../services/leetcodeAPI");

// Get comprehensive user statistics
router.get("/stats/:username", async (req, res) => {
  try {
    const { username } = req.params;
    const stats = await getComprehensiveUserStats(username);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user profile
router.get("/profile/:username", async (req, res) => {
  try {
    const { username } = req.params;
    const profile = await fetchLeetCodeUserProfile(username);
    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get recent submissions
router.get("/submissions/:username", async (req, res) => {
  try {
    const { username } = req.params;
    const limit = parseInt(req.query.limit) || 20;
    const submissions = await fetchRecentSubmissions(username, limit);
    res.json(submissions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get contest ranking
router.get("/contest-ranking/:username", async (req, res) => {
  try {
    const { username } = req.params;
    const ranking = await fetchContestRanking(username);
    res.json(ranking);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get language statistics
router.get("/languages/:username", async (req, res) => {
  try {
    const { username } = req.params;
    const stats = await fetchLanguageStats(username);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get problems by topic
router.get("/topics/:username", async (req, res) => {
  try {
    const { username } = req.params;
    const topics = await fetchProblemsByTopic(username);
    res.json(topics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get calendar/heatmap data
router.get("/calendar/:username", async (req, res) => {
  try {
    const { username } = req.params;
    const calendar = await fetchCalendarData(username);
    res.json(calendar);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;