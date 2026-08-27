const currentScript = document.currentScript
const verificationToken = currentScript ? currentScript.getAttribute("data-token") : null

let attempts = 0
let accepted = false

const originalFetch = window.fetch
window.fetch = async (...args) => {
  const response = await originalFetch(...args)
  const url = typeof args[0] === "string" ? args[0] : args[0].url

  if (url.includes("/submit")) {
    attempts += 1
  }

  if (url.includes("/submit") || url.includes("/interpret_solution") || url.includes("/check")) {
    response.clone().json().then((data) => {
      const status = data?.status_msg || "Pending"

      if (status === "Accepted") {
        accepted = true
      }

      window.dispatchEvent(
        new CustomEvent("leetcode-verdict", {
          detail: {
            token: verificationToken,
            source: url.includes("/check")
              ? "check"
              : url.includes("/submit")
              ? "submit"
              : "interpret",
            verdict: status,
            attempts,
            accepted,
            data
          }
        })
      )
    })
  }

  return response
}

// ---- Also handle XHR ----
const origOpen = XMLHttpRequest.prototype.open
XMLHttpRequest.prototype.open = function (method, url, ...rest) {
  this.addEventListener("load", function () {
    if (url.includes("/check") || url.includes("/submit") || url.includes("/interpret_solution")) {
      try {
        const data = JSON.parse(this.responseText)
        const status = data?.status_msg || "Pending"

        if (url.includes("/submit")) {
          attempts += 1
        }

        if (status === "Accepted") {
          accepted = true
        }

        window.dispatchEvent(
          new CustomEvent("leetcode-verdict", {
            detail: {
              token: verificationToken,
              source: url.includes("/check")
                ? "check"
                : url.includes("/submit")
                ? "submit"
                : "interpret",
              verdict: status,
              attempts,
              accepted,
              data
            }
          })
        )
      } catch {}
    }
  })
  return origOpen.call(this, method, url, ...rest)
}