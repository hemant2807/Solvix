const Session = require("../models/Session");
const User = require("../models/User");

const setQuestionVerdict = async (req, res) => {
  try {
    const { sessionId, questionId } = req.params;
    const { verdict, timeSpent, attempts } = req.body;

    const session = await Session.findById(sessionId);
    if (!session) return res.status(404).json({ error: "Session not found" });

    const question = session.questions.id(questionId);
    if (!question) return res.status(404).json({ error: "Question not found" });

    // Only mark as completed if verdict is Accepted
    if (verdict === "Accepted") {
      question.completed = true;
      question.timeSpent = timeSpent || 0;
      question.attempts = attempts || question.attempts;
      session.completedQuestions = session.questions.filter(q => q.completed).length;
      await session.save();
    }

    res.json(session);
  } catch (error) {
    console.error("Error setting question verdict:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Create a new session
const createSession = async (req, res) => {
  try {
    const { name, questions, username } = req.body;
    
    if (!name || !questions || !username) {
      return res.status(400).json({ 
        error: "Session name, questions, and username are required" 
      });
    }

    // Verify user exists
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Validate questions
    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ error: "At least one question is required" });
    }

    for (const question of questions) {
      if (!question.name || !question.leetcodeUrl || !question.difficulty) {
        return res.status(400).json({ 
          error: "Each question must have name, leetcodeUrl, and difficulty" 
        });
      }
    }

    const session = new Session({
      name,
      sessionName: name,
      username,
      email: user.email,
      questions: questions.map(q => ({
        name: q.name,
        leetcodeUrl: q.leetcodeUrl,
        difficulty: q.difficulty,
        completed: false,
        timeSpent: 0,
        attempts: 0
      }))
    });

    await session.save();
    res.status(201).json(session);
  } catch (error) {
    console.error("Error creating session:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get all sessions for a user
const getUserSessions = async (req, res) => {
  try {
    const { username } = req.params;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit, 10) || 5, 25);
    
    if (!username) {
      return res.status(400).json({ error: "Username is required" });
    }

    const [sessions, total] = await Promise.all([
      Session.find({ username })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Session.countDocuments({ username })
    ]);

    const payload = {
      sessions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
        hasMore: page * limit < total
      }
    };
    
    if (req.query.page || req.query.limit) {
      return res.json(payload);
    }

    res.json(sessions);
  } catch (error) {
    console.error("Error fetching sessions:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get a specific session
const getSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }
    
    res.json(session);
  } catch (error) {
    console.error("Error fetching session:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Start a session
const startSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    session.isActive = true;
    session.startedAt = new Date();
    await session.save();
    
    res.json(session);
  } catch (error) {
    console.error("Error starting session:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Mark a question as completed
const completeQuestion = async (req, res) => {
  try {
    const { sessionId, questionId } = req.params;
    const { timeSpent, attempts } = req.body;
    
    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    const question = session.questions.id(questionId);
    if (!question) {
      return res.status(404).json({ error: "Question not found" });
    }

    // Only mark as completed if it wasn't already completed
    if (!question.completed) {
      question.completed = true;
      question.timeSpent = timeSpent || 5;
      question.attempts = attempts || question.attempts;
      
      // Update session completed questions count
      session.completedQuestions = session.questions.filter(q => q.completed).length;
      
      await session.save();
      console.log(`Question "${question.name}" completed: timeSpent=${timeSpent}ms, attempts=${question.attempts}`);
    } else {
      // Update timeSpent even if already completed (in case it wasn't set before)
      if (timeSpent && timeSpent > 0 && (!question.timeSpent || question.timeSpent === 0)) {
        question.timeSpent = timeSpent;
        await session.save();
        console.log(`Updated timeSpent for already completed question "${question.name}": ${timeSpent}ms`);
      }
    }
    
    res.json(session);
  } catch (error) {
    console.error("Error completing question:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Update question attempts
const updateQuestionAttempts = async (req, res) => {
  try {
    const { sessionId, questionId } = req.params;
    const { attempts } = req.body;
    
    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    const question = session.questions.id(questionId);
    if (!question) {
      return res.status(404).json({ error: "Question not found" });
    }

    question.attempts = attempts;
    await session.save();
    
    res.json(session);
  } catch (error) {
    console.error("Error updating question attempts:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Finish a session
const finishSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { totalTimeSpent } = req.body;
    
    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    session.isActive = false;
    session.finishedAt = new Date();
    session.totalTimeSpent = totalTimeSpent || 0;
    session.completedQuestions = session.questions.filter(q => q.completed).length;
    
    await session.save();

    // TODO: Email notification logic will go here in a future commit

    res.json(session);
  } catch (error) {
    console.error("Error finishing session:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Delete a session
const deleteSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const session = await Session.findByIdAndDelete(sessionId);
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }
    
    res.json({ message: "Session deleted successfully" });
  } catch (error) {
    console.error("Error deleting session:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get session statistics for a user
const getSessionStats = async (req, res) => {
  try {
    const { username } = req.params;
    
    const stats = await Session.aggregate([
      { $match: { username } },
      {
        $group: {
          _id: null,
          totalSessions: { $sum: 1 },
          completedSessions: {
            $sum: {
              $cond: [
                { $eq: ["$completedQuestions", { $size: "$questions" }] },
                1,
                0
              ]
            }
          },
          totalQuestionsAttempted: { $sum: { $size: "$questions" } },
          totalQuestionsCompleted: { $sum: "$completedQuestions" },
          totalTimeSpent: { $sum: "$totalTimeSpent" },
          avgTimePerSession: { $avg: "$totalTimeSpent" }
        }
      }
    ]);

    const result = stats[0] || {
      totalSessions: 0,
      completedSessions: 0,
      totalQuestionsAttempted: 0,
      totalQuestionsCompleted: 0,
      totalTimeSpent: 0,
      avgTimePerSession: 0
    };

    res.json(result);
  } catch (error) {
    console.error("Error fetching session stats:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
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
};