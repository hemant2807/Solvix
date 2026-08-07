import React from 'react';
import { TrendingUp, TrendingDown, Minus, Target, CheckCircle2, Sparkles } from 'lucide-react';
import type { DailyPerformanceComparison } from '../../utils/analytics';

interface DailyPerformanceCardProps {
  data: DailyPerformanceComparison;
}

function formatDelta(todayValue: number, yesterdayValue: number, suffix = ''): { text: string; positive: boolean } | null {
  const diff = todayValue - yesterdayValue;
  if (diff === 0) return null;
  return {
    text: `${diff > 0 ? '↑' : '↓'} ${Math.abs(diff)}${suffix}`,
    positive: diff > 0
  };
}

export const DailyPerformanceCard: React.FC<DailyPerformanceCardProps> = ({ data }) => {
  const { today, yesterday, goalTarget, goalMet, solvedChangePercent, trend } = data;

  const solvedDelta = yesterday ? formatDelta(today.solved, yesterday.solved) : null;
  const attemptsDelta = yesterday ? formatDelta(today.attempts, yesterday.attempts) : null;
  const accuracyDelta =
    yesterday && today.accuracy !== null && yesterday.accuracy !== null
      ? formatDelta(today.accuracy, yesterday.accuracy, '%')
      : null;

  const headline = (() => {
    if (trend === 'no-data') return "Start today — tomorrow we'll compare your progress.";
    if (solvedChangePercent !== null && solvedChangePercent > 0) return `You're ${solvedChangePercent}% better than yesterday 🚀`;
    if (solvedChangePercent !== null && solvedChangePercent < 0) return `You're ${Math.abs(solvedChangePercent)}% below yesterday 📉`;
    if (trend === 'up') return "You're improving on yesterday 🚀";
    return "You're performing about the same as yesterday.";
  })();

  const footer = (() => {
    if (trend === 'no-data') return null;
    if (trend === 'up') return 'Keep it up! You\'re improving.';
    if (trend === 'down') return 'Every problem counts — get back on track today.';
    return 'Steady progress — try to push a little further today.';
  })();

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-green-400' : trend === 'down' ? 'text-red-400' : 'text-gray-400';

  return (
    <div className="bg-gray-900/70 rounded-2xl p-4 border border-gray-800 shadow-xl mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="text-yellow-400" size={16} />
          <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider">
            Daily Performance
          </h4>
        </div>
        {trend !== 'no-data' && (
          <TrendIcon size={16} className={trendColor} />
        )}
      </div>

      <p className={`text-sm font-semibold mb-3 ${trend === 'no-data' ? 'text-gray-400 italic' : 'text-white'}`}>
        {headline}
      </p>

      <div className="space-y-1.5 mb-1">
        <PerformanceRow label="Solved" value={String(today.solved)} delta={solvedDelta} />
        <PerformanceRow label="Attempts" value={String(today.attempts)} delta={attemptsDelta} />
        <PerformanceRow
          label="Accuracy"
          value={today.accuracy !== null ? `${today.accuracy}%` : '—'}
          delta={accuracyDelta}
        />
        <div className="flex items-center justify-between text-xs py-1">
          <span className="text-gray-400">Goal</span>
          <span className={`font-bold flex items-center gap-1 ${goalMet ? 'text-green-400' : 'text-white'}`}>
            <Target size={11} className={goalMet ? 'text-green-400' : 'text-gray-500'} />
            {today.solved}/{goalTarget || '—'}
            {goalMet && <CheckCircle2 size={12} className="text-green-400" />}
          </span>
        </div>
      </div>

      {footer && (
        <p className="text-[10px] text-gray-500 mt-2 pt-2 border-t border-gray-800/80">{footer}</p>
      )}
    </div>
  );
};

function PerformanceRow({
  label,
  value,
  delta
}: {
  label: string;
  value: string;
  delta: { text: string; positive: boolean } | null;
}) {
  return (
    <div className="flex items-center justify-between text-xs py-1">
      <span className="text-gray-400">{label}</span>
      <span className="flex items-center gap-1.5">
        <span className="font-bold text-white">{value}</span>
        {delta && (
          <span className={`text-[10px] font-semibold ${delta.positive ? 'text-green-400' : 'text-red-400'}`}>
            {delta.text}
          </span>
        )}
      </span>
    </div>
  );
}
