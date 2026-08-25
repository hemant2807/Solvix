import { useState, useEffect, useMemo } from "react";
import { BarChart2, Calendar, Clock, Code, TrendingUp, Award, ChevronLeft, ChevronRight, Target } from "lucide-react";
import { apiUrl } from "../constants/api";
import {
  groupSubmissionsByDay,
  formatDuration,
  computeTopicAnalytics,
  computeDifficultyBreakdown,
  generateInsights,
  generateRecommendations,
  computeInterviewReadiness,
  computeStreaks,
  computeWeakTopicRadar,
  type AnalyticsSubmission,
  type DailyActivity,
  type WeakTopicData
} from "../utils/analytics";
import { TopicAnalytics } from "./Stats/TopicAnalytics";
import { DifficultyAnalytics } from "./Stats/DifficultyAnalytics";
import { PracticeInsights } from "./Stats/PracticeInsights";
import { Recommendations } from "./Stats/Recommendations";
import { InterviewReadiness } from "./Stats/InterviewReadiness";
import { WeakTopicRadar } from "./Stats/WeakTopicRadar";

type Submission = AnalyticsSubmission & { _id: string; timeComplexity?: string; spaceComplexity?: string };

interface StatsTabProps {
  username: string;
}

const monthKeyFromDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

export default function StatsTab({ username }: StatsTabProps) {
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTopic, setSelectedTopic] = useState<string>("");
  const currentMonthKey = monthKeyFromDate(new Date());
  const [heatmapMonth, setHeatmapMonth] = useState(currentMonthKey);
  const [heatmapData, setHeatmapData] = useState<DailyActivity[]>([]);
  const [heatmapLoading, setHeatmapLoading] = useState(false);

  const ITEMS_PER_PAGE = 3;

  useEffect(() => {
    fetchAvailableMonths();
  }, [username]);

  useEffect(() => {
    if (selectedMonth || availableMonths.length > 0) {
      fetchSubmissions();
      fetchStats();
    }
  }, [selectedMonth, username]);

  useEffect(() => {
    fetchHeatmap();
  }, [heatmapMonth, username]);

  useEffect(() => {
    setCurrentPage(1);
    setSelectedTopic("");
  }, [selectedMonth]);

  const goToPrevHeatmapMonth = () => {
    const [year, month] = heatmapMonth.split("-").map(Number);
    setHeatmapMonth(monthKeyFromDate(new Date(year, month - 2, 1)));
  };

  const goToNextHeatmapMonth = () => {
    if (heatmapMonth >= currentMonthKey) return;
    const [year, month] = heatmapMonth.split("-").map(Number);
    setHeatmapMonth(monthKeyFromDate(new Date(year, month, 1)));
  };

  const fetchAvailableMonths = async () => {
    try {
      const res = await fetch(apiUrl(`/api/submissions/user/${username}/months`));
      const months = await res.json();
      setAvailableMonths(months);
      if (months.length > 0 && !selectedMonth) {
        setSelectedMonth(months[0]);
      }
    } catch (err) {
      console.error("Failed to fetch months:", err);
    }
  };

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const url = selectedMonth 
        ? apiUrl(`/api/submissions/user/${username}?month=${selectedMonth}`)
        : apiUrl(`/api/submissions/user/${username}`);
      
      const res = await fetch(url);
      const data = await res.json();
      setSubmissions(data);
    } catch (err) {
      console.error("Failed to fetch submissions:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const url = selectedMonth
        ? apiUrl(`/api/submissions/user/${username}/stats?month=${selectedMonth}`)
        : apiUrl(`/api/submissions/user/${username}/stats`);
      
      const res = await fetch(url);
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  };

  const fetchHeatmap = async () => {
    setHeatmapLoading(true);
    try {
      const res = await fetch(apiUrl(`/api/submissions/user/${username}?month=${heatmapMonth}`));
      if (res.ok) {
        const monthSubmissions: Submission[] = await res.json();
        setHeatmapData(groupSubmissionsByDay(monthSubmissions));
      }
    } catch (err) {
      console.error("Failed to fetch heatmap:", err);
    } finally {
      setHeatmapLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) return `${hrs}h ${mins}m`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatMonthDisplay = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long'
    });
  };

  const totalPages = Math.ceil(submissions.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  
  // Filter submissions by selected topic
  const filteredSubmissions = selectedTopic
    ? submissions.filter(sub => sub.topics?.includes(selectedTopic))
    : submissions;
  
  const currentSubmissions = filteredSubmissions.slice(startIndex, endIndex);
  const filteredTotalPages = Math.ceil(filteredSubmissions.length / ITEMS_PER_PAGE);

  const goToNextPage = () => {
    if (currentPage < filteredTotalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleTopicClick = (topic: string) => {
    if (selectedTopic === topic) {
      setSelectedTopic("");
    } else {
      setSelectedTopic(topic);
    }
    setCurrentPage(1);
  };

  const heatmapMatrix = useMemo(() => {
    const map = new Map<string, DailyActivity>();
    heatmapData.forEach((item) => map.set(item.date, item));

    const [yearStr, monthStr] = heatmapMonth.split("-");
    const year = parseInt(yearStr, 10);
    const monthIndex = parseInt(monthStr, 10) - 1;
    const firstDay = new Date(year, monthIndex, 1);
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

    const cells: (DailyActivity | null)[] = [];

    for (let i = 0; i < firstDay.getDay(); i++) {
      cells.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const current = new Date(year, monthIndex, day);
      const iso = current.toISOString().slice(0, 10);
      cells.push(map.get(iso) || { date: iso, count: 0, timeSpent: 0 });
    }

    while (cells.length % 7 !== 0) {
      cells.push(null);
    }

    const weeks = [];
    for (let i = 0; i < cells.length; i += 7) {
      weeks.push(cells.slice(i, i + 7));
    }
    return weeks;
  }, [heatmapData, heatmapMonth]);

  // Missing days: days so far this month with zero activity (only meaningful for the current month).
  const missingDaysCount = useMemo(() => {
    if (heatmapMonth !== currentMonthKey) return 0;
    const activeDates = new Set(heatmapData.map((d) => d.date));
    const today = new Date();
    let missing = 0;
    for (let day = 1; day <= today.getDate(); day++) {
      const iso = `${heatmapMonth}-${String(day).padStart(2, "0")}`;
      if (!activeDates.has(iso)) missing += 1;
    }
    return missing;
  }, [heatmapData, heatmapMonth, currentMonthKey]);

  // Highlights the still-ongoing streak, walking back from today through this month's data.
  const currentStreakDates = useMemo(() => {
    if (heatmapMonth !== currentMonthKey) return new Set<string>();
    const activeDates = new Set(heatmapData.map((d) => d.date));
    const dates = new Set<string>();
    const cursor = new Date();
    cursor.setHours(0, 0, 0, 0);
    if (!activeDates.has(cursor.toISOString().slice(0, 10))) {
      cursor.setDate(cursor.getDate() - 1);
    }
    while (activeDates.has(cursor.toISOString().slice(0, 10))) {
      dates.add(cursor.toISOString().slice(0, 10));
      cursor.setDate(cursor.getDate() - 1);
    }
    return dates;
  }, [heatmapData, heatmapMonth, currentMonthKey]);

  const monthlySummary = useMemo(
    () => ({
      solved: heatmapData.reduce((sum, d) => sum + d.count, 0),
      timeSpent: heatmapData.reduce((sum, d) => sum + d.timeSpent, 0)
    }),
    [heatmapData]
  );

  const heatmapLabel = useMemo(() => {
    const [yearStr, monthStr] = heatmapMonth.split("-");
    return new Date(parseInt(yearStr, 10), parseInt(monthStr, 10) - 1).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric"
    });
  }, [heatmapMonth]);

  // Derived analytics (Modules 3-7): all computed once here from the same
  // submissions list already fetched above, and reused by every section below.
  const topicStats = useMemo(() => computeTopicAnalytics(submissions), [submissions]);
  const difficultyStats = useMemo(() => computeDifficultyBreakdown(submissions), [submissions]);
  const insights = useMemo(() => generateInsights(submissions, topicStats), [submissions, topicStats]);
  const streaks = useMemo(() => computeStreaks(submissions), [submissions]);
  const recommendations = useMemo(() => generateRecommendations(topicStats), [topicStats]);
  const interviewReadiness = useMemo(
    () => computeInterviewReadiness(submissions, topicStats, streaks),
    [submissions, topicStats, streaks]
  );

  const weakTopicRadar = useMemo(
    () => computeWeakTopicRadar(submissions),
    [submissions]
  );

  const getHeatmapColor = (count: number) => {
    if (count === 0) return "bg-gray-800/70 border border-gray-700/60";
    if (count < 2) return "bg-emerald-900/70 border border-emerald-800/60";
    if (count < 4) return "bg-emerald-700/80 border border-emerald-600/60";
    return "bg-emerald-500/80 border border-emerald-400/60";
  };

  return (
    <div className="space-y-4 animate-fade-in max-w-md">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="p-2 bg-gradient-to-br from-yellow-400/20 to-orange-500/20 rounded-lg">
          <BarChart2 className="text-yellow-400" size={18} />
        </div>
        <h3 className="text-base font-semibold text-white">Statistics</h3>
      </div>

      {/* Heatmap */}
      <div className="bg-gray-800/30 rounded-lg p-3 border border-gray-700/50 space-y-3">
        <div className="flex items-center justify-between">
          <button
            onClick={goToPrevHeatmapMonth}
            className="p-1 rounded text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors"
            title="Previous month"
          >
            <ChevronLeft size={14} />
          </button>
          <div className="flex items-center gap-2 text-sm text-white font-semibold">
            <Clock size={14} className="text-emerald-400" />
            <span>{heatmapLabel} Streak Map</span>
          </div>
          <button
            onClick={goToNextHeatmapMonth}
            disabled={heatmapMonth >= currentMonthKey}
            className="p-1 rounded text-gray-400 hover:text-white hover:bg-gray-700/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Next month"
          >
            <ChevronRight size={14} />
          </button>
        </div>

        {!heatmapLoading && (
          <div className="flex items-center justify-center gap-3 text-[11px] text-gray-400">
            <span>
              <strong className="text-white">{monthlySummary.solved}</strong> solved
            </span>
            <span>
              <strong className="text-white">{formatDuration(monthlySummary.timeSpent)}</strong> practiced
            </span>
            {missingDaysCount > 0 && <span>{missingDaysCount} missed day{missingDaysCount !== 1 ? "s" : ""}</span>}
          </div>
        )}

        {heatmapLoading ? (
          <div className="w-full py-8 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-emerald-500/40 border-t-emerald-400 rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            <div className="flex justify-center w-full">
              <div className="flex gap-1">
                {heatmapMatrix.map((week, weekIndex) => (
                  <div key={weekIndex} className="flex flex-col gap-1">
                    {week.map((day, dayIndex) => (
                      <div
                        key={`${weekIndex}-${dayIndex}`}
                        title={day ? `${day.date}: ${day.count} solved, ${formatDuration(day.timeSpent)} practiced` : ""}
                        className={`w-3 h-3 rounded-sm ${day ? getHeatmapColor(day.count) : "bg-transparent"} ${
                          day && currentStreakDates.has(day.date) ? "ring-1 ring-amber-400" : ""
                        }`}
                      ></div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 text-[10px] text-gray-500">
              <span>Less</span>
              {[0, 1, 3, 5].map((value) => (
                <div key={value} className={`w-4 h-3 rounded-sm ${getHeatmapColor(value)}`}></div>
              ))}
              <span>More</span>
            </div>
          </>
        )}
      </div>

      {/* Month Selector */}
      <div className="flex items-center gap-2">
        <Calendar className="text-purple-400" size={16} />
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="flex-1 px-3 py-1.5 text-sm bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
        >
          <option value="">All Time</option>
          {availableMonths.map((month) => (
            <option key={month} value={month}>
              {formatMonthDisplay(month)}
            </option>
          ))}
        </select>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/30 rounded-lg p-3 border border-blue-500/30">
            <div className="flex items-center gap-1.5 mb-1">
              <Award className="text-blue-400" size={14} />
              <span className="text-blue-300 text-xs font-medium">Solved</span>
            </div>
            <p className="text-xl font-bold text-white">{stats.totalSubmissions || 0}</p>
          </div>

          <div className="bg-gradient-to-br from-green-900/30 to-green-800/30 rounded-lg p-3 border border-green-500/30">
            <div className="flex items-center gap-1.5 mb-1">
              <Clock className="text-green-400" size={14} />
              <span className="text-green-300 text-xs font-medium">Avg Time</span>
            </div>
            <p className="text-xl font-bold text-white">
              {formatTime(Math.round(stats.avgTime || 0))}
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-900/30 to-purple-800/30 rounded-lg p-3 border border-purple-500/30">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp className="text-purple-400" size={14} />
              <span className="text-purple-300 text-xs font-medium">Attempts</span>
            </div>
            <p className="text-xl font-bold text-white">
              {(stats.avgAttempts || 0).toFixed(1)}
            </p>
          </div>

          <div className="bg-gradient-to-br from-orange-900/30 to-orange-800/30 rounded-lg p-3 border border-orange-500/30">
            <div className="flex items-center gap-1.5 mb-1">
              <Code className="text-orange-400" size={14} />
              <span className="text-orange-300 text-xs font-medium">Total</span>
            </div>
            <p className="text-xl font-bold text-white">
              {formatTime(stats.totalTime || 0)}
            </p>
          </div>
        </div>
      )}

      {/* Top Topics */}
      {stats?.topicCounts && Object.keys(stats.topicCounts).length > 0 && (
        <div className="bg-gray-800/30 rounded-lg p-3 border border-gray-700/50">
          <h4 className="text-white text-sm font-semibold mb-2 flex items-center gap-1.5">
            <Code size={14} className="text-yellow-400" />
            Top Topics
            {selectedTopic && (
              <span className="text-xs text-gray-400 font-normal ml-auto">
                (Click again to clear filter)
              </span>
            )}
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(stats.topicCounts)
              .sort((a: any, b: any) => b[1] - a[1])
              .slice(0, 6)
              .map(([topic, count]: [string, any]) => (
                <button
                  key={topic}
                  onClick={() => handleTopicClick(topic)}
                  className={`px-2 py-0.5 rounded-full text-xs transition-all cursor-pointer hover:scale-105 ${
                    selectedTopic === topic
                      ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white border border-purple-400'
                      : 'bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 text-purple-300 hover:border-purple-400/50'
                  }`}
                >
                  {topic} ({count})
                </button>
              ))}
          </div>
        </div>
      )}

      {/* Difficulty Analytics (Module 4) */}
      <DifficultyAnalytics difficultyStats={difficultyStats} />

      {/* Topic Analytics (Module 3) */}
      <TopicAnalytics topicStats={topicStats} />

      {/* Practice Insights (Module 5) */}
      <PracticeInsights insights={insights} />

      {/* AI Recommendations (Module 6) */}
      <Recommendations recommendations={recommendations} />

      {/* Interview Readiness (Module 7) */}
      <InterviewReadiness readiness={interviewReadiness} />

      {/* Weak Topic Radar (Feature 6) */}
      <div className="mb-4">
        <WeakTopicRadar radarData={weakTopicRadar} />
      </div>

      {/* Submissions List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-white text-sm font-semibold flex items-center gap-1.5">
            <Clock size={14} className="text-blue-400" />
            Recent Submissions
          </h4>
          {submissions.length > 0 && (
            <span className="text-xs text-gray-400">
              {startIndex + 1}-{Math.min(endIndex, submissions.length)} of {submissions.length}
            </span>
          )}
        </div>
        
        {loading ? (
          <div className="text-center py-6">
            <div className="w-6 h-6 border-3 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto"></div>
          </div>
        ) : submissions.length === 0 ? (
          <div className="text-center py-6 text-gray-400">
            <Code size={36} className="mx-auto mb-2 opacity-30" />
            <p className="text-xs">No submissions yet</p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {currentSubmissions.map((sub) => (
                <div
                  key={sub._id}
                  className="bg-gray-800/30 rounded-lg p-3 border border-gray-700/50 hover:border-purple-500/50 transition-all"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h5 className="text-white text-sm font-medium leading-tight">{sub.questionName}</h5>
                    <span className="text-xs text-gray-400 whitespace-nowrap ml-2">{formatDate(sub.submittedAt)}</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                    <div className="flex items-center gap-1.5 text-gray-300">
                      <Clock size={12} className="text-blue-400" />
                      <span>Time: {formatTime(sub.timeSpent)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-300">
                      <TrendingUp size={12} className="text-green-400" />
                      <span>{sub.attempts} attempt{sub.attempts !== 1 ? 's' : ''}</span>
                    </div>
                  </div>

                  {sub.topics && sub.topics.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {sub.topics.slice(0, 3).map((topic, idx) => (
                        <span
                          key={idx}
                          className="px-1.5 py-0.5 bg-purple-500/20 border border-purple-500/30 rounded text-xs text-purple-300"
                        >
                          {topic}
                        </span>
                      ))}
                      {sub.topics.length > 3 && (
                        <span className="px-1.5 py-0.5 text-xs text-gray-400">
                          +{sub.topics.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {(sub.timeComplexity || sub.spaceComplexity) && (
                    <div className="pt-2 border-t border-gray-700/50 flex gap-3 text-xs text-gray-400">
                      {sub.timeComplexity && <span>Time: {sub.timeComplexity}</span>}
                      {sub.spaceComplexity && <span>Space: {sub.spaceComplexity}</span>}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-2 border-t border-gray-700/50">
                <button
                  onClick={goToPrevPage}
                  disabled={currentPage === 1}
                  className="flex items-center gap-1 px-3 py-1.5 bg-gray-800/50 border border-gray-700 rounded-lg text-sm text-white disabled:opacity-30 disabled:cursor-not-allowed hover:border-purple-500 transition-colors"
                >
                  <ChevronLeft size={14} />
                  Prev
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-7 h-7 rounded-lg text-xs font-medium transition-all ${
                        currentPage === page
                          ? 'bg-purple-500 text-white'
                          : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-1 px-3 py-1.5 bg-gray-800/50 border border-gray-700 rounded-lg text-sm text-white disabled:opacity-30 disabled:cursor-not-allowed hover:border-purple-500 transition-colors"
                >
                  Next
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
