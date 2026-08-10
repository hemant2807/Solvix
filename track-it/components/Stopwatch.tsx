import { useEffect, useState, useRef } from "react"
import { Play, Pause } from "lucide-react"
import { formatSecondsToHMS } from "../utils/time"

export default function Stopwatch({
  verdict,
  buttonClicked,
  question,
}: {
  verdict: string
  buttonClicked: string
  question: string
}) {
  const [elapsed, setElapsed] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [prevQuestion, setPrevQuestion] = useState<string | null>(null)
  const intervalRef = useRef<number | null>(null)

  const startTimer = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = window.setInterval(() => {
      setElapsed((prev) => prev + 1)
    }, 1000)
    setIsRunning(true)
  }

  const stopTimer = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = null
    setIsRunning(false)
  }

  // reset when new question comes
  useEffect(() => {
    if (question && question !== prevQuestion) {
      stopTimer()
      setElapsed(0)
      setPrevQuestion(question)
      startTimer()
    }
  }, [question])

  // pause automatically when Accepted + Submit
  useEffect(() => {
    if (verdict === "Accepted" && buttonClicked === "Submit") {
      stopTimer()
    }
  }, [verdict, buttonClicked])

  // cleanup
  useEffect(() => {
    return () => stopTimer()
  }, [])

  const isAccepted = verdict === "Accepted" && buttonClicked === "Submit"

  return (
    <div className="relative">
      {/* Timer display only */}
      <div
        className={`inline-flex items-center gap-3 px-6 py-4 rounded-lg transition-all duration-500 ${
          isAccepted
            ? "bg-green-500/20 border border-green-500/30"
            : isRunning
            ? "bg-blue-500/20 border border-blue-500/30 shadow-lg shadow-blue-500/20"
            : "bg-gray-500/20 border border-gray-500/30"
        }`}
      >
        <span
          className={`text-3xl font-mono font-bold tracking-wider transition-colors duration-300 ${
            isAccepted
              ? "text-green-400"
              : isRunning
              ? "text-blue-400"
              : "text-gray-400"
          }`}
        >
          {formatSecondsToHMS(elapsed)}
        </span>

        <div
          className={`transition-all duration-300 ${
            isAccepted
              ? "text-green-400"
              : isRunning
              ? "text-blue-400"
              : "text-gray-400"
          }`}
        >
          {isRunning ? (
            <Pause className="w-5 h-5" />
          ) : (
            <Play className="w-5 h-5" />
          )}
        </div>
      </div>
    </div>
  )
}
