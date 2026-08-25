import "./style.css"
import type { PlasmoCSConfig } from "plasmo"
// import { mountHelpButton } from "./components/HelpButtonMount" // TODO: Add in future commit
declare const chrome: any;

export const config: PlasmoCSConfig = {
  matches: ["https://leetcode.com/*"]
}

// ---- Inject verdict hook ----
const script = document.createElement("script")
script.src = chrome.runtime.getURL("inject-fetch.js")
document.documentElement.appendChild(script)
script.remove()

// ---- Extract question title ----
function sendQuestionInfo() {
  const title = document.querySelector("div.text-title-large")?.textContent?.trim()
  const isPremium = checkIfPremium()
  const slug = extractProblemSlug()
  
  if (title) {
    sendMessageToExtension({ 
      type: "QUESTION_INFO", 
      title,
      isPremium,
      slug
    })
  }
}

function sendMessageToExtension(message: any) {
  try {
    chrome.runtime.sendMessage(message)
  } catch (err) {
    if (err instanceof Error && err.message.includes("Extension context invalidated")) {
      console.debug("[LeetBuddy] Extension context invalidated, skipping message")
      return
    }
    console.error("[LeetBuddy] Failed to send message:", err)
  }
}

function checkIfPremium(): boolean {
  const lockIcon = document.querySelector("div.text-title-large svg[data-icon='lock']") ||
                   document.querySelector("div.text-title-large .lock-icon") ||
                   document.querySelector("[data-cy='question-title-lock']")
  
  let premiumBadge = null
  const titleArea = document.querySelector("div.text-title-large")?.parentElement
  if (titleArea) {
    const walker = document.createTreeWalker(titleArea, NodeFilter.SHOW_TEXT, null)
    while (walker.nextNode()) {
      if (walker.currentNode.textContent?.includes("Premium")) {
        premiumBadge = walker.currentNode.parentElement
        break
      }
    }
  }
  premiumBadge = premiumBadge || document.querySelector(".premium-badge") || document.querySelector("[data-cy='premium-badge']")
  
  const descEl = document.querySelector("div[data-track-load='description_content']")
  const isPremiumContent = descEl && (
    descEl.textContent?.includes("Subscribe to unlock") ||
    descEl.textContent?.includes("Upgrade to Premium") ||
    descEl.textContent?.includes("This is a premium problem")
  )
  
  const statsLock = document.querySelector(".css-101rr4k svg[data-icon='lock']") ||
                    document.querySelector(".question-stats svg[data-icon='lock']")
  
  return !!(lockIcon || premiumBadge || isPremiumContent || statsLock)
}

function extractProblemSlug(): string | null {
  const urlMatch = window.location.pathname.match(/\/problems\/([^\/]+)/)
  if (urlMatch) return urlMatch[1]
  
  const titleEl = document.querySelector("div.text-title-large")
  const slugFromEl = titleEl?.getAttribute("data-cy")?.replace("question-title-", "")
  if (slugFromEl) return slugFromEl
  
  return null
}

sendQuestionInfo()

// ---- Watch DOM for changes ----
let mutationDebounceTimer: ReturnType<typeof setTimeout> | null = null

const observer = new MutationObserver(() => {
  if (mutationDebounceTimer) clearTimeout(mutationDebounceTimer)
  mutationDebounceTimer = setTimeout(() => {
    mutationDebounceTimer = null
    sendQuestionInfo()
    injectHelpButton()
  }, 400)
})

observer.observe(document.body, { childList: true, subtree: true })

// ---- Inject Help Button beside Save ----
function injectHelpButton() {
  if (document.getElementById("help-in-coding")) return

  const saveBtn = Array.from(document.querySelectorAll("div")).find(
    (el) => el.textContent?.trim() === "Save" || el.textContent?.trim() === "Saved"
  )

  if (saveBtn) {
    const mountPoint = document.createElement("div")
    mountPoint.id = "help-in-coding"
    mountPoint.style.display = "inline-block"
    mountPoint.style.position = "relative"

    saveBtn.insertAdjacentElement("afterend", mountPoint)

    // mountHelpButton(mountPoint) // TODO: Add in future commit
  }
}

// ---- Listen for messages ----
chrome.runtime.onMessage.addListener((msg: any, sender: any, sendResponse: any) => {
  if (msg.type === "APPLY_CODE") {
    try {
      const monaco = (window as any).monaco
      if (monaco?.editor) {
        const editors =
          monaco.editor.getEditors?.() || 
          (monaco.editor.getModels ? [monaco.editor.getModels()[0]] : [])

        if (editors && editors.length > 0) {
          const editor = editors[0]
          if (editor.setValue) {
            editor.setValue(msg.code)
          }
          return
        }
      }

      const textarea = document.querySelector(
        '.view-lines textarea'
      ) as HTMLTextAreaElement
      if (textarea) {
        textarea.value = msg.code
        textarea.dispatchEvent(new Event("input", { bubbles: true }))
        textarea.focus()
        return
      }
      console.warn("Could not find editor or textarea to insert code")
    } catch (err) {
      console.error("Failed to insert code", err)
    } 
  }

  if (msg.type === "GET_CONTEXT") {
    sendResponse(getQuestionContext())
  }
})
 
function listenForButtonClicks() {
  document.addEventListener("click", (e) => {
    const target = e.target as HTMLElement
    if (!target) return

    if (
      target.textContent?.trim() === "Submit" ||
      target.textContent?.trim() === "Run"
    ) {
      sendMessageToExtension({
        type: "BUTTON_CLICKED",
        button: target.textContent?.trim()
      })
    }
  }, true)
}

listenForButtonClicks()

// ---- Extract full problem context ----
function getQuestionContext() {
  const language =
    document.querySelector("button.rounded.items-center")?.textContent?.trim() || ""

  let description = ""
  const descEl = document.querySelector("div[data-track-load='description_content']")
  if (descEl) {
    description = descEl.textContent?.trim() || ""
  }
  if (!description) {
    const article = document.querySelector("#qd-content article")
    if (article) {
      description = article.textContent?.trim() || ""
    }
  }

  return {
    description,
    code: getCurrentCode(),
    language,
    slug: extractProblemSlug()
  }
}

function getCurrentCode(): string {
  try {
    const monaco = (window as any).monaco;
    if (monaco?.editor) {
      const activeEditor = monaco.editor.getEditors
        ? monaco.editor.getEditors()[0]
        : monaco.editor.getModels
        ? monaco.editor.getModels()[0]
        : null;

      if (activeEditor && typeof activeEditor.getValue === "function") {
        return activeEditor.getValue();
      }
    }

    const textarea = document.querySelector(
      '.view-lines textarea, textarea.inputarea'
    ) as HTMLTextAreaElement;
    if (textarea && textarea.value) return textarea.value;

    const lines = document.querySelectorAll(".view-lines span");
    if (lines.length > 0) {
      return Array.from(lines)
        .map((el) => (el.textContent || "").trim())
        .join("\n");
    }
  } catch (err) {
    console.error("❌ Failed to extract code:", err);
  }

  return "";
}

window.addEventListener("leetcode-verdict", (event: any) => {
  const detail = event.detail;
  const code = getCurrentCode();
  const language = document.querySelector("button.rounded.items-center")?.textContent?.trim() || "";

  sendMessageToExtension({
    type: "VERDICT",
    source: detail.source,
    verdict: detail.verdict,
    attempts: detail.attempts,
    raw: detail.data,
    code,
    language,
  });
});