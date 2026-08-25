const pad = (value: number) => value.toString().padStart(2, "0")

function formatClock(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return [hours, minutes, seconds].map(pad).join(":")
}

export function formatSecondsToHMS(seconds: number) {
  return formatClock(seconds)
}

export function formatMillisecondsToHMS(milliseconds: number) {
  return formatClock(Math.floor(milliseconds / 1000))
}

export function formatRelativeTime(timestamp?: number | null, neverLabel = "Never") {
  if (!timestamp) return neverLabel
  const diff = Date.now() - timestamp
  const minutes = Math.max(1, Math.round(diff / 60000))
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  return `${days}d ago`
}