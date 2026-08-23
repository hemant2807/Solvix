const cron = require("node-cron");
const User = require("../models/User");
const Submission = require("../models/Submission");
const { sendEmail } = require("./emailService");

function getDateRange(date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

function getYesterdayRange() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return getDateRange(yesterday);
}

function getLastWeekRange() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekStart = new Date(today);
  weekStart.setDate(weekStart.getDate() - 7);
  const weekEnd = new Date(today);
  weekEnd.setDate(weekEnd.getDate() - 1);
  return { start: weekStart, end: weekEnd };
}

async function getUserSubmissionsInRange(username, start, end) {
  return await Submission.find({
    username,
    submittedAt: { $gte: start, $lt: end }
  }).lean();
}

function computeMetrics(submissions) {
  const total = submissions.length;
  const accepted = submissions.filter(s => s.verdict === "Accepted").length;
  const acceptanceRate = total > 0 ? Math.round((accepted / total) * 100) : 0;
  const totalTime = submissions.reduce((sum, s) => sum + (s.timeSpent || 0), 0);
  
  const difficultyDist = { Easy: 0, Medium: 0, Hard: 0 };
  const topicCounts = {};
  
  for (const s of submissions) {
    if (s.difficulty && difficultyDist.hasOwnProperty(s.difficulty)) {
      difficultyDist[s.difficulty]++;
    }
    for (const topic of s.topics || []) {
      topicCounts[topic] = (topicCounts[topic] || 0) + 1;
    }
  }
  
  const topTopics = Object.entries(topicCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([topic, count]) => `${topic} (${count})`)
    .join(", ") || "None";
  
  return {
    total,
    accepted,
    acceptanceRate,
    totalTime,
    difficultyDist,
    topTopics
  };
}

function comparePerformance(today, yesterday, lastWeek) {
  if (today.total > yesterday.total) return { better: true, reason: `You solved ${today.total} problem${today.total !== 1 ? "s" : ""} today vs ${yesterday.total} yesterday.` };
  if (today.total < yesterday.total) return { better: false, reason: `You solved ${today.total} problem${today.total !== 1 ? "s" : ""} today vs ${yesterday.total} yesterday.` };
  
  if (today.acceptanceRate > yesterday.acceptanceRate) return { better: true, reason: `Same problems solved (${today.total}), but higher acceptance rate (${today.acceptanceRate}% vs ${yesterday.acceptanceRate}%).` };
  if (today.acceptanceRate < yesterday.acceptanceRate) return { better: false, reason: `Same problems solved (${today.total}), but lower acceptance rate (${today.acceptanceRate}% vs ${yesterday.acceptanceRate}%).` };
  
  const diffOrder = { Hard: 3, Medium: 2, Easy: 1 };
  const todayHardest = today.difficultyDist.Hard > 0 ? "Hard" : today.difficultyDist.Medium > 0 ? "Medium" : "Easy";
  const yesterdayHardest = yesterday.difficultyDist.Hard > 0 ? "Hard" : yesterday.difficultyDist.Medium > 0 ? "Medium" : "Easy";
  
  if (diffOrder[todayHardest] > diffOrder[yesterdayHardest]) return { better: true, reason: `Same problems (${today.total}) and acceptance rate (${today.acceptanceRate}%), but you tackled ${todayHardest} problems today vs ${yesterdayHardest} yesterday.` };
  if (diffOrder[todayHardest] < diffOrder[yesterdayHardest]) return { better: false, reason: `Same problems (${today.total}) and acceptance rate (${today.acceptanceRate}%), but hardest problem was ${todayHardest} today vs ${yesterdayHardest} yesterday.` };
  
  return { better: null, reason: `Today was very similar to yesterday (${today.total} solved, ${today.acceptanceRate}% acceptance).` };
}

function compareToLastWeek(today, lastWeek) {
  if (today.total > lastWeek.total) return `Up from ${lastWeek.total} last week.`;
  if (today.total < lastWeek.total) return `Down from ${lastWeek.total} last week.`;
  return `Same as last week (${lastWeek.total}).`;
}

function formatDuration(seconds) {
  if (!seconds || seconds < 60) return `${Math.round(seconds)}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins < 60) return `${mins}m ${secs}s`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m`;
}

function buildDailyReportHtml(user, todayMetrics, yesterdayMetrics, lastWeekMetrics, comparison, weekComparison) {
  const today = new Date();
  const dateStr = today.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  
  const diffColors = {
    Easy: { bg: "#dcfce7", text: "#166534" },
    Medium: { bg: "#fef3c7", text: "#92400e" },
    Hard: { bg: "#fee2e2", text: "#991b1b" }
  };
  
  const difficultyRows = ["Hard", "Medium", "Easy"].map(diff => {
    const todayCount = todayMetrics.difficultyDist[diff] || 0;
    const yesterdayCount = yesterdayMetrics.difficultyDist[diff] || 0;
    const weekCount = lastWeekMetrics.difficultyDist[diff] || 0;
    const color = diffColors[diff];
    return `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-weight:500;">
          <span style="padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;background:${color.bg};color:${color.text};">${diff}</span>
        </td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:center;font-weight:600;color:#111827;">${todayCount}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:center;color:#6b7280;font-size:13px;">${yesterdayCount}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:center;color:#6b7280;font-size:13px;">${weekCount}</td>
      </tr>
    `;
  }).join("");
  
  const comparisonColor = comparison.better === true ? "#16a34a" : comparison.better === false ? "#dc2626" : "#6b7280";
  const comparisonIcon = comparison.better === true ? "📈" : comparison.better === false ? "📉" : "➡️";
  
  return `
    <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color:#111827; background:#f9fafb; padding:24px;">
      <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">
        <div style="padding:24px;background:linear-gradient(135deg,#fbbf24,#a855f7);color:#111827;">
          <p style="margin:0;font-size:14px;">Daily Progress Report</p>
          <h1 style="margin:8px 0 0;font-size:28px;">${dateStr}</h1>
          <p style="margin:8px 0 0;font-size:16px;">Hey ${user.username}, here's how you did today! 📊</p>
        </div>

        <div style="padding:24px;">
          <!-- Summary Cards -->
          <div style="display:flex;gap:16px;margin-bottom:24px;flex-wrap:wrap;">
            <div style="flex:1;min-width:160px;padding:16px;background:#f0fdf4;border-radius:12px;border:1px solid #bbf7d0;">
              <p style="margin:0;font-size:12px;color:#166534;text-transform:uppercase;">Problems Solved</p>
              <p style="margin:4px 0 0;font-size:28px;font-weight:700;color:#166534;">${todayMetrics.total}</p>
              <p style="margin:4px 0 0;font-size:12px;color:#6b7280;">${weekComparison}</p>
            </div>
            <div style="flex:1;min-width:160px;padding:16px;background:#eff6ff;border-radius:12px;border:1px solid #bfdbfe;">
              <p style="margin:0;font-size:12px;color:#1d4ed8;text-transform:uppercase;">Acceptance Rate</p>
              <p style="margin:4px 0 0;font-size:28px;font-weight:700;color:#1d4ed8;">${todayMetrics.acceptanceRate}%</p>
              <p style="margin:4px 0 0;font-size:12px;color:#6b7280;">${todayMetrics.accepted}/${todayMetrics.total} accepted</p>
            </div>
            <div style="flex:1;min-width:160px;padding:16px;background:#faf5ff;border-radius:12px;border:1px solid #e9d5ff;">
              <p style="margin:0;font-size:12px;color:#7c3aed;text-transform:uppercase;">Practice Time</p>
              <p style="margin:4px 0 0;font-size:28px;font-weight:700;color:#7c3aed;">${formatDuration(todayMetrics.totalTime)}</p>
              <p style="margin:4px 0 0;font-size:12px;color:#6b7280;">Total time spent</p>
            </div>
          </div>

          <!-- Comparison Summary -->
          <div style="padding:16px;background:${comparison.better === true ? "#f0fdf4" : comparison.better === false ? "#fef2f2" : "#f9fafb"};border-radius:12px;border:1px solid ${comparison.better === true ? "#bbf7d0" : comparison.better === false ? "#fecaca" : "#e5e7eb"};margin-bottom:24px;">
            <div style="display:flex;align-items:center;gap:12px;">
              <span style="font-size:24px;">${comparisonIcon}</span>
              <div>
                <p style="margin:0;font-weight:600;color:${comparisonColor};">${comparison.better === true ? "Stronger than yesterday" : comparison.better === false ? "Weaker than yesterday" : "Similar to yesterday"}</p>
                <p style="margin:4px 0 0;font-size:14px;color:#374151;">${comparison.reason}</p>
              </div>
            </div>
          </div>

          <!-- Difficulty Distribution Table -->
          <h3 style="margin:0 0 12px;font-size:18px;">Difficulty Breakdown</h3>
          <div style="overflow-x:auto;margin-bottom:24px;">
            <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
              <thead>
                <tr style="background:#f3f4f6;">
                  <th style="text-align:left;padding:10px 12px;font-size:12px;color:#6b7280;font-weight:600;">Difficulty</th>
                  <th style="text-align:center;padding:10px 12px;font-size:12px;color:#6b7280;font-weight:600;">Today</th>
                  <th style="text-align:center;padding:10px 12px;font-size:12px;color:#6b7280;font-weight:600;">Yesterday</th>
                  <th style="text-align:center;padding:10px 12px;font-size:12px;color:#6b7280;font-weight:600;">Last Week (avg/day)</th>
                </tr>
              </thead>
              <tbody>
                ${difficultyRows}
              </tbody>
            </table>
          </div>

          <!-- Top Topics -->
          <div style="padding:16px;background:#f3f4f6;border-radius:12px;border:1px solid #e5e7eb;">
            <p style="margin:0 0 8px;font-size:14px;color:#6b7280;">Top Topics Today</p>
            <p style="margin:0;font-size:14px;font-weight:500;color:#111827;">${todayMetrics.topTopics}</p>
          </div>

          <p style="margin:24px 0 0;font-size:14px;color:#6b7280;text-align:center;">
            Keep pushing! We'll send tomorrow's report at midnight. 💪
          </p>
        </div>
      </div>
    </div>
  `;
}

async function sendDailyReport(user) {
  if (!user.dailyReport?.enabled || !user.dailyReport?.email) {
    return;
  }

  const todayRange = getDateRange(new Date());
  const yesterdayRange = getYesterdayRange();
  const lastWeekRange = getLastWeekRange();

  const [todaySubs, yesterdaySubs, lastWeekSubs] = await Promise.all([
    getUserSubmissionsInRange(user.username, todayRange.start, todayRange.end),
    getUserSubmissionsInRange(user.username, yesterdayRange.start, yesterdayRange.end),
    getUserSubmissionsInRange(user.username, lastWeekRange.start, lastWeekRange.end)
  ]);

  const todayMetrics = computeMetrics(todaySubs);
  const yesterdayMetrics = computeMetrics(yesterdaySubs);
  
  const lastWeekDailyAvg = {
    total: Math.round(lastWeekSubs.length / 7),
    accepted: Math.round(lastWeekSubs.filter(s => s.verdict === "Accepted").length / 7),
    acceptanceRate: lastWeekSubs.length > 0 ? Math.round((lastWeekSubs.filter(s => s.verdict === "Accepted").length / lastWeekSubs.length) * 100) : 0,
    totalTime: Math.round(lastWeekSubs.reduce((sum, s) => sum + (s.timeSpent || 0), 0) / 7),
    difficultyDist: { Easy: 0, Medium: 0, Hard: 0 },
    topTopics: ""
  };
  
  for (const s of lastWeekSubs) {
    if (s.difficulty && lastWeekDailyAvg.difficultyDist.hasOwnProperty(s.difficulty)) {
      lastWeekDailyAvg.difficultyDist[s.difficulty]++;
    }
  }
  for (const diff in lastWeekDailyAvg.difficultyDist) {
    lastWeekDailyAvg.difficultyDist[diff] = Math.round(lastWeekDailyAvg.difficultyDist[diff] / 7);
  }

  const comparison = comparePerformance(todayMetrics, yesterdayMetrics, lastWeekDailyAvg);
  const weekComparison = compareToLastWeek(todayMetrics, lastWeekDailyAvg);

  const html = buildDailyReportHtml(user, todayMetrics, yesterdayMetrics, lastWeekDailyAvg, comparison, weekComparison);

  await sendEmail({
    to: user.dailyReport.email,
    subject: `📊 Daily Progress Report - ${todayMetrics.total} solved, ${todayMetrics.acceptanceRate}% acceptance`,
    html
  });

  // Update last sent date to prevent duplicates
  user.dailyReport.lastSentDate = new Date();
  await user.save();
}

async function checkAndSendDailyReports() {
  try {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    // Run at midnight (00:00) - check every hour but only send at midnight
    if (currentHour !== 0) return;

    const users = await User.find({
      "dailyReport.enabled": true,
      "dailyReport.email": { $exists: true, $ne: null }
    });

    console.log(`Running daily report check at ${currentHour}:${currentMinute.toString().padStart(2, '0')}, found ${users.length} users`);

    for (const user of users) {
      // Check if already sent today
      const lastSent = user.dailyReport.lastSentDate ? new Date(user.dailyReport.lastSentDate) : null;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (lastSent && lastSent >= today) {
        console.log(`Daily report already sent to ${user.username} today`);
        continue;
      }

      await sendDailyReport(user);
    }
  } catch (error) {
    console.error('Error in checkAndSendDailyReports:', error);
  }
}

function initializeDailyReportScheduler() {
  // Run every hour at minute 0 to check if it's midnight
  cron.schedule('0 * * * *', async () => {
    console.log('Running daily report scheduler...');
    await checkAndSendDailyReports();
  });

  console.log('Daily report scheduler initialized');
}

module.exports = {
  initializeDailyReportScheduler,
  checkAndSendDailyReports,
  sendDailyReport
};