import React from "react";
import { BarChart3 } from "lucide-react";
import type { DifficultyStat } from "../../utils/analytics";
import { formatDuration } from "../../utils/analytics";

interface DifficultyAnalyticsProps {
  difficultyStats: DifficultyStat[];
}

const colorForDifficulty: Record<string, { text: string; bar: string }> = {
  Easy: { text: "text-green-400", bar: "from-green-500 to-emerald-400" },
  Medium: { text: "text-yellow-400", bar: "from-yellow-500 to-amber-400" },
  Hard: { text: "text-red-400", bar: "from-red-500 to-rose-400" },
  Unknown: { text: "text-gray-400", bar: "from-gray-600 to-gray-500" }
};

export const DifficultyAnalytics: React.FC<DifficultyAnalyticsProps> = ({ difficultyStats }) => {
  const knownStats = difficultyStats.filter((d) => d.solved > 0);
  if (knownStats.length === 0) {
    return null;
  }

  return (
    <div className="bg-gray-800/30 rounded-lg p-3 border border-gray-700/50 space-y-2.5">
      <h4 className="text-white text-sm font-semibold flex items-center gap-1.5">
        <BarChart3 size={14} className="text-purple-400" />
        Difficulty Analytics
      </h4>

      <div className="grid grid-cols-3 gap-2">
        {difficultyStats
          .filter((d) => d.difficulty !== "Unknown")
          .map((stat) => {
            const colors = colorForDifficulty[stat.difficulty] || colorForDifficulty.Unknown;
            return (
              <div key={stat.difficulty} className="bg-gray-900/40 rounded-lg p-2 border border-gray-800 text-center">
                <div className={`text-xs font-bold ${colors.text}`}>{stat.difficulty}</div>
                <div className="text-lg font-extrabold text-white mt-0.5">{stat.solved}</div>
                <div className="text-[10px] text-gray-500">{formatDuration(stat.avgTime)} avg</div>
                {stat.successRate !== null && (
                  <div className="mt-1 w-full bg-gray-800 h-1 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${colors.bar}`}
                      style={{ width: `${stat.successRate}%` }}
                    />
                  </div>
                )}
                {stat.successRate !== null && (
                  <div className="text-[10px] text-gray-500 mt-0.5">{stat.successRate}% success</div>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
};
