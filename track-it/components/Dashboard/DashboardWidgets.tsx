import React from 'react';
import { Bookmark, StickyNote, CheckCircle, History, BookOpen } from 'lucide-react';
import type { PracticeSheet } from '../../data/sheets';

interface DashboardWidgetsProps {
  totalSolved: number;
  totalBookmarks: number;
  totalNotes: number;
  activeSheet: PracticeSheet;
  sheetSolvedCount: number;
  recentSessions: { name: string; lastOpenedAt: number; progress: number }[];
  onOpenPracticeTab: () => void;
}

export const DashboardWidgets: React.FC<DashboardWidgetsProps> = ({
  totalSolved,
  totalBookmarks,
  totalNotes,
  activeSheet,
  sheetSolvedCount,
  recentSessions,
  onOpenPracticeTab
}) => {
  const sheetProgress = Math.round((sheetSolvedCount / Math.max(1, activeSheet.questions.length)) * 100);

  return (
    <div className="space-y-4">
      {/* 3 Metric Cards */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-gray-900/60 p-3 rounded-2xl border border-gray-800 text-center">
          <div className="flex items-center justify-center gap-1 text-green-400 text-[10px] uppercase font-bold mb-1">
            <CheckCircle size={12} /> Total Solved
          </div>
          <span className="text-xl font-extrabold text-white">{totalSolved}</span>
        </div>

        <div className="bg-gray-900/60 p-3 rounded-2xl border border-gray-800 text-center">
          <div className="flex items-center justify-center gap-1 text-yellow-400 text-[10px] uppercase font-bold mb-1">
            <Bookmark size={12} /> Bookmarks
          </div>
          <span className="text-xl font-extrabold text-white">{totalBookmarks}</span>
        </div>

        <div className="bg-gray-900/60 p-3 rounded-2xl border border-gray-800 text-center">
          <div className="flex items-center justify-center gap-1 text-purple-400 text-[10px] uppercase font-bold mb-1">
            <StickyNote size={12} /> Notes
          </div>
          <span className="text-xl font-extrabold text-white">{totalNotes}</span>
        </div>
      </div>

      {/* Active Sheet Summary Widget */}
      <div className="bg-gray-900/60 p-3.5 rounded-2xl border border-gray-800">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <BookOpen size={14} className="text-yellow-400" />
            <span className="text-xs font-bold text-gray-300">Active Sheet Summary</span>
          </div>
          <span className="text-xs font-extrabold text-yellow-400">{sheetProgress}%</span>
        </div>
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span className="font-semibold text-white truncate max-w-[180px]">{activeSheet.name}</span>
          <span>{sheetSolvedCount}/{activeSheet.questions.length} solved</span>
        </div>
        <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden mt-2 border border-gray-700/50">
          <div
            className="bg-gradient-to-r from-yellow-400 to-amber-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${sheetProgress}%` }}
          />
        </div>
      </div>

      {/* Recent Sessions Widget */}
      {recentSessions.length > 0 && (
        <div className="bg-gray-900/60 p-3.5 rounded-2xl border border-gray-800">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-300">
              <History size={14} className="text-cyan-400" /> Recent Sessions
            </div>
            <button
              onClick={onOpenPracticeTab}
              className="text-[11px] text-cyan-400 hover:underline font-semibold"
            >
              View all
            </button>
          </div>
          <div className="space-y-1.5">
            {recentSessions.slice(0, 3).map((session, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between text-xs p-2 bg-gray-800/50 rounded-xl border border-gray-700/30"
              >
                <span className="font-medium text-white truncate max-w-[180px]">{session.name}</span>
                <span className="text-cyan-300 font-bold">{session.progress}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
