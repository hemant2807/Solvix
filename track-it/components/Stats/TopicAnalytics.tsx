import React from "react";
import { Layers, Trophy, AlertTriangle } from "lucide-react";
import type { TopicStat } from "../../utils/analytics";
import { formatDuration } from "../../utils/analytics";

interface TopicAnalyticsProps {
  topicStats: TopicStat[];
}

const masteryStyle: Record<TopicStat["mastery"], string> = {
  Mastered: "bg-green-400/10 text-green-400 border-green-400/30",
  Practicing: "bg-yellow-400/10 text-yellow-400 border-yellow-400/30",
  "Needs Practice": "bg-red-400/10 text-red-400 border-red-400/30"
};

export const TopicAnalytics: React.FC<TopicAnalyticsProps> = ({ topicStats }) => {
  if (topicStats.length === 0) {
    return (
      <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700/50 text-center text-xs text-gray-400">
        Solve a few problems to unlock topic analytics.
      </div>
    );
  }

  const maxSolved = Math.max(...topicStats.map((t) => t.solved));

  return (
    <div className="bg-gray-800/30 rounded-lg p-3 border border-gray-700/50 space-y-3">
      <h4 className="text-white text-sm font-semibold flex items-center gap-1.5">
        <Layers size={14} className="text-cyan-400" />
        Topic Analytics
      </h4>

      <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar pr-1">
        {topicStats.map((stat, index) => (
          <div key={stat.topic} className="bg-gray-900/40 rounded-lg p-2.5 border border-gray-800">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-[10px] text-gray-500 font-mono w-4 shrink-0">#{index + 1}</span>
                <span className="text-xs font-semibold text-white truncate">{stat.topic}</span>
              </div>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${masteryStyle[stat.mastery]}`}>
                {stat.mastery}
              </span>
            </div>
            <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden mb-1.5">
              <div
                className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.max(4, (stat.solved / maxSolved) * 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-gray-400">
              <span>{stat.solved} solved</span>
              <span>Avg {formatDuration(stat.avgTime)}</span>
              <span>{stat.acceptance !== null ? `${stat.acceptance}% acceptance` : "No verdict data"}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
