import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ChevronLeft,
  Play,
  Square,
  Eye,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Plus,
  X,
  Trophy,
  Timer,
  Target,
  CheckCircle,
  Clock,
  BookOpen,
  Bookmark,
  Search,
  SlidersHorizontal,
  History,
  StickyNote,
  Sparkles,
  ExternalLink,
  Shuffle,
  Zap
} from 'lucide-react';
import Stopwatch from '~components/Stopwatch';
import { apiUrl } from "../../constants/api";
import { useLeetCodeUser } from "../../hooks/useLeetCodeUser";
import { formatMillisecondsToHMS } from "../../utils/time";
import { readChromeStorage, writeChromeStorage, CHROME_STORAGE_KEYS } from "../../utils/storage";
import type { LeetCodeUser } from "../../types/shared";

import { SheetSelector } from './SheetSelector';
import { SheetDashboard } from './SheetDashboard';
import { DifficultyBreakdown } from './DifficultyBreakdown';
import { SessionHistory } from './SessionHistory';
import {
  PRACTICE_SHEETS,
  DEFAULT_SHEET_ID,
  getSheetById,
  type PracticeSheet,
  type SheetQuestion
} from '../../data/sheets';

interface Question {
  _id?: string;
  name: string;
  leetcodeUrl: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  completed?: boolean;
  timeSpent?: number;
  attempts?: number;
  topics?: string[];
}

interface Session {
  _id: string;
  name: string;
  username: string;
  questions: Question[];
  createdAt: string;
  totalTimeSpent?: number;
  completedQuestions?: number;
  isActive?: boolean;
  startedAt?: string;
  finishedAt?: string;
}

interface ActiveSession {
  session: Session;
  currentQuestionIndex: number;
  startTime: number;
  questionStartTime: number;
  questionElapsedTime: number;
  isRunning: boolean;
  elapsedTime: number;
}

type CompletionFilter = "All" | "Completed" | "In Progress" | "Not Started";
type DifficultyFilter = "All" | "Easy" | "Medium" | "Hard";

type RecentSessionEntry = {
  sessionId: string;
  name: string;
  lastOpenedAt: number;
  completedQuestions: number;
  totalQuestions: number;
  progress: number;
};

const SESSION_PAGE_SIZE = 5;
const MAX_RECENT_SESSIONS = 5;

const buildStorageKeys = (username: string, sheetId: string) => ({
  bookmarks: `Solvix.practice.bookmarks.${username}.${sheetId}`,
  notes: `Solvix.practice.notes.${username}.${sheetId}`,
  recent: `Solvix.practice.recent.${username}.${sheetId}`,
  progress: `Solvix.practice.progress.${username}.${sheetId}`
});

const getQuestionKey = (session: Session, question?: Question | null) => {
  const questionId = question?._id || question?.leetcodeUrl || question?.name || "unknown";
  return `${session._id}:${questionId}`;
};

const getQuestionProgress = (session: Session) => {
  const completed = session.questions.filter((question) => question.completed).length;
  const total = session.questions.length || 1;
  return {
    completed,
    total,
    progress: Math.round((completed / total) * 100)
  };
};

const getCompletionStatus = (session: Session): CompletionFilter => {
  const completed = session.questions.filter((question) => question.completed).length;
  if (completed === 0) return "Not Started";
  if (completed === session.questions.length) return "Completed";
  return "In Progress";
};

const getQuestionStatus = (question?: Question | null) => {
  if (!question) return "Not Started";
  if (question.completed) return "Completed";
  if ((question.attempts ?? 0) > 0 || (question.timeSpent ?? 0) > 0) return "In Progress";
  return "Not Started";
};

const PracticeSession: React.FC = () => {
  const [selectedSheet, setSelectedSheet] = useState<PracticeSheet>(() => getSheetById(DEFAULT_SHEET_ID));
  const [completedQuestionIds, setCompletedQuestionIds] = useState<Set<string>>(new Set());
  const [lastPracticedTime, setLastPracticedTime] = useState<number | null>(null);

  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showQuestionsList, setShowQuestionsList] = useState(false);
  const [showSessionHistory, setShowSessionHistory] = useState(false);
  const [currentUser, setCurrentUser] = useState<LeetCodeUser | null>(null);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessionPage, setSessionPage] = useState(1);
  const [sessionTotalPages, setSessionTotalPages] = useState(1);
  const { fetchLeetCodeUser } = useLeetCodeUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>("All");
  const [completionFilter, setCompletionFilter] = useState<CompletionFilter>("All");
  const [topicFilter, setTopicFilter] = useState("All");
  const [bookmarks, setBookmarks] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [noteDraft, setNoteDraft] = useState("");
  const [recentSessions, setRecentSessions] = useState<RecentSessionEntry[]>([]);

  // Create session form state
  const [sessionName, setSessionName] = useState('');
  const [questions, setQuestions] = useState<Question[]>([
    { _id: '', name: '', leetcodeUrl: '', difficulty: 'Medium' }
  ]);

  const [title, setTitle] = useState<string>("");
  const [verdict, setVerdict] = useState<string>("");
  const [attempts, setAttempts] = useState<number>(0);
  const [buttonClicked, setButtonClicked] = useState<string | null>("");

  // Stopwatch
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const noteSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [prev, setPrev] = useState<string>("");

  const activeQuestion = activeSession
    ? activeSession.session.questions[activeSession.currentQuestionIndex]
    : null;
  const activeQuestionKey = activeSession && activeQuestion
    ? getQuestionKey(activeSession.session, activeQuestion)
    : "";
  const activeQuestionTimeSpent = activeSession
    ? activeSession.questionElapsedTime + (activeSession.isRunning ? Date.now() - activeSession.questionStartTime : 0)
    : 0;

  // Synthesize sheet questions into an active sheet view
  const sheetQuestionsAsQuestions: Question[] = useMemo(() => {
    return selectedSheet.questions.map((q) => ({
      _id: q.id,
      name: q.name,
      leetcodeUrl: q.leetcodeUrl,
      difficulty: q.difficulty,
      topics: q.topics,
      completed: completedQuestionIds.has(q.id) || completedQuestionIds.has(q.name)
    }));
  }, [selectedSheet, completedQuestionIds]);

  const availableTopics = useMemo(() => {
    const topicSet = new Set<string>();
    selectedSheet.questions.forEach((q) => q.topics?.forEach((t) => topicSet.add(t)));
    sessions.forEach((s) => s.questions.forEach((q) => q.topics?.forEach((t) => topicSet.add(t))));
    return Array.from(topicSet).sort();
  }, [selectedSheet, sessions]);

  const filteredSheetQuestions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return sheetQuestionsAsQuestions.filter((q) => {
      const matchesSearch = !query || q.name.toLowerCase().includes(query);
      const matchesDifficulty = difficultyFilter === "All" || q.difficulty === difficultyFilter;
      const isCompleted = Boolean(q.completed);
      const matchesCompletion =
        completionFilter === "All" ||
        (completionFilter === "Completed" && isCompleted) ||
        (completionFilter === "Not Started" && !isCompleted);
      const matchesTopic = topicFilter === "All" || (q.topics && q.topics.includes(topicFilter));
      return matchesSearch && matchesDifficulty && matchesCompletion && matchesTopic;
    });
  }, [sheetQuestionsAsQuestions, searchQuery, difficultyFilter, completionFilter, topicFilter]);

  const filteredSessions = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    return sessions.filter((session) => {
      const matchesSearch =
        !normalizedQuery ||
        session.name.toLowerCase().includes(normalizedQuery) ||
        session.questions.some((q) => q.name.toLowerCase().includes(normalizedQuery));
      const matchesDifficulty =
        difficultyFilter === "All" ||
        session.questions.some((q) => q.difficulty === difficultyFilter);
      const completionStatus = getCompletionStatus(session);
      const matchesCompletion =
        completionFilter === "All" || completionStatus === completionFilter;
      const matchesTopic =
        topicFilter === "All" ||
        session.questions.some((q) => q.topics?.includes(topicFilter));
      return matchesSearch && matchesDifficulty && matchesCompletion && matchesTopic;
    });
  }, [sessions, searchQuery, difficultyFilter, completionFilter, topicFilter]);

  const activeQuestionProgress = activeSession
    ? getQuestionProgress(activeSession.session)
    : null;

  const currentQuestionBookmarkKey = activeQuestionKey;
  const currentQuestionIsBookmarked = currentQuestionBookmarkKey
    ? Boolean(bookmarks[currentQuestionBookmarkKey])
    : false;
  const currentQuestionNote = currentQuestionBookmarkKey
    ? notes[currentQuestionBookmarkKey] || ""
    : "";
  const currentQuestionStatus = getQuestionStatus(activeQuestion);

  const loadPracticeLocalState = async (username: string, sheetId: string) => {
    const keys = buildStorageKeys(username, sheetId);
    const [storedBookmarks, storedNotes, storedRecent, storedProgress] = await Promise.all([
      readChromeStorage<Record<string, boolean>>(keys.bookmarks, {}),
      readChromeStorage<Record<string, string>>(keys.notes, {}),
      readChromeStorage<RecentSessionEntry[]>(keys.recent, []),
      readChromeStorage<string[]>(keys.progress, [])
    ]);

    setBookmarks(storedBookmarks);
    setNotes(storedNotes);
    setRecentSessions(storedRecent);
    setCompletedQuestionIds(new Set(storedProgress));

    if (storedRecent.length > 0) {
      const sorted = [...storedRecent].sort((a, b) => b.lastOpenedAt - a.lastOpenedAt);
      setLastPracticedTime(sorted[0].lastOpenedAt);
    } else {
      setLastPracticedTime(null);
    }
  };

  const handleSelectSheet = async (nextSheet: PracticeSheet) => {
    setSelectedSheet(nextSheet);
    await writeChromeStorage(CHROME_STORAGE_KEYS.SELECTED_SHEET, nextSheet.id);
    if (currentUser?.username) {
      await loadPracticeLocalState(currentUser.username, nextSheet.id);
    }
  };

  const saveBookmarkState = async (username: string, sheetId: string, nextBookmarks: Record<string, boolean>) => {
    const keys = buildStorageKeys(username, sheetId);
    setBookmarks(nextBookmarks);
    await writeChromeStorage(keys.bookmarks, nextBookmarks);
  };

  const saveNoteState = async (username: string, sheetId: string, questionKey: string, note: string) => {
    const keys = buildStorageKeys(username, sheetId);
    const nextNotes = { ...notes };

    if (note.trim()) {
      nextNotes[questionKey] = note;
    } else {
      delete nextNotes[questionKey];
    }

    setNotes(nextNotes);
    await writeChromeStorage(keys.notes, nextNotes);
  };

  const recordRecentSession = async (session: Session) => {
    if (!currentUser?.username) return;

    const keys = buildStorageKeys(currentUser.username, selectedSheet.id);
    const { completed, total, progress } = getQuestionProgress(session);
    const entry: RecentSessionEntry = {
      sessionId: session._id,
      name: session.name,
      lastOpenedAt: Date.now(),
      completedQuestions: completed,
      totalQuestions: total,
      progress
    };

    setLastPracticedTime(entry.lastOpenedAt);
    setRecentSessions((prev) => {
      const nextRecent = [
        entry,
        ...prev.filter((item) => item.sessionId !== session._id)
      ].slice(0, MAX_RECENT_SESSIONS);

      writeChromeStorage(keys.recent, nextRecent);
      return nextRecent;
    });
  };

  const handleToggleBookmark = async () => {
    if (!currentUser?.username || !currentQuestionBookmarkKey) return;
    const nextBookmarks = { ...bookmarks };
    if (nextBookmarks[currentQuestionBookmarkKey]) {
      delete nextBookmarks[currentQuestionBookmarkKey];
    } else {
      nextBookmarks[currentQuestionBookmarkKey] = true;
    }
    await saveBookmarkState(currentUser.username, selectedSheet.id, nextBookmarks);
  };

  const handleNoteChange = (value: string) => {
    setNoteDraft(value);
    if (!currentUser?.username || !currentQuestionBookmarkKey) return;

    // Debounce the actual storage write so we don't hit chrome.storage on every keystroke.
    if (noteSaveTimeoutRef.current) clearTimeout(noteSaveTimeoutRef.current);
    const username = currentUser.username;
    const questionKey = currentQuestionBookmarkKey;
    noteSaveTimeoutRef.current = setTimeout(() => {
      saveNoteState(username, selectedSheet.id, questionKey, value);
    }, 500);
  };

  const toggleSheetQuestionCompletion = async (question: Question) => {
    const qId = question._id || question.name;
    const nextSet = new Set(completedQuestionIds);
    if (nextSet.has(qId)) {
      nextSet.delete(qId);
    } else {
      nextSet.add(qId);
    }
    setCompletedQuestionIds(nextSet);

    if (currentUser?.username) {
      const keys = buildStorageKeys(currentUser.username, selectedSheet.id);
      await writeChromeStorage(keys.progress, Array.from(nextSet));
    }
  };

  useEffect(() => {
    const listener = (msg: any) => {
      if (msg.type === "QUESTION_INFO") {
        if (msg.title !== prev) {
          setVerdict("—");
          setButtonClicked("—");
          setPrev(msg.title);
        }
        setTitle(msg.title);
      }
      if (msg.type === "VERDICT") {
        if (msg.source === "submit") {
          setButtonClicked("Submit");
        }
        setVerdict(msg.verdict);
        if (msg.attempts) setAttempts(msg.attempts);
      }
    };

    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, [prev]);

  // Load user & persistent sheet state on mount
  useEffect(() => {
    const loadUserAndSessions = async () => {
      const savedSheetId = await readChromeStorage<string>(CHROME_STORAGE_KEYS.SELECTED_SHEET, DEFAULT_SHEET_ID);
      const initialSheet = getSheetById(savedSheetId);
      setSelectedSheet(initialSheet);

      const user = await fetchLeetCodeUser();
      setCurrentUser(user);

      if (user) {
        await loadPracticeLocalState(user.username, initialSheet.id);
        fetchSessions(user.username);
      } else {
        setSessionsLoading(false);
      }
    };

    loadUserAndSessions();

    const handleLeetCodeVerdict = (event: CustomEvent) => {
      const { verdict, attempts } = event.detail;

      if (activeSession && verdict === 'Accepted') {
        handleQuestionCompleted();
      }

      if (activeSession && attempts > 0) {
        updateQuestionAttempts(attempts);
      }
    };

    window.addEventListener('leetcode-verdict', handleLeetCodeVerdict as EventListener);

    return () => {
      window.removeEventListener('leetcode-verdict', handleLeetCodeVerdict as EventListener);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [activeSession]);

  // Stopwatch interval
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setActiveSession((prev) => {
        if (!prev || !prev.isRunning) return prev;
        return {
          ...prev,
          elapsedTime: Date.now() - prev.startTime
        };
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Flush any pending debounced note save on unmount so it isn't lost.
  useEffect(() => {
    return () => {
      if (noteSaveTimeoutRef.current) {
        clearTimeout(noteSaveTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!activeQuestionKey) {
      setNoteDraft("");
      return;
    }
    setNoteDraft(notes[activeQuestionKey] || "");
  }, [activeQuestionKey, notes]);

  const fetchSessions = async (username: string) => {
    setSessionsLoading(true);
    try {
      const response = await fetch(apiUrl(`/api/sessions/user/${username}?page=1&limit=25`));
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      const list = Array.isArray(data) ? data : data.sessions || [];
      setSessions(list);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setSessionsLoading(false);
    }
  };

  const clearSessionFilters = () => {
    setSearchQuery("");
    setDifficultyFilter("All");
    setCompletionFilter("All");
    setTopicFilter("All");
  };

  const startSheetAsSession = async () => {
    // A practice session should only contain questions the user hasn't
    // solved yet - previously this passed the full sheet (solved + unsolved)
    // straight through, so "Start Practice Session" always included already
    // completed questions. getRandomQuestion() already filters the same way;
    // apply the same filter here so the session's actual question set (not
    // just its display) excludes completed ones.
    const unsolvedQuestions = sheetQuestionsAsQuestions.filter((q) => !q.completed);

    if (unsolvedQuestions.length === 0) {
      alert("You've completed every question in this sheet! Pick another sheet or reset progress to practice again.");
      return;
    }

    const sheetSession: Session = {
      _id: `sheet_${selectedSheet.id}`,
      name: selectedSheet.name,
      username: currentUser?.username || 'user',
      createdAt: new Date().toISOString(),
      questions: unsolvedQuestions
    };
    await startSession(sheetSession);
  };

  const startSession = async (session: Session) => {
    try {
      if (!session._id.startsWith('sheet_')) {
        await fetch(apiUrl(`/api/sessions/${session._id}/start`), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const now = Date.now();
      setActiveSession({
        session,
        currentQuestionIndex: 0,
        startTime: now,
        questionStartTime: now,
        questionElapsedTime: 0,
        isRunning: true,
        elapsedTime: 0
      });

      await recordRecentSession(session);

      if (session.questions[0]) {
        if (typeof chrome !== "undefined" && chrome.runtime) {
          chrome.runtime.sendMessage({ type: "NAVIGATE", url: session.questions[0].leetcodeUrl })
        } else {
          window.open(session.questions[0].leetcodeUrl, '_blank')
        }
      }
    } catch (error) {
      console.error('Error starting session:', error);
    }
  };

  const finishSession = async () => {
    if (!activeSession) return;
    try {
      if (!activeSession.session._id.startsWith('sheet_')) {
        await fetch(apiUrl(`/api/sessions/${activeSession.session._id}/finish`), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ totalTimeSpent: activeSession.elapsedTime })
        });
      }
      setActiveSession(null);
      if (currentUser) fetchSessions(currentUser.username);
    } catch (error) {
      console.error('Error finishing session:', error);
    }
  };

  const stopSession = () => {
    setActiveSession((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        isRunning: false,
        questionElapsedTime: prev.questionElapsedTime + (Date.now() - prev.questionStartTime)
      };
    });
  };

  const resumeSession = () => {
    setActiveSession((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        isRunning: true,
        startTime: Date.now() - prev.elapsedTime,
        questionStartTime: Date.now()
      };
    });
    if (activeSession?.session) {
      recordRecentSession(activeSession.session);
    }
  };

  const handleQuestionCompleted = async () => {
    if (!activeSession) return;
    const timeSpent = activeSession.questionElapsedTime + (activeSession.isRunning ? Date.now() - activeSession.questionStartTime : 0);
    const currentQuestion = activeSession.session.questions[activeSession.currentQuestionIndex];

    if (currentQuestion._id) {
      toggleSheetQuestionCompletion(currentQuestion);
    }

    try {
      if (!activeSession.session._id.startsWith('sheet_')) {
        const response = await fetch(
          apiUrl(`/api/sessions/${activeSession.session._id}/questions/${currentQuestion._id}/complete`),
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ timeSpent, attempts: currentQuestion.attempts || 1 })
          }
        );
        if (response.ok) {
          const updatedSession = await response.json();
          setActiveSession((prev) => prev ? { ...prev, session: updatedSession, questionElapsedTime: 0 } : null);
          await recordRecentSession(updatedSession);
        }
      }
    } catch (error) {
      console.error('Error updating question completion:', error);
    }
  };

  const updateQuestionAttempts = async (attempts: number) => {
    if (!activeSession) return;
    const currentQuestion = activeSession.session.questions[activeSession.currentQuestionIndex];

    try {
      if (!activeSession.session._id.startsWith('sheet_')) {
        await fetch(
          apiUrl(`/api/sessions/${activeSession.session._id}/questions/${currentQuestion._id}/attempts`),
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ attempts })
          }
        );
      }

      setActiveSession((prev) => {
        if (!prev) return null;
        const updatedQuestions = [...prev.session.questions];
        updatedQuestions[prev.currentQuestionIndex] = {
          ...updatedQuestions[prev.currentQuestionIndex],
          attempts
        };
        return {
          ...prev,
          session: { ...prev.session, questions: updatedQuestions }
        };
      });
    } catch (error) {
      console.error('Error updating question attempts:', error);
    }
  };

  const navigateQuestion = (direction: 'next' | 'prev') => {
    if (!activeSession) return;
    const newIndex = direction === 'next'
      ? Math.min(activeSession.currentQuestionIndex + 1, activeSession.session.questions.length - 1)
      : Math.max(activeSession.currentQuestionIndex - 1, 0);

    const question = activeSession.session.questions[newIndex];
    if (question) {
      setActiveSession((prev) => prev ? {
        ...prev,
        currentQuestionIndex: newIndex,
        questionStartTime: Date.now()
      } : null);
      if (typeof chrome !== "undefined" && chrome.runtime) {
        chrome.runtime.sendMessage({ type: "NAVIGATE", url: question.leetcodeUrl })
      } else {
        window.open(question.leetcodeUrl, '_blank');
      }
    }
  };

  const handleCreateSession = async () => {
    if (!sessionName || questions.some((q) => !q.name || !q.leetcodeUrl) || !currentUser) {
      alert('Please fill all required fields');
      return;
    }

    try {
      const response = await fetch(apiUrl('/api/sessions'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: sessionName,
          username: currentUser.username,
          questions: questions.filter((q) => q.name && q.leetcodeUrl)
        })
      });

      if (response.ok) {
        setShowCreateForm(false);
        setSessionName('');
        setQuestions([{ _id: '', name: '', leetcodeUrl: '', difficulty: 'Medium' }]);
        await fetchSessions(currentUser.username);
      }
    } catch (error) {
      console.error('Error creating session:', error);
    }
  };

  const getRandomQuestion = () => {
    const unsolvedQuestions = sheetQuestionsAsQuestions.filter((q) => !q.completed);
    const pool = unsolvedQuestions.length > 0 ? unsolvedQuestions : sheetQuestionsAsQuestions;
    
    if (pool.length === 0) return null;
    
    const randomIndex = Math.floor(Math.random() * pool.length);
    return pool[randomIndex];
  };

  const handleRandomQuestion = () => {
    const randomQuestion = getRandomQuestion();
    if (!randomQuestion) return;
    
    // Start a session with just this question
    const randomSession: Session = {
      _id: `random_${Date.now()}`,
      name: `Random: ${randomQuestion.name}`,
      username: currentUser?.username || 'user',
      createdAt: new Date().toISOString(),
      questions: [randomQuestion]
    };
    startSession(randomSession);
  };

  // Active Session Running View
  if (activeSession && activeSession.isRunning) {
    const currentQuestion = activeSession.session.questions[activeSession.currentQuestionIndex];
    return (
      <div className="h-full bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white relative overflow-hidden">
        <div className="relative z-10 p-2 h-full overflow-y-auto custom-scrollbar">
          {/* Header */}
          <div className="mb-3 animate-slide-down">
            <div className="bg-gray-800/40 backdrop-blur-md rounded-xl border border-gray-700/50 p-3 shadow-2xl">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <Trophy className="text-yellow-400" size={14} />
                  <h3 className="text-sm font-bold text-white truncate max-w-[200px]">
                    {activeSession.session.name}
                  </h3>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={finishSession}
                    className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded-md flex items-center gap-1 transition-all"
                  >
                    <CheckCircle size={10} /> Finish
                  </button>
                  <button
                    onClick={stopSession}
                    className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded-md flex items-center gap-1 transition-all"
                  >
                    <Square size={10} /> Pause
                  </button>
                </div>
              </div>

              <div className="bg-gray-700/50 rounded-lg p-2 border border-gray-600/50 text-center">
                <Stopwatch verdict={verdict} buttonClicked={buttonClicked ?? ""} question={title} />
              </div>
            </div>
          </div>

          {/* Current Question */}
          <div className="mb-3 bg-gray-800/40 backdrop-blur-md rounded-xl border border-gray-700/50 p-3">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">Current Problem</h2>
              {currentQuestion?.leetcodeUrl && (
                <button
                  onClick={() => {
                    if (typeof chrome !== "undefined" && chrome.runtime) {
                      chrome.runtime.sendMessage({ type: "NAVIGATE", url: currentQuestion.leetcodeUrl })
                    } else {
                      window.open(currentQuestion.leetcodeUrl, "_blank")
                    }
                  }}
                  className="px-2 py-0.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] rounded flex items-center gap-1"
                >
                  <ExternalLink size={10} /> LeetCode
                </button>
              )}
            </div>

            <h3 className="text-sm font-semibold text-white mb-2">{currentQuestion?.name}</h3>

            <div className="flex items-center justify-between text-xs mb-2">
              <span className={`px-2 py-0.5 rounded font-bold ${
                currentQuestion?.difficulty === 'Easy' ? 'bg-green-500/20 text-green-400' :
                currentQuestion?.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-red-500/20 text-red-400'
              }`}>
                {currentQuestion?.difficulty}
              </span>
              <button
                onClick={handleToggleBookmark}
                className="p-1 rounded bg-gray-800 text-gray-300 hover:text-white transition-transform duration-200 hover:scale-110 active:scale-90"
              >
                <Bookmark size={14} className={currentQuestionIsBookmarked ? "fill-yellow-400 text-yellow-400" : ""} />
              </button>
            </div>

            {/* Note Drawer */}
            <div className="mt-2 pt-2 border-t border-gray-700/50">
              <textarea
                value={noteDraft}
                onChange={(e) => handleNoteChange(e.target.value)}
                rows={2}
                placeholder="Write a private note..."
                className="w-full bg-gray-900/60 rounded p-2 text-xs text-white placeholder-gray-500 border border-gray-700 transition-colors duration-200 focus:outline-none focus:border-yellow-400"
              />
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex justify-between gap-2">
            <button
              onClick={() => navigateQuestion('prev')}
              disabled={activeSession.currentQuestionIndex === 0}
              className="flex-1 py-1.5 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-xs rounded flex items-center justify-center gap-1"
            >
              <ChevronLeft size={12} /> Prev
            </button>
            <button
              onClick={() => setShowQuestionsList(true)}
              className="flex-1 py-1.5 bg-purple-600 hover:bg-purple-700 text-xs rounded flex items-center justify-center gap-1"
            >
              <Eye size={12} /> All ({activeSession.session.questions.length})
            </button>
            <button
              onClick={() => navigateQuestion('next')}
              disabled={activeSession.currentQuestionIndex === activeSession.session.questions.length - 1}
              className="flex-1 py-1.5 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-xs rounded flex items-center justify-center gap-1"
            >
              Next <ChevronRight size={12} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active Session Paused View
  if (activeSession && !activeSession.isRunning) {
    return (
      <div className="h-full bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white p-4 flex items-center justify-center">
        <div className="bg-gray-800/80 rounded-2xl p-5 border border-gray-700 w-full text-center">
          <Square className="text-amber-400 mx-auto mb-2" size={32} />
          <h3 className="text-base font-bold mb-1">Session Paused</h3>
          <p className="text-xs text-gray-400 mb-4">{activeSession.session.name}</p>
          <div className="flex gap-2">
            <button
              onClick={resumeSession}
              className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-xs font-bold rounded flex items-center justify-center gap-1"
            >
              <Play size={12} /> Resume
            </button>
            <button
              onClick={finishSession}
              className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-xs font-bold rounded flex items-center justify-center gap-1"
            >
              <CheckCircle size={12} /> End
            </button>
          </div>
        </div>
      </div>
    );
  }

  // MAIN MULTI-SHEET PRACTICE VIEW
  return (
    <div className="h-full bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white relative overflow-hidden">
      <div className="relative z-10 p-3 h-full overflow-y-auto custom-scrollbar">

        {/* FEATURE 2: SHEET SELECTOR */}
        <SheetSelector
          selectedSheet={selectedSheet}
          onSelectSheet={handleSelectSheet}
        />

        {/* FEATURE 5: CURRENT SHEET DASHBOARD */}
        <SheetDashboard
          sheet={selectedSheet}
          completedCount={completedQuestionIds.size}
          lastPracticedTime={lastPracticedTime}
        />

        {/* FEATURE 6: DIFFICULTY BREAKDOWN */}
        <DifficultyBreakdown
          questions={selectedSheet.questions}
          completedQuestionIds={completedQuestionIds}
        />

        {/* Action Buttons: Start Practice Sheet & Random Question */}
        <div className="mb-5 grid grid-cols-2 gap-2">
          <button
            onClick={startSheetAsSession}
            className="py-3 bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 hover:from-yellow-300 hover:to-orange-400 text-gray-950 font-extrabold text-sm rounded-xl shadow-lg shadow-yellow-500/20 hover:shadow-yellow-500/40 transition-all duration-300 flex items-center justify-center gap-2 uppercase tracking-wide"
          >
            <Play size={16} className="fill-gray-950" />
            Start Practice Session
          </button>
          <button
            onClick={handleRandomQuestion}
            className="py-3 bg-gradient-to-r from-purple-500 via-purple-600 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 transition-all duration-300 flex items-center justify-center gap-2 uppercase tracking-wide"
          >
            <Shuffle size={16} />
            Random Question
          </button>
        </div>

        {/* FEATURE: SMART SESSION HISTORY */}
        {sessions.length > 0 && (
          <div className="mb-5">
            <button
              onClick={() => setShowSessionHistory((prev) => !prev)}
              className="w-full flex items-center justify-between px-1 mb-2 text-xs font-bold text-gray-400 uppercase tracking-wider hover:text-gray-200 transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <History size={14} className="text-cyan-400" />
                Session History ({sessions.length})
              </span>
              {showSessionHistory ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            {showSessionHistory && <SessionHistory sessions={sessions} />}
          </div>
        )}

        {/* FEATURE 8: INTEGRATED SEARCH & FILTERS */}
        <div className="bg-gray-900/60 rounded-2xl p-3 border border-gray-800 mb-4">
          <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-gray-400">
            <SlidersHorizontal size={14} className="text-yellow-400" />
            Filter Sheet Problems
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 bg-gray-800/80 rounded-xl px-3 py-2 border border-gray-700/50 transition-colors duration-200 focus-within:border-yellow-400/50">
              <Search size={14} className="text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search problem title..."
                className="w-full bg-transparent text-xs text-white placeholder-gray-500 focus:outline-none"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="text-gray-400 hover:text-white transition-colors">
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <select
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value as DifficultyFilter)}
                className="bg-gray-800/80 rounded-xl p-2 text-xs text-white border border-gray-700/50 transition-colors duration-200 hover:border-gray-600 focus:outline-none"
              >
                <option value="All">All Difficulties</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>

              <select
                value={completionFilter}
                onChange={(e) => setCompletionFilter(e.target.value as CompletionFilter)}
                className="bg-gray-800/80 rounded-xl p-2 text-xs text-white border border-gray-700/50 transition-colors duration-200 hover:border-gray-600 focus:outline-none"
              >
                <option value="All">All Status</option>
                <option value="Completed">Completed</option>
                <option value="Not Started">Not Started</option>
              </select>
            </div>
          </div>
        </div>

        {/* FEATURE 3: DYNAMIC QUESTION LIST */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1 mb-1">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Problems ({filteredSheetQuestions.length})
            </span>
          </div>

          {filteredSheetQuestions.length === 0 ? (
            <div className="p-6 text-center bg-gray-900/40 rounded-2xl border border-gray-800">
              <p className="text-xs text-gray-400">No problems match your filters.</p>
              <button
                onClick={clearSessionFilters}
                className="mt-2 text-xs text-yellow-400 hover:underline font-semibold"
              >
                Clear filters
              </button>
            </div>
          ) : (
            filteredSheetQuestions.map((q) => {
              const qId = q._id || q.name;
              const isDone = Boolean(q.completed);
              return (
                <div
                  key={qId}
                  className={`p-3 rounded-xl border transition-all duration-200 flex items-center justify-between ${
                    isDone
                      ? 'bg-green-950/20 border-green-800/40 text-gray-300'
                      : 'bg-gray-900/70 hover:bg-gray-800/80 border-gray-800 text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 flex-1 min-w-0 mr-2">
                    <button
                      onClick={() => toggleSheetQuestionCompletion(q)}
                      className={`p-1 rounded-md transition-colors ${
                        isDone ? 'text-green-400 hover:text-green-300' : 'text-gray-600 hover:text-gray-400'
                      }`}
                    >
                      <CheckCircle size={18} className={isDone ? 'fill-green-400/20' : ''} />
                    </button>

                    <div className="min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => {
                          if (typeof chrome !== "undefined" && chrome.runtime) {
                            chrome.runtime.sendMessage({ type: "NAVIGATE", url: q.leetcodeUrl })
                          } else {
                            window.open(q.leetcodeUrl, '_blank')
                          }
                        }}
                        className="text-xs font-semibold hover:text-yellow-400 transition-colors block truncate text-left"
                      >
                        {q.name}
                      </button>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                            q.difficulty === 'Easy' ? 'bg-green-400/10 text-green-400' :
                            q.difficulty === 'Medium' ? 'bg-yellow-400/10 text-yellow-400' :
                            'bg-red-400/10 text-red-400'
                          }`}
                        >
                          {q.difficulty}
                        </span>
                        {q.topics?.slice(0, 2).map((t) => (
                          <span key={t} className="text-[10px] text-gray-500">
                            #{t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (typeof chrome !== "undefined" && chrome.runtime) {
                        chrome.runtime.sendMessage({ type: "NAVIGATE", url: q.leetcodeUrl })
                      } else {
                        window.open(q.leetcodeUrl, '_blank')
                      }
                    }}
                    className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-lg transition-colors"
                  >
                    <ExternalLink size={14} />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default PracticeSession;
