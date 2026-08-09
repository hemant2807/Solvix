import { type WeakTopicData } from "../../utils/analytics"

interface WeakTopicRadarProps {
  radarData: WeakTopicData[]
}

const TOPIC_ORDER = [
  "Array",
  "String",
  "Hash Table",
  "Dynamic Programming",
  "Two Pointers",
  "Sliding Window",
  "Tree",
  "Binary Tree",
  "Graph",
  "Depth-First Search",
  "Breadth-First Search",
  "Binary Search",
  "Heap",
  "Stack",
  "Queue",
  "Linked List",
  "Trie",
  "Greedy",
  "Backtracking",
  "Divide and Conquer",
  "Sorting",
  "Math",
  "Bit Manipulation",
  "Geometry",
  "Simulation"
]

const MAX_TOPICS = 12

export function WeakTopicRadar({ radarData }: WeakTopicRadarProps) {
  if (radarData.length === 0) {
    return (
      <div className="bg-gray-900/60 rounded-2xl p-4 border border-gray-800 text-center">
        <p className="text-xs text-gray-500">Not enough data to generate topic radar.</p>
        <p className="text-[10px] text-gray-600 mt-1">Solve more problems across different topics to see your radar.</p>
      </div>
    )
  }

  const displayTopics = radarData.slice(0, MAX_TOPICS)
  const numTopics = displayTopics.length
  const angleStep = (Math.PI * 2) / numTopics
  const centerX = 100
  const centerY = 100
  const maxRadius = 85

  // Calculate polygon points for each level
  const getPolygonPoints = (radiusRatio: number) => {
    return displayTopics.map((_, i) => {
      const angle = i * angleStep - Math.PI / 2
      const x = centerX + Math.cos(angle) * maxRadius * radiusRatio
      const y = centerY + Math.sin(angle) * maxRadius * radiusRatio
      return `${x},${y}`
    }).join(" ")
  }

  // Calculate data polygon points
  const dataPoints = displayTopics.map((topic, i) => {
    const angle = i * angleStep - Math.PI / 2
    const radius = maxRadius * (topic.score / 100)
    const x = centerX + Math.cos(angle) * radius
    const y = centerY + Math.sin(angle) * radius
    return `${x},${y}`
  }).join(" ")

  // Calculate label positions
  const labelPositions = displayTopics.map((item, i) => {
    const angle = i * angleStep - Math.PI / 2
    const labelRadius = maxRadius + 18
    const x = centerX + Math.cos(angle) * labelRadius
    const y = centerY + Math.sin(angle) * labelRadius
    const textAnchor = Math.cos(angle) > 0.1 ? "start" : Math.cos(angle) < -0.1 ? "end" : "middle"
    const dy = Math.sin(angle) > 0.1 ? "0.8em" : Math.sin(angle) < -0.1 ? "-0.2em" : "0.35em"
    return { topic: item.topic, x, y, textAnchor, dy }
  })

  return (
    <div className="bg-gray-900/60 rounded-2xl p-4 border border-gray-800">
      <div className="mb-4">
        <h4 className="text-white text-sm font-semibold mb-1 flex items-center gap-1.5">
          <span style={{display:"flex"}}>🎯</span>
          Topic Radar
        </h4>
        <p className="text-xs text-gray-500">Higher score = weaker topic. Based on failure rate, attempts, time, and difficulty.</p>
      </div>

      <div className="relative" style={{ width: "200px", height: "200px", margin: "0 auto" }}>
        <svg width="200" height="200" viewBox="0 0 200 200">
          {/* Grid circles */}
          <polygon
            points={getPolygonPoints(0.25)}
            fill="none"
            stroke="#374150"
            strokeWidth="1"
          />
          <polygon
            points={getPolygonPoints(0.5)}
            fill="none"
            stroke="#374150"
            strokeWidth="1"
          />
          <polygon
            points={getPolygonPoints(0.75)}
            fill="none"
            stroke="#374150"
            strokeWidth="1"
          />
          <polygon
            points={getPolygonPoints(1)}
            fill="none"
            stroke="#374150"
            strokeWidth="1"
          />

          {/* Axis lines */}
          {displayTopics.map((_, i) => {
            const angle = i * angleStep - Math.PI / 2
            const x = centerX + Math.cos(angle) * maxRadius
            const y = centerY + Math.sin(angle) * maxRadius
            return (
              <line
                key={i}
                x1={centerX}
                y1={centerY}
                x2={x}
                y2={y}
                stroke="#374150"
                strokeWidth="1"
              />
            )
          })}

          {/* Data polygon */}
          <polygon
            points={dataPoints}
            fill="#ef444433"
            stroke="#ef4444"
            strokeWidth="2"
          />

          {/* Data points */}
          {displayTopics.map((topic, i) => {
            const angle = i * angleStep - Math.PI / 2
            const radius = maxRadius * (topic.score / 100)
            const x = centerX + Math.cos(angle) * radius
            const y = centerY + Math.sin(angle) * radius
            const color = topic.level === "Weak" ? "#ef4444" : topic.level === "Average" ? "#f59e0b" : "#22c55e"
            return (
              <circle
                key={i}
                cx={x}
                cy={y}
                r={4}
                fill={color}
                stroke="#111827"
                strokeWidth="2"
              />
            )
          })}

          {/* Labels */}
          {labelPositions.map(({ topic, x, y, textAnchor, dy }) => (
            <text
              key={topic}
              x={x}
              y={y}
              textAnchor={textAnchor}
              dy={dy}
              fontSize="9"
              fill="#9ca3af"
              style={{ fontFamily: "Inter, system-ui, sans-serif", pointerEvents: "none" }}
            >
              {topic.length > 12 ? topic.slice(0, 10) + "…" : topic}
            </text>
          ))}

          {/* Center label */}
          <text
            x={centerX}
            y={centerY}
            textAnchor="middle"
            dy="0.35em"
            fontSize="10"
            fill="#6b7280"
            style={{ fontFamily: "Inter, system-ui, sans-serif" }}
          >
            WEAKNESS
            <tspan x={centerX} dy="1.2em" fontSize="8">SCORE</tspan>
          </text>
        </svg>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap justify-center gap-3">
        {[
          { label: "Strong (0-30)", color: "#22c55e" },
          { label: "Average (31-59)", color: "#f59e0b" },
          { label: "Weak (60+)", color: "#ef4444" }
        ].map(({ label, color }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-[10px] text-gray-400">{label}</span>
          </div>
        ))}
      </div>

      {/* Topic Details Table */}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left py-1 px-2 text-gray-500 font-medium">Topic</th>
              <th className="text-center py-1 px-2 text-gray-500 font-medium">Score</th>
              <th className="text-center py-1 px-2 text-gray-500 font-medium">Level</th>
              <th className="text-center py-1 px-2 text-gray-500 font-medium">Solved</th>
              <th className="text-center py-1 px-2 text-gray-500 font-medium">Fail%</th>
              <th className="text-center py-1 px-2 text-gray-500 font-medium">Avg Att.</th>
            </tr>
          </thead>
          <tbody>
            {displayTopics.map((item) => {
              const levelColor = item.level === "Weak" ? "text-red-400" : item.level === "Average" ? "text-yellow-400" : "text-green-400"
              return (
                <tr key={item.topic} className="border-b border-gray-800/50 hover:bg-gray-800/50">
                  <td className="py-1.5 px-2 text-white font-medium truncate max-w-[120px]">{item.topic}</td>
                  <td className="py-1.5 px-2 text-center font-bold" style={{ color: levelColor }}>{item.score}</td>
                  <td className="py-1.5 px-2 text-center" style={{ color: levelColor }}>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold" style={{
                      backgroundColor: item.level === "Weak" ? "#ef444433" : item.level === "Average" ? "#f59e0b33" : "#22c55e33"
                    }}>
                      {item.level}
                    </span>
                  </td>
                  <td className="py-1.5 px-2 text-center text-gray-400">{item.stats.solved}</td>
                  <td className="py-1.5 px-2 text-center text-gray-400">{item.stats.failureRate}%</td>
                  <td className="py-1.5 px-2 text-center text-gray-400">{item.stats.avgAttempts}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="mt-3 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
        <p className="text-xs text-gray-300">{getWeakTopicSummary(radarData)}</p>
      </div>
    </div>
  )
}

function getWeakTopicSummary(radarData: WeakTopicData[]): string {
  if (radarData.length === 0) return "Not enough data to analyze weak topics."
  
  const weakTopics = radarData.filter(t => t.level === "Weak")
  const avgTopics = radarData.filter(t => t.level === "Average")
  
  if (weakTopics.length > 0) {
    const names = weakTopics.slice(0, 3).map(t => t.topic).join(", ")
    return `${names} currently require the most attempts and have the highest failure rate.`
  }
  
  if (avgTopics.length > 0) {
    const names = avgTopics.slice(0, 3).map(t => t.topic).join(", ")
    return `${names} need more practice to strengthen.`
  }
  
  return "All topics are performing well! Keep up the great work."
}