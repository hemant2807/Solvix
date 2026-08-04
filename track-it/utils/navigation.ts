declare const chrome: any

export function navigateSameTab(url: string): void {
  if (typeof chrome !== "undefined" && chrome.runtime) {
    chrome.runtime.sendMessage({ type: "NAVIGATE", url })
  } else {
    window.open(url, "_blank")
  }
}

export function openInNewTab(url: string): void {
  if (typeof chrome !== "undefined" && chrome.tabs?.create) {
    chrome.tabs.create({ url })
  } else {
    window.open(url, "_blank")
  }
}