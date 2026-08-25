import { BarChart2, BookOpen, User, Sparkles, Trophy, Clock, LayoutDashboard, ExternalLink, LogOut, Lock, ChevronRight, Edit2, Check, Loader2, X, Github, Globe } from "lucide-react"
import { useEffect, useState, type KeyboardEvent } from "react"
import "./style.css"

import LeetCodeLogin from "./components/LeetCodeLogin"
import AITab from "./components/AITab/AITab"
import PracticeSessions from "./components/Sessions/PracticeSessions"
import CelebrationOverlay from "~components/CelebrationOverlay"
import StatsTab from "~components/StatsTab"
import { ProductivityDashboard } from "./components/Dashboard/ProductivityDashboard"
import { apiUrl } from "./constants/api"
import { useLeetCodeUser } from "./hooks/useLeetCodeUser"
import { analyzeAlgorithm, analyzeComplexity } from "./services/aiService"
import { readChromeStorage, writeChromeStorage, onChromeStorageKeyChanged, CHROME_STORAGE_KEYS } from "./utils/storage"
import { getSheetById, DEFAULT_SHEET_ID, findDifficultyByQuestionName } from "./data/sheets"
import { getSimilarQuestions, type AlternativeProblem } from "./data/premiumAlternatives"
import { openInNewTab } from "./utils/navigation"
import {
  computeStreaks,
  computeTopicAnalytics,
  computeLanguageDistribution,
  groupSubmissionsByDay,
  mostActiveDayOfWeek,
  formatDuration,
  type AnalyticsSubmission,
  type DailyActivity
} from "./utils/analytics"
import type { LeetCodeUser } from "./types/shared"

type RecentActivityEntry = {
  questionName: string
  submittedAt: string
  verdict?: string
}

type ProfileSummary = {
  streak: number
  longestStreak: number
  totalSolved: number
  sheetName: string
  avgTime: number
  favoriteTopic: string
  favoriteLanguage: string
  mostActiveDay: string
  calendarPreview: DailyActivity[]
  recentActivity: RecentActivityEntry[]
}

function IndexSidePanel() {
  const [aiContext, setAiContext] = useState<{ description: string; code: string }>({ description: "", code: "" })
  const [buttonClicked, setButtonClicked] = useState<string | null>(null)
  const [title, setTitle] = useState("")
  const [verdict, setVerdict] = useState("")
  const [attempts, setAttempts] = useState(0)
  const { leetcodeUser, restoreUserFromStorage, saveUserToStorage, fetchLeetCodeUser, logout } = useLeetCodeUser()
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"dashboard" | "profile" | "stats" | "practice" | "ai">("dashboard")
  const [prev, setPrev] = useState("")
  const [timerStart, setTimerStart] = useState<Date | null>(null)
  const [elapsed, setElapsed] = useState<number>(0)
  const [timerStopped, setTimerStopped] = useState(false)
  const [isAccepted, setIsAccepted] = useState(false)
  const [frozenElapsed, setFrozenElapsed] = useState<number>(0)

  const [showCelebration, setShowCelebration] = useState(false)
  const [profileSummary, setProfileSummary] = useState<ProfileSummary | null>(null)

  // Premium problem alternatives state
  const [isPremiumProblem, setIsPremiumProblem] = useState(false)
  const [currentProblemSlug, setCurrentProblemSlug] = useState<string | null>(null)
  const [premiumAlternatives, setPremiumAlternatives] = useState<AlternativeProblem[]>([])

  // GitHub Integration State
  const [githubConnected, setGithubConnected] = useState(false)
  const [githubUsername, setGithubUsername] = useState("")
  const [githubRepo, setGithubRepo] = useState("")
  const [githubBranch, setGithubBranch] = useState("main")
  const [githubRepos, setGithubRepos] = useState<Array<{name: string, fullName: string, private: boolean}>>([])
  const [githubBranches, setGithubBranches] = useState<string[]>([])
  const [githubLoading, setGithubLoading] = useState(false)
  const [githubError, setGithubError] = useState("")
  const [githubSuccess, setGithubSuccess] = useState("")
  const [githubAuthStep, setGithubAuthStep] = useState<"idle" | "oauth" | "select_repo">("idle")
  const [githubOAuthUrl, setGithubOAuthUrl] = useState("")

  // Daily Goal editing state.
  // dailyGoal itself is deliberately NOT part of `profileSummary` - that
  // summary is only (re)loaded once per session (guarded by `!profileSummary`
  // below), so bundling dailyGoal into it meant editing the goal from the
  // Dashboard's DailyGoalRing left the Profile tab showing a stale cached
  // value until a full reload. Tracking it as its own state, refreshed via
  // chrome.storage.onChanged, keeps both surfaces in sync regardless of
  // which one made the edit.
  const [dailyGoal, setDailyGoal] = useState<number>(3)
  const [dailyGoalEditing, setDailyGoalEditing] = useState(false)
  const [dailyGoalInput, setDailyGoalInput] = useState("")
  const [dailyGoalSaving, setDailyGoalSaving] = useState(false)
  const [dailyGoalError, setDailyGoalError] = useState("")
  const [dailyGoalSuccess, setDailyGoalSuccess] = useState("")

  useEffect(() => {
    let cancelled = false
    readChromeStorage<number>(CHROME_STORAGE_KEYS.DAILY_GOAL, 3).then((value) => {
      // eslint-disable-next-line no-console
      console.log("[LeetBuddy DailyGoal] Profile mount-load read:", value, "cancelled:", cancelled)
      if (!cancelled) setDailyGoal(value)
    })
    const unsubscribe = onChromeStorageKeyChanged<number>(CHROME_STORAGE_KEYS.DAILY_GOAL, (value) => {
      // eslint-disable-next-line no-console
      console.log("[LeetBuddy DailyGoal] Profile onChanged fired:", value, "cancelled:", cancelled)
      if (typeof value === "number" && !cancelled) setDailyGoal(value)
    })
    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [])

  useEffect(() => {
    let interval: number | null = null
    if (timerStart && !timerStopped) {
      interval = setInterval(() => {
        setElapsed(Math.floor((Date.now() - timerStart.getTime()) / 1000))
      }, 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [timerStart, timerStopped])

  useEffect(() => {
    if (timerStopped) {
      setFrozenElapsed(elapsed)
    }
  }, [timerStopped])

  const handleUserFound = async (user: LeetCodeUser) => {
    await saveUserToStorage(user)
    await syncUserProfile(user)
  }

  useEffect(() => {
    const initializeUser = async () => {
      const cachedUser = await restoreUserFromStorage()
      const freshUser = await fetchLeetCodeUser(handleUserFound)
      // fetchLeetCodeUser resolves null (not undefined) only when LeetCode
      // actively confirmed there's no session — safe to clear a stale cache.
      if (freshUser === null && cachedUser) {
        await logout()
      }
      setIsLoading(false)
    }
    initializeUser()
  }, [])

  // Load a lightweight profile summary (streak, solved count, active sheet,
  // daily goal) the first time the Profile tab is opened. Reuses the same
  // storage keys and endpoints ProductivityDashboard already relies on.
  useEffect(() => {
    if (activeTab !== "profile" || !leetcodeUser?.username || profileSummary) return

    const loadProfileSummary = async () => {
      const sheetId = await readChromeStorage<string>(CHROME_STORAGE_KEYS.SELECTED_SHEET, DEFAULT_SHEET_ID)

      let streak = 0
      let totalSolved = 0
      let longestStreak = 0
      let avgTime = 0
      let favoriteTopic = "—"
      let favoriteLanguage = "—"
      let mostActiveDay = "—"
      let calendarPreview: DailyActivity[] = []
      let recentActivity: RecentActivityEntry[] = []

      try {
        const userRes = await fetch(apiUrl("/api/users/create-or-get"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: leetcodeUser.username })
        })
        if (userRes.ok) {
          const userData = await userRes.json()
          streak = userData?.user?.streak?.current || 0
        }
      } catch {
        // ignore streak fetch errors
      }

      try {
        const submissionsRes = await fetch(apiUrl(`/api/submissions/user/${leetcodeUser.username}`))
        if (submissionsRes.ok) {
          const submissions: AnalyticsSubmission[] = await submissionsRes.json()
          totalSolved = Array.isArray(submissions) ? submissions.length : 0

          if (totalSolved > 0) {
            recentActivity = submissions.slice(0, 5).map((s) => ({
              questionName: s.questionName,
              submittedAt: s.submittedAt,
              verdict: s.verdict
            }))
            longestStreak = computeStreaks(submissions).longest
            avgTime = Math.round(submissions.reduce((sum, s) => sum + (s.timeSpent || 0), 0) / totalSolved)

            const topicStats = computeTopicAnalytics(submissions)
            favoriteTopic = topicStats[0]?.topic || "—"

            const languageStats = computeLanguageDistribution(submissions)
            favoriteLanguage = languageStats.find((l) => l.language !== "Unknown")?.language || "—"

            mostActiveDay = mostActiveDayOfWeek(submissions) || "—"

            const last14Days = submissions.filter(
              (s) => Date.now() - new Date(s.submittedAt).getTime() < 14 * 86400000
            )
            calendarPreview = groupSubmissionsByDay(last14Days)
          }
        }
      } catch {
        // ignore submissions fetch errors
      }

      setProfileSummary({
        streak,
        longestStreak,
        totalSolved,
        sheetName: getSheetById(sheetId).shortName,
        avgTime,
        favoriteTopic,
        favoriteLanguage,
        mostActiveDay,
        calendarPreview,
        recentActivity
      })
    }

    loadProfileSummary()
  }, [activeTab, leetcodeUser?.username, profileSummary])

  // Load GitHub connection status the first time the Profile tab is opened.
  useEffect(() => {
    if (activeTab !== "profile" || !leetcodeUser?.username) return

    const loadGithubStatus = async () => {
      try {
        const res = await fetch(apiUrl(`/api/github/status/${leetcodeUser.username}`))
        if (!res.ok) return
        const data = await res.json()
        setGithubConnected(!!data.connected)
        setGithubUsername(data.username || "")
        setGithubRepo(data.repo || "")
        setGithubBranch(data.branch || "main")
        if (data.connected && !data.repo) {
          // Connected before the automatic DSA-repo setup existed (or it
          // failed transiently during connect) - retry it before falling
          // back to manual repo selection.
          await ensureDsaRepo()
        }
      } catch {
        // ignore status fetch errors
      }
    }

    loadGithubStatus()
  }, [activeTab, leetcodeUser?.username])

  useEffect(() => {
    const listener = (msg: any) => {
      if (msg.type === "QUESTION_INFO") {
        if (msg.title !== prev) {
          setVerdict("—")
          setButtonClicked("—")
          setIsAccepted(false)
          setPrev(msg.title)
          setTimerStart(new Date())
          setElapsed(0)  
          setFrozenElapsed(0) 
          setTimerStopped(false)
        }
        setTitle(msg.title)

        const premium = !!msg.isPremium
        setIsPremiumProblem(premium)
        setCurrentProblemSlug(msg.slug || null)
        // Similar Questions Across Platforms is shown for both locked/premium
        // and free problems - it isn't gated on the premium flag anymore, so
        // always look up alternatives for whatever problem is currently open.
        // getSimilarQuestions falls back to generated search links when there
        // is no curated PREMIUM_ALTERNATIVES entry, so the section isn't
        // empty for the vast majority of problems that aren't in that list.
        setPremiumAlternatives(getSimilarQuestions(msg.slug || "", msg.title))
      }
      if (msg.type === "VERDICT") {
        if (msg.source === "submit") {
          setButtonClicked("Submit")
          const accepted = msg.verdict === "Accepted"
          setIsAccepted(accepted)
          setShowCelebration(true)

          // Calculate time spent from elapsed time (convert seconds to seconds for submission)
          const submissionTimeSpent = elapsed || frozenElapsed || 0;
          
          handleStoreSubmission({
              questionName: title,
              attempts: msg.attempts || attempts,
              timeSpent: submissionTimeSpent,
              code: msg.code || "",
              verdict: msg.verdict,
              language: msg.language || ""
            });

          if (accepted) {
            setTimerStopped(true)
          }
        }
        setVerdict(msg.verdict)
        if (msg.attempts) setAttempts(msg.attempts)
      }
      if (msg.type === "OPEN_AI_TAB") {
        setActiveTab("ai")
        setAiContext({
          description: msg.description || "",
          code: msg.code || ""
        })
      }
    }

    chrome.runtime.onMessage.addListener(listener)
    return () => chrome.runtime.onMessage.removeListener(listener)
  }, [prev])

const handleStoreSubmission = async (data: {
  questionName: string;
  attempts: number;
  timeSpent: number;
  code: string;
  verdict?: string;
  language?: string;
}) => {
  try {
    // First, analyze the algorithm
    const { topics } = await analyzeAlgorithm(data.code);
    const difficulty = findDifficultyByQuestionName(data.questionName);

    let timeComplexity = "Unknown";
    let spaceComplexity = "Unknown";

    try {
      const complexity = await analyzeComplexity(data.code);
      timeComplexity = complexity.timeComplexity || timeComplexity;
      spaceComplexity = complexity.spaceComplexity || spaceComplexity;
    } catch (complexityErr) {
      console.error("Complexity analysis error:", complexityErr);
    }

    // Then store the submission
    const submissionRes = await fetch(apiUrl("/api/submissions"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: leetcodeUser?.username,
        questionName: data.questionName,
        attempts: data.attempts,
        timeSpent: data.timeSpent,
        topics,
        difficulty,
        verdict: data.verdict,
        language: data.language,
        code: data.code,
        timeComplexity,
        spaceComplexity
      })
    });

    if (!submissionRes.ok) {
      throw new Error("Submission storage failed");
    }
  } catch (err) {
    console.error("Failed to store submission:", err);
  }

  // GitHub sync only ever runs for an ACCEPTED verdict - rejected/wrong
  // answer/compile error/runtime error/unfinished code must never reach
  // GitHub. This is a separate, independent try/catch from submission
  // storage above so a GitHub failure (not connected, API hiccup) can never
  // block or corrupt the LeetBuddy submission record itself.
  if (data.verdict === "Accepted" && leetcodeUser?.username) {
    try {
      await fetch(apiUrl("/api/github/push-solution"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: leetcodeUser.username,
          questionName: data.questionName,
          code: data.code,
          language: data.language,
          verdict: data.verdict
        })
      });
      // Intentionally not surfacing errors here: GitHub sync is an optional
      // convenience feature. A user who hasn't connected GitHub yet
      // (backend responds 400 "GitHub not fully configured") shouldn't see
      // an error toast every time they solve a problem.
    } catch (githubErr) {
      console.error("GitHub push-solution failed:", githubErr);
    }
  }
};

  const syncUserProfile = async (user: LeetCodeUser) => {
    try {
      const response = await fetch(apiUrl("/api/users/create-or-get"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user)
      })
      const json = await response.json()
      return json?.user
    } catch (error) {
      console.error("Failed to sync user profile:", error)
      return null
    }
  }

  const startEditDailyGoal = () => {
    setDailyGoalInput(String(dailyGoal))
    setDailyGoalError("")
    setDailyGoalEditing(true)
  }

  const cancelEditDailyGoal = () => {
    setDailyGoalEditing(false)
    setDailyGoalError("")
  }

  const saveDailyGoal = async () => {
    const value = parseInt(dailyGoalInput, 10)
    if (isNaN(value) || value < 1 || value > 100) {
      setDailyGoalError("Enter a number between 1 and 100")
      return
    }

    setDailyGoalSaving(true)
    setDailyGoalError("")
    try {
      await writeChromeStorage(CHROME_STORAGE_KEYS.DAILY_GOAL, value)
      // eslint-disable-next-line no-console
      console.log("[LeetBuddy DailyGoal] Profile saveDailyGoal wrote:", value)
      const verifyReadBack = await readChromeStorage<number>(CHROME_STORAGE_KEYS.DAILY_GOAL, -1)
      // eslint-disable-next-line no-console
      console.log("[LeetBuddy DailyGoal] Profile saveDailyGoal read-back immediately after write:", verifyReadBack)
      // Update local state immediately for instant feedback rather than
      // waiting on the chrome.storage.onChanged round-trip; other mounted
      // surfaces (e.g. the Dashboard's DailyGoalRing) still pick this up via
      // that listener.
      setDailyGoal(value)
      setDailyGoalEditing(false)
      setDailyGoalSuccess("Saved!")
      setTimeout(() => setDailyGoalSuccess(""), 2000)
    } catch (error) {
      setDailyGoalError("Failed to save. Please try again.")
    } finally {
      setDailyGoalSaving(false)
    }
  }

  const handleDailyGoalKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      saveDailyGoal()
    } else if (e.key === "Escape") {
      e.preventDefault()
      cancelEditDailyGoal()
    }
  }

  const loadGithubRepos = async () => {
    if (!leetcodeUser?.username) return
    try {
      const res = await fetch(apiUrl(`/api/github/repos/${leetcodeUser.username}`))
      const data = await res.json()
      if (res.ok && Array.isArray(data)) {
        setGithubRepos(data)
      }
    } catch {
      // ignore repo fetch errors
    }
  }

  // Idempotent: creates the user's own "DSA" repo if they don't have one yet,
  // or reuses it if they do. Used both as a fallback when /connect's
  // best-effort attempt didn't set a repo, and for users who connected
  // before this feature existed.
  const ensureDsaRepo = async () => {
    if (!leetcodeUser?.username) return
    try {
      const res = await fetch(apiUrl("/api/github/ensure-dsa-repo"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: leetcodeUser.username })
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setGithubRepo(data.repo)
        setGithubBranch(data.branch || "main")
        setGithubAuthStep("idle")
      } else {
        // Couldn't auto-create/reuse DSA (e.g. GitHub API hiccup) - fall
        // back to the existing manual repo-selection flow so the user isn't
        // stuck.
        setGithubAuthStep("select_repo")
        await loadGithubRepos()
      }
    } catch {
      setGithubAuthStep("select_repo")
      await loadGithubRepos()
    }
  }

  const loadGithubBranches = async (repo: string) => {
    if (!leetcodeUser?.username || !repo) return
    try {
      const res = await fetch(apiUrl(`/api/github/branches/${leetcodeUser.username}?repo=${encodeURIComponent(repo)}`))
      const data = await res.json()
      if (res.ok && Array.isArray(data)) {
        setGithubBranches(data)
      }
    } catch {
      // ignore branch fetch errors
    }
  }

  const connectGitHub = async () => {
    if (!leetcodeUser?.username) return
    if (typeof chrome === "undefined" || !chrome.identity) {
      setGithubError(
        "GitHub connect requires the Chrome extension environment (chrome.identity unavailable). " +
        "Make sure LeetBuddy is loaded as an unpacked/packed extension (not a browser preview tab) " +
        "and that the \"identity\" permission is granted, then reload the extension."
      )
      return
    }

    setGithubLoading(true)
    setGithubError("")
    try {
      const redirectUri = chrome.identity.getRedirectURL()
      setGithubAuthStep("oauth")

      const authUrlRes = await fetch(apiUrl(`/api/github/auth-url?redirect_uri=${encodeURIComponent(redirectUri)}`))
      const authUrlData = await authUrlRes.json()
      if (!authUrlRes.ok || !authUrlData.url) {
        setGithubError(authUrlData.error || "GitHub OAuth is not configured on the server.")
        return
      }
      setGithubOAuthUrl(authUrlData.url)

      const responseUrl = await new Promise<string | undefined>((resolve, reject) => {
        chrome.identity.launchWebAuthFlow(
          { url: authUrlData.url, interactive: true },
          (result) => {
            if (chrome.runtime.lastError || !result) {
              reject(new Error(chrome.runtime.lastError?.message || "GitHub authorization was cancelled."))
              return
            }
            resolve(result)
          }
        )
      })

      const code = responseUrl ? new URL(responseUrl).searchParams.get("code") : null
      if (!code) {
        setGithubError("GitHub did not return an authorization code.")
        return
      }

      const exchangeRes = await fetch(apiUrl("/api/github/exchange"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, redirectUri })
      })
      const exchangeData = await exchangeRes.json()
      if (!exchangeRes.ok || !exchangeData.accessToken) {
        setGithubError(exchangeData.error || "Failed to exchange GitHub authorization code.")
        return
      }

      const connectRes = await fetch(apiUrl("/api/github/connect"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: leetcodeUser.username,
          accessToken: exchangeData.accessToken,
          githubUsername: exchangeData.githubUsername
        })
      })
      const connectData = await connectRes.json()
      if (!connectRes.ok || !connectData.success) {
        setGithubError(connectData.error || "Failed to save GitHub connection.")
        return
      }

      setGithubConnected(true)
      setGithubUsername(exchangeData.githubUsername)
      setGithubSuccess("GitHub connected!")
      setTimeout(() => setGithubSuccess(""), 2500)

      // /connect already tried to auto-create/reuse this user's own DSA repo.
      // If that succeeded, skip the manual repo picker entirely; otherwise
      // fall back to it (or retry via ensureDsaRepo) so the user isn't stuck.
      if (connectData.github?.repo) {
        setGithubRepo(connectData.github.repo)
        setGithubBranch(connectData.github.branch || "main")
        setGithubAuthStep("idle")
      } else {
        await ensureDsaRepo()
      }
    } catch (error: any) {
      setGithubError(error?.message || "GitHub connection failed. Please try again.")
      setGithubAuthStep("idle")
    } finally {
      setGithubLoading(false)
    }
  }

  const selectGithubRepo = async (repo: string, branch: string) => {
    if (!leetcodeUser?.username || !repo) return
    setGithubLoading(true)
    setGithubError("")
    try {
      const res = await fetch(apiUrl("/api/github/select-repo"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: leetcodeUser.username, repo, branch })
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setGithubRepo(repo)
        setGithubBranch(branch)
        setGithubAuthStep("idle")
        setGithubSuccess("Repository selected!")
        setTimeout(() => setGithubSuccess(""), 2000)
      } else {
        setGithubError(data.error || "Failed to select repository.")
      }
    } catch {
      setGithubError("Failed to select repository.")
    } finally {
      setGithubLoading(false)
    }
  }

  const disconnectGithub = async () => {
    if (!leetcodeUser?.username) return
    setGithubLoading(true)
    setGithubError("")
    try {
      await fetch(apiUrl("/api/github/disconnect"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: leetcodeUser.username })
      })
      setGithubConnected(false)
      setGithubUsername("")
      setGithubRepo("")
      setGithubBranch("main")
      setGithubRepos([])
      setGithubBranches([])
      setGithubAuthStep("idle")
    } catch {
      setGithubError("Failed to disconnect GitHub.")
    } finally {
      setGithubLoading(false)
    }
  }

  const openLeetCodeLogin = () => {
    const loginUrl = "https://leetcode.com/accounts/login/"
    if (typeof chrome !== "undefined" && chrome.tabs) {
      chrome.tabs.create({ url: loginUrl })
    } else {
      window.open(loginUrl, "_blank")
    }
    checkLoginWithTimeout(20000, 1500)
  }

  const checkLoginWithTimeout = async (timeoutMs = 15000, intervalMs = 1000) => {
    const start = Date.now()
    while (Date.now() - start < timeoutMs) {
      const user = await fetchLeetCodeUser(handleUserFound)
      if (user) return
      await new Promise((resolve) => setTimeout(resolve, intervalMs))
    }
  }

  if (leetcodeUser) {
    return (
      <>
      {showCelebration && (
        <CelebrationOverlay
          questionName={title}
          buttonClicked={buttonClicked ?? "—"}
          verdict={verdict}
          attempts={attempts}
          onClose={() => setShowCelebration(false)}
        />
      )}
      <div className="h-screen w-full max-w-[440px] bg-gradient-to-br from-gray-950 via-gray-900 to-black text-gray-200 overflow-hidden relative">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-yellow-400/5 rounded-full blur-3xl animate-float"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl animate-float-delayed"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/3 rounded-full blur-3xl animate-pulse-slow"></div>
        </div>

        <div className="relative z-10 p-4 h-full overflow-y-auto">
          {/* Header with user info */}
          <div className="mb-6 animate-slide-down">
            <div className="flex items-center gap-4 p-4 bg-gray-800/30 backdrop-blur-md rounded-2xl border border-gray-700/50 shadow-2xl hover:shadow-yellow-500/10 transition-all duration-500 hover:scale-[1.02]">
              <div className="relative group">
                <img
                  src={leetcodeUser.avatar}
                  alt="Profile"
                  className="w-14 h-14 rounded-full border-2 border-yellow-400 shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:shadow-yellow-400/50"
                />
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-2 border-gray-900 animate-pulse-glow"></div>
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-yellow-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-white flex items-center gap-2 group">
                  {leetcodeUser.username}
                  <Trophy className="text-yellow-400 group-hover:animate-bounce transition-all duration-300" size={16} />
                </h2>
                <p className="text-sm text-gray-400 transition-colors duration-300 hover:text-gray-300">
                  Ranking #{leetcodeUser.ranking.toLocaleString()}
                </p>
              </div>
              <button
                onClick={logout}
                title="Logout"
                aria-label="Logout"
                className="relative z-10 p-2 rounded-xl text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors duration-300"
              >
                <LogOut size={18} />
              </button>
              <div className="absolute top-0 right-0 w-full h-full rounded-2xl bg-gradient-to-br from-yellow-400/5 to-purple-500/5 opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex justify-center gap-2 mb-6 p-2 bg-gray-800/20 backdrop-blur-md rounded-2xl border border-gray-700/30 shadow-xl">
            {[
              { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
              { id: "profile", label: "Profile", icon: <User size={18} /> },
              { id: "stats", label: "Stats", icon: <BarChart2 size={18} /> },
              { id: "practice", label: "Practice", icon: <BookOpen size={18} /> },
              { id: "ai", label: "AI", icon: <Sparkles size={18} /> }
            ].map((item: any, index) => (
              <button
                key={item.id}
                title={item.label}
                aria-label={item.label}
                className={`relative flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-500 ease-out group overflow-hidden ${
                  activeTab === item.id
                    ? "bg-gradient-to-br from-yellow-400 to-orange-500 text-black shadow-lg shadow-yellow-500/25 scale-110"
                    : "text-gray-400 hover:text-white hover:bg-gray-700/50 hover:scale-105"
                }`}
                onClick={() => setActiveTab(item.id)}
                style={{ 
                  animationDelay: `${index * 100}ms`,
                  transform: activeTab === item.id ? 'translateY(-2px)' : 'translateY(0)'
                }}
              >
                <span className={`transition-all duration-300 z-10 relative ${
                  activeTab === item.id ? "scale-110 drop-shadow-md" : "group-hover:scale-110"
                }`}>
                  {item.icon}
                </span>
                
                {activeTab === item.id && (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/30 to-orange-500/30 rounded-xl blur animate-pulse"></div>
                    <div className="absolute -inset-1 bg-gradient-to-br from-yellow-400/20 to-orange-500/20 rounded-xl blur-md animate-pulse-slow"></div>
                  </>
                )}
                
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="bg-gray-800/20 backdrop-blur-md rounded-2xl border border-gray-700/30 shadow-2xl min-h-[65vh] overflow-hidden">
            <div className="p-2 h-full overflow-y-auto custom-scrollbar">
              {activeTab === "dashboard" && (
                <ProductivityDashboard
                  username={leetcodeUser.username}
                  onNavigateTab={(tab) => setActiveTab(tab)}
                />
              )}

              {activeTab === "profile" && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-gradient-to-br from-yellow-400/20 to-orange-500/20 rounded-lg">
                      <User className="text-yellow-400" size={20} />
                    </div>
                    <h3 className="text-lg font-semibold text-white">Profile Overview</h3>
                  </div>

                  {/* Connected LeetCode Account */}
                  <a
                    href={`https://leetcode.com/${leetcodeUser.username}/`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between bg-gray-900/60 rounded-2xl p-3.5 border border-gray-800 hover:border-yellow-500/30 transition-colors group"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                      <div>
                        <p className="text-xs font-bold text-white">Connected: {leetcodeUser.username}</p>
                        <p className="text-[10px] text-gray-500">
                          Ranking #{leetcodeUser.ranking.toLocaleString()}
                          {leetcodeUser.contestRating ? ` • Contest ${leetcodeUser.contestRating}` : ""}
                        </p>
                      </div>
                    </div>
                    <ExternalLink size={14} className="text-gray-500 group-hover:text-yellow-400 transition-colors" />
                  </a>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="bg-gray-900/60 p-3 rounded-2xl border border-gray-800 text-center">
                      <div className="text-[10px] text-amber-400 uppercase font-bold mb-1">Streak</div>
                      <div className="text-lg font-extrabold text-white">
                        {profileSummary ? `${profileSummary.streak}d` : "—"}
                      </div>
                    </div>
                    <div className="bg-gray-900/60 p-3 rounded-2xl border border-gray-800 text-center">
                      <div className="text-[10px] text-green-400 uppercase font-bold mb-1">Solved</div>
                      <div className="text-lg font-extrabold text-white">
                        {profileSummary ? profileSummary.totalSolved : "—"}
                      </div>
                    </div>
                    <div className="bg-gray-900/60 p-3 rounded-2xl border border-gray-800 text-center">
                      <div className="text-[10px] text-purple-400 uppercase font-bold mb-1">Sheet</div>
                      <div className="text-xs font-bold text-white truncate">
                        {profileSummary ? profileSummary.sheetName : "—"}
                      </div>
                    </div>
                    <div className="bg-gray-900/60 p-3 rounded-2xl border border-gray-800 text-center">
                      <div className="flex items-center justify-center gap-1 text-[10px] text-yellow-400 uppercase font-bold mb-1">
                        Daily Goal
                        {!dailyGoalEditing && (
                          <button
                            onClick={startEditDailyGoal}
                            title="Edit daily goal"
                            aria-label="Edit daily goal"
                            className="text-gray-500 hover:text-yellow-400 transition-colors"
                          >
                            <Edit2 size={10} />
                          </button>
                        )}
                      </div>

                      {dailyGoalEditing ? (
                        <div className="flex flex-col items-center gap-1">
                          <div className="flex items-center justify-center gap-1">
                            <input
                              type="number"
                              min={1}
                              max={100}
                              autoFocus
                              value={dailyGoalInput}
                              onChange={(e) => setDailyGoalInput(e.target.value)}
                              onKeyDown={handleDailyGoalKeyDown}
                              disabled={dailyGoalSaving}
                              className="w-14 bg-gray-800 border border-yellow-400/50 rounded px-1.5 py-0.5 text-sm text-white text-center focus:outline-none disabled:opacity-50"
                            />
                            {dailyGoalSaving ? (
                              <Loader2 size={14} className="text-yellow-400 animate-spin" />
                            ) : (
                              <>
                                <button
                                  onClick={saveDailyGoal}
                                  title="Save goal"
                                  aria-label="Save goal"
                                  className="text-green-400 hover:text-green-300 p-0.5"
                                >
                                  <Check size={14} />
                                </button>
                                <button
                                  onClick={cancelEditDailyGoal}
                                  title="Cancel"
                                  aria-label="Cancel"
                                  className="text-gray-500 hover:text-red-400 p-0.5"
                                >
                                  <X size={14} />
                                </button>
                              </>
                            )}
                          </div>
                          {dailyGoalError && (
                            <span className="text-[9px] text-red-400">{dailyGoalError}</span>
                          )}
                        </div>
                      ) : (
                        <div className="text-lg font-extrabold text-white">
                          {dailyGoalSuccess || `${dailyGoal}/day`}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Profile Analytics (Module 9) */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="bg-gray-900/60 p-3 rounded-2xl border border-gray-800 text-center">
                      <div className="text-[10px] text-orange-400 uppercase font-bold mb-1">Longest Streak</div>
                      <div className="text-lg font-extrabold text-white">
                        {profileSummary ? `${profileSummary.longestStreak}d` : "—"}
                      </div>
                    </div>
                    <div className="bg-gray-900/60 p-3 rounded-2xl border border-gray-800 text-center">
                      <div className="text-[10px] text-cyan-400 uppercase font-bold mb-1">Avg Time</div>
                      <div className="text-lg font-extrabold text-white">
                        {profileSummary ? formatDuration(profileSummary.avgTime) : "—"}
                      </div>
                    </div>
                    <div className="bg-gray-900/60 p-3 rounded-2xl border border-gray-800 text-center">
                      <div className="text-[10px] text-pink-400 uppercase font-bold mb-1">Favorite Topic</div>
                      <div className="text-xs font-bold text-white truncate">
                        {profileSummary ? profileSummary.favoriteTopic : "—"}
                      </div>
                    </div>
                    <div className="bg-gray-900/60 p-3 rounded-2xl border border-gray-800 text-center">
                      <div className="text-[10px] text-blue-400 uppercase font-bold mb-1">Favorite Language</div>
                      <div className="text-xs font-bold text-white truncate">
                        {profileSummary ? profileSummary.favoriteLanguage : "—"}
                      </div>
                    </div>
                  </div>

                  {profileSummary && (
                    <div className="bg-gray-900/60 rounded-2xl p-3 border border-gray-800">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] text-gray-400 uppercase font-bold">Last 14 Days</span>
                        <span className="text-[10px] text-gray-500">
                          Most active: <span className="text-gray-300 font-semibold">{profileSummary.mostActiveDay}</span>
                        </span>
                      </div>
                      <div className="flex gap-1">
                        {Array.from({ length: 14 }).map((_, i) => {
                          const date = new Date()
                          date.setDate(date.getDate() - (13 - i))
                          const iso = date.toISOString().slice(0, 10)
                          const day = profileSummary.calendarPreview.find((d) => d.date === iso)
                          const intensity = !day ? "bg-gray-800" : day.count < 2 ? "bg-emerald-800" : day.count < 4 ? "bg-emerald-600" : "bg-emerald-400"
                          return <div key={iso} title={`${iso}: ${day?.count || 0} solved`} className={`flex-1 h-4 rounded-sm ${intensity}`} />
                        })}
                      </div>
                    </div>
                  )}

                  {/* Recent Activity */}
                  <div className="bg-gray-900/60 rounded-2xl p-3.5 border border-gray-800">
                    <div className="flex items-center gap-1.5 mb-2.5 text-xs font-bold text-gray-400 uppercase tracking-wider">
                      <Clock size={13} className="text-cyan-400" />
                      Recent Activity
                    </div>
                    {!profileSummary ? (
                      <div className="space-y-2">
                        {[0, 1, 2].map((i) => (
                          <div key={i} className="h-9 rounded-lg bg-gray-800/50 animate-pulse" />
                        ))}
                      </div>
                    ) : profileSummary.recentActivity.length === 0 ? (
                      <p className="text-xs text-gray-500 text-center py-2">
                        No submissions yet — solve a problem on LeetCode to see it here.
                      </p>
                    ) : (
                      <div className="space-y-1.5">
                        {profileSummary.recentActivity.map((entry, i) => (
                          <div
                            key={`${entry.questionName}-${i}`}
                            className="flex items-center justify-between text-xs p-2 bg-gray-800/40 rounded-lg"
                          >
                            <span className="text-gray-300 truncate mr-2">{entry.questionName}</span>
                            <span
                              className={`text-[10px] font-semibold shrink-0 ${
                                entry.verdict === "Accepted" ? "text-green-400" : "text-gray-500"
                              }`}
                            >
                              {entry.verdict || "—"}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* GitHub Sync */}
                  <div className="bg-gray-900/60 rounded-2xl p-3.5 border border-gray-800">
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400 uppercase tracking-wider">
                        <Github size={13} className="text-gray-300" />
                        GitHub Sync
                      </div>
                      {githubConnected && (
                        <button
                          onClick={disconnectGithub}
                          disabled={githubLoading}
                          className="text-[10px] text-gray-500 hover:text-red-400 transition-colors disabled:opacity-50"
                        >
                          Disconnect
                        </button>
                      )}
                    </div>

                    {githubError && (
                      <p className="text-[10px] text-red-400 mb-2">{githubError}</p>
                    )}
                    {githubSuccess && (
                      <p className="text-[10px] text-green-400 mb-2">{githubSuccess}</p>
                    )}

                    {!githubConnected ? (
                      <button
                        onClick={connectGitHub}
                        disabled={githubLoading}
                        className="w-full py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-colors"
                      >
                        {githubLoading ? <Loader2 size={14} className="animate-spin" /> : <Github size={14} />}
                        {githubLoading ? "Connecting..." : "Connect GitHub"}
                      </button>
                    ) : githubAuthStep === "select_repo" || !githubRepo ? (
                      <div className="space-y-2">
                        <p className="text-[10px] text-gray-500">
                          Connected as <span className="text-gray-300 font-semibold">{githubUsername}</span>. Select a repository to sync solutions to:
                        </p>
                        <select
                          value={githubRepo}
                          onChange={(e) => {
                            const repo = e.target.value
                            setGithubRepo(repo)
                            setGithubBranches([])
                            if (repo) loadGithubBranches(repo)
                          }}
                          className="w-full bg-gray-800/80 rounded-xl p-2 text-xs text-white border border-gray-700/50 focus:outline-none"
                        >
                          <option value="">Select repository...</option>
                          {githubRepos.map((r) => (
                            <option key={r.fullName} value={r.name}>
                              {r.fullName}{r.private ? " (private)" : ""}
                            </option>
                          ))}
                        </select>
                        {githubRepo && (
                          <>
                            <select
                              value={githubBranch}
                              onChange={(e) => setGithubBranch(e.target.value)}
                              className="w-full bg-gray-800/80 rounded-xl p-2 text-xs text-white border border-gray-700/50 focus:outline-none"
                            >
                              {(githubBranches.length ? githubBranches : ["main"]).map((b) => (
                                <option key={b} value={b}>{b}</option>
                              ))}
                            </select>
                            <button
                              onClick={() => selectGithubRepo(githubRepo, githubBranch)}
                              disabled={githubLoading}
                              className="w-full py-1.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl"
                            >
                              {githubLoading ? "Saving..." : "Save Repository"}
                            </button>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-between text-xs">
                        <div className="min-w-0">
                          <p className="text-gray-300 font-semibold truncate">{githubUsername}</p>
                          <p className="text-[10px] text-gray-500 truncate">{githubRepo} · {githubBranch}</p>
                        </div>
                        <button
                          onClick={() => {
                            loadGithubRepos()
                            setGithubAuthStep("select_repo")
                          }}
                          className="text-[10px] text-gray-500 hover:text-yellow-400 transition-colors shrink-0 ml-2"
                        >
                          Change repo
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "stats" && (
                <div className="animate-fade-in">
                  <StatsTab username={leetcodeUser.username} />
                </div>
              )}

              {activeTab === "practice" && (
                <div className="animate-fade-in">
                  <PracticeSessions />
                </div>
              )}

              {activeTab === "ai" && (
                <div className="animate-fade-in">
                  <AITab
                    description={aiContext.description}
                    code={aiContext.code}
                    slug={currentProblemSlug || undefined}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Similar Questions Across Platforms - shown under the dashboard/
              profile content for whichever problem is currently open, for
              BOTH locked/premium and free problems (not gated on premium). */}
          {(activeTab === "dashboard" || activeTab === "profile") && premiumAlternatives.length > 0 && (
            <div className="mt-4 bg-gray-900/60 rounded-2xl p-3.5 border border-gray-700/50 animate-slide-down">
              <div className="flex items-center gap-2 mb-2.5 text-xs font-bold text-purple-400 uppercase tracking-wider">
                <Globe size={13} />
                Similar Questions Across Platforms
              </div>
              <div className="space-y-1.5">
                {premiumAlternatives.map((alt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      // Every alternative here points at another platform
                      // (GeeksforGeeks, Codeforces, CodeChef, etc.), never
                      // back at LeetCode itself - those always open in a NEW
                      // tab, same as YouTube, so the user's current LeetCode
                      // problem tab stays put.
                      openInNewTab(alt.url)
                    }}
                    title={alt.note}
                    className="w-full flex items-center justify-between text-left text-xs p-2 bg-gray-800/60 hover:bg-gray-800 rounded-lg border border-gray-800 hover:border-purple-500/40 transition-colors"
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      {alt.isSearch ? (
                        <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-400/10 text-purple-300">
                          Search
                        </span>
                      ) : (
                        <span
                          className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            alt.difficulty === "Easy"
                              ? "bg-green-400/10 text-green-400"
                              : alt.difficulty === "Medium"
                              ? "bg-yellow-400/10 text-yellow-400"
                              : "bg-red-400/10 text-red-400"
                          }`}
                        >
                          {alt.difficulty}
                        </span>
                      )}
                      <span className="truncate text-gray-200">
                        <span className="font-semibold text-white">{alt.platform}</span>
                        <span className="text-gray-500"> : </span>
                        {alt.title}
                      </span>
                    </span>
                    <ExternalLink size={11} className="shrink-0 text-gray-500" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
                        </>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-yellow-400/10 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-float-delayed"></div>
        </div>
        
        <div className="text-center z-10">
          <div className="relative mb-8">
            <div className="w-16 h-16 border-4 border-yellow-400/30 border-t-yellow-400 rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-purple-500 rounded-full animate-spin-reverse mx-auto"></div>
            <div className="absolute inset-2 w-12 h-12 border-2 border-transparent border-l-blue-400 rounded-full animate-spin-slow mx-auto"></div>
          </div>
          <div className="space-y-2">
            <p className="text-gray-300 animate-pulse font-medium">Initializing LeetCode Tracker...</p>
            <div className="flex justify-center space-x-1">
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        </div>
        
      </div>
      
    )
  }

  return (
    <div className="animate-fade-in">
      <LeetCodeLogin onLogin={openLeetCodeLogin} />
    </div>
    
  )
}

export default IndexSidePanel

/* Additional CSS for enhanced animations - Add this to your style.css */