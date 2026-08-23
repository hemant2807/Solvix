const cron = require('node-cron');
const nodemailer = require('nodemailer');
const User = require('../models/User');

// Configure email transporter with better connection settings
function createEmailTransporter() {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: {
      ciphers: 'SSLv3',
      rejectUnauthorized: false
    },
    connectionTimeout: 5000,
    greetingTimeout: 5000,
    socketTimeout: 5000,
    pool: true,
    maxConnections: 1,
    maxMessages: 3
  });
}

const transporter = createEmailTransporter();

// Practice reminder email template
function generateReminderEmail(user) {
  const { dailyQuestions, focusTopics } = user.preferences.goals;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: #f3f4f6;
    ">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 12px;
          padding: 32px;
          text-align: center;
          margin-bottom: 24px;
        ">
          <h1 style="color: white; margin: 0 0 8px 0; font-size: 28px;">
            🔥 Time to Practice!
          </h1>
          <p style="color: rgba(255,255,255,0.9); margin: 0; font-size: 16px;">
            Keep your ${user.streak.current} day streak alive!
          </p>
        </div>

        <div style="
          background: white;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 24px;
        ">
          <h2 style="margin: 0 0 16px 0; font-size: 20px; color: #111827;">
            Today's Goal
          </h2>
          <p style="color: #6b7280; margin: 0 0 16px 0;">
            Complete ${dailyQuestions} question${dailyQuestions > 1 ? 's' : ''} to maintain your streak!
          </p>
          
          ${focusTopics && focusTopics.length > 0 ? `
            <div style="
              background: #f9fafb;
              padding: 16px;
              border-radius: 8px;
              margin-bottom: 16px;
            ">
              <h3 style="margin: 0 0 8px 0; font-size: 14px; color: #374151;">
                Focus Topics:
              </h3>
              <div>
                ${focusTopics.map(topic => `
                  <span style="
                    display: inline-block;
                    background: #e0e7ff;
                    color: #4338ca;
                    padding: 4px 12px;
                    border-radius: 12px;
                    font-size: 12px;
                    margin: 4px;
                  ">
                    ${topic}
                  </span>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <a href="https://leetcode.com/problemset/" style="
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 600;
            margin-top: 16px;
          ">
            Start Practicing →
          </a>
        </div>

        <div style="
          background: white;
          border-radius: 12px;
          padding: 24px;
        ">
          <h2 style="margin: 0 0 16px 0; font-size: 18px; color: #111827;">
            📊 Your Progress
          </h2>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">
            <div style="text-align: center; padding: 12px; background: #f9fafb; border-radius: 8px;">
              <div style="font-size: 24px; font-weight: 700; color: #111827;">
                ${user.streak.current}
              </div>
              <div style="font-size: 12px; color: #6b7280;">
                Day Streak
              </div>
            </div>
            <div style="text-align: center; padding: 12px; background: #f9fafb; border-radius: 8px;">
              <div style="font-size: 24px; font-weight: 700; color: #111827;">
                ${user.stats.totalQuestions}
              </div>
              <div style="font-size: 12px; color: #6b7280;">
                Total Solved
              </div>
            </div>
          </div>
        </div>

        <div style="
          text-align: center;
          color: #6b7280;
          font-size: 14px;
          padding: 20px;
        ">
          <p style="margin: 0;">
            You're doing great! Keep it up! 💪
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Send reminder email
async function sendReminderEmail(user) {
  if (!user.email || !user.preferences.practiceReminders.enabled) {
    return;
  }

  // Check if email is configured
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn("Email not configured. Skipping reminder email.");
    return;
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: user.email,
    subject: `🔥 Daily Practice Reminder - ${user.streak.current} Day Streak!`,
    html: generateReminderEmail(user)
  };

  // Retry logic - try up to 2 times for reminders
  const maxRetries = 2;
  let lastError = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await transporter.sendMail(mailOptions);
      console.log(`✅ Reminder email sent to ${user.email} (attempt ${attempt})`);
      return;
    } catch (error) {
      lastError = error;
      console.error(`❌ Failed to send reminder (attempt ${attempt}/${maxRetries}):`, error.message);
      
      if ((error.code === 'ETIMEDOUT' || error.code === 'ESOCKET') && attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        continue;
      }
      
      if (error.code === 'EAUTH') {
        console.error('   → Authentication failed. Check EMAIL_USER and EMAIL_PASS');
      } else if (error.code === 'ETIMEDOUT' || error.code === 'ESOCKET') {
        console.error('   → Connection timeout. Check network/firewall settings.');
      }
      break;
    }
  }
}

// Check and send reminders based on user preferences
async function checkAndSendReminders() {
  try {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;

    // Find users who need reminders at this time
    const users = await User.find({
      'preferences.practiceReminders.enabled': true,
      'preferences.practiceReminders.time': currentTime,
      email: { $exists: true, $ne: null }
    });

    console.log(`Checking reminders at ${currentTime}, found ${users.length} users`);

    for (const user of users) {
      // Check if user already practiced today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const lastActivity = user.streak.lastActivityDate 
        ? new Date(user.streak.lastActivityDate)
        : null;
      
      if (lastActivity) {
        lastActivity.setHours(0, 0, 0, 0);
      }

      // Only send reminder if user hasn't practiced today
      if (!lastActivity || lastActivity < today) {
        await sendReminderEmail(user);
      }
    }
  } catch (error) {
    console.error('Error in checkAndSendReminders:', error);
  }
}

// Initialize scheduler
function initializeReminderScheduler() {
  // Run every hour to check for reminders
  // In production, you might want to run more frequently (e.g., every 15 minutes)
  cron.schedule('0 * * * *', async () => {
    console.log('Running reminder scheduler...');
    await checkAndSendReminders();
  });

  // Also check for weekly reports (Sunday at 8 AM)
  cron.schedule('0 8 * * 0', async () => {
    console.log('Sending weekly reports...');
    await sendWeeklyReports();
  });

  console.log('Reminder scheduler initialized');
}

// Send weekly progress reports
async function sendWeeklyReports() {
  try {
    const users = await User.find({
      'preferences.emailNotifications.weeklyReport': true,
      email: { $exists: true, $ne: null }
    });

    for (const user of users) {
      // Generate and send weekly report
      // Implementation similar to session summary
      console.log(`Sending weekly report to ${user.email}`);
    }
  } catch (error) {
    console.error('Error sending weekly reports:', error);
  }
}

module.exports = {
  initializeReminderScheduler,
  checkAndSendReminders,
  sendReminderEmail
};