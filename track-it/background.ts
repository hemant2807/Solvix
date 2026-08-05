/// <reference types="chrome"/>

chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg.type === "NAVIGATE" && msg.url) {
    const doUpdate = (tabId: number) => {
      chrome.tabs.update(tabId, { url: msg.url }, () => {
        if (chrome.runtime.lastError) {
          console.error("[LeetBuddy] NAVIGATE failed:", chrome.runtime.lastError.message)
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