import React from 'react';
import type { SheetQuestion } from '../../data/sheets';
import { getDifficultyStyle } from '../../utils/difficulty';

interface DifficultyBreakdownProps {
  questions: SheetQuestion[];
  completedQuestionIds: Set<string>;
}

interface DifficultyMetrics {
  difficulty: 'Easy' | 'Medium' | 'Hard';
  total: number;
  solved: number;
  remaining: number;
  percentage: number;
  colorClass: string;
  badgeClass: string;
  barColor: string;
}

export const DifficultyBreakdown: React.FC<DifficultyBreakdownProps> = ({
  questions,
  completedQuestionIds
}) => {
  const getMetrics = (diff: 'Easy' | 'Medium' | 'Hard'): DifficultyMetrics => {
    const diffQuestions = questions.filter((q) => q.difficulty === diff);
    const total = diffQuestions.length;
    const solved = diffQuestions.filter((q) => completedQuestionIds.has(q.id) || completedQuestionIds.has(q.name)).length;
    const remaining = Math.max(0, total - solved);
    const percentage = total > 0 ? Math.round((solved / total) * 100) : 0;
    const { colorClass, badgeClass, barColor } = getDifficultyStyle(diff);

    return {
      difficulty: diff,
      total,
      solved,
      remaining,
      percentage,
      colorClass,
      badgeClass,
      barColor
    };
  };

  const categories: ('Easy' | 'Medium' | 'Hard')[] = ['Easy', 'Medium', 'Hard'];

  return (
    <div className="bg-gray-900/60 rounded-2xl p-4 border border-gray-800 shadow-lg mb-5">
      <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
        Difficulty Breakdown
      </h4>

      <div className="grid grid-cols-3 gap-2.5">
        {categories.map((diff) => {
          const metrics = getMetrics(diff);
          return (
            <div
              key={diff}
              className="bg-gray-800/40 rounded-xl p-2.5 border border-gray-700/40 flex flex-col justify-between hover:border-gray-600 transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-md border ${metrics.badgeClass}`}>
                    {diff}
                  </span>
                  <span className={`text-xs font-extrabold ${metrics.colorClass}`}>
                    {metrics.percentage}%
                  </span>
                </div>

                <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden my-2">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${metrics.barColor} transition-all duration-500`}
                    style={{ width: `${metrics.percentage}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-gray-400 mt-1">
                <span>
                  <strong className="text-white">{metrics.solved}</strong>/{metrics.total}
                </span>
                <span className="text-gray-500">{metrics.remaining} left</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
