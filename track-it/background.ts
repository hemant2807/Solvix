/// <reference types="chrome"/>

chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg.type === "NAVIGATE" && msg.url) {
    try {
      const parsed = new URL(msg.url)
      const isAllowedHost = 
        parsed.hostname === "leetcode.com" || 
        parsed.hostname.endsWith(".leetcode.com") ||
        parsed.hostname === "github.com" ||
        parsed.hostname.endsWith(".github.com")

      if (!isAllowedHost) {
        console.warn("[Solvix] Blocked navigation to untrusted domain:", msg.url)
        return
      }
    } catch (e) {
      console.error("[Solvix] Invalid navigation URL:", msg.url)
      return
    }

    const doUpdate = (tabId: number) => {
      chrome.tabs.update(tabId, { url: msg.url }, () => {
        if (chrome.runtime.lastError) {
          console.error("[Solvix] NAVIGATE failed:", chrome.runtime.lastError.message)
        }
      })
    }
    if (sender.tab?.id) {
      doUpdate(sender.tab.id)
    } else {
      chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
        if (tabs[0]?.id) doUpdate(tabs[0].id)
      })
    }
    return
  }

  if (msg.type === "APPLY_CODE") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: "APPLY_CODE",
          code: msg.code,
        });
      }
    });
  }

  if (msg.type === "OPEN_AI_TAB") {
    const windowId = sender.tab?.windowId;
    if (windowId !== undefined) {
      chrome.sidePanel.open({ windowId }).catch((err) => {
        console.error("Failed to open side panel:", err);
      });
    }
  }
});