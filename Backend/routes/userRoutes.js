const express = require("express");
const {
  createOrGetUser,
  saveOnboardingDetails,
  getOnboardingDetails,
  updateDailyReportSettings,
  getDailyReportSettings
} = require("../controllers/userController");

const router = express.Router();

// POST /api/users/create-or-get
router.post("/create-or-get", createOrGetUser);
router.post("/:username/onboarding", saveOnboardingDetails);
router.get("/:username/onboarding", getOnboardingDetails);
router.post("/:username/daily-report", updateDailyReportSettings);
router.get("/:username/daily-report", getDailyReportSettings);

module.exports = router;