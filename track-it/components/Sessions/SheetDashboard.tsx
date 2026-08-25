import React from 'react';
import { Trophy, CheckCircle, Clock, Target, Sparkles } from 'lucide-react';
import type { PracticeSheet } from '../../data/sheets';
import { formatRelativeTime } from '../../utils/time';

interface SheetDashboardProps {
  sheet: PracticeSheet;
  completedCount: number;
  lastPracticedTime?: number | null;
}

export const SheetDashboard: React.FC<SheetDashboardProps> = ({
  sheet,
  completedCount,
  lastPracticedTime
}) => {
  const total = sheet.questions.length;
  const remaining = Math.max(0, total - completedCount);
  const completionPercentage = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-900/90 to-gray-800/80 rounded-2xl p-4 border border-gray-700/50 shadow-xl mb-5 relative overflow-hidden group">
      {/* Background Subtle Accent Glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/5 rounded-full blur-2xl pointer-events-none group-hover:bg-yellow-400/10 transition-all duration-500" />

      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Trophy size={16} className="text-yellow-400" />
            {sheet.name} Summary
          </h3>
          <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{sheet.description}</p>
        </div>
        <div className="text-right">
          <span className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">
            {completionPercentage}%
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-800/80 h-2.5 rounded-full overflow-hidden mb-4 border border-gray-700/40 p-0.5">
        <div
          className="bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-500 h-full rounded-full transition-all duration-500 shadow-md shadow-yellow-500/20"
          style={{ width: `${completionPercentage}%` }}
        />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-2">
        <div className="bg-gray-800/50 rounded-xl p-2 border border-gray-700/30 text-center">
          <div className="text-[10px] text-gray-400 uppercase font-semibold flex items-center justify-center gap-1">
            <Target size={10} className="text-blue-400" />
            Total
          </div>
          <div className="text-base font-bold text-white mt-0.5">{total}</div>
        </div>

        <div className="bg-gray-800/50 rounded-xl p-2 border border-gray-700/30 text-center">
          <div className="text-[10px] text-gray-400 uppercase font-semibold flex items-center justify-center gap-1">
            <CheckCircle size={10} className="text-green-400" />
            Solved
          </div>
          <div className="text-base font-bold text-green-400 mt-0.5">{completedCount}</div>
        </div>

        <div className="bg-gray-800/50 rounded-xl p-2 border border-gray-700/30 text-center">
          <div className="text-[10px] text-gray-400 uppercase font-semibold flex items-center justify-center gap-1">
            <Sparkles size={10} className="text-orange-400" />
            Left
          </div>
          <div className="text-base font-bold text-orange-400 mt-0.5">{remaining}</div>
        </div>

        <div className="bg-gray-800/50 rounded-xl p-2 border border-gray-700/30 text-center">
          <div className="text-[10px] text-gray-400 uppercase font-semibold flex items-center justify-center gap-1">
            <Clock size={10} className="text-purple-400" />
            Last
          </div>
          <div className="text-xs font-semibold text-purple-300 mt-1 truncate">
            {formatRelativeTime(lastPracticedTime)}
          </div>
        </div>
      </div>
    </div>
  );
};
