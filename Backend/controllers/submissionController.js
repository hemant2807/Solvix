const Submission = require("../models/Submission");

const createSubmission = async (req, res) => {
  try {
    const {
      username,
      questionName,
      attempts,
      timeSpent,
      topics,
      difficulty,
      verdict,
      language,
      timeComplexity,
      spaceComplexity,
      code
    } = req.body;

    if (!username || !questionName || !code) {
      return res.status(400).json({
        error: "Username, question name, and code are required"
      });
    }

    const submittedAt = new Date();
    const submission = new Submission({
      username,
      questionName,
      attempts: attempts || 1,
      timeSpent: timeSpent || 0,
      topics: topics || [],
      difficulty,
      verdict,
      language,
      timeComplexity,
      spaceComplexity,
      code,
      submittedAt,
      month: `${submittedAt.getFullYear()}-${String(submittedAt.getMonth() + 1).padStart(2, '0')}`,
      year: submittedAt.getFullYear()
    });

    await submission.save();
    res.status(201).json(submission);
  } catch (error) {
    console.error("Error creating submission:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getUserSubmissions = async (req, res) => {
  try {
    const { username } = req.params;
    const { month } = req.query; // Optional filter by month (YYYY-MM)

    const filter = { username };
    if (month) {
      filter.month = month;
    }

    const submissions = await Submission.find(filter)
      .sort({ submittedAt: -1 })
      .lean();
    
    res.json(submissions);
  } catch (error) {
    console.error("Error fetching submissions:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getSubmissionStats = async (req, res) => {
  try {
    const { username } = req.params;
    const { month } = req.query;

    const matchFilter = { username };
    if (month) {
      matchFilter.month = month;
    }

    const stats = await Submission.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: null,
          totalSubmissions: { $sum: 1 },
          totalTime: { $sum: "$timeSpent" },
          avgTime: { $avg: "$timeSpent" },
          avgAttempts: { $avg: "$attempts" },
          allTopics: { $push: "$topics" }
        }
      }
    ]);

    const defaultStats = {
      totalSubmissions: 0,
      totalTime: 0,
      avgTime: 0,
      avgAttempts: 0,
      topicCounts: {}
    };

    if (!stats || stats.length === 0) {
      return res.json(defaultStats);
    }

    // Flatten topics and count
    const topicCounts = {};
    if (stats[0]?.allTopics) {
      stats[0].allTopics.flat().forEach(topic => {
        topicCounts[topic] = (topicCounts[topic] || 0) + 1;
      });
    }

    res.json({
      totalSubmissions: stats[0]?.totalSubmissions || 0,
      totalTime: stats[0]?.totalTime || 0,
      avgTime: stats[0]?.avgTime || 0,
      avgAttempts: stats[0]?.avgAttempts || 0,
      topicCounts
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getAvailableMonths = async (req, res) => {
  try {
    const { username } = req.params;
    
    const months = await Submission.distinct("month", { username });
    res.json(months.sort().reverse());
  } catch (error) {
    console.error("Error fetching months:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getHeatmapData = async (req, res) => {
  try {
    const { username } = req.params;
    const { month, year } = req.query;

    if (!username) {
      return res.status(400).json({ error: "Username is required" });
    }

    let rangeStart;
    let rangeEnd;

    if (month) {
      const [yearStr, monthStr] = month.split("-");
      const parsedYear = parseInt(yearStr, 10);
      const parsedMonth = parseInt(monthStr, 10);

      if (isNaN(parsedYear) || isNaN(parsedMonth)) {
        return res.status(400).json({ error: "Invalid month format. Use YYYY-MM." });
      }

      rangeStart = new Date(parsedYear, parsedMonth - 1, 1);
      rangeEnd = new Date(parsedYear, parsedMonth, 1);
    } else {
      const targetYear = parseInt(year, 10) || new Date().getFullYear();
      rangeStart = new Date(targetYear, 0, 1);
      rangeEnd = new Date(targetYear + 1, 0, 1);
    }

    const buckets = await Submission.aggregate([
      {
        $match: {
          username,
          submittedAt: { $gte: rangeStart, $lt: rangeEnd }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$submittedAt" }
          },
          count: { $sum: 1 },
          timeSpent: { $sum: "$timeSpent" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json(
      buckets.map((bucket) => ({
        date: bucket._id,
        count: bucket.count,
        timeSpent: bucket.timeSpent || 0
      }))
    );
  } catch (error) {
    console.error("Error fetching heatmap data:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getLeaderboard = async (req, res) => {
  try {
    // Parse and validate the `days` query param. Allowed: 7, 15, 30. Default: 7.
    const ALLOWED_DAYS = [7, 15, 30];
    const rawDays = parseInt(req.query.days, 10);
    const days = ALLOWED_DAYS.includes(rawDays) ? rawDays : 7;

    // Rolling window start date (calculated on the server so the client cannot tamper)
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const leaderboardPipeline = [
      // ── Step 1: Seed the pipeline with every registered user ──────────────────
      {
        $project: {
          _id: 0,
          username: "$username",
          avatar: { $ifNull: ["$avatar", ""] }
        }
      },
      // ── Step 2: Union with any username that has an Accepted sub (ever) ───────
      // This ensures users who solved something before the window but are not
      // yet registered (edge case) still get included; avatar defaults to "".
      {
        $unionWith: {
          coll: "submissions",
          pipeline: [
            {
              $match: {
                verdict: "Accepted",
                username: { $exists: true, $ne: "" }
              }
            },
            { $group: { _id: "$username" } },
            { $project: { _id: 0, username: "$_id", avatar: "" } }
          ]
        }
      },
      // ── Step 3: Deduplicate users, keeping the best (non-empty) avatar ────────
      {
        $group: {
          _id: "$username",
          avatar: { $max: "$avatar" }
        }
      },
      // ── Step 4: Lookup UNIQUE questions solved in the selected time window ────
      {
        $lookup: {
          from: "submissions",
          let: { uName: "$_id" },
          pipeline: [
            {
              // Filter: correct user + Accepted + within rolling window
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$username", "$$uName"] },
                    { $eq: ["$verdict", "Accepted"] },
                    { $gte: ["$submittedAt", startDate] }
                  ]
                }
              }
            },
            {
              // Deduplicate by questionName → each unique question counted once
              $group: {
                _id: "$questionName",
                difficulty: { $first: "$difficulty" }
              }
            }
          ],
          as: "solvedQuestions"
        }
      },
      // ── Step 5: Project counts ─────────────────────────────────────────────────
      {
        $project: {
          _id: 0,
          username: "$_id",
          avatar: { $ifNull: ["$avatar", ""] },
          solved: { $size: "$solvedQuestions" },
          hard: {
            $size: {
              $filter: {
                input: "$solvedQuestions",
                as: "q",
                cond: { $eq: ["$$q.difficulty", "Hard"] }
              }
            }
          },
          medium: {
            $size: {
              $filter: {
                input: "$solvedQuestions",
                as: "q",
                cond: { $eq: ["$$q.difficulty", "Medium"] }
              }
            }
          },
          easy: {
            $size: {
              $filter: {
                input: "$solvedQuestions",
                as: "q",
                cond: { $eq: ["$$q.difficulty", "Easy"] }
              }
            }
          }
        }
      },
      // ── Step 6: Sort by ranking priority ─────────────────────────────────────
      {
        $sort: {
          solved: -1,
          hard: -1,
          medium: -1,
          easy: -1,
          username: 1
        }
      }
    ];

    const User = require("../models/User");
    const results = await User.aggregate(leaderboardPipeline);

    const ranked = results.map((item, index) => ({
      rank: index + 1,
      username: item.username,
      avatar: item.avatar || "",
      solved: item.solved || 0,
      hard: item.hard || 0,
      medium: item.medium || 0,
      easy: item.easy || 0
    }));

    res.json(ranked);
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  createSubmission,
  getUserSubmissions,
  getSubmissionStats,
  getAvailableMonths,
  getHeatmapData,
  getLeaderboard
};