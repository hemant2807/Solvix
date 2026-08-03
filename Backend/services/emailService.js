const nodemailer = require("nodemailer");

const QUICK_CHART_URL = "https://quickchart.io/chart";

function createTransporter() {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn("Email credentials missing. Emails will be skipped.");
    return null;
  }

  // Use Gmail SMTP with proper configuration
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: {
      rejectUnauthorized: false
    },
    connectionTimeout: 10000, // 10 seconds
    greetingTimeout: 10000,
    socketTimeout: 10000
  });
}

const transporter = createTransporter();

async function sendEmail({ to, subject, html }) {
  if (!transporter) {
    console.warn("Email transporter not configured. Skipping email send.");
    return;
  }

  if (!to) {
    console.warn("Missing recipient email, skipping send.");
    return;
  }

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      html
    });
    console.log(`✅ Email sent successfully to ${to}`);
  } catch (error) {
    // Log error but don't throw - email failures shouldn't break the app
    console.error(`❌ Failed to send email to ${to}:`, error.message);
    console.error("Error details:", {
      code: error.code,
      errno: error.errno,
      syscall: error.syscall,
      address: error.address,
      port: error.port
    });
    // Don't throw - let the caller handle gracefully
    return;
  }
}

function buildChartUrl(config) {
  return `${QUICK_CHART_URL}?c=${encodeURIComponent(JSON.stringify(config))}`;
}

function buildSessionChart(session) {
  const completed = session.completedQuestions || 0;
  const pending = Math.max(session.questions.length - completed, 0);

  return buildChartUrl({
    type: "doughnut",
    data: {
      labels: ["Completed", "Pending"],
      datasets: [
        {
          data: [completed, pending],
          backgroundColor: ["#22c55e", "#1f2937"]
        }
      ]
    },
    options: {
      plugins: {
        legend: { position: "bottom", labels: { color: "#111827" } },
        title: {
          display: true,
          text: "Session Progress",
          color: "#111827",
          font: { size: 16 }
        }
      }
    }
  });
}

function buildMonthlyChart(summary) {
  const labels = summary.dailyCounts.map((item) =>
    new Date(item.date).getDate()
  );
  const data = summary.dailyCounts.map((item) => item.count);

  return buildChartUrl({
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Problems Solved",
          data,
          backgroundColor: "#a855f7"
        }
      ]
    },
    options: {
      scales: {
        x: {
          ticks: { color: "#111827" },
          grid: { display: false }
        },
        y: {
          ticks: { color: "#111827" },
          beginAtZero: true
        }
      },
      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text: `${summary.monthLabel} Progress`,
          color: "#111827",
          font: { size: 16 }
        }
      }
    }
  });
}

function formatTime(ms) {
  if (!ms) return "N/A";
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

function formatTimeFromSeconds(seconds) {
  if (!seconds) return "N/A";
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (minutes > 0) return `${minutes}m ${secs}s`;
  return `${secs}s`;
}

function buildSessionSummaryHtml(user, session, chartUrl) {
  const durationMinutes = Math.round((session.totalTimeSpent || 0) / 60000);
  const durationHours = Math.floor(durationMinutes / 60);
  const remainingMinutes = durationMinutes % 60;
  const totalTimeDisplay = durationHours > 0 
    ? `${durationHours}h ${remainingMinutes}m` 
    : `${durationMinutes}m`;

  const questionRows = session.questions
    .map((q) => {
      // Handle both Mongoose document and plain object
      const question = q.toObject ? q.toObject() : q;
      const submission = question.submission || {};
      const topics = submission.topics || question.topics || [];
      const timeComplexity = submission.timeComplexity || question.timeComplexity || "N/A";
      const spaceComplexity = submission.spaceComplexity || question.spaceComplexity || "N/A";
      const attempts = question.attempts || submission.attempts || 0;
      // question.timeSpent is in milliseconds, submission.timeSpent is in seconds
      // We've already normalized question.timeSpent in sendSessionSummaryEmail
      const timeSpent = question.timeSpent && question.timeSpent > 0 
        ? formatTime(question.timeSpent) 
        : (submission && submission.timeSpent && submission.timeSpent > 0 
          ? formatTimeFromSeconds(submission.timeSpent) 
          : "N/A");
      
      return `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-weight:500;">${question.name}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;">
            <span style="padding:4px 8px;border-radius:4px;font-size:11px;font-weight:600;background:${
              question.difficulty === 'Easy' ? '#dcfce7' : question.difficulty === 'Medium' ? '#fef3c7' : '#fee2e2'
            };color:${
              question.difficulty === 'Easy' ? '#166534' : question.difficulty === 'Medium' ? '#92400e' : '#991b1b'
            };">${question.difficulty}</span>
          </td>
          <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">
            ${question.completed ? "✅ Completed" : "⏳ Pending"}
          </td>
          <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:12px;color:#6b7280;">
            ${timeSpent}
          </td>
          <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:center;font-size:12px;color:#6b7280;">
            ${attempts}
          </td>
          <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:11px;color:#6b7280;">
            ${timeComplexity}
          </td>
          <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:11px;color:#6b7280;">
            ${spaceComplexity}
          </td>
          <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:11px;">
            ${topics.length > 0 
              ? topics.slice(0, 3).map(t => `<span style="display:inline-block;margin:2px;padding:2px 6px;background:#ede9fe;color:#6d28d9;border-radius:4px;">${t}</span>`).join('')
              : '<span style="color:#9ca3af;">N/A</span>'
            }
            ${topics.length > 3 ? `<span style="color:#6b7280;font-size:10px;">+${topics.length - 3}</span>` : ''}
          </td>
        </tr>
      `;
    })
    .join("");

  return `
    <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color:#111827; background:#f9fafb; padding:24px;">
      <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">
        <div style="padding:24px;background:linear-gradient(135deg,#fbbf24,#a855f7);color:#111827;">
          <p style="margin:0;font-size:14px;">Hey ${user.username},</p>
          <h1 style="margin:8px 0 0;font-size:28px;">Session "${session.name}" Wrapped 🎯</h1>
        </div>

        <div style="padding:24px;">
          <img src="${chartUrl}" alt="Session summary chart" style="width:100%;border-radius:12px;border:1px solid #e5e7eb;" />

          <div style="display:flex;gap:16px;margin:24px 0;flex-wrap:wrap;">
            <div style="flex:1;min-width:180px;padding:16px;background:#f9fafb;border-radius:12px;border:1px solid #e5e7eb;">
              <p style="margin:0;font-size:12px;color:#6b7280;">Total Questions</p>
              <p style="margin:4px 0 0;font-size:24px;font-weight:700;">
                ${session.questions.length}
              </p>
            </div>
            <div style="flex:1;min-width:180px;padding:16px;background:#f9fafb;border-radius:12px;border:1px solid #e5e7eb;">
              <p style="margin:0;font-size:12px;color:#6b7280;">Completed</p>
              <p style="margin:4px 0 0;font-size:24px;font-weight:700;color:#16a34a;">
                ${session.completedQuestions || 0}
              </p>
            </div>
            <div style="flex:1;min-width:180px;padding:16px;background:#f9fafb;border-radius:12px;border:1px solid #e5e7eb;">
              <p style="margin:0;font-size:12px;color:#6b7280;">Total Session Time</p>
              <p style="margin:4px 0 0;font-size:24px;font-weight:700;">
                ${totalTimeDisplay}
              </p>
            </div>
          </div>

          <h3 style="margin:24px 0 8px;font-size:18px;">Detailed Problem Breakdown</h3>
          <div style="overflow-x:auto;">
            <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;min-width:800px;">
              <thead>
                <tr style="background:#f3f4f6;">
                  <th style="text-align:left;padding:10px 12px;font-size:12px;color:#6b7280;font-weight:600;">Question</th>
                  <th style="text-align:left;padding:10px 12px;font-size:12px;color:#6b7280;font-weight:600;">Difficulty</th>
                  <th style="text-align:center;padding:10px 12px;font-size:12px;color:#6b7280;font-weight:600;">Status</th>
                  <th style="text-align:left;padding:10px 12px;font-size:12px;color:#6b7280;font-weight:600;">Time Taken</th>
                  <th style="text-align:center;padding:10px 12px;font-size:12px;color:#6b7280;font-weight:600;">Attempts</th>
                  <th style="text-align:left;padding:10px 12px;font-size:12px;color:#6b7280;font-weight:600;">Time Complexity</th>
                  <th style="text-align:left;padding:10px 12px;font-size:12px;color:#6b7280;font-weight:600;">Space Complexity</th>
                  <th style="text-align:left;padding:10px 12px;font-size:12px;color:#6b7280;font-weight:600;">Algorithms Used</th>
                </tr>
              </thead>
              <tbody>
                ${questionRows}
              </tbody>
            </table>
          </div>

          <p style="margin:24px 0 0;font-size:14px;color:#6b7280;">
            Keep pushing! We'll continue tracking your progress and highlighting trends.
          </p>
        </div>
      </div>
    </div>
  `;
}

function buildMonthlyDigestHtml(user, summary, chartUrl) {
  const topicTags = summary.topTopics
    .map(
      (topic) => `
        <span style="
          display:inline-block;
          margin:4px;
          padding:6px 12px;
          border-radius:999px;
          background:#ede9fe;
          color:#6d28d9;
          font-size:12px;
        ">
          ${topic.name} (${topic.count})
        </span>
      `
    )
    .join("");

  return `
    <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color:#111827; background:#f3f4f6; padding:24px;">
      <div style="max-width:680px;margin:0 auto;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #e5e7eb;">
        <div style="padding:24px;background:linear-gradient(120deg,#9333ea,#2563eb);color:white;">
          <p style="margin:0;font-size:14px;">Monthly Performance Report</p>
          <h1 style="margin:8px 0 0;font-size:30px;">${summary.monthLabel}</h1>
          <p style="margin:8px 0 0;font-size:16px;">Great hustle, ${user.username}! Here's what you achieved.</p>
        </div>

        <div style="padding:24px;">
          <img src="${chartUrl}" alt="Monthly progress chart" style="width:100%;border-radius:12px;border:1px solid #e5e7eb;" />

          <div style="display:flex;flex-wrap:wrap;gap:16px;margin:24px 0;">
            <div style="flex:1;min-width:180px;padding:16px;background:#f8fafc;border-radius:14px;border:1px solid #e2e8f0;">
              <p style="margin:0;font-size:12px;color:#64748b;">Total Problems</p>
              <p style="margin:6px 0 0;font-size:26px;font-weight:700;">${summary.totalSolved}</p>
            </div>
            <div style="flex:1;min-width:180px;padding:16px;background:#f8fafc;border-radius:14px;border:1px solid #e2e8f0;">
              <p style="margin:0;font-size:12px;color:#64748b;">Active Days</p>
              <p style="margin:6px 0 0;font-size:26px;font-weight:700;">${summary.activeDays}</p>
            </div>
            <div style="flex:1;min-width:180px;padding:16px;background:#f8fafc;border-radius:14px;border:1px solid #e2e8f0;">
              <p style="margin:0;font-size:12px;color:#64748b;">Avg Attempts</p>
              <p style="margin:6px 0 0;font-size:26px;font-weight:700;">${summary.avgAttempts.toFixed(
                1
              )}</p>
            </div>
          </div>

          <h3 style="margin:16px 0 8px;font-size:18px;">Top Focus Areas</h3>
          <div>${topicTags || "<p style='color:#6b7280;'>Not enough data yet.</p>"}</div>

          <div style="margin:24px 0;padding:16px;background:#ecfccb;border-radius:12px;border:1px solid #d9f99d;">
            <strong style="display:block;color:#3f6212;">Peak Flow Day</strong>
            <p style="margin:4px 0 0;color:#4d7c0f;">${summary.bestDay.date} — ${
    summary.bestDay.count
  } problems solved</p>
          </div>
        </div>
      </div>
    </div>
  `;
}

async function sendSessionSummaryEmail(user, session) {
  if (!user?.email || user.preferences?.emailNotifications?.sessionSummary === false) {
    console.log("Skipping session summary email:", !user?.email ? "No email" : "User disabled");
    return;
  }

  try {
    // Enrich session questions with submission data
    const Submission = require("../models/Submission");
    const enrichedQuestions = await Promise.all(
      session.questions.map(async (q) => {
        // Handle both Mongoose document and plain object
        const question = q.toObject ? q.toObject() : q;
        
        // Find the most recent submission for this question
        const submission = await Submission.findOne({
          username: session.username,
          questionName: question.name
        })
          .sort({ submittedAt: -1 })
          .lean();

        // If question has timeSpent and it's > 0, use it (it's in milliseconds)
        // Otherwise, try to get from submission (it's in seconds, convert to ms)
        let finalTimeSpent = question.timeSpent && question.timeSpent > 0 
          ? question.timeSpent 
          : null;
        
        if (!finalTimeSpent && submission && submission.timeSpent && submission.timeSpent > 0) {
          finalTimeSpent = submission.timeSpent * 1000; // Convert seconds to milliseconds
        }
        
        // If still no time, check if question was completed and use a default or 0
        if (!finalTimeSpent) {
          finalTimeSpent = 0;
        }

        return {
          ...question,
          timeSpent: finalTimeSpent || 0, // Ensure we have a value
          submission: submission || null
        };
      })
    );

    const enrichedSession = {
      ...session,
      questions: enrichedQuestions
    };

    const chartUrl = buildSessionChart(enrichedSession);
    const html = buildSessionSummaryHtml(user, enrichedSession, chartUrl);

    await sendEmail({
      to: user.email,
      subject: `Session "${session.name}" summary - ${enrichedSession.completedQuestions || 0}/${enrichedSession.questions.length} completed`,
      html
    });
  } catch (error) {
    // Already logged in sendEmail, just return
    console.warn("Session summary email failed, but continuing...");
  }
}

async function sendMonthlyDigestEmail(user, summary) {
  if (!user?.email || user.preferences?.emailNotifications?.monthlyReport === false) {
    return;
  }

  const chartUrl = buildMonthlyChart(summary);
  const html = buildMonthlyDigestHtml(user, summary, chartUrl);

  await sendEmail({
    to: user.email,
    subject: `Your ${summary.monthLabel} coding recap`,
    html
  });
}

module.exports = {
  sendEmail,
  sendSessionSummaryEmail,
  sendMonthlyDigestEmail
};

