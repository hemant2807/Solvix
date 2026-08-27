export const CHROME_STORAGE_KEYS = {
  LEETCODE_USER: "leetcodeUser",
  AI_CHAT_HISTORY: "Solvix.ai_chat_history",
  AI_LAST_CONTEXT: "Solvix.ai_last_context",
  SELECTED_SHEET: "Solvix.selected_sheet",
  DAILY_GOAL: "Solvix.daily_goal"
} as const;

export async function readChromeStorage<T>(key: string, fallback: T): Promise<T> {
  try {
    if (typeof chrome !== "undefined" && chrome.storage?.local) {
      const result = await chrome.storage.local.get([key])
      return (result[key] as T) ?? fallback
    }
  } catch (e) {
  }
  return fallback
}

export async function writeChromeStorage(key: string, value: unknown): Promise<void> {
  try {
    if (typeof chrome !== "undefined" && chrome.storage?.local) {
      await chrome.storage.local.set({ [key]: value })
    }
  } catch (e) {
  }
}

export async function removeChromeStorage(key: string): Promise<void> {
  try {
    if (typeof chrome !== "undefined" && chrome.storage?.local) {
      await chrome.storage.local.remove([key])
    }
  } catch (e) {
  }
}

export function onChromeStorageKeyChanged<T>(key: string, callback: (newValue: T) => void): () => void {
  if (typeof chrome === "undefined" || !chrome.storage?.onChanged) {
    return () => {}
  }

  const listener = (changes: Record<string, chrome.storage.StorageChange>, areaName: string) => {
    if (areaName !== "local" || !(key in changes)) return
    callback(changes[key].newValue as T)
  }

  chrome.storage.onChanged.addListener(listener)
  return () => chrome.storage.onChanged.removeListener(listener)
}