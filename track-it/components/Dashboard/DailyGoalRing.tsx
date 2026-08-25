import React, { useState } from 'react';
import { Target, CheckCircle2, Edit2, Check, Flame } from 'lucide-react';

interface DailyGoalRingProps {
  completedToday: number;
  goalTarget: number;
  onUpdateGoal: (newTarget: number) => void;
}

export const DailyGoalRing: React.FC<DailyGoalRingProps> = ({
  completedToday,
  goalTarget,
  onUpdateGoal
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [inputTarget, setInputTarget] = useState(goalTarget.toString());

  const remaining = Math.max(0, goalTarget - completedToday);
  const percentage = Math.min(100, Math.round((completedToday / Math.max(1, goalTarget)) * 100));

  const strokeDasharray = 283; // 2 * pi * r (r=45)
  const strokeDashoffset = strokeDasharray - (strokeDasharray * percentage) / 100;

  const handleSave = () => {
    const val = parseInt(inputTarget, 10);
    if (!isNaN(val) && val > 0) {
      onUpdateGoal(val);
    }
    setIsEditing(false);
  };

  return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-900/95 to-gray-800/90 rounded-2xl p-4 border border-gray-700/60 shadow-xl flex items-center justify-between gap-4 relative overflow-hidden group">
      {/* Subtle Glow */}
      <div className="absolute -top-10 -right-10 w-28 h-28 bg-yellow-400/10 rounded-full blur-2xl pointer-events-none group-hover:bg-yellow-400/20 transition-all duration-500" />

      {/* Goal Info */}
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <Target className="text-yellow-400" size={16} />
          <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">
            Daily Goal
          </span>

          {!isEditing ? (
            <button
              onClick={() => {
                setInputTarget(goalTarget.toString());
                setIsEditing(true);
              }}
              className="text-gray-500 hover:text-yellow-400 transition-colors p-0.5"
              title="Edit daily goal"
            >
              <Edit2 size={12} />
            </button>
          ) : (
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="1"
                max="100"
                value={inputTarget}
                onChange={(e) => setInputTarget(e.target.value)}
                className="w-12 bg-gray-800 border border-yellow-400/50 rounded px-1.5 py-0.5 text-xs text-white focus:outline-none"
              />
              <button
                onClick={handleSave}
                className="text-green-400 hover:text-green-300 p-0.5"
                title="Save goal"
              >
                <Check size={14} />
              </button>
            </div>
          )}
        </div>

        <div className="mt-2 space-y-1">
          <div className="text-2xl font-extrabold text-white flex items-baseline gap-1">
            <span>{completedToday}</span>
            <span className="text-xs font-semibold text-gray-400">/ {goalTarget} solved</span>
          </div>

          <p className="text-xs text-gray-400 flex items-center gap-1">
            {completedToday >= goalTarget ? (
              <span className="text-green-400 font-bold flex items-center gap-1">
                <CheckCircle2 size={12} /> Goal achieved today! 🎉
              </span>
            ) : (
              <span>
                <strong className="text-yellow-400">{remaining} more</strong> needed to hit your target
              </span>
            )}
          </p>
        </div>
      </div>

      {/* SVG Ring Visual */}
      <div className="relative w-20 h-20 flex items-center justify-center flex-shrink-0">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          {/* Track Ring */}
          <circle
            cx="50"
            cy="50"
            r="45"
            className="stroke-gray-800"
            strokeWidth="8"
            fill="transparent"
          />
          {/* Animated Progress Ring */}
          <circle
            cx="50"
            cy="50"
            r="45"
            className="stroke-yellow-400 transition-all duration-700 ease-out"
            strokeWidth="8"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-sm font-extrabold text-white">{percentage}%</span>
          <Flame size={10} className={percentage >= 100 ? "text-amber-400 fill-amber-400 animate-bounce" : "text-gray-500"} />
        </div>
      </div>
    </div>
  );
};
