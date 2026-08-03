const User = require("../models/User");

// Complete onboarding and save preferences
const completeOnboarding = async (req, res) => {
  try {
    const { username, email, preferences } = req.body;

    if (!username) {
      return res.status(400).json({ error: "Username is required" });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Update user with onboarding data
    if (email) {
      user.email = email;
    }

    if (preferences) {
      // Practice reminders
      if (preferences.practiceReminders) {
        user.preferences.practiceReminders.enabled = preferences.practiceReminders.enabled || false;
        user.preferences.practiceReminders.frequency = preferences.practiceReminders.frequency || 'daily';
        user.preferences.practiceReminders.time = preferences.practiceReminders.time || '09:00';
        user.preferences.practiceReminders.timezone = preferences.practiceReminders.timezone || 'UTC';
      }

      // Email notifications
      if (preferences.emailNotifications) {
        user.preferences.emailNotifications.sessionSummary = 
          preferences.emailNotifications.sessionSummary !== undefined 
            ? preferences.emailNotifications.sessionSummary 
            : true;
        user.preferences.emailNotifications.weeklyReport = 
          preferences.emailNotifications.weeklyReport || false;
        user.preferences.emailNotifications.milestones = 
          preferences.emailNotifications.milestones !== undefined
            ? preferences.emailNotifications.milestones
            : true;
      }

      // Goals
      if (preferences.goals) {
        user.preferences.goals.dailyQuestions = preferences.goals.dailyQuestions || 2;
        user.preferences.goals.weeklyQuestions = preferences.goals.weeklyQuestions || 10;
        user.preferences.goals.focusTopics = preferences.goals.focusTopics || [];
      }
    }

    user.onboardingCompleted = true;
    await user.save();

    res.json({ 
      success: true, 
      user,
      message: "Onboarding completed successfully"
    });
  } catch (error) {
    console.error("Error completing onboarding:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Update user preferences
const updatePreferences = async (req, res) => {
  try {
    const { username } = req.params;
    const { preferences } = req.body;

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Update preferences
    if (preferences.practiceReminders) {
      Object.assign(user.preferences.practiceReminders, preferences.practiceReminders);
    }

    if (preferences.emailNotifications) {
      Object.assign(user.preferences.emailNotifications, preferences.emailNotifications);
    }

    if (preferences.goals) {
      Object.assign(user.preferences.goals, preferences.goals);
    }

    await user.save();

    res.json({ 
      success: true, 
      user,
      message: "Preferences updated successfully"
    });
  } catch (error) {
    console.error("Error updating preferences:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get user preferences
const getPreferences = async (req, res) => {
  try {
    const { username } = req.params;

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ 
      success: true, 
      preferences: user.preferences,
      onboardingCompleted: user.onboardingCompleted
    });
  } catch (error) {
    console.error("Error fetching preferences:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get user streak and stats
const getUserStats = async (req, res) => {
  try {
    const { username } = req.params;

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ 
      success: true, 
      streak: user.streak,
      stats: user.stats
    });
  } catch (error) {
    console.error("Error fetching user stats:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Update user stats after session completion
const updateUserStatsAfterSession = async (username, session) => {
  try {
    const user = await User.findOne({ username });
    if (!user) return;

    // Update total sessions
    user.stats.totalSessions += 1;

    // Update total time spent
    user.stats.totalTimeSpent += session.totalTimeSpent || 0;

    // Update questions completed by difficulty
    for (const question of session.questions) {
      if (question.completed) {
        user.stats.totalQuestions += 1;
        
        switch (question.difficulty) {
          case 'Easy':
            user.stats.easyCompleted += 1;
            break;
          case 'Medium':
            user.stats.mediumCompleted += 1;
            break;
          case 'Hard':
            user.stats.hardCompleted += 1;
            break;
        }
      }
    }

    // Update streak
    const completedCount = session.questions.filter(q => q.completed).length;
    if (completedCount > 0) {
      user.updateStreak(completedCount);
    }

    await user.save();
  } catch (error) {
    console.error("Error updating user stats:", error);
  }
};

module.exports = {
  completeOnboarding,
  updatePreferences,
  getPreferences,
  getUserStats,
  updateUserStatsAfterSession
};