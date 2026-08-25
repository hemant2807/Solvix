import React from 'react';
import { Award, Flame, Target, Globe2 } from 'lucide-react';
import type { DifficultyStat, TrendPoint } from '../../utils/analytics';

interface AdvancedStatsProps {
  longestStreak: number;
  consistencyScore: number;
  successRate: number | null;
  difficultyStats: DifficultyStat[];
  languageStats: { language: string; count: number }[];
  weeklyTrend: TrendPoint[];
}

const difficultyColor: Record<string, string> = {
  Easy: 'bg-green-500',
  Medium: 'bg-yellow-500',
  Hard: 'bg-red-500',
  Unknown: 'bg-gray-600'
};

export const AdvancedStats: React.FC<AdvancedStatsProps> = ({
  longestStreak,
  consistencyScore,
  successRate,
  difficultyStats,
  languageStats,
  weeklyTrend
}) => {
  const maxTrend = Math.max(1, ...weeklyTrend.map((w) => w.solved));
  const knownDifficulty = difficultyStats.filter((d) => d.difficulty !== 'Unknown' && d.solved > 0);
  const totalDifficultySolved = Math.max(1, knownDifficulty.reduce((sum, d) => sum + d.solved, 0));

  return (
    <div className="bg-gray-900/60 rounded-2xl p-4 border border-gray-800 shadow-lg space-y-4">
      <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
        <Award size={14} className="text-yellow-400" />
        Advanced Analytics
      </div>

      {/* Longest streak / consistency / success rate */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-gray-800/50 rounded-xl p-2.5 text-center border border-gray-700/40">
          <Flame size={14} className="text-amber-400 mx-auto mb-1" />
          <div className="text-base font-extrabold text-white">{longestStreak}</div>
          <div className="text-[9px] text-gray-500 uppercase">Longest Streak</div>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-2.5 text-center border border-gray-700/40">
          <Target size={14} className="text-cyan-400 mx-auto mb-1" />
          <div className="text-base font-extrabold text-white">{consistencyScore}%</div>
          <div className="text-[9px] text-gray-500 uppercase">Consistency</div>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-2.5 text-center border border-gray-700/40">
          <Award size={14} className="text-green-400 mx-auto mb-1" />
          <div className="text-base font-extrabold text-white">{successRate !== null ? `${successRate}%` : '—'}</div>
          <div className="text-[9px] text-gray-500 uppercase">Success Rate</div>
        </div>
      </div>

      {/* Weekly trend */}
      <div>
        <div className="text-[10px] text-gray-500 uppercase font-semibold mb-1.5">8-Week Trend</div>
        <div className="flex items-end justify-between gap-1 h-14">
          {weeklyTrend.map((point) => (
            <div key={point.label} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full rounded-t bg-gradient-to-t from-yellow-500 to-orange-400 transition-all duration-500"
                style={{ height: `${Math.max(4, (point.solved / maxTrend) * 100)}%` }}
                title={`${point.label}: ${point.solved} solved`}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Difficulty distribution */}
      {knownDifficulty.length > 0 && (
        <div>
          <div className="text-[10px] text-gray-500 uppercase font-semibold mb-1.5">Difficulty Distribution</div>
          <div className="w-full h-2.5 rounded-full overflow-hidden flex bg-gray-800">
            {knownDifficulty.map((d) => (
              <div
                key={d.difficulty}
                className={`${difficultyColor[d.difficulty]} h-full transition-all duration-500`}
                style={{ width: `${(d.solved / totalDifficultySolved) * 100}%` }}
                title={`${d.difficulty}: ${d.solved}`}
              />
            ))}
          </div>
          <div className="flex justify-between mt-1 text-[9px] text-gray-500">
            {knownDifficulty.map((d) => (
              <span key={d.difficulty}>{d.difficulty} {d.solved}</span>
            ))}
          </div>
        </div>
      )}

      {/* Language distribution */}
      {languageStats.length > 0 && languageStats[0].language !== 'Unknown' && (
        <div>
          <div className="text-[10px] text-gray-500 uppercase font-semibold mb-1.5 flex items-center gap-1">
            <Globe2 size={11} /> Top Languages
          </div>
          <div className="flex flex-wrap gap-1.5">
            {languageStats.slice(0, 4).map((lang) => (
              <span
                key={lang.language}
                className="text-[10px] px-2 py-0.5 rounded-full bg-blue-400/10 text-blue-300 border border-blue-400/20"
              >
                {lang.language} ({lang.count})
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
