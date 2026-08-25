import React from 'react';
import { Compass, ExternalLink, Play, Sparkles } from 'lucide-react';
import type { FocusProblem } from './types';
import { getDifficultyStyle } from '../../utils/difficulty';

interface TodaysFocusCardProps {
  focusProblem: FocusProblem | null;
  onStartPractice: () => void;
}

export const TodaysFocusCard: React.FC<TodaysFocusCardProps> = ({
  focusProblem,
  onStartPractice
}) => {
  if (!focusProblem) {
    return (
      <div className="bg-gray-900/60 rounded-2xl p-4 border border-gray-800 text-center mb-4">
        <Sparkles size={20} className="text-yellow-400 mx-auto mb-1 animate-pulse" />
        <p className="text-xs font-semibold text-gray-300">All questions in this sheet completed! 🎉</p>
        <p className="text-[11px] text-gray-500 mt-0.5">Select another sheet from Practice tab.</p>
      </div>
    );
  }

  const difficultyClass = getDifficultyStyle(focusProblem.difficulty).badgeClass;

  return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-900/90 to-purple-950/40 rounded-2xl p-4 border border-purple-500/30 shadow-xl mb-4 relative overflow-hidden group">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Compass className="text-purple-400" size={16} />
          <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">
            Today's Focus
          </span>
        </div>
        <span className="text-[10px] font-semibold bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/30">
          {focusProblem.sheetName}
        </span>
      </div>

      <div className="mb-3">
        <span className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">
          Next Question
        </span>
        <h4 className="text-sm font-bold text-white group-hover:text-purple-200 transition-colors line-clamp-1 mt-0.5">
          {focusProblem.name}
        </h4>
        <div className="mt-1.5 flex items-center gap-2">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${difficultyClass}`}>
            {focusProblem.difficulty}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onStartPractice}
          className="flex-1 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-purple-600/20 transition-all flex items-center justify-center gap-1.5"
        >
          <Play size={14} className="fill-white" />
          Start Session
        </button>

        <button
          type="button"
          onClick={() => {
            if (typeof chrome !== "undefined" && chrome.runtime) {
              chrome.runtime.sendMessage({ type: "NAVIGATE", url: focusProblem.leetcodeUrl })
            } else {
              window.open(focusProblem.leetcodeUrl, '_blank')
            }
          }}
          className="p-2 bg-gray-800/80 hover:bg-gray-700 text-gray-300 hover:text-white border border-gray-700/60 rounded-xl transition-colors"
          title="Open on LeetCode"
        >
          <ExternalLink size={16} />
        </button>
      </div>
    </div>
  );
};
