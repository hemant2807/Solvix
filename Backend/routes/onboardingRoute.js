const express = require("express");
const router = express.Router();
const {
  completeOnboarding,
  updatePreferences,
  getPreferences,
  getUserStats
} = require("../controllers/onboardingController");

// Complete onboarding
router.post("/complete", completeOnboarding);

// Get user preferences
router.get("/preferences/:username", getPreferences);

// Update user preferences
router.put("/preferences/:username", updatePreferences);

// Get user stats (streak, totals, etc.)
router.get("/stats/:username", getUserStats);

module.exports = router;