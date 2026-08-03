function formatTime(ms) {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${hours}h ${minutes}m ${seconds}s`;
}

function getDifficultyColor(difficulty) {
  switch (difficulty) {
    case 'Easy': return '#22c55e';
    case 'Medium': return '#eab308';
    case 'Hard': return '#ef4444';
    default: return '#6b7280';
  }
}

function generateSessionSummaryHTML(session) {
  const completedQuestions = session.questions.filter(q => q.completed);
  const totalQuestions = session.questions.length;
  const completionRate = ((completedQuestions.length / totalQuestions) * 100).toFixed(1);
  
  // Calculate statistics
  const avgTimePerQuestion = completedQuestions.length > 0
    ? completedQuestions.reduce((sum, q) => sum + (q.timeSpent || 0), 0) / completedQuestions.length
    : 0;
  
  const totalAttempts = completedQuestions.reduce((sum, q) => sum + (q.attempts || 0), 0);
  
  // Algorithm usage statistics
  const algorithmCounts = {};
  completedQuestions.forEach(q => {
    if (q.algorithm) {
      const algorithms = q.algorithm.split(',').map(a => a.trim());
      algorithms.forEach(alg => {
        algorithmCounts[alg] = (algorithmCounts[alg] || 0) + 1;
      });
    }
  });
  
  // Complexity distribution
  const complexityCounts = {
    time: {},
    space: {}
  };
  completedQuestions.forEach(q => {
    if (q.timeComplexity) {
      complexityCounts.time[q.timeComplexity] = (complexityCounts.time[q.timeComplexity] || 0) + 1;
    }
    if (q.spaceComplexity) {
      complexityCounts.space[q.spaceComplexity] = (complexityCounts.space[q.spaceComplexity] || 0) + 1;
    }
  });
  
  // Difficulty distribution
  const difficultyCounts = {
    Easy: 0,
    Medium: 0,
    Hard: 0
  };
  completedQuestions.forEach(q => {
    if (q.difficulty) {
      difficultyCounts[q.difficulty] = (difficultyCounts[q.difficulty] || 0) + 1;
    }
  });

  // Generate question rows
  const questionRows = session.questions.map(q => `
    <tr style="border-bottom: 1px solid #e5e7eb;">
      <td style="padding: 12px; text-align: left;">
        <a href="${q.leetcodeUrl}" style="color: #3b82f6; text-decoration: none; font-weight: 500;">
          ${q.name}
        </a>
      </td>
      <td style="padding: 12px; text-align: center;">
        <span style="
          display: inline-block;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          color: white;
          background-color: ${getDifficultyColor(q.difficulty)};
        ">
          ${q.difficulty}
        </span>
      </td>
      <td style="padding: 12px; text-align: center;">
        ${q.completed ? `
          <span style="color: #22c55e; font-weight: 600;">
            ✓ ${formatTime(q.timeSpent || 0)}
          </span>
        ` : '<span style="color: #ef4444;">✗ Not completed</span>'}
      </td>
      <td style="padding: 12px; text-align: center;">
        ${q.attempts || 0}
      </td>
      <td style="padding: 12px; text-align: center; font-family: monospace; font-size: 12px;">
        ${q.timeComplexity || 'N/A'}
      </td>
      <td style="padding: 12px; text-align: center; font-family: monospace; font-size: 12px;">
        ${q.spaceComplexity || 'N/A'}
      </td>
      <td style="padding: 12px; text-align: center; font-size: 11px; color: #6b7280;">
        ${q.algorithm || 'N/A'}
      </td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Session Summary - ${session.name}</title>
    </head>
    <body style="
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f3f4f6;
    ">
      <div style="max-width: 800px; margin: 0 auto; padding: 20px;">
        <!-- Header -->
        <div style="
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 12px;
          padding: 32px;
          text-align: center;
          margin-bottom: 24px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.1);
        ">
          <h1 style="
            color: white;
            margin: 0 0 8px 0;
            font-size: 32px;
            font-weight: 700;
          ">
            🎯 Session Complete!
          </h1>
          <p style="
            color: rgba(255,255,255,0.9);
            margin: 0;
            font-size: 18px;
          ">
            ${session.name}
          </p>
        </div>

        <!-- Summary Stats -->
        <div style="
          background: white;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 24px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        ">
          <h2 style="
            margin: 0 0 20px 0;
            font-size: 20px;
            color: #111827;
          ">
            📊 Session Statistics
          </h2>
          
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;">
            <!-- Total Time -->
            <div style="
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              padding: 20px;
              border-radius: 8px;
              text-align: center;
            ">
              <div style="color: rgba(255,255,255,0.8); font-size: 14px; margin-bottom: 4px;">
                Total Time
              </div>
              <div style="color: white; font-size: 28px; font-weight: 700;">
                ${formatTime(session.totalTimeSpent || 0)}
              </div>
            </div>

            <!-- Completion Rate -->
            <div style="
              background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
              padding: 20px;
              border-radius: 8px;
              text-align: center;
            ">
              <div style="color: rgba(255,255,255,0.8); font-size: 14px; margin-bottom: 4px;">
                Completion Rate
              </div>
              <div style="color: white; font-size: 28px; font-weight: 700;">
                ${completionRate}%
              </div>
            </div>

            <!-- Questions Completed -->
            <div style="
              background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
              padding: 20px;
              border-radius: 8px;
              text-align: center;
            ">
              <div style="color: rgba(255,255,255,0.8); font-size: 14px; margin-bottom: 4px;">
                Questions Completed
              </div>
              <div style="color: white; font-size: 28px; font-weight: 700;">
                ${completedQuestions.length}/${totalQuestions}
              </div>
            </div>

            <!-- Total Attempts -->
            <div style="
              background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
              padding: 20px;
              border-radius: 8px;
              text-align: center;
            ">
              <div style="color: rgba(255,255,255,0.8); font-size: 14px; margin-bottom: 4px;">
                Total Attempts
              </div>
              <div style="color: white; font-size: 28px; font-weight: 700;">
                ${totalAttempts}
              </div>
            </div>
          </div>

          ${completedQuestions.length > 0 ? `
            <div style="
              margin-top: 20px;
              padding: 16px;
              background: #f9fafb;
              border-radius: 8px;
            ">
              <div style="color: #6b7280; font-size: 14px; margin-bottom: 8px;">
                Average Time per Question
              </div>
              <div style="color: #111827; font-size: 20px; font-weight: 600;">
                ${formatTime(avgTimePerQuestion)}
              </div>
            </div>
          ` : ''}
        </div>

        <!-- Questions Table -->
        <div style="
          background: white;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 24px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
          overflow-x: auto;
        ">
          <h2 style="
            margin: 0 0 20px 0;
            font-size: 20px;
            color: #111827;
          ">
            📝 Question Breakdown
          </h2>
          
          <table style="
            width: 100%;
            border-collapse: collapse;
            font-size: 14px;
          ">
            <thead>
              <tr style="background: #f9fafb; border-bottom: 2px solid #e5e7eb;">
                <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151;">
                  Question
                </th>
                <th style="padding: 12px; text-align: center; font-weight: 600; color: #374151;">
                  Difficulty
                </th>
                <th style="padding: 12px; text-align: center; font-weight: 600; color: #374151;">
                  Time Spent
                </th>
                <th style="padding: 12px; text-align: center; font-weight: 600; color: #374151;">
                  Attempts
                </th>
                <th style="padding: 12px; text-align: center; font-weight: 600; color: #374151;">
                  Time
                </th>
                <th style="padding: 12px; text-align: center; font-weight: 600; color: #374151;">
                  Space
                </th>
                <th style="padding: 12px; text-align: center; font-weight: 600; color: #374151;">
                  Algorithm
                </th>
              </tr>
            </thead>
            <tbody>
              ${questionRows}
            </tbody>
          </table>
        </div>

        <!-- Performance Charts Section -->
        <div style="
          background: white;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 24px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        ">
          <h2 style="
            margin: 0 0 20px 0;
            font-size: 20px;
            color: #111827;
          ">
            📊 Performance Analytics
          </h2>
          
          <!-- Time Distribution Chart -->
          <div style="margin-bottom: 32px;">
            <h3 style="margin: 0 0 16px 0; font-size: 16px; color: #374151; font-weight: 600;">
              ⏱️ Time Distribution per Question
            </h3>
            ${completedQuestions.map((q, index) => {
              const maxTime = Math.max(...completedQuestions.map(q => q.timeSpent || 0), 1);
              const widthPercent = maxTime > 0 ? ((q.timeSpent || 0) / maxTime) * 100 : 0;
              
              return `
                <div style="margin-bottom: 16px;">
                  <div style="
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 6px;
                  ">
                    <span style="font-size: 13px; color: #374151; font-weight: 500;">
                      ${q.name.length > 35 ? q.name.substring(0, 35) + '...' : q.name}
                    </span>
                    <span style="font-size: 13px; color: #6b7280; font-weight: 600;">
                      ${formatTime(q.timeSpent || 0)}
                    </span>
                  </div>
                  <div style="
                    width: 100%;
                    height: 10px;
                    background: #e5e7eb;
                    border-radius: 5px;
                    overflow: hidden;
                    position: relative;
                  ">
                    <div style="
                      width: ${widthPercent}%;
                      height: 100%;
                      background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
                      border-radius: 5px;
                      transition: width 0.3s ease;
                    "></div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
          
          <!-- Algorithm Usage Chart -->
          ${Object.keys(algorithmCounts).length > 0 ? `
            <div style="margin-bottom: 32px;">
              <h3 style="margin: 0 0 16px 0; font-size: 16px; color: #374151; font-weight: 600;">
                🔧 Algorithms Used
              </h3>
              ${Object.entries(algorithmCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 8)
                .map(([algorithm, count]) => {
                  const maxCount = Math.max(...Object.values(algorithmCounts));
                  const widthPercent = (count / maxCount) * 100;
                  
                  return `
                    <div style="margin-bottom: 12px;">
                      <div style="
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 6px;
                      ">
                        <span style="font-size: 13px; color: #374151; font-weight: 500;">
                          ${algorithm}
                        </span>
                        <span style="font-size: 13px; color: #6b7280; font-weight: 600;">
                          ${count} ${count === 1 ? 'question' : 'questions'}
                        </span>
                      </div>
                      <div style="
                        width: 100%;
                        height: 10px;
                        background: #e5e7eb;
                        border-radius: 5px;
                        overflow: hidden;
                      ">
                        <div style="
                          width: ${widthPercent}%;
                          height: 100%;
                          background: linear-gradient(90deg, #f093fb 0%, #f5576c 100%);
                          border-radius: 5px;
                        "></div>
                      </div>
                    </div>
                  `;
                }).join('')}
            </div>
          ` : ''}
          
          <!-- Complexity Distribution -->
          ${Object.keys(complexityCounts.time).length > 0 || Object.keys(complexityCounts.space).length > 0 ? `
            <div style="margin-bottom: 32px;">
              <h3 style="margin: 0 0 16px 0; font-size: 16px; color: #374151; font-weight: 600;">
                ⚡ Complexity Analysis
              </h3>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                ${Object.keys(complexityCounts.time).length > 0 ? `
                  <div>
                    <h4 style="margin: 0 0 12px 0; font-size: 14px; color: #6b7280; font-weight: 600;">
                      Time Complexity
                    </h4>
                    ${Object.entries(complexityCounts.time)
                      .sort((a, b) => b[1] - a[1])
                      .map(([complexity, count]) => {
                        const maxCount = Math.max(...Object.values(complexityCounts.time));
                        const widthPercent = (count / maxCount) * 100;
                        
                        return `
                          <div style="margin-bottom: 10px;">
                            <div style="
                              display: flex;
                              justify-content: space-between;
                              margin-bottom: 4px;
                            ">
                              <span style="font-size: 12px; color: #374151; font-family: monospace;">
                                ${complexity}
                              </span>
                              <span style="font-size: 12px; color: #6b7280;">
                                ${count}
                              </span>
                            </div>
                            <div style="
                              width: 100%;
                              height: 8px;
                              background: #e5e7eb;
                              border-radius: 4px;
                              overflow: hidden;
                            ">
                              <div style="
                                width: ${widthPercent}%;
                                height: 100%;
                                background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);
                                border-radius: 4px;
                              "></div>
                            </div>
                          </div>
                        `;
                      }).join('')}
                  </div>
                ` : ''}
                
                ${Object.keys(complexityCounts.space).length > 0 ? `
                  <div>
                    <h4 style="margin: 0 0 12px 0; font-size: 14px; color: #6b7280; font-weight: 600;">
                      Space Complexity
                    </h4>
                    ${Object.entries(complexityCounts.space)
                      .sort((a, b) => b[1] - a[1])
                      .map(([complexity, count]) => {
                        const maxCount = Math.max(...Object.values(complexityCounts.space));
                        const widthPercent = (count / maxCount) * 100;
                        
                        return `
                          <div style="margin-bottom: 10px;">
                            <div style="
                              display: flex;
                              justify-content: space-between;
                              margin-bottom: 4px;
                            ">
                              <span style="font-size: 12px; color: #374151; font-family: monospace;">
                                ${complexity}
                              </span>
                              <span style="font-size: 12px; color: #6b7280;">
                                ${count}
                              </span>
                            </div>
                            <div style="
                              width: 100%;
                              height: 8px;
                              background: #e5e7eb;
                              border-radius: 4px;
                              overflow: hidden;
                            ">
                              <div style="
                                width: ${widthPercent}%;
                                height: 100%;
                                background: linear-gradient(90deg, #43e97b 0%, #38f9d7 100%);
                                border-radius: 4px;
                              "></div>
                            </div>
                          </div>
                        `;
                      }).join('')}
                  </div>
                ` : ''}
              </div>
            </div>
          ` : ''}
          
          <!-- Difficulty Distribution -->
          ${Object.values(difficultyCounts).some(count => count > 0) ? `
            <div>
              <h3 style="margin: 0 0 16px 0; font-size: 16px; color: #374151; font-weight: 600;">
                📈 Difficulty Distribution
              </h3>
              <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;">
                ${['Easy', 'Medium', 'Hard'].map(difficulty => {
                  const count = difficultyCounts[difficulty] || 0;
                  const total = Object.values(difficultyCounts).reduce((a, b) => a + b, 0);
                  const percentage = total > 0 ? ((count / total) * 100).toFixed(0) : 0;
                  const color = difficulty === 'Easy' ? '#22c55e' : difficulty === 'Medium' ? '#eab308' : '#ef4444';
                  
                  return `
                    <div style="
                      background: ${color}15;
                      border: 2px solid ${color}40;
                      border-radius: 8px;
                      padding: 16px;
                      text-align: center;
                    ">
                      <div style="
                        font-size: 24px;
                        font-weight: 700;
                        color: ${color};
                        margin-bottom: 4px;
                      ">
                        ${count}
                      </div>
                      <div style="
                        font-size: 12px;
                        color: #6b7280;
                        font-weight: 600;
                        margin-bottom: 4px;
                      ">
                        ${difficulty}
                      </div>
                      <div style="
                        font-size: 11px;
                        color: #9ca3af;
                      ">
                        ${percentage}%
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          ` : ''}
        </div>

        <!-- Footer -->
        <div style="
          text-align: center;
          color: #6b7280;
          font-size: 14px;
          padding: 20px;
        ">
          <p style="margin: 0 0 8px 0;">
            Keep up the great work! 🚀
          </p>
          <p style="margin: 0;">
            Session completed on ${new Date(session.finishedAt).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

module.exports = { generateSessionSummaryHTML };