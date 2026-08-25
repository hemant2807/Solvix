import React from 'react';
import { Play, Plus, Shuffle, ExternalLink, Zap } from 'lucide-react';

interface QuickActionsBarProps {
  onContinuePractice: () => void;
  onStartNewSession: () => void;
  onRandomQuestion: () => void;
  onOpenLeetCode: () => void;
}

export const QuickActionsBar: React.FC<QuickActionsBarProps> = ({
  onContinuePractice,
  onStartNewSession,
  onRandomQuestion,
  onOpenLeetCode
}) => {
  return (
    <div className="bg-gray-900/60 rounded-2xl p-3 border border-gray-800 mb-4">
      <div className="flex items-center gap-1.5 mb-2.5 px-1">
        <Zap className="text-yellow-400" size={14} />
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
          Quick Actions
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={onContinuePractice}
          className="p-2.5 bg-gray-800/80 hover:bg-gray-700/90 border border-gray-700/60 hover:border-yellow-400/40 rounded-xl transition-all text-left flex items-center gap-2 group"
        >
          <div className="p-1.5 bg-yellow-400/10 text-yellow-400 rounded-lg group-hover:scale-105 transition-transform">
            <Play size={14} className="fill-yellow-400" />
          </div>
          <div>
            <span className="text-xs font-bold text-white block group-hover:text-yellow-400 transition-colors">
              Continue
            </span>
            <span className="text-[10px] text-gray-400 block">Resume sheet</span>
          </div>
        </button>

        <button
          onClick={onStartNewSession}
          className="p-2.5 bg-gray-800/80 hover:bg-gray-700/90 border border-gray-700/60 hover:border-purple-400/40 rounded-xl transition-all text-left flex items-center gap-2 group"
        >
          <div className="p-1.5 bg-purple-400/10 text-purple-400 rounded-lg group-hover:scale-105 transition-transform">
            <Plus size={14} />
          </div>
          <div>
            <span className="text-xs font-bold text-white block group-hover:text-purple-300 transition-colors">
              New Session
            </span>
            <span className="text-[10px] text-gray-400 block">Custom list</span>
          </div>
        </button>

        <button
          onClick={onRandomQuestion}
          className="p-2.5 bg-gray-800/80 hover:bg-gray-700/90 border border-gray-700/60 hover:border-cyan-400/40 rounded-xl transition-all text-left flex items-center gap-2 group"
        >
          <div className="p-1.5 bg-cyan-400/10 text-cyan-400 rounded-lg group-hover:scale-105 transition-transform">
            <Shuffle size={14} />
          </div>
          <div>
            <span className="text-xs font-bold text-white block group-hover:text-cyan-300 transition-colors">
              Random
            </span>
            <span className="text-[10px] text-gray-400 block">Pick problem</span>
          </div>
        </button>

        <button
          onClick={onOpenLeetCode}
          className="p-2.5 bg-gray-800/80 hover:bg-gray-700/90 border border-gray-700/60 hover:border-amber-400/40 rounded-xl transition-all text-left flex items-center gap-2 group"
        >
          <div className="p-1.5 bg-amber-400/10 text-amber-400 rounded-lg group-hover:scale-105 transition-transform">
            <ExternalLink size={14} />
          </div>
          <div>
            <span className="text-xs font-bold text-white block group-hover:text-amber-300 transition-colors">
              LeetCode
            </span>
            <span className="text-[10px] text-gray-400 block">Open site</span>
          </div>
        </button>
      </div>
    </div>
  );
};
