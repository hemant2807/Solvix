import React from 'react'
import { Trophy, Clock, Target, CheckCircle } from 'lucide-react'

interface CelebrationOverlayProps {
  onClose: () => void
  questionName: string
  buttonClicked: string
  verdict: string
  attempts: number
}

const CelebrationOverlay: React.FC<CelebrationOverlayProps> = ({
  onClose,
  verdict,
  questionName,
  buttonClicked,
  attempts
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
      {/* Celebration ribbons/confetti background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Animated ribbons */}
        <div className="absolute top-0 left-1/4 w-2 h-full bg-gradient-to-b from-yellow-400 to-orange-500 transform -skew-x-12 animate-ribbon-fall opacity-80"></div>
        <div className="absolute top-0 right-1/4 w-2 h-full bg-gradient-to-b from-green-400 to-emerald-500 transform skew-x-12 animate-ribbon-fall-delayed opacity-80"></div>
        <div className="absolute top-0 left-1/2 w-2 h-full bg-gradient-to-b from-purple-400 to-pink-500 transform -skew-x-6 animate-ribbon-fall-slow opacity-80"></div>
        
        {/* Floating particles */}
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className={`absolute w-3 h-3 bg-yellow-400 rounded-full animate-float-particle opacity-70`}
            style={{
              left: `${10 + (i * 7)}%`,
              top: `${20 + (i % 3) * 20}%`,
              animationDelay: `${i * 200}ms`,
              animationDuration: `${3 + (i % 2)}s`
            }}
          />
        ))}
      </div>

      {/* Main overlay content */}
      <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 max-w-md w-full mx-4 border border-gray-700/50 shadow-2xl animate-scale-in">
        {/* Trophy icon with glow */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-yellow-400/30 rounded-full blur-xl animate-pulse-glow"></div>
            <div className="relative bg-gradient-to-br from-yellow-400 to-orange-500 p-4 rounded-full">
              <Trophy className="text-white" size={40} />
            </div>
          </div>
        </div>

        {/* Congratulations text */}
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-white mb-2 animate-bounce-in">
            Congratulations! 🎉
          </h2>
          <p className="text-gray-300">You solved</p>
          <p className="text-xl font-semibold text-blue-400 mt-1">{questionName}</p>
        </div>

        {/* Stats section */}
        <div className="space-y-4 mb-8">
          {/* Time taken */}
          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-lg border border-blue-500/30">
            <div className="flex items-center gap-2">
              <Clock className="text-blue-400" size={20} />
              <span className="text-gray-300">Time taken</span>
            </div>
            <span className="text-white font-semibold">{buttonClicked}</span>
          </div>

          {/* Attempts */}
          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-orange-900/30 to-red-900/30 rounded-lg border border-orange-500/30">
            <div className="flex items-center gap-2">
              <Target className="text-orange-400" size={20} />
              <span className="text-gray-300">Attempts</span>
            </div>
            <span className="text-white font-semibold">{attempts || 1}</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="space-y-3">
          {/* Analyze complexity button */}
          <button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25 flex items-center justify-center gap-2">
            <CheckCircle size={20} />
            Want to analyze the time and space complexity
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Continue reviewing button */}
          <button 
            onClick={onClose}
            className="w-full bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 hover:scale-105"
          >
            Continue Reviewing
          </button>
        </div>

        {/* Decorative elements */}
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full animate-ping opacity-75"></div>
        <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-green-400 rounded-full animate-ping opacity-75" style={{ animationDelay: '0.5s' }}></div>
      </div>

      {/* Additional CSS animations would go in your style.css file */}
      <style>{`
        @keyframes ribbon-fall {
          0% { transform: translateY(-100vh) skewX(-12deg); }
          100% { transform: translateY(100vh) skewX(-12deg); }
        }
        
        @keyframes ribbon-fall-delayed {
          0% { transform: translateY(-100vh) skewX(12deg); }
          100% { transform: translateY(100vh) skewX(12deg); }
        }
        
        @keyframes ribbon-fall-slow {
          0% { transform: translateY(-100vh) skewX(-6deg); }
          100% { transform: translateY(100vh) skewX(-6deg); }
        }
        
        @keyframes float-particle {
          0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.7; }
          50% { transform: translateY(-20px) rotate(180deg); opacity: 1; }
        }
        
        @keyframes scale-in {
          0% { transform: scale(0.8); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        
        @keyframes bounce-in {
          0% { transform: translateY(-30px); opacity: 0; }
          50% { transform: translateY(5px); opacity: 1; }
          100% { transform: translateY(0); opacity: 1; }
        }
        
        @keyframes pulse-glow {
          0%, 100% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(1.1); opacity: 0.6; }
        }
        
        .animate-ribbon-fall { animation: ribbon-fall 3s linear infinite; }
        .animate-ribbon-fall-delayed { animation: ribbon-fall-delayed 3s linear infinite 0.5s; }
        .animate-ribbon-fall-slow { animation: ribbon-fall-slow 4s linear infinite 1s; }
        .animate-float-particle { animation: float-particle 3s ease-in-out infinite; }
        .animate-scale-in { animation: scale-in 0.5s ease-out; }
        .animate-bounce-in { animation: bounce-in 0.8s ease-out; }
        .animate-pulse-glow { animation: pulse-glow 2s ease-in-out infinite; }
      `}</style>
    </div>
  )
}

export default CelebrationOverlay