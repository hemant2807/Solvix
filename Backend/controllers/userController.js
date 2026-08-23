const User = require("../models/User");

const createOrGetUser = async (req, res) => {
  try {
    const { username, avatar, ranking, email, timezone } = req.body;

    if (!username) {
      return res.status(400).json({ success: false, error: "Username is required" });
    }

    let user = await User.findOne({ username });

    if (!user) {
      user = new User({
        username,
        avatar,
        ranking,
        email,
        timezone: timezone || "UTC"
      });
    } else {
      if (avatar) user.avatar = avatar;
      if (typeof ranking === "number") user.ranking = ranking;
      if (email) user.email = email;
      if (timezone) user.timezone = timezone;
    }

    await user.save();

    res.cookie("isLoggedIn", true, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000
    });

    return res.json({ success: true, user });
  } catch (err) {
    console.error("createOrGetUser error:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

const saveOnboardingDetails = async (req, res) => {
  try {
    const { username } = req.params;
    const {
      email,
      timezone,
      dailyTarget,
      experienceLevel,
      motivation,
      focusTopics = [],
      allowMonthlyEmails = true,
      allowSessionEmails = true
    } = req.body;

    if (!username) {
      return res.status(400).json({ error: "Username is required" });
    }

    const user = await User.findOneAndUpdate(
      { username },
      {
        $set: {
          email,
          timezone: timezone || "UTC",
          "preferences.goals.dailyQuestions": dailyTarget || 1,
          "preferences.goals.focusTopics": focusTopics,
          "preferences.emailNotifications.monthlyReport": allowMonthlyEmails,
          "preferences.emailNotifications.sessionSummary": allowSessionEmails,
          onboarding: {
            completed: true,
            completedAt: new Date(),
            experienceLevel,
            motivation,
            dailyTarget,
            focusTopics
          }
        },
        $setOnInsert: {
          username
        }
      },
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      user
    });
  } catch (err) {
    console.error("saveOnboardingDetails error:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

const getOnboardingDetails = async (req, res) => {
  try {
    const { username } = req.params;
    if (!username) {
      return res.status(400).json({ error: "Username is required" });
    }

    const user = await User.findOne({ username }).lean();
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      completed: user.onboarding?.completed ?? false,
      experienceLevel: user.onboarding?.experienceLevel || "",
      motivation: user.onboarding?.motivation || "",
      dailyTarget: user.onboarding?.dailyTarget || user.preferences?.goals?.dailyQuestions || 1,
      focusTopics: user.onboarding?.focusTopics || user.preferences?.goals?.focusTopics || [],
      email: user.email || "",
      timezone: user.timezone || "UTC",
      allowMonthlyEmails: user.preferences?.emailNotifications?.monthlyReport ?? true,
      allowSessionEmails: user.preferences?.emailNotifications?.sessionSummary ?? true
    });
  } catch (err) {
    console.error("getOnboardingDetails error:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

const updateDailyReportSettings = async (req, res) => {
  try {
    const { username } = req.params;
    const { enabled, email } = req.body;

    if (!username) {
      return res.status(400).json({ error: "Username is required" });
    }

    if (enabled && email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: "Invalid email format" });
      }
    }

    const user = await User.findOneAndUpdate(
      { username },
      {
        $set: {
          "dailyReport.enabled": enabled ?? false,
          "dailyReport.email": email || undefined,
          "preferences.emailNotifications.dailyProgressReport": enabled ?? false
        }
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ success: true, user });
  } catch (err) {
    console.error("updateDailyReportSettings error:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

const getDailyReportSettings = async (req, res) => {
  try {
    const { username } = req.params;
    if (!username) {
      return res.status(400).json({ error: "Username is required" });
    }

    const user = await User.findOne({ username }).lean();
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      enabled: user.dailyReport?.enabled ?? false,
      email: user.dailyReport?.email ?? "",
      lastSentDate: user.dailyReport?.lastSentDate ?? null
    });
  } catch (err) {
    console.error("getDailyReportSettings error:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

module.exports = {
  createOrGetUser,
  saveOnboardingDetails,
  getOnboardingDetails,
  updateDailyReportSettings,
  getDailyReportSettings
};