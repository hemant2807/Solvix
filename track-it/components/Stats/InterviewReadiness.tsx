import React from "react";
import { GraduationCap, CheckCircle2, AlertCircle } from "lucide-react";
import type { InterviewReadiness as InterviewReadinessType } from "../../utils/analytics";

interface InterviewReadinessProps {
  readiness: InterviewReadinessType;
}

const scoreColor = (score: number) => {
  if (score >= 75) return "text-green-400";
  if (score >= 45) return "text-yellow-400";
  return "text-red-400";
};

export const InterviewReadiness: React.FC<InterviewReadinessProps> = ({ readiness }) => {
  if (readiness.score === 0 && readiness.strengths.length === 0) {
    return (
      <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700/50 text-center text-xs text-gray-400">
        {readiness.roadmap[0]}
      </div>
    );
  }

  return (
    <div className="bg-gray-800/30 rounded-lg p-3 border border-gray-700/50 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-white text-sm font-semibold flex items-center gap-1.5">
          <GraduationCap size={14} className="text-indigo-400" />
          Interview Readiness
        </h4>
        <span className={`text-xl font-extrabold ${scoreColor(readiness.score)}`}>{readiness.score}</span>
      </div>

      <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-700"
          style={{ width: `${readiness.score}%` }}
        />
      </div>

      {readiness.strengths.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-wide text-gray-500 font-semibold mb-1">Strengths</p>
          <div className="flex flex-wrap gap-1.5">
            {readiness.strengths.map((s) => (
              <span key={s} className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-green-400/10 text-green-300 border border-green-400/20">
                <CheckCircle2 size={10} /> {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {readiness.weaknesses.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-wide text-gray-500 font-semibold mb-1">Weaknesses</p>
          <div className="flex flex-wrap gap-1.5">
            {readiness.weaknesses.map((w) => (
              <span key={w} className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-red-400/10 text-red-300 border border-red-400/20">
                <AlertCircle size={10} /> {w}
              </span>
            ))}
          </div>
        </div>
      )}

      {readiness.roadmap.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-wide text-gray-500 font-semibold mb-1">Roadmap</p>
          <ul className="space-y-1">
            {readiness.roadmap.map((step, i) => (
              <li key={i} className="text-xs text-gray-300 flex items-start gap-1.5">
                <span className="text-indigo-400">{i + 1}.</span>
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
