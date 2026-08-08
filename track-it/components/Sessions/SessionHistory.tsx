import React, { useState } from 'react';
import { History, ChevronDown, ChevronUp, Clock, CheckCircle, Calendar, ExternalLink } from 'lucide-react';
import { formatMillisecondsToHMS } from '../../utils/time';
import { findSheetQuestionByName } from '../../data/sheets';

interface SessionHistoryQuestion {
  _id?: string;
  name: string;
  leetcodeUrl: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  completed?: boolean;
}

interface SessionHistoryEntry {
  _id: string;
  name: string;
  questions: SessionHistoryQuestion[];
  createdAt: string;
  totalTimeSpent?: number;
  completedQuestions?: number;
  startedAt?: string;
  finishedAt?: string;
}

interface SessionHistoryProps {
  sessions: SessionHistoryEntry[];
}

const difficultyDot: Record<string, string> = {
  Easy: 'bg-green-400',
  Medium: 'bg-yellow-400',
  Hard: 'bg-red-400'
};

const formatDateTime = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '—';

export const SessionHistory: React.FC<SessionHistoryProps> = ({ sessions }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (sessions.length === 0) {
    return (
      <div className="p-6 text-center bg-gray-900/40 rounded-2xl border border-gray-800">
        <History size={24} className="mx-auto mb-2 text-gray-600" />
        <p className="text-xs text-gray-400">No session history yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {sessions.map((session) => {
        const isExpanded = expandedId === session._id;
        const solved = session.completedQuestions ?? session.questions.filter((q) => q.completed).length;
        const total = session.questions.length;

        const difficultyTally: Record<string, number> = {};
        const topics = new Set<string>();
        for (const q of session.questions) {
          difficultyTally[q.difficulty] = (difficultyTally[q.difficulty] || 0) + 1;
          findSheetQuestionByName(q.name)?.topics?.forEach((t) => topics.add(t));
        }

        return (
          <div key={session._id} className="bg-gray-900/70 rounded-xl border border-gray-800 overflow-hidden">
            <button
              onClick={() => setExpandedId(isExpanded ? null : session._id)}
              className="w-full p-3 flex items-center justify-between text-left hover:bg-gray-800/50 transition-colors"
            >
              <div className="min-w-0 flex-1 mr-2">
                <h4 className="text-xs font-semibold text-white truncate">{session.name}</h4>
                <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-400">
                  <span className="flex items-center gap-1">
                    <Calendar size={10} /> {formatDateTime(session.startedAt || session.createdAt)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={10} /> {formatMillisecondsToHMS(session.totalTimeSpent || 0)}
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircle size={10} /> {solved}/{total}
                  </span>
                </div>
              </div>
              {isExpanded ? <ChevronUp size={16} className="text-gray-400 shrink-0" /> : <ChevronDown size={16} className="text-gray-400 shrink-0" />}
            </button>

            {isExpanded && (
              <div className="px-3 pb-3 border-t border-gray-800 pt-2 space-y-2">
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(difficultyTally).map(([diff, count]) => (
                    <span key={diff} className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-300">
                      <span className={`w-1.5 h-1.5 rounded-full ${difficultyDot[diff] || 'bg-gray-500'}`} />
                      {diff} {count}
                    </span>
                  ))}
                  {topics.size > 0 &&
                    Array.from(topics)
                      .slice(0, 5)
                      .map((topic) => (
                        <span key={topic} className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
                          #{topic}
                        </span>
                      ))}
                </div>

                <div className="space-y-1">
                  {session.questions.map((q) => (
                    <div key={q._id || q.name} className="flex items-center justify-between text-[11px] p-1.5 rounded bg-gray-800/40">
                      <span className={`flex items-center gap-1.5 truncate ${q.completed ? 'text-gray-300' : 'text-gray-500'}`}>
                        <CheckCircle size={10} className={q.completed ? 'text-green-400' : 'text-gray-600'} />
                        <span className="truncate">{q.name}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          if (typeof chrome !== "undefined" && chrome.runtime) {
                            chrome.runtime.sendMessage({ type: "NAVIGATE", url: q.leetcodeUrl })
                          } else {
                            window.open(q.leetcodeUrl, '_blank')
                          }
                        }}
                        className="text-gray-500 hover:text-white shrink-0 ml-2"
                      >
                        <ExternalLink size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
