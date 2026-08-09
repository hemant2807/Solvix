import React from "react";
import { Sparkles, ArrowRight } from "lucide-react";
import type { Recommendation } from "../../utils/analytics";

interface RecommendationsProps {
  recommendations: Recommendation[];
}

export const Recommendations: React.FC<RecommendationsProps> = ({ recommendations }) => {
  if (recommendations.length === 0) return null;

  return (
    <div className="bg-gray-800/30 rounded-lg p-3 border border-gray-700/50 space-y-2">
      <h4 className="text-white text-sm font-semibold flex items-center gap-1.5">
        <Sparkles size={14} className="text-orange-400" />
        Recommended Next
      </h4>
      <div className="space-y-1.5">
        {recommendations.map((rec, index) => (
          <div
            key={index}
            className="flex items-start gap-2 bg-gray-900/40 rounded-lg p-2 border border-gray-800"
          >
            <ArrowRight size={12} className="text-orange-400 mt-0.5 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white">{rec.title}</p>
              <p className="text-[10px] text-gray-400">{rec.reason}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
