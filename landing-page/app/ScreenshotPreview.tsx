import React, { useState } from "react";
import { Sparkles, Terminal, ShieldAlert, BarChart3, Clock, CheckCircle } from "lucide-react";

interface ScreenshotPreviewProps {
  src: string;
  alt: string;
  className?: string;
  type?: "dashboard" | "goal" | "ai" | "analytics" | "github" | "activity" | "platforms" | "performance" | "sheets";
}

export const ScreenshotPreview: React.FC<ScreenshotPreviewProps> = ({
  src,
  alt,
  className = "",
  type = "dashboard",
}) => {
  const [hasError, setHasError] = useState(false);

  // Return a stunning, premium CSS mock preview of the actual extension panel/UI state
  const renderPlaceholder = () => {
    switch (type) {
      case "dashboard":
        return (
          <div className="dashboard-preview-mock w-full h-full mx-auto bg-[#0d1324] rounded-2xl border border-gray-800 shadow-2xl p-5 text-left relative overflow-hidden flex flex-col justify-between">
            {/* Top user profile header */}
            <div>
              <div className="flex items-center space-x-3 pb-4 border-b border-gray-800/60">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brandPurple to-indigo-500 p-[2px]">
                  <div className="w-full h-full bg-[#0a0f1d] rounded-full flex items-center justify-center font-bold text-xs text-white">XL</div>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-white flex items-center space-x-1.5">
                    <span>xyz.leetcode</span>
                    <span className="text-xs text-brandOrange">🏆</span>
                  </h4>
                  <p className="text-xs text-gray-500">Ranking #493,991</p>
                </div>
              </div>

              {/* Status Grid */}
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="bg-[#090d18] border border-gray-800/40 rounded-xl p-3">
                  <span className="text-[10px] text-gray-500 block uppercase tracking-wider font-semibold">Today's Solved</span>
                  <span className="text-lg font-bold text-brandGreen">2 Problems</span>
                </div>
                <div className="bg-[#090d18] border border-gray-800/40 rounded-xl p-3">
                  <span className="text-[10px] text-gray-500 block uppercase tracking-wider font-semibold">Active Streak</span>
                  <span className="text-lg font-bold text-brandOrange">7 Days</span>
                </div>
              </div>

              {/* Goal Widget */}
              <div className="bg-[#090d18] border border-gray-800/40 rounded-xl p-4 mt-3 flex items-center justify-between">
                <div>
                  <h5 className="text-xs font-bold text-gray-300">DAILY GOAL</h5>
                  <p className="text-[10px] text-gray-500 mt-0.5">2 / 3 solved. 1 more left!</p>
                </div>
                {/* Visual circle widget */}
                <div className="relative w-11 h-11 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="22" cy="22" r="18" stroke="#1f2937" strokeWidth="3" fill="transparent" />
                    <circle cx="22" cy="22" r="18" stroke="#f59e0b" strokeWidth="3" fill="transparent" strokeDasharray={113} strokeDashoffset={113 - (113 * 66) / 100} />
                  </svg>
                  <span className="absolute text-[10px] font-bold text-brandOrange">66%</span>
                </div>
              </div>

              {/* Active sheet widget */}
              <div className="bg-[#090d18] border border-gray-800/40 rounded-xl p-3.5 mt-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Active List:</span>
                  <span className="font-semibold text-white">Striver SDE Sheet</span>
                </div>
                <div className="w-full bg-gray-800 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-brandPurple h-full rounded-full" style={{ width: "35%" }}></div>
                </div>
              </div>
            </div>

            {/* Bottom Tabs Mock */}
            <div className="grid grid-cols-5 gap-1 pt-4 border-t border-gray-800/60 text-center text-gray-500 text-[10px]">
              <div className="text-brandOrange font-bold flex flex-col items-center">
                <div className="p-1 bg-brandOrange/10 rounded-lg"><Terminal className="w-4 h-4" /></div>
              </div>
              <div className="flex flex-col items-center hover:text-white"><BarChart3 className="w-4 h-4" /></div>
              <div className="flex flex-col items-center hover:text-white"><Clock className="w-4 h-4" /></div>
              <div className="flex flex-col items-center hover:text-white"><Sparkles className="w-4 h-4" /></div>
              <div className="flex flex-col items-center hover:text-white"><ShieldAlert className="w-4 h-4" /></div>
            </div>
          </div>
        );

      case "platforms":
        return (
          <div className="platform-preview-mock w-full max-w-[340px] mx-auto bg-[#0d1324] rounded-2xl border border-gray-800 shadow-2xl p-5 text-left flex flex-col justify-between">
            <h4 className="text-xs font-bold text-brandPurple uppercase tracking-wider mb-4 flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-brandPurple animate-pulse" />
              <span>Similar Questions Across Platforms</span>
            </h4>
            <div className="space-y-3">
              {[
                { name: "GeeksforGeeks", query: "Search GeeksforGeeks for \"Sqrt(x)\"" },
                { name: "Codeforces", query: "Search Codeforces for \"Sqrt(x)\"" },
                { name: "CodeChef", query: "Search CodeChef for \"Sqrt(x)\"" }
              ].map((plat, idx) => (
                <div key={idx} className="platform-work-row bg-[#090d18] border border-gray-800/40 rounded-xl p-3 flex items-center justify-between hover:border-brandPurple/30 transition-all cursor-pointer">
                  <div className="platform-work-copy flex-1 min-w-0 pr-2">
                    <span className="text-[10px] text-brandPurple bg-brandPurple/10 px-2 py-0.5 rounded font-bold uppercase tracking-wider mr-2">Search</span>
                    <span className="text-xs text-white font-bold">{plat.name} : </span>
                    <span className="platform-query text-[11px] text-gray-400 font-light truncate">{plat.query}</span>
                  </div>
                  <svg className="w-3.5 h-3.5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </div>
              ))}
            </div>
          </div>
        );

      case "performance":
        return (
          // Removed max-w-[340px] so the global CSS sizing applies smoothly
          <div className="performance-preview w-full mx-auto bg-[#0d1324] rounded-2xl border border-gray-800 shadow-2xl p-5 text-left flex flex-col justify-between">
            {/* Grouped the top section so it stays together */}
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center space-x-1.5">
                <span className="text-brandOrange">✨</span>
                <span>Daily Performance</span>
              </h4>
              
              <div className="performance-quote text-xs text-gray-400 italic mb-5 border-b border-gray-850 pb-4">
                "Start today — tomorrow we'll compare your progress."
              </div>
            </div>

            {/* Increased vertical spacing (space-y-5) to let the metrics breathe */}
            <div className="performance-metrics space-y-5 mb-2">
              {[
                { label: "Solved", val: "0" },
                { label: "Attempts", val: "0" },
                { label: "Accuracy", val: "—" },
                { label: "Goal", val: "0/3", isGoal: true }
              ].map((metric, i) => (
                <div key={i} className="flex justify-between items-center text-xs">
                  <span className="text-gray-400 font-light">{metric.label}</span>
                  <span className="font-bold text-white flex items-center space-x-1.5">
                    {metric.isGoal && <span className="text-[10px] text-gray-500">🎯</span>}
                    <span>{metric.val}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        );

      case "sheets":
        return (
          <div className="sheets-preview w-full max-w-[340px] mx-auto bg-[#0d1324] rounded-2xl border border-gray-800 shadow-2xl p-5 text-left flex flex-col justify-between max-h-[380px] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-gray-800 mb-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
                <span className="text-brandPurple">📚</span>
                <span>Select Practice Sheet</span>
              </h4>
              <span className="text-[10px] bg-brandOrange/10 text-brandOrange px-2 py-0.5 rounded-full font-bold">25 Problems</span>
            </div>

            <div className="space-y-2">
              {[
                { name: "Striver's A2Z DSA Course Sheet", count: "20 questions", author: "Raj Vikramaditya (Striver)" },
                { name: "Striver's SDE Sheet", count: "25 questions", author: "Raj Vikramaditya (Striver)", active: true },
                { name: "Blind 75 Must Do LeetCode Questions", count: "75 questions", author: "Yangshun Tai" },
                { name: "Blind 150 Extended Problem Set", count: "85 questions", author: "LeetCode Community" },
                { name: "NeetCode 150 Practice Roadmap", count: "30 questions", author: "NeetCode" },
                { name: "Love Babbar 450 DSA Cracker", count: "15 questions", author: "Love Babbar" }
              ].map((sheet, idx) => (
                <div 
                  key={idx} 
                  className={`border rounded-xl p-3 flex flex-col justify-between transition-all ${
                    sheet.active 
                      ? "border-brandPurple/60 bg-brandPurple/5" 
                      : "border-gray-850 bg-[#090d18]/50 hover:border-gray-800"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h6 className="text-xs font-bold text-white flex items-center space-x-1.5">
                        {sheet.active && <span className="text-brandPurple text-[10px]">✓</span>}
                        <span>{sheet.name}</span>
                      </h6>
                      <p className="text-[10px] text-gray-500 mt-1">
                        {sheet.count} &bull; {sheet.author}
                      </p>
                    </div>
                    <span className="text-[9px] bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded font-bold uppercase">Curated</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case "goal":
        return (
          <div className="w-full aspect-video max-w-[340px] mx-auto bg-[#0d1324] rounded-2xl border border-gray-800 shadow-2xl p-5 text-left relative flex items-center justify-center">
            <div className="text-center">
              <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="48" cy="48" r="40" stroke="#1f2937" strokeWidth="6" fill="transparent" />
                  <circle cx="48" cy="48" r="40" stroke="#f59e0b" strokeWidth="6" fill="transparent" strokeDasharray={251} strokeDashoffset={251 - (251 * 75) / 100} strokeLinecap="round" />
                </svg>
                <div className="absolute text-center">
                  <span className="text-xl font-bold text-white block">75%</span>
                  <span className="text-[9px] uppercase tracking-wider text-gray-500 font-bold">Goal</span>
                </div>
              </div>
              <h5 className="text-sm font-bold text-gray-200 mt-4">Daily Targets</h5>
              <p className="text-xs text-gray-500 mt-1">3 / 4 completed today</p>
            </div>
          </div>
        );

      case "ai":
        return (
          // Added 'ai-preview' and removed Tailwind aspect/max-width classes
          <div className="ai-preview w-full mx-auto bg-[#0d1324] rounded-2xl border border-gray-800 shadow-2xl p-5 text-left relative flex flex-col justify-between">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-brandPurple" />
                <span className="text-xs font-bold text-white">Solvix AI assistant</span>
              </div>
              <span className="text-[10px] bg-brandPurple/15 text-brandPurple px-2 py-0.5 rounded-full font-semibold">Gemini 2.0</span>
            </div>

            {/* Chats */}
            <div className="flex-1 py-4 space-y-3 overflow-y-auto text-xs">
              <div className="bg-gray-800/40 p-2.5 rounded-lg border border-gray-800 max-w-[85%] text-gray-300">
                How can I optimize this O(N²) solution for Two Sum?
              </div>
              <div className="bg-brandPurple/10 p-2.5 rounded-lg border border-brandPurple/20 max-w-[90%] ml-auto text-gray-200">
                You can use a Hash Map to store values. This allows finding target complements in O(1) lookups, bringing complexity to <code className="text-brandPurple font-mono">O(N)</code>!
              </div>
            </div>

            {/* Options */}
            <div className="grid grid-cols-2 gap-2 pb-3">
              <button className="py-2 bg-gray-850 hover:bg-gray-800 border border-gray-800 text-[10px] font-semibold rounded-lg text-center text-white">💡 Explain Problem</button>
              <button className="py-2 bg-gray-850 hover:bg-gray-800 border border-gray-800 text-[10px] font-semibold rounded-lg text-center text-white">🧠 Get Code Hint</button>
              <button className="py-2 bg-gray-850 hover:bg-gray-800 border border-gray-800 text-[10px] font-semibold rounded-lg text-center text-white">🔥 Optimize Code</button>
              <button className="py-2 bg-gray-850 hover:bg-gray-800 border border-gray-800 text-[10px] font-semibold rounded-lg text-center text-white">🪲 Find Bugs</button>
            </div>

            {/* Input Mock */}
            <div className="border-t border-gray-800 pt-3 flex items-center space-x-2">
              <div className="bg-[#090d18] border border-gray-800 text-[11px] text-gray-500 px-3 py-2 rounded-lg flex-1">
                Ask a concept, e.g. "Explain recursion"...
              </div>
              <button className="w-8 h-8 rounded-lg bg-brandPurple flex items-center justify-center text-white">
                <Sparkles className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        );

      case "analytics":
        return (
          // Removed Tailwind aspect/max-width classes so global CSS takes over
          <div className="analytics-preview-mock w-full mx-auto bg-[#0d1324] rounded-2xl border border-gray-800 shadow-2xl p-5 text-left relative flex flex-col justify-between">
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center justify-between">
                <span>7-Day Activity</span>
                <span className="text-[10px] text-brandGreen bg-brandGreen/10 px-2 py-0.5 rounded-full lowercase">active</span>
              </h4>
              
              {/* Analytics chart */}
              <div className="analytics-chart flex items-end justify-between h-24 px-2 pt-2 border-b border-gray-800">
                {[
                  { day: "Tue", h: "40%", active: false },
                  { day: "Wed", h: "20%", active: false },
                  { day: "Thu", h: "60%", active: false },
                  { day: "Fri", h: "80%", active: false },
                  { day: "Sat", h: "100%", active: true },
                  { day: "Sun", h: "10%", active: false },
                  { day: "Mon", h: "50%", active: false },
                ].map((bar, i) => (
                  <div key={i} className="flex flex-col items-center space-y-2 flex-1">
                    <div className="w-5 bg-gray-800 rounded-t-sm relative h-16 overflow-hidden analytics-bar-track">
                      <div 
                        className={`absolute bottom-0 left-0 right-0 rounded-t-sm ${
                          bar.active ? "bg-gradient-to-t from-sky-400 to-sky-300 analytics-bar-active" : "bg-gradient-to-t from-gray-700 to-gray-600 analytics-bar-muted"
                        }`} 
                        style={{ height: bar.h }}
                      />
                    </div>
                    <span className="text-[9px] font-semibold text-gray-500">{bar.day}</span>
                  </div>
                ))}
              </div>

              <div className="analytics-stats grid grid-cols-3 gap-2 mt-4 text-center">
                <div className="bg-[#090d18] border border-gray-800/40 rounded-lg p-2">
                  <span className="text-[9px] text-gray-500 block uppercase font-bold">Solved</span>
                  <span className="text-xs font-extrabold text-white">42</span>
                </div>
                <div className="bg-[#090d18] border border-gray-800/40 rounded-lg p-2">
                  <span className="text-[9px] text-gray-500 block uppercase font-bold">Practice Hours</span>
                  <span className="text-xs font-extrabold text-white">12.5h</span>
                </div>
                <div className="bg-[#090d18] border border-gray-800/40 rounded-lg p-2">
                  <span className="text-[9px] text-gray-500 block uppercase font-bold">Sessions</span>
                  <span className="text-xs font-extrabold text-white">18</span>
                </div>
              </div>

              <div className="analytics-advanced bg-[#090d18] border border-gray-800/40 rounded-xl p-3.5 mt-4">
                <h5 className="text-[10px] text-gray-400 uppercase tracking-wider font-bold mb-2.5">Advanced metrics</h5>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500">Longest Streak</span>
                    <span className="font-bold text-white">14 days</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500">Consistency Index</span>
                    <span className="font-bold text-brandGreen">92%</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500">Success Rate</span>
                    <span className="font-bold text-brandPurple">78%</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="text-[10px] text-center text-gray-600 mt-2 font-mono">Solvix Analytics Engine</div>
          </div>
        );

      case "github":
        return (
          // Removed aspect-video and max-w-[340px] to allow global CSS sizing
          <div className="github-preview w-full mx-auto bg-[#0d1324] rounded-2xl border border-gray-800 shadow-2xl p-5 text-left relative flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-2 pb-4 border-b border-gray-800">
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                </svg>
                <span className="text-xs font-bold text-white">GitHub DSA Sync Workflow</span>
              </div>
              
              {/* Increased spacing and margin for the repository details */}
              <div className="space-y-4 mt-6">
                <div className="flex items-center space-x-2 text-xs">
                  <div className="w-2 h-2 rounded-full bg-brandGreen"></div>
                  <span className="text-gray-400">Target Repository:</span>
                  <span className="font-mono text-white text-[11px] bg-gray-800 px-2 py-1 rounded">my-leetcode-solutions</span>
                </div>
                <div className="flex items-center space-x-2 text-xs">
                  <div className="w-2 h-2 rounded-full bg-brandGreen"></div>
                  <span className="text-gray-400">Branch:</span>
                  <span className="font-mono text-white text-[11px] bg-gray-800 px-2 py-1 rounded">main</span>
                </div>
              </div>
            </div>
            
            {/* Softened the padding and spacing on the success alert */}
            <div className="mt-4 flex items-center space-x-2 text-[11px] text-gray-500 bg-[#090d18] border border-gray-850 p-3 rounded-xl">
              <CheckCircle className="w-4 h-4 text-brandGreen flex-shrink-0" />
              <span>Automatically pushed solution for <strong>"Two Sum"</strong> to GitHub.</span>
            </div>
          </div>
        );

      case "activity":
        return (
          <div className="activity-preview-mock w-full bg-[#0d1324] rounded-2xl border border-gray-800 shadow-2xl p-5 text-left relative flex flex-col justify-between">
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Recent practice work</h4>
              <div className="space-y-2">
                {[
                  { q: "4. Median of Two Sorted Arrays", time: "25m ago", state: "Accepted", color: "text-red-500 bg-red-500/10" },
                  { q: "121. Best Time to Buy and Sell Stock", time: "2h ago", state: "Accepted", color: "text-brandGreen bg-brandGreen/10" },
                  { q: "15. 3Sum", time: "1d ago", state: "Wrong Answer", color: "text-amber-500 bg-amber-500/10" },
                ].map((item, index) => (
                  <div key={index} className="activity-work-row flex justify-between items-center bg-[#090d18] border border-gray-850 p-2 rounded-lg text-xs">
                    <div>
                      <h6 className="font-semibold text-white truncate">{item.q}</h6>
                      <span className="text-[10px] text-gray-500">{item.time}</span>
                    </div>
                    <div className="text-right">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${item.color}`}>{item.state}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="w-full aspect-video bg-[#0d1324] rounded-2xl border border-gray-800 shadow-2xl flex items-center justify-center p-6 text-center">
            <div>
              <span className="text-sm font-semibold text-gray-400 block">{alt}</span>
              <span className="text-xs text-gray-600 mt-2 block font-mono">(Screenshot will appear here)</span>
            </div>
          </div>
        );
    }
  };

  if (hasError || !src || src.includes("CHROME_EXTENSION_URL_HERE") || src.includes("GITHUB_SYNC_SCREENSHOT_URL_HERE")) {
    return (
      // Removed the bg-gradient, borders, and shadows here
      <div className={`flex items-center justify-center w-full h-full ${className}`}>
        {renderPlaceholder()}
      </div>
    );
  }

  return (
    <div className={`p-3 bg-gradient-to-b from-gray-800/20 to-gray-900/60 rounded-3xl border border-gray-800/50 shadow-2xl flex items-center justify-center overflow-hidden transition-all duration-300 hover:border-brandPurple/30 group ${className}`}>
      <img
        src={src}
        alt={alt}
        onError={() => setHasError(true)}
        className="w-full h-auto rounded-xl object-contain shadow-lg max-h-[460px] group-hover:scale-[1.01] transition-transform duration-500"
      />
    </div>
  );
};
