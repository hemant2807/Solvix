import React from 'react';
import { Calendar, Clock, Trophy, Layers } from 'lucide-react';
import type { WeeklyActivityDay } from './types';
import { formatSecondsToHMS } from '../../utils/time';

interface WeeklyProgressSummaryProps {
  days: WeeklyActivityDay[];
  totalWeeklySolved: number;
  totalWeeklyTimeSeconds: number;
  totalWeeklySessions: number;
}

export const WeeklyProgressSummary: React.FC<WeeklyProgressSummaryProps> = ({
  days,
  totalWeeklySolved,
  totalWeeklyTimeSeconds,
  totalWeeklySessions
}) => {
  const maxSolved = Math.max(1, ...days.map((d) => d.solvedCount));

  return (
    <div className="bg-gray-900/70 rounded-2xl p-4 border border-gray-800 shadow-xl mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Calendar className="text-cyan-400" size={16} />
          <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider">
            7-Day Activity
          </h4>
        </div>
        <span className="text-xs font-extrabold text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded-full border border-cyan-400/20">
          Weekly Summary
        </span>
      </div>

      {/* 7-Day Bar Chart */}
      <div className="grid grid-cols-7 gap-1.5 items-end h-24 pt-4 pb-1 border-b border-gray-800/80 mb-3">
        {days.map((day, idx) => {
          const heightPercent = Math.max(8, Math.round((day.solvedCount / maxSolved) * 100));
          return (
            <div key={idx} className="flex flex-col items-center gap-1 group relative">
              {/* Hover Tooltip */}
              <div className="absolute bottom-full mb-1 hidden group-hover:flex flex-col items-center z-20">
                <div className="bg-gray-800 text-[10px] text-white px-2 py-1 rounded shadow-lg whitespace-nowrap border border-gray-700">
                  {day.solvedCount} solved • {Math.round(day.timeSpentSeconds / 60)}m
                </div>
              </div>

              {/* Bar */}
              <div className="w-full bg-gray-800 rounded-t-md overflow-hidden flex items-end h-16">
                <div
                  className={`w-full rounded-t-md transition-all duration-500 ${
                    day.isToday
                      ? 'bg-gradient-to-t from-yellow-500 to-amber-400 shadow-md shadow-yellow-500/20'
                      : day.solvedCount > 0
                      ? 'bg-gradient-to-t from-cyan-600 to-cyan-400'
                      : 'bg-gray-700/30'
                  }`}
                  style={{ height: `${heightPercent}%` }}
                />
              </div>

              {/* Day Label */}
              <span
                className={`text-[10px] font-semibold ${
                  day.isToday ? 'text-yellow-400 font-bold' : 'text-gray-400'
                }`}
              >
                {day.dayName}
              </span>
            </div>
          );
        })}
      </div>

      {/* Weekly Stats Bar */}
      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <div className="bg-gray-800/40 p-2 rounded-xl border border-gray-700/30">
          <span className="text-[10px] text-gray-400 uppercase font-semibold flex items-center justify-center gap-1">
            <Trophy size={10} className="text-yellow-400" /> Solved
          </span>
          <span className="font-extrabold text-white text-sm mt-0.5 block">
            {totalWeeklySolved}
          </span>
        </div>

        <div className="bg-gray-800/40 p-2 rounded-xl border border-gray-700/30">
          <span className="text-[10px] text-gray-400 uppercase font-semibold flex items-center justify-center gap-1">
            <Clock size={10} className="text-cyan-400" /> Time
          </span>
          <span className="font-extrabold text-cyan-300 text-xs mt-1 block truncate">
            {formatSecondsToHMS(totalWeeklyTimeSeconds)}
          </span>
        </div>

        <div className="bg-gray-800/40 p-2 rounded-xl border border-gray-700/30">
          <span className="text-[10px] text-gray-400 uppercase font-semibold flex items-center justify-center gap-1">
            <Layers size={10} className="text-purple-400" /> Sessions
          </span>
          <span className="font-extrabold text-white text-sm mt-0.5 block">
            {totalWeeklySessions}
          </span>
        </div>
      </div>
    </div>
  );
};
