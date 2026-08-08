import { useState } from "react"
import { LogIn, Sparkles } from "lucide-react"
import "../style.css"

type Props = {
  onLogin?: () => void
}

export default function LeetCodeLogin({ onLogin }: Props) {
  const [loading, setLoading] = useState(false)

  const handleLogin = () => {
    setLoading(true)
    if (onLogin) {
      onLogin()
    } else {
      const loginUrl = "https://leetcode.com/accounts/login/"
      if (typeof chrome !== "undefined" && chrome.tabs) {
        chrome.tabs.create({ url: loginUrl })
      } else {
        window.open(loginUrl, "_blank")
      }
    }
    setTimeout(() => setLoading(false), 2000)
  }

  return (
    <div className="relative flex items-center justify-center min-h-screen overflow-hidden bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-yellow-400/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-float-delayed"></div>
      </div>

      <div className="relative z-10 w-full max-w-md bg-gray-900/70 backdrop-blur-md border border-gray-800 shadow-2xl rounded-3xl p-8 animate-scale-in">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg shadow-yellow-500/20">
            <Sparkles className="text-black" size={30} />
          </div>
          <h1 className="text-3xl font-extrabold text-white">
            Leet<span className="text-yellow-400">Buddy</span>
          </h1>
          <p className="text-gray-400 mt-2 text-sm leading-relaxed">
            Your AI-powered LeetCode practice tracker — sheets, sessions, analytics and an AI
            workspace, all in one side panel.
          </p>
        </div>

        <div className="flex flex-col gap-4 mt-8">
          <button
            onClick={handleLogin}
            disabled={loading}
            aria-label="Login with LeetCode"
            className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-300 hover:to-orange-400 text-black font-bold rounded-xl py-3.5 text-base flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-300 ease-out hover:shadow-lg hover:shadow-yellow-500/30 hover:scale-[1.02] active:scale-95 focus:outline-none focus:ring-2 focus:ring-yellow-400/60 focus:ring-offset-2 focus:ring-offset-gray-900"
          >
            <LogIn size={20} />
            {loading ? "Redirecting..." : "Login with LeetCode"}
          </button>
          <p className="text-center text-[11px] text-gray-500">
            Opens leetcode.com to sign in, then syncs automatically.
          </p>
        </div>
      </div>
    </div>
  )
}