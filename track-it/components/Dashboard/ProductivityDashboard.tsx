import React, { useState, useEffect, useMemo } from 'react';
import {
  Flame,
  Clock,
  CheckCircle,
  Play,
  Layers,
  BookOpen,
  Trophy
} from 'lucide-react';
import { DailyGoalRing } from './DailyGoalRing';
import { DailyPerformanceCard } from './DailyPerformanceCard';
import { WeeklyProgressSummary } from './WeeklyProgressSummary';
import { TodaysFocusCard } from './TodaysFocusCard';
import { QuickActionsBar } from './QuickActionsBar';
import { DashboardWidgets } from './DashboardWidgets';
import { AdvancedStats } from './AdvancedStats';
import type { DailyGoal, WeeklyActivityDay, FocusProblem } from './types';
import { formatSecondsToHMS } from '../../utils/time';
import { apiUrl } from '../../constants/api';
import { readChromeStorage, writeChromeStorage, onChromeStorageKeyChanged, CHROME_STORAGE_KEYS } from '../../utils/storage';
import { getSheetById, DEFAULT_SHEET_ID, type PracticeSheet } from '../../data/sheets';
import {
  computeStreaks,
  computeConsistencyScore,
  computeDifficultyBreakdown,
  computeLanguageDistribution,
  overallSuccessRate,
  computeWeeklyTrend,
  computeDailyPerformance,
  type AnalyticsSubmission
} from '../../utils/analytics';

interface ProductivityDashboardProps {
  username: string;
  onNavigateTab: (tab: 'profile' | 'stats' | 'practice' | 'ai') => void;
  onStartSession?: (session: any) => void;
}

export const ProductivityDashboard: React.FC<ProductivityDashboardProps> = ({
  username,
  onNavigateTab,
  onStartSession
}) => {
  const [activeSheet, setActiveSheet] = useState<PracticeSheet>(() => getSheetById(DEFAULT_SHEET_ID));
  const [goalTarget, setGoalTarget] = useState<number>(3);
  const [completedTodayCount, setCompletedTodayCount] = useState<number>(0);
  const [todayTimeSeconds, setTodayTimeSeconds] = useState<number>(0);
  const [streakCount, setStreakCount] = useState<number>(0);

  const [totalSolved, setTotalSolved] = useState<number>(0);
  const [totalBookmarks, setTotalBookmarks] = useState<number>(0);
  const [totalNotes, setTotalNotes] = useState<number>(0);

  const [completedQuestionIds, setCompletedQuestionIds] = useState<Set<string>>(new Set());
  const [recentSessions, setRecentSessions] = useState<any[]>([]);
  const [lastUnfinishedSession, setLastUnfinishedSession] = useState<any | null>(null);

  const [weeklyDays, setWeeklyDays] = useState<WeeklyActivityDay[]>([]);
  const [weeklyStats, setWeeklyStats] = useState({ solved: 0, time: 0, sessions: 0 });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [allSubmissions, setAllSubmissions] = useState<AnalyticsSubmission[]>([]);

  // Load persistent goal & sheet state
  useEffect(() => {
    const loadDashboardData = async () => {
      setIsLoading(true);
      // Load daily goal
      const savedGoal = await readChromeStorage<number>(CHROME_STORAGE_KEYS.DAILY_GOAL, 3);
      // eslint-disable-next-line no-console
      console.log("[LeetBuddy DailyGoal] Dashboard mount-load read:", savedGoal);
      setGoalTarget(savedGoal);

      // Load active sheet
      const savedSheetId = await readChromeStorage<string>(CHROME_STORAGE_KEYS.SELECTED_SHEET, DEFAULT_SHEET_ID);
      const sheet = getSheetById(savedSheetId);
      setActiveSheet(sheet);

      // Load sheet progress & bookmarks/notes
      if (username) {
        const progressKey = `leetbuddy.practice.progress.${username}.${sheet.id}`;
        const bookmarkKey = `leetbuddy.practice.bookmarks.${username}.${sheet.id}`;
        const noteKey = `leetbuddy.practice.notes.${username}.${sheet.id}`;
        const recentKey = `leetbuddy.practice.recent.${username}.${sheet.id}`;

        const [progressArr, bMarks, nTes, rSessions] = await Promise.all([
          readChromeStorage<string[]>(progressKey, []),
          readChromeStorage<Record<string, boolean>>(bookmarkKey, {}),
          readChromeStorage<Record<string, string>>(noteKey, {}),
          readChromeStorage<any[]>(recentKey, [])
        ]);

        setCompletedQuestionIds(new Set(progressArr));
        setTotalBookmarks(Object.keys(bMarks).length);
        setTotalNotes(Object.keys(nTes).length);
        setRecentSessions(rSessions);

        // Load backend submissions for today & weekly stats
        try {
          const res = await fetch(apiUrl(`/api/submissions/user/${username}`));
          if (res.ok) {
            const submissions: any[] = await res.json();
            setTotalSolved(submissions.length);
            setAllSubmissions(submissions);

            // Filter submissions for Today
            const todayStr = new Date().toISOString().split('T')[0];
            const todaySubs = submissions.filter((s) => {
              const subDate = new Date(s.submittedAt || s.createdAt).toISOString().split('T')[0];
              return subDate === todayStr;
            });

            setCompletedTodayCount(todaySubs.length);
            const totalSecondsToday = todaySubs.reduce((acc, curr) => acc + (curr.timeSpent || 0), 0);
            setTodayTimeSeconds(totalSecondsToday);

            // Compute 7-day activity
            const last7Days: WeeklyActivityDay[] = [];
            let wSolved = 0;
            let wTime = 0;

            for (let i = 6; i >= 0; i--) {
              const d = new Date();
              d.setDate(d.getDate() - i);
              const dateStr = d.toISOString().split('T')[0];
              const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });

              const daySubs = submissions.filter((s) => {
                const sDate = new Date(s.submittedAt || s.createdAt).toISOString().split('T')[0];
                return sDate === dateStr;
              });

              const dayTime = daySubs.reduce((acc, c) => acc + (c.timeSpent || 0), 0);
              wSolved += daySubs.length;
              wTime += dayTime;

              last7Days.push({
                dayName,
                dateStr,
                solvedCount: daySubs.length,
                timeSpentSeconds: dayTime,
                isToday: i === 0
              });
            }

            setWeeklyDays(last7Days);
            setWeeklyStats({ solved: wSolved, time: wTime, sessions: rSessions.length });
          }
        } catch {
          // ignore API error fallbacks
        }

        // Fetch user sessions to find unfinished session for Quick Continue
        try {
          const sessRes = await fetch(apiUrl(`/api/sessions/user/${username}?page=1&limit=5`));
          if (sessRes.ok) {
            const data = await sessRes.json();
            const list: any[] = Array.isArray(data) ? data : data.sessions || [];
            const unfinished = list.find((s) => !s.finishedAt);
            if (unfinished) setLastUnfinishedSession(unfinished);
          }
        } catch {
          // ignore session fetch errors
        }

        // Fetch streak
        try {
          const userRes = await fetch(apiUrl('/api/users/create-or-get'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username })
          });
          if (userRes.ok) {
            const userData = await userRes.json();
            if (userData?.user?.streak?.current) {
              setStreakCount(userData.user.streak.current);
            }
          }
        } catch {
          // ignore streak error
        }
      }

      setIsLoading(false);
    };

    loadDashboardData();
  }, [username]);

  // Keep goalTarget in sync if the goal is edited elsewhere (e.g. the
  // Profile tab's inline editor) while this component happens to already be
  // mounted, rather than only picking up changes on the next full remount.
  useEffect(() => {
    return onChromeStorageKeyChanged<number>(CHROME_STORAGE_KEYS.DAILY_GOAL, (value) => {
      // eslint-disable-next-line no-console
      console.log("[LeetBuddy DailyGoal] Dashboard onChanged fired:", value);
      if (typeof value === "number") setGoalTarget(value);
    });
  }, []);

  // Advanced analytics (Module 1): all derived from the same submissions
  // list already fetched above, via the shared analytics engine.
  const longestStreak = useMemo(() => computeStreaks(allSubmissions).longest, [allSubmissions]);
  const consistencyScore = useMemo(() => computeConsistencyScore(allSubmissions, 30), [allSubmissions]);
  const successRate = useMemo(() => overallSuccessRate(allSubmissions), [allSubmissions]);
  const difficultyStats = useMemo(() => computeDifficultyBreakdown(allSubmissions), [allSubmissions]);
  const languageStats = useMemo(() => computeLanguageDistribution(allSubmissions), [allSubmissions]);
  const weeklyTrend = useMemo(() => computeWeeklyTrend(allSubmissions, 8), [allSubmissions]);
  // Replaces the old emailed daily report: recomputed from today's date
  // every time this renders, so "today vs yesterday" always uses the
  // correct calendar days with no scheduler involved - tomorrow this
  // automatically becomes "tomorrow vs today" on its own.
  const dailyPerformance = useMemo(
    () => computeDailyPerformance(allSubmissions, goalTarget),
    [allSubmissions, goalTarget]
  );

  const handleUpdateGoal = async (newTarget: number) => {
    // eslint-disable-next-line no-console
    console.log("[LeetBuddy DailyGoal] Dashboard handleUpdateGoal called with:", newTarget);
    setGoalTarget(newTarget);
    await writeChromeStorage(CHROME_STORAGE_KEYS.DAILY_GOAL, newTarget);
    const verifyReadBack = await readChromeStorage<number>(CHROME_STORAGE_KEYS.DAILY_GOAL, -1);
    // eslint-disable-next-line no-console
    console.log("[LeetBuddy DailyGoal] Dashboard handleUpdateGoal read-back immediately after write:", verifyReadBack);
  };

  // Next unsolved problem for Today's Focus
  const focusProblem: FocusProblem | null = useMemo(() => {
    const nextQ = activeSheet.questions.find(
      (q) => !completedQuestionIds.has(q.id) && !completedQuestionIds.has(q.name)
    );

    if (!nextQ) return null;

    return {
      id: nextQ.id,
      name: nextQ.name,
      leetcodeUrl: nextQ.leetcodeUrl,
      difficulty: nextQ.difficulty,
      sheetName: activeSheet.shortName
    };
  }, [activeSheet, completedQuestionIds]);

  const handleQuickContinue = () => {
    onNavigateTab('practice');
  };

  const handleRandomQuestion = () => {
    const uncompleted = activeSheet.questions.filter(
      (q) => !completedQuestionIds.has(q.id) && !completedQuestionIds.has(q.name)
    );
    const pool = uncompleted.length > 0 ? uncompleted : activeSheet.questions;
    const randomQ = pool[Math.floor(Math.random() * pool.length)];
    if (randomQ?.leetcodeUrl) {
      if (typeof chrome !== "undefined" && chrome.runtime) {
        chrome.runtime.sendMessage({ type: "NAVIGATE", url: randomQ.leetcodeUrl })
      } else {
        window.open(randomQ.leetcodeUrl, '_blank')
      }
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 animate-fade-in pb-4">
        <div className="grid grid-cols-2 gap-2.5">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-gray-900/60 p-3 rounded-2xl border border-gray-800 h-[74px] animate-pulse"
            />
          ))}
        </div>
        <div className="h-24 rounded-2xl border border-gray-800 bg-gray-900/60 animate-pulse" />
        <div className="h-28 rounded-2xl border border-gray-800 bg-gray-900/60 animate-pulse" />
        <div className="h-32 rounded-2xl border border-gray-800 bg-gray-900/60 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in pb-4">
      {/* FEATURE 1: DASHBOARD OVERVIEW CARDS */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 p-3 rounded-2xl border border-gray-700/50 shadow-lg hover:border-yellow-500/30 hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex items-center gap-1.5 text-yellow-400 text-xs font-semibold mb-1">
            <CheckCircle size={14} /> Today's Solved
          </div>
          <div className="text-xl font-extrabold text-white">{completedTodayCount}</div>
          <div className="text-[10px] text-gray-400 mt-0.5">Problems completed</div>
        </div>

        <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 p-3 rounded-2xl border border-gray-700/50 shadow-lg hover:border-cyan-500/30 hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex items-center gap-1.5 text-cyan-400 text-xs font-semibold mb-1">
            <Clock size={14} /> Time Today
          </div>
          <div className="text-sm font-extrabold text-cyan-300 font-mono mt-1">
            {formatSecondsToHMS(todayTimeSeconds)}
          </div>
          <div className="text-[10px] text-gray-400 mt-0.5">Active practice time</div>
        </div>

        <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 p-3 rounded-2xl border border-gray-700/50 shadow-lg hover:border-amber-500/30 hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex items-center gap-1.5 text-amber-400 text-xs font-semibold mb-1">
            <Flame size={14} className="fill-amber-400" /> Current Streak
          </div>
          <div className="text-xl font-extrabold text-amber-300">{streakCount} Days</div>
          <div className="text-[10px] text-gray-400 mt-0.5">Keep it up!</div>
        </div>

        <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 p-3 rounded-2xl border border-gray-700/50 shadow-lg hover:border-purple-500/30 hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex items-center gap-1.5 text-purple-400 text-xs font-semibold mb-1">
            <BookOpen size={14} /> Active Sheet
          </div>
          <div className="text-xs font-bold text-white truncate mt-1">{activeSheet.shortName}</div>
          <div className="text-[10px] text-gray-400 mt-0.5">{activeSheet.questions.length} problems</div>
        </div>
      </div>

      {/* FEATURE 2: QUICK CONTINUE SESSION */}
      {lastUnfinishedSession && (
        <div className="bg-gradient-to-r from-blue-900/40 to-purple-900/40 p-3.5 rounded-2xl border border-blue-500/40 flex items-center justify-between shadow-lg">
          <div>
            <span className="text-[10px] font-bold text-blue-300 uppercase tracking-wide">
              Unfinished Session
            </span>
            <h4 className="text-xs font-bold text-white truncate max-w-[180px]">
              {lastUnfinishedSession.name}
            </h4>
          </div>
          <button
            onClick={handleQuickContinue}
            className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold text-xs rounded-xl flex items-center gap-1 shadow-md"
          >
            <Play size={12} className="fill-white" /> Continue
          </button>
        </div>
      )}

      {/* FEATURE 4: DAILY GOAL RING */}
      <DailyGoalRing
        completedToday={completedTodayCount}
        goalTarget={goalTarget}
        onUpdateGoal={handleUpdateGoal}
      />

      {/* Daily Performance: today vs yesterday, computed on-demand (no email/scheduler) */}
      <DailyPerformanceCard data={dailyPerformance} />

      {/* FEATURE 5: TODAY'S FOCUS */}
      <TodaysFocusCard
        focusProblem={focusProblem}
        onStartPractice={handleQuickContinue}
      />

      {/* FEATURE 3: WEEKLY PROGRESS SUMMARY */}
      <WeeklyProgressSummary
        days={weeklyDays}
        totalWeeklySolved={weeklyStats.solved}
        totalWeeklyTimeSeconds={weeklyStats.time}
        totalWeeklySessions={weeklyStats.sessions}
      />

      {/* Advanced Analytics (Module 1) */}
      <AdvancedStats
        longestStreak={longestStreak}
        consistencyScore={consistencyScore}
        successRate={successRate}
        difficultyStats={difficultyStats}
        languageStats={languageStats}
        weeklyTrend={weeklyTrend}
      />

      {/* FEATURE 6: QUICK ACTIONS */}
      <QuickActionsBar
        onContinuePractice={handleQuickContinue}
        onStartNewSession={() => onNavigateTab('practice')}
        onRandomQuestion={handleRandomQuestion}
        onOpenLeetCode={() => {
          if (typeof chrome !== "undefined" && chrome.runtime) {
            chrome.runtime.sendMessage({ type: "NAVIGATE", url: 'https://leetcode.com/problemset/all/' })
          } else {
            window.open('https://leetcode.com/problemset/all/', '_blank')
          }
        }}
      />

      {/* FEATURE 7: DASHBOARD WIDGETS */}
      <DashboardWidgets
        totalSolved={totalSolved}
        totalBookmarks={totalBookmarks}
        totalNotes={totalNotes}
        activeSheet={activeSheet}
        sheetSolvedCount={completedQuestionIds.size}
        recentSessions={recentSessions}
        onOpenPracticeTab={() => onNavigateTab('practice')}
      />
    </div>
  );
};
