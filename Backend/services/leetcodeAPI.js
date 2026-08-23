// Use native fetch (Node 18+) or node-fetch as fallback
let fetch;
try {
  // Try to use native fetch (Node 18+)
  if (typeof globalThis.fetch === 'function') {
    fetch = globalThis.fetch;
  } else {
    fetch = require('node-fetch');
  }
} catch (e) {
  // Fallback to node-fetch if native fetch not available
  fetch = require('node-fetch');
}

/**
 * Fetch user profile from LeetCode GraphQL API
 */
async function fetchLeetCodeUserProfile(username) {
  try {
    const response = await fetch('https://leetcode.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `
          query getUserProfile($username: String!) {
            matchedUser(username: $username) {
              username
              profile {
                userAvatar
                ranking
                realName
                aboutMe
                school
                websites
                countryName
                company
                jobTitle
                skillTags
                postViewCount
                reputation
              }
              submitStats {
                acSubmissionNum {
                  difficulty
                  count
                  submissions
                }
                totalSubmissionNum {
                  difficulty
                  count
                  submissions
                }
              }
              badges {
                id
                name
                displayName
                icon
                creationDate
              }
            }
          }
        `,
        variables: { username }
      })
    });

    if (!response.ok) {
      throw new Error(`LeetCode API returned ${response.status}`);
    }

    const data = await response.json();
    
    if (data.errors) {
      throw new Error(data.errors[0].message);
    }

    return data.data.matchedUser;
  } catch (error) {
    console.error('Error fetching LeetCode profile:', error);
    throw error;
  }
}

/**
 * Fetch user's recent submissions
 */
async function fetchRecentSubmissions(username, limit = 20) {
  try {
    const response = await fetch('https://leetcode.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `
          query getRecentSubmissions($username: String!, $limit: Int) {
            recentSubmissionList(username: $username, limit: $limit) {
              title
              titleSlug
              timestamp
              statusDisplay
              lang
              runtime
              memory
            }
          }
        `,
        variables: { username, limit }
      })
    });

    const data = await response.json();
    
    if (data.errors) {
      throw new Error(data.errors[0].message);
    }

    return data.data.recentSubmissionList;
  } catch (error) {
    console.error('Error fetching recent submissions:', error);
    throw error;
  }
}

/**
 * Fetch user's contest ranking info
 */
async function fetchContestRanking(username) {
  try {
    const response = await fetch('https://leetcode.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `
          query getUserContestRanking($username: String!) {
            userContestRanking(username: $username) {
              attendedContestsCount
              rating
              globalRanking
              totalParticipants
              topPercentage
              badge {
                name
              }
            }
          }
        `,
        variables: { username }
      })
    });

    const data = await response.json();
    
    if (data.errors) {
      throw new Error(data.errors[0].message);
    }

    return data.data.userContestRanking;
  } catch (error) {
    console.error('Error fetching contest ranking:', error);
    throw error;
  }
}

/**
 * Fetch language usage statistics
 */
async function fetchLanguageStats(username) {
  try {
    const response = await fetch('https://leetcode.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `
          query getLanguageStats($username: String!) {
            matchedUser(username: $username) {
              languageProblemCount {
                languageName
                problemsSolved
              }
            }
          }
        `,
        variables: { username }
      })
    });

    const data = await response.json();
    
    if (data.errors) {
      throw new Error(data.errors[0].message);
    }

    return data.data.matchedUser.languageProblemCount;
  } catch (error) {
    console.error('Error fetching language stats:', error);
    throw error;
  }
}

/**
 * Fetch solved problems by topic
 */
async function fetchProblemsByTopic(username) {
  try {
    const response = await fetch('https://leetcode.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `
          query getSkillStats($username: String!) {
            matchedUser(username: $username) {
              tagProblemCounts {
                advanced {
                  tagName
                  tagSlug
                  problemsSolved
                }
                intermediate {
                  tagName
                  tagSlug
                  problemsSolved
                }
                fundamental {
                  tagName
                  tagSlug
                  problemsSolved
                }
              }
            }
          }
        `,
        variables: { username }
      })
    });

    const data = await response.json();
    
    if (data.errors) {
      throw new Error(data.errors[0].message);
    }

    return data.data.matchedUser.tagProblemCounts;
  } catch (error) {
    console.error('Error fetching problems by topic:', error);
    throw error;
  }
}

/**
 * Fetch user's calendar data (heatmap)
 */
async function fetchCalendarData(username) {
  try {
    const response = await fetch('https://leetcode.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `
          query getUserCalendar($username: String!, $year: Int) {
            matchedUser(username: $username) {
              userCalendar(year: $year) {
                activeYears
                streak
                totalActiveDays
                submissionCalendar
              }
            }
          }
        `,
        variables: { username, year: new Date().getFullYear() }
      })
    });

    const data = await response.json();
    
    if (data.errors) {
      throw new Error(data.errors[0].message);
    }

    return data.data.matchedUser.userCalendar;
  } catch (error) {
    console.error('Error fetching calendar data:', error);
    throw error;
  }
}

/**
 * Get comprehensive user statistics
 */
async function getComprehensiveUserStats(username) {
  try {
    const [profile, contestRanking, languageStats, topicStats, calendarData] = await Promise.all([
      fetchLeetCodeUserProfile(username),
      fetchContestRanking(username).catch(() => null),
      fetchLanguageStats(username).catch(() => []),
      fetchProblemsByTopic(username).catch(() => null),
      fetchCalendarData(username).catch(() => null)
    ]);

    // Parse submission statistics
    const acSubmissions = profile.submitStats.acSubmissionNum;
    const totalSubmissions = profile.submitStats.totalSubmissionNum;

    const stats = {
      username: profile.username,
      profile: profile.profile,
      solved: {
        total: acSubmissions.find(s => s.difficulty === 'All')?.count || 0,
        easy: acSubmissions.find(s => s.difficulty === 'Easy')?.count || 0,
        medium: acSubmissions.find(s => s.difficulty === 'Medium')?.count || 0,
        hard: acSubmissions.find(s => s.difficulty === 'Hard')?.count || 0,
      },
      submissions: {
        total: totalSubmissions.find(s => s.difficulty === 'All')?.count || 0,
        easy: totalSubmissions.find(s => s.difficulty === 'Easy')?.count || 0,
        medium: totalSubmissions.find(s => s.difficulty === 'Medium')?.count || 0,
        hard: totalSubmissions.find(s => s.difficulty === 'Hard')?.count || 0,
      },
      acceptanceRate: {
        overall: totalSubmissions.find(s => s.difficulty === 'All')?.count > 0
          ? ((acSubmissions.find(s => s.difficulty === 'All')?.count || 0) / 
             totalSubmissions.find(s => s.difficulty === 'All')?.count * 100).toFixed(2)
          : 0
      },
      contestRanking,
      languageStats,
      topicStats,
      calendar: calendarData,
      badges: profile.badges || []
    };

    return stats;
  } catch (error) {
    console.error('Error getting comprehensive stats:', error);
    throw error;
  }
}

module.exports = {
  fetchLeetCodeUserProfile,
  fetchRecentSubmissions,
  fetchContestRanking,
  fetchLanguageStats,
  fetchProblemsByTopic,
  fetchCalendarData,
  getComprehensiveUserStats
};