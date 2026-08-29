import React, { useState, useEffect, useCallback } from 'react';
import { Trophy, Award, RefreshCw, User as UserIcon, ChevronDown, ChevronUp } from 'lucide-react';
import { apiUrl } from '../../constants/api';

export interface LeaderboardUser {
  rank: number;
  username: string;
  avatar?: string;
  solved: number;
  hard: number;
  medium: number;
  easy: number;
}

type DayOption = 7 | 15 | 30;
const DAY_OPTIONS: DayOption[] = [7, 15, 30];

interface LeaderboardCardProps {
  currentUsername: string;
}

export const LeaderboardCard: React.FC<LeaderboardCardProps> = ({ currentUsername }) => {
  const [selectedDays, setSelectedDays] = useState<DayOption>(7);
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const fetchLeaderboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(apiUrl(`/api/submissions/leaderboard?days=${selectedDays}`));
      if (!res.ok) {
        throw new Error(`Failed to load leaderboard (${res.status})`);
      }
      const data: LeaderboardUser[] = await res.json();
      setLeaderboard(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Error fetching leaderboard:', err);
      setError('Unable to load leaderboard. Please check connection.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedDays]);

  // Re-fetch whenever selectedDays changes (and on initial mount)
  useEffect(() => {
    setIsExpanded(false); // collapse list when switching periods
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const displayedUsers = isExpanded ? leaderboard : leaderboard.slice(0, 5);

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <span className="w-6 h-6 rounded-full bg-gradient-to-br from-yellow-300 to-amber-500 text-black text-xs font-black flex items-center justify-center shadow-md shadow-yellow-500/30">
          1
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span className="w-6 h-6 rounded-full bg-gradient-to-br from-slate-200 to-slate-400 text-black text-xs font-black flex items-center justify-center shadow-md shadow-slate-400/20">
          2
        </span>
      );
    }
    if (rank === 3) {
      return (
        <span className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 text-white text-xs font-black flex items-center justify-center shadow-md shadow-amber-700/20">
          3
        </span>
      );
    }
    return (
      <span className="w-6 h-6 rounded-full bg-gray-800/80 border border-gray-700/60 text-gray-400 text-xs font-bold font-mono flex items-center justify-center">
        {rank}
      </span>
    );
  };

  return (
    <div className="bg-gray-900/70 rounded-2xl p-4 border border-gray-800 shadow-xl mb-4">
      {/* Header row */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-yellow-400/10 rounded-lg border border-yellow-400/20">
            <Trophy className="text-yellow-400" size={16} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-gray-200 uppercase tracking-wider">
              Student Leaderboard
            </h4>
            <span className="text-[10px] text-gray-400">
              Ranked by unique DSA problems solved · Last {selectedDays} days
            </span>
          </div>
        </div>

        <button
          onClick={fetchLeaderboard}
          disabled={isLoading}
          title="Refresh Leaderboard"
          className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Period selector: 3 equal-width segmented buttons */}
      <div className="flex items-center gap-1 mb-3">
        {DAY_OPTIONS.map((d) => (
          <button
            key={d}
            onClick={() => setSelectedDays(d)}
            className={`flex-1 py-1 text-[11px] font-semibold rounded-lg border transition-all duration-150 ${
              selectedDays === d
                ? 'bg-yellow-400/20 border-yellow-500/50 text-yellow-300'
                : 'bg-gray-800/40 border-gray-700/50 text-gray-400 hover:border-gray-600 hover:text-gray-200'
            }`}
          >
            {d} Days
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-2 py-1">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between p-2.5 bg-gray-800/30 rounded-xl border border-gray-800 h-12 animate-pulse"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full bg-gray-700/50" />
                <div className="w-6 h-6 rounded-full bg-gray-700/50" />
                <div className="w-24 h-3 rounded bg-gray-700/50" />
              </div>
              <div className="w-16 h-3 rounded bg-gray-700/50" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-center space-y-2">
          <p className="text-xs text-red-300 font-medium">{error}</p>
          <button
            onClick={fetchLeaderboard}
            className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-200 text-xs rounded-lg border border-red-500/30 transition-colors"
          >
            Retry
          </button>
        </div>
      ) : leaderboard.length === 0 ? (
        <div className="p-6 text-center text-gray-400 text-xs bg-gray-800/20 border border-gray-800/40 rounded-xl">
          <Award size={24} className="mx-auto mb-2 text-gray-500 opacity-60" />
          <p className="font-semibold text-gray-300">No submissions in the last {selectedDays} days</p>
          <p className="text-[11px] text-gray-500 mt-0.5">Solve LeetCode problems to climb the ranks!</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {displayedUsers.map((user) => {
            const isCurrentUser =
              user.username.toLowerCase() === (currentUsername || '').toLowerCase();
            return (
              <div
                key={user.username}
                className={`flex items-center justify-between p-2 rounded-xl transition-all duration-200 ${
                  isCurrentUser
                    ? 'bg-gradient-to-r from-yellow-500/15 via-yellow-500/5 to-transparent border border-yellow-500/40 shadow-sm shadow-yellow-500/10'
                    : 'bg-gray-800/30 hover:bg-gray-800/60 border border-gray-800/60'
                }`}
              >
                {/* Left: Rank badge + Avatar + Username */}
                <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
                  {getRankBadge(user.rank)}

                  {/* Avatar with initial fallback */}
                  <div className="relative shrink-0">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.username}
                        className="w-6 h-6 rounded-full object-cover border border-gray-700"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div
                      className={`w-6 h-6 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 border border-gray-600 flex items-center justify-center text-[10px] font-bold text-gray-200 ${
                        user.avatar ? 'hidden' : ''
                      }`}
                    >
                      {user.username.charAt(0).toUpperCase() || <UserIcon size={12} />}
                    </div>
                  </div>

                  {/* Username + You badge */}
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className={`text-xs font-semibold truncate ${
                        isCurrentUser ? 'text-yellow-300 font-bold' : 'text-gray-200'
                      }`}
                    >
                      {user.username}
                    </span>
                    {isCurrentUser && (
                      <span className="shrink-0 text-[9px] font-extrabold uppercase px-1.5 rounded bg-yellow-400/20 text-yellow-300 border border-yellow-400/30">
                        You
                      </span>
                    )}
                  </div>
                </div>

                {/* Right: difficulty breakdown + solved pill */}
                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex items-center gap-1 text-[10px] font-mono">
                    <span className="text-emerald-400 font-semibold" title={`${user.easy} Easy`}>
                      {user.easy}E
                    </span>
                    <span className="text-gray-600">·</span>
                    <span className="text-amber-400 font-semibold" title={`${user.medium} Medium`}>
                      {user.medium}M
                    </span>
                    <span className="text-gray-600">·</span>
                    <span className="text-rose-400 font-semibold" title={`${user.hard} Hard`}>
                      {user.hard}H
                    </span>
                  </div>

                  <div
                    className={`px-2 py-0.5 rounded-lg text-xs font-extrabold flex items-center gap-1 ${
                      isCurrentUser
                        ? 'bg-yellow-400/20 text-yellow-300 border border-yellow-400/30'
                        : 'bg-gray-800 text-gray-200 border border-gray-700/60'
                    }`}
                  >
                    <span>{user.solved}</span>
                    <span className="text-[10px] font-normal text-gray-400">solved</span>
                  </div>
                </div>
              </div>
            );
          })}

          {/* View All / Show Top 5 */}
          {leaderboard.length > 5 && (
            <button
              onClick={() => setIsExpanded((prev) => !prev)}
              className="w-full py-1.5 mt-2 flex items-center justify-center gap-1 text-xs font-semibold text-gray-400 hover:text-gray-200 bg-gray-800/30 hover:bg-gray-800/60 rounded-xl border border-gray-800 transition-colors"
            >
              {isExpanded ? (
                <>
                  <ChevronUp size={14} /> Show Top 5
                </>
              ) : (
                <>
                  <ChevronDown size={14} /> View All ({leaderboard.length} students)
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
