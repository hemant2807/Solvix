const cron = require("node-cron");
const User = require("../models/User");
const Submission = require("../models/Submission");
const { sendMonthlyDigestEmail } = require("./emailService");

function getPreviousMonthRange() {
  const now = new Date();
  const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
  const month = now.getMonth() === 0 ? 11 : now.getMonth() - 1;

  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 1);

  const monthLabel = start.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric"
  });

  return { start, end, monthLabel };
}

async function buildMonthlySummary(user, range) {
  const submissions = await Submission.find({
    username: user.username,
    submittedAt: { $gte: range.start, $lt: range.end }
  }).lean();

  if (!submissions.length) {
    return null;
  }

  const dayMap = new Map();
  const topicCounts = {};
  let totalAttempts = 0;

  submissions.forEach((submission) => {
    const dayKey = submission.submittedAt.toISOString().slice(0, 10);
    dayMap.set(dayKey, (dayMap.get(dayKey) || 0) + 1);
    totalAttempts += submission.attempts || 1;

    (submission.topics || []).forEach((topic) => {
      if (!topic) return;
      topicCounts[topic] = (topicCounts[topic] || 0) + 1;
    });
  });

  const dailyCounts = Array.from(dayMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const bestDay = dailyCounts.reduce(
    (best, current) => (current.count > best.count ? current : best),
    { date: range.monthLabel, count: submissions.length }
  );

  return {
    monthLabel: range.monthLabel,
    totalSolved: submissions.length,
    activeDays: dailyCounts.length,
    avgAttempts: submissions.length ? totalAttempts / submissions.length : 1,
    dailyCounts,
    topTopics: Object.entries(topicCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5),
    bestDay
  };
}

async function runMonthlyDigestJob() {
  try {
    const range = getPreviousMonthRange();
    const users = await User.find({
      email: { $exists: true, $ne: "" },
      "preferences.emailNotifications.monthlyReport": { $ne: false }
    });

    for (const user of users) {
      const summary = await buildMonthlySummary(user, range);
      if (summary) {
        await sendMonthlyDigestEmail(user, summary);
      }
    }
  } catch (error) {
    console.error("Monthly digest job failed:", error);
  }
}

function scheduleMonthlyDigest() {
  cron.schedule("0 9 1 * *", runMonthlyDigestJob);
  console.log("Monthly digest scheduler ready");
}

module.exports = {
  scheduleMonthlyDigest,
  runMonthlyDigestJob
};

