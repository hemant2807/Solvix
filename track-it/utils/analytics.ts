export type Difficulty = "Easy" | "Medium" | "Hard"

export interface AnalyticsSubmission {
  _id?: string
  questionName: string
  attempts: number
  timeSpent: number // seconds
  topics?: string[]
  difficulty?: Difficulty
  verdict?: string
  language?: string
  submittedAt: string
}

const dayKey = (iso: string) => new Date(iso).toISOString().slice(0, 10)

const isAccepted = (verdict?: string) => verdict === "Accepted"

export interface DailyActivity {
  date: string
  count: number
  timeSpent: number
}

export function groupSubmissionsByDay(submissions: AnalyticsSubmission[]): DailyActivity[] {
  const byDay = new Map<string, DailyActivity>()
  for (const s of submissions) {
    const date = dayKey(s.submittedAt)
    const existing = byDay.get(date)
    if (existing) {
      existing.count += 1
      existing.timeSpent += s.timeSpent || 0
    } else {
      byDay.set(date, { date, count: 1, timeSpent: s.timeSpent || 0 })
    }
  }
  return Array.from(byDay.values()).sort((a, b) => a.date.localeCompare(b.date))
}

const WEEKDAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

export function mostActiveDayOfWeek(submissions: AnalyticsSubmission[]): string {
  if (submissions.length === 0) return ""
  const counts = new Array(7).fill(0)
  for (const s of submissions) {
    counts[new Date(s.submittedAt).getDay()] += 1
  }
  const maxIndex = counts.indexOf(Math.max(...counts))
  return WEEKDAY_NAMES[maxIndex]
}

const hasVerdict = (s: AnalyticsSubmission) => typeof s.verdict === "string" && s.verdict.length > 0

export function computeStreaks(submissions: AnalyticsSubmission[]): { current: number; longest: number } {
  const days = Array.from(new Set(submissions.map((s) => dayKey(s.submittedAt)))).sort()
  if (days.length === 0) return { current: 0, longest: 0 }

  let longest = 1
  let run = 1
  for (let i = 1; i < days.length; i++) {
    const prev = new Date(days[i - 1])
    const curr = new Date(days[i])
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / 86400000)
    if (diffDays === 1) {
      run += 1
      longest = Math.max(longest, run)
    } else {
      run = 1
    }
  }

  const daySet = new Set(days)
  let current = 0
  const cursor = new Date()
  cursor.setHours(0, 0, 0, 0)
  if (!daySet.has(cursor.toISOString().slice(0, 10))) {
    cursor.setDate(cursor.getDate() - 1)
  }
  while (daySet.has(cursor.toISOString().slice(0, 10))) {
    current += 1
    cursor.setDate(cursor.getDate() - 1)
  }

  return { current, longest }
}

export function computeConsistencyScore(submissions: AnalyticsSubmission[], windowDays = 30): number {
  if (submissions.length === 0) return 0
  const activeDays = new Set(submissions.map((s) => dayKey(s.submittedAt)))
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  let activeInWindow = 0
  for (let i = 0; i < windowDays; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    if (activeDays.has(d.toISOString().slice(0, 10))) activeInWindow += 1
  }
  return Math.round((activeInWindow / windowDays) * 100)
}

export interface TrendPoint {
  label: string
  solved: number
  timeSpent: number
}

export function computeWeeklyTrend(submissions: AnalyticsSubmission[], weeks = 8): TrendPoint[] {
  const points: TrendPoint[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (let w = weeks - 1; w >= 0; w--) {
    const weekEnd = new Date(today)
    weekEnd.setDate(weekEnd.getDate() - w * 7)
    const weekStart = new Date(weekEnd)
    weekStart.setDate(weekStart.getDate() - 6)

    const inRange = submissions.filter((s) => {
      const t = new Date(s.submittedAt).getTime()
      return t >= weekStart.getTime() && t <= weekEnd.getTime() + 86399999
    })

    points.push({
      label: weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      solved: inRange.length,
      timeSpent: inRange.reduce((sum, s) => sum + (s.timeSpent || 0), 0)
    })
  }

  return points
}

export function computeMonthlyTrend(submissions: AnalyticsSubmission[], months = 6): TrendPoint[] {
  const points: TrendPoint[] = []
  const today = new Date()

  for (let m = months - 1; m >= 0; m--) {
    const target = new Date(today.getFullYear(), today.getMonth() - m, 1)
    const monthKey = `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, "0")}`

    const inMonth = submissions.filter((s) => dayKey(s.submittedAt).startsWith(monthKey))

    points.push({
      label: target.toLocaleDateString("en-US", { month: "short" }),
      solved: inMonth.length,
      timeSpent: inMonth.reduce((sum, s) => sum + (s.timeSpent || 0), 0)
    })
  }

  return points
}

export interface DifficultyStat {
  difficulty: Difficulty | "Unknown"
  solved: number
  avgTime: number
  successRate: number | null 
}

export function computeDifficultyBreakdown(submissions: AnalyticsSubmission[]): DifficultyStat[] {
  const buckets: Difficulty[] | string[] = ["Easy", "Medium", "Hard", "Unknown"]
  return buckets.map((difficulty) => {
    const inBucket = submissions.filter((s) => (s.difficulty || "Unknown") === difficulty)
    const withVerdict = inBucket.filter(hasVerdict)
    const accepted = withVerdict.filter((s) => isAccepted(s.verdict))

    return {
      difficulty: difficulty as Difficulty | "Unknown",
      solved: inBucket.length,
      avgTime: inBucket.length ? Math.round(inBucket.reduce((sum, s) => sum + (s.timeSpent || 0), 0) / inBucket.length) : 0,
      successRate: withVerdict.length ? Math.round((accepted.length / withVerdict.length) * 100) : null
    }
  })
}

export function computeLanguageDistribution(submissions: AnalyticsSubmission[]): { language: string; count: number }[] {
  const counts = new Map<string, number>()
  for (const s of submissions) {
    const lang = s.language?.trim() || "Unknown"
    counts.set(lang, (counts.get(lang) || 0) + 1)
  }
  return Array.from(counts.entries())
    .map(([language, count]) => ({ language, count }))
    .sort((a, b) => b.count - a.count)
}

export function overallSuccessRate(submissions: AnalyticsSubmission[]): number | null {
  const withVerdict = submissions.filter(hasVerdict)
  if (withVerdict.length === 0) return null
  const accepted = withVerdict.filter((s) => isAccepted(s.verdict))
  return Math.round((accepted.length / withVerdict.length) * 100)
}

export type TopicMastery = "Mastered" | "Practicing" | "Needs Practice"

export interface TopicStat {
  topic: string
  solved: number
  avgTime: number
  acceptance: number | null
  mastery: TopicMastery
}

export function computeTopicAnalytics(submissions: AnalyticsSubmission[]): TopicStat[] {
  const byTopic = new Map<string, AnalyticsSubmission[]>()
  for (const s of submissions) {
    for (const topic of s.topics || []) {
      if (!byTopic.has(topic)) byTopic.set(topic, [])
      byTopic.get(topic)!.push(s)
    }
  }

  const stats: TopicStat[] = Array.from(byTopic.entries()).map(([topic, subs]) => {
    const withVerdict = subs.filter(hasVerdict)
    const accepted = withVerdict.filter((s) => isAccepted(s.verdict))
    const acceptance = withVerdict.length ? Math.round((accepted.length / withVerdict.length) * 100) : null
    const avgTime = Math.round(subs.reduce((sum, s) => sum + (s.timeSpent || 0), 0) / subs.length)

    let mastery: TopicMastery = "Practicing"
    if (subs.length >= 5 && (acceptance === null || acceptance >= 70)) mastery = "Mastered"
    else if (subs.length <= 2 || (acceptance !== null && acceptance < 50)) mastery = "Needs Practice"

    return { topic, solved: subs.length, avgTime, acceptance, mastery }
  })

  return stats.sort((a, b) => b.solved - a.solved)
}

export function weakestTopics(topicStats: TopicStat[], limit = 3): TopicStat[] {
  return [...topicStats]
    .filter((t) => t.mastery === "Needs Practice")
    .sort((a, b) => (a.acceptance ?? 100) - (b.acceptance ?? 100))
    .slice(0, limit)
}

export function strongestTopics(topicStats: TopicStat[], limit = 3): TopicStat[] {
  return [...topicStats]
    .filter((t) => t.mastery === "Mastered")
    .sort((a, b) => b.solved - a.solved)
    .slice(0, limit)
}

export function generateInsights(submissions: AnalyticsSubmission[], topicStats: TopicStat[]): string[] {
  const insights: string[] = []
  if (submissions.length === 0) return insights

  const byTime = [...topicStats].sort((a, b) => a.avgTime - b.avgTime)
  if (byTime[0]) insights.push(`You solve ${byTime[0].topic} fastest, averaging ${formatDuration(byTime[0].avgTime)}.`)

  const weak = weakestTopics(topicStats, 1)[0]
  if (weak) insights.push(`You struggle with ${weak.topic}${weak.acceptance !== null ? ` (${weak.acceptance}% acceptance)` : ""} — worth another look.`)

  const difficultyStats = computeDifficultyBreakdown(submissions)
  const easy = difficultyStats.find((d) => d.difficulty === "Easy")
  const medium = difficultyStats.find((d) => d.difficulty === "Medium")
  if (easy && medium && easy.successRate !== null && medium.successRate !== null && medium.successRate > easy.successRate) {
    insights.push("You solve Medium problems more accurately than Easy ones.")
  }

  const now = Date.now()
  const THIRTY_DAYS = 30 * 86400000
  for (const stat of topicStats) {
    const subsForTopic = submissions.filter((s) => s.topics?.includes(stat.topic))
    const lastPracticed = Math.max(...subsForTopic.map((s) => new Date(s.submittedAt).getTime()))
    if (now - lastPracticed > THIRTY_DAYS) {
      insights.push(`You haven't practiced ${stat.topic} recently — it's been over 30 days.`)
      break
    }
  }

  return insights.slice(0, 5)
}

export interface Recommendation {
  title: string
  reason: string
}

export function generateRecommendations(
  topicStats: TopicStat[],
  options: { activeSheetName?: string; hasUnfinishedSheet?: boolean } = {}
): Recommendation[] {
  const recs: Recommendation[] = []

  const weak = weakestTopics(topicStats, 2)
  for (const topic of weak) {
    recs.push({
      title: `Practice ${topic.topic} today`,
      reason: topic.acceptance !== null ? `Only ${topic.acceptance}% acceptance so far.` : "Very little practice logged here."
    })
  }

  const stale = [...topicStats].filter((t) => t.mastery !== "Needs Practice")
  if (stale[0]) {
    recs.push({ title: `Review ${stale[0].topic}`, reason: "Keep it sharp with a refresher problem." })
  }

  if (options.hasUnfinishedSheet && options.activeSheetName) {
    recs.push({ title: `Continue ${options.activeSheetName}`, reason: "Pick up where you left off." })
  }

  if (recs.length === 0) {
    recs.push({ title: "Start a new practice session", reason: "No recent activity to branch off yet." })
  }

  return recs.slice(0, 5)
}

export interface InterviewReadiness {
  score: number
  strengths: string[]
  weaknesses: string[]
  roadmap: string[]
}

export function computeInterviewReadiness(
  submissions: AnalyticsSubmission[],
  topicStats: TopicStat[],
  streak: { current: number; longest: number }
): InterviewReadiness {
  if (submissions.length === 0) {
    return { score: 0, strengths: [], weaknesses: [], roadmap: ["Solve your first few problems to get a readiness score."] }
  }

  const volumeScore = Math.min(100, (submissions.length / 150) * 100)
  const topicCoverageScore = Math.min(100, (topicStats.length / 20) * 100)
  const consistencyScore = computeConsistencyScore(submissions, 30)
  const difficultyStats = computeDifficultyBreakdown(submissions)
  const hasHard = difficultyStats.find((d) => d.difficulty === "Hard")?.solved || 0
  const balanceScore = Math.min(100, (hasHard / 20) * 100)
  const accuracy = overallSuccessRate(submissions) ?? 60
  const streakScore = Math.min(100, (streak.current / 14) * 100)

  const score = Math.round(
    volumeScore * 0.25 +
      topicCoverageScore * 0.2 +
      consistencyScore * 0.2 +
      balanceScore * 0.15 +
      accuracy * 0.1 +
      streakScore * 0.1
  )

  const strengths: string[] = []
  const weaknesses: string[] = []

  if (volumeScore >= 60) strengths.push("Strong problem volume")
  else weaknesses.push("Low overall problem count")

  if (topicCoverageScore >= 60) strengths.push("Broad topic coverage")
  else weaknesses.push("Limited topic coverage")

  if (consistencyScore >= 50) strengths.push("Consistent practice habit")
  else weaknesses.push("Inconsistent practice schedule")

  if (balanceScore >= 40) strengths.push("Comfortable with Hard problems")
  else weaknesses.push("Needs more Hard-difficulty practice")

  const roadmap: string[] = []
  if (weaknesses.includes("Low overall problem count")) roadmap.push("Aim for at least 3-5 problems a week.")
  if (weaknesses.includes("Limited topic coverage")) roadmap.push("Branch into topics you haven't tried yet.")
  if (weaknesses.includes("Inconsistent practice schedule")) roadmap.push("Practice a little every day to build a streak.")
  if (weaknesses.includes("Needs more Hard-difficulty practice")) roadmap.push("Add Hard problems once Medium feels comfortable.")
  const weak = weakestTopics(topicStats, 1)[0]
  if (weak) roadmap.push(`Focus a session on ${weak.topic}.`)

  return { score, strengths, weaknesses, roadmap: roadmap.slice(0, 5) }
}

export function formatDuration(seconds: number): string {
  if (seconds >= 3600) return `${Math.round(seconds / 3600)}h`
  if (seconds >= 60) return `${Math.round(seconds / 60)}m`
  return `${Math.round(seconds)}s`
}

export interface WeakTopicData {
  topic: string
  score: number 
  level: "Strong" | "Average" | "Weak"
  stats: {
    solved: number
    avgAttempts: number
    failureRate: number 
    avgTime: number
    difficultyMix: { Easy: number; Medium: number; Hard: number }
  }
}

export function computeWeakTopicRadar(submissions: AnalyticsSubmission[]): WeakTopicData[] {
  if (submissions.length === 0) return []

  const byTopic = new Map<string, AnalyticsSubmission[]>()
  for (const s of submissions) {
    for (const topic of s.topics || []) {
      if (!byTopic.has(topic)) byTopic.set(topic, [])
      byTopic.get(topic)!.push(s)
    }
  }

  const radarData: WeakTopicData[] = []

  for (const [topic, subs] of byTopic.entries()) {
    if (subs.length < 2) continue 

    const withVerdict = subs.filter((s) => typeof s.verdict === "string" && s.verdict.length > 0)
    const accepted = withVerdict.filter((s) => s.verdict === "Accepted")
    const failed = withVerdict.filter((s) => s.verdict !== "Accepted")
    
    const solved = subs.length
    const avgAttempts = subs.reduce((sum, s) => sum + (s.attempts || 1), 0) / solved
    const failureRate = withVerdict.length > 0 ? (failed.length / withVerdict.length) * 100 : 0
    const avgTime = subs.reduce((sum, s) => sum + (s.timeSpent || 0), 0) / solved

    const difficultyMix = { Easy: 0, Medium: 0, Hard: 0 }
    for (const s of subs) {
      if (s.difficulty && difficultyMix.hasOwnProperty(s.difficulty)) {
        difficultyMix[s.difficulty]++
      }
    }
    
    const failureRateScore = Math.min(100, failureRate * 1.5) 
    const attemptsScore = Math.min(100, (avgAttempts / 5) * 100) 
    const timeScore = Math.min(100, (avgTime / 1800) * 100) 
    
    const hardRatio = solved > 0 ? difficultyMix.Hard / solved : 0
    const difficultyAdjustment = hardRatio * 30 
    
    const rawScore = (
      failureRateScore * 0.4 +
      attemptsScore * 0.2 +
      timeScore * 0.15
    ) - difficultyAdjustment
    
    const score = Math.max(0, Math.min(100, Math.round(rawScore)))

    let level: "Strong" | "Average" | "Weak"
    if (score >= 60) level = "Weak"
    else if (score >= 30) level = "Average"
    else level = "Strong"

    radarData.push({
      topic,
      score,
      level,
      stats: {
        solved,
        avgAttempts: Math.round(avgAttempts * 10) / 10,
        failureRate: Math.round(failureRate * 10) / 10,
        avgTime: Math.round(avgTime),
        difficultyMix
      }
    })
  }

  return radarData.sort((a, b) => b.score - a.score)
}

export interface DailyPerformanceMetrics {
  date: string
  solved: number
  attempts: number
  accuracy: number | null 
}

export interface DailyPerformanceComparison {
  today: DailyPerformanceMetrics
  yesterday: DailyPerformanceMetrics | null
  goalTarget: number
  goalMet: boolean
  solvedChangePercent: number | null
  trend: "up" | "down" | "same" | "no-data"
}

function computeDayMetrics(submissions: AnalyticsSubmission[], dateKey: string): DailyPerformanceMetrics {
  const daySubs = submissions.filter((s) => dayKey(s.submittedAt) === dateKey)
  const solved = daySubs.filter((s) => isAccepted(s.verdict)).length
  const attempts = daySubs.length
  return {
    date: dateKey,
    solved,
    attempts,
    accuracy: attempts > 0 ? Math.round((solved / attempts) * 100) : null
  }
}

export function computeDailyPerformance(
  submissions: AnalyticsSubmission[],
  goalTarget: number
): DailyPerformanceComparison {
  const safeSubmissions = Array.isArray(submissions) ? submissions : []

  const todayKey = new Date().toISOString().slice(0, 10)
  const yesterdayKey = new Date(Date.now() - 86400000).toISOString().slice(0, 10)

  const todayMetrics = computeDayMetrics(safeSubmissions, todayKey)
  const hasYesterdayData = safeSubmissions.some((s) => dayKey(s.submittedAt) === yesterdayKey)
  const yesterdayMetrics = hasYesterdayData ? computeDayMetrics(safeSubmissions, yesterdayKey) : null

  const safeGoal = typeof goalTarget === "number" && goalTarget > 0 ? goalTarget : 0
  const goalMet = safeGoal > 0 && todayMetrics.solved >= safeGoal

  let solvedChangePercent: number | null = null
  let trend: DailyPerformanceComparison["trend"] = "no-data"

  if (yesterdayMetrics) {
    if (yesterdayMetrics.solved === 0 && todayMetrics.solved === 0) {
      trend = "same"
      solvedChangePercent = 0
    } else if (yesterdayMetrics.solved === 0) {
      trend = "up"
    } else {
      const percent = Math.round(
        ((todayMetrics.solved - yesterdayMetrics.solved) / yesterdayMetrics.solved) * 100
      )
      solvedChangePercent = percent
      trend = percent > 0 ? "up" : percent < 0 ? "down" : "same"
    }
  }

  return {
    today: todayMetrics,
    yesterday: yesterdayMetrics,
    goalTarget: safeGoal,
    goalMet,
    solvedChangePercent,
    trend
  }
}

export function getWeakTopicSummary(radarData: WeakTopicData[]): string {
  if (radarData.length === 0) return "Not enough data to analyze weak topics."
  
  const weakTopics = radarData.filter(t => t.level === "Weak")
  const avgTopics = radarData.filter(t => t.level === "Average")
  
  if (weakTopics.length > 0) {
    const names = weakTopics.slice(0, 3).map(t => t.topic).join(", ")
    return `${names} currently require the most attempts and have the highest failure rate.`
  }
  
  if (avgTopics.length > 0) {
    const names = avgTopics.slice(0, 3).map(t => t.topic).join(", ")
    return `${names} need more practice to strengthen.`
  }
  
  return "All topics are performing well! Keep up the great work."
}