import React from "react";
import { Lightbulb } from "lucide-react";

interface PracticeInsightsProps {
  insights: string[];
}

export const PracticeInsights: React.FC<PracticeInsightsProps> = ({ insights }) => {
  if (insights.length === 0) return null;

  return (
    <div className="bg-gray-800/30 rounded-lg p-3 border border-gray-700/50 space-y-2">
      <h4 className="text-white text-sm font-semibold flex items-center gap-1.5">
        <Lightbulb size={14} className="text-yellow-400" />
        Practice Insights
      </h4>
      <ul className="space-y-1.5">
        {insights.map((insight, index) => (
          <li key={index} className="text-xs text-gray-300 flex items-start gap-2">
            <span className="text-yellow-400 mt-0.5">•</span>
            <span>{insight}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};
