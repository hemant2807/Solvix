export type Difficulty = "Easy" | "Medium" | "Hard"

interface DifficultyStyle {
  colorClass: string
  badgeClass: string
  barColor: string
}

const DIFFICULTY_STYLES: Record<Difficulty, DifficultyStyle> = {
  Easy: {
    colorClass: "text-green-400",
    badgeClass: "bg-green-400/10 text-green-400 border-green-400/30",
    barColor: "from-green-500 to-emerald-400"
  },
  Medium: {
    colorClass: "text-yellow-400",
    badgeClass: "bg-yellow-400/10 text-yellow-400 border-yellow-400/30",
    barColor: "from-yellow-500 to-amber-400"
  },
  Hard: {
    colorClass: "text-red-400",
    badgeClass: "bg-red-400/10 text-red-400 border-red-400/30",
    barColor: "from-red-500 to-rose-400"
  }
}

export function getDifficultyStyle(difficulty: Difficulty): DifficultyStyle {
  return DIFFICULTY_STYLES[difficulty]
}