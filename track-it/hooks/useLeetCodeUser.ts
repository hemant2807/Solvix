import { useState } from "react"

import { CHROME_STORAGE_KEYS, removeChromeStorage } from "../utils/storage"
import type { LeetCodeUser } from "../types/shared"

type FetchCompletionCallback = (user: LeetCodeUser) => void | Promise<void>

export function useLeetCodeUser() {
  const [leetcodeUser, setLeetCodeUser] = useState<LeetCodeUser | null>(null)

  const restoreUserFromStorage = async (): Promise<LeetCodeUser | null> => {
    try {
      if (typeof chrome !== "undefined" && chrome.storage) {
        const result = await chrome.storage.local.get([CHROME_STORAGE_KEYS.LEETCODE_USER])
        const storedUser = result[CHROME_STORAGE_KEYS.LEETCODE_USER]

        if (storedUser) {
          setLeetCodeUser(storedUser)
          return storedUser
        }
      }
    } catch (error) {
      // noop
    }
    return null
  }

  const saveUserToStorage = async (user: LeetCodeUser) => {
    try {
      if (typeof chrome !== "undefined" && chrome.storage) {
        await chrome.storage.local.set({
          [CHROME_STORAGE_KEYS.LEETCODE_USER]: user
        })
      }
    } catch (error) {
      // noop
    }
  }

  // Returns the user on success, null when LeetCode confirms there is no
  // active session (safe to treat as logged out / expired), or undefined
  // when the check itself failed (e.g. offline) and the prior state
  // should be left untouched.
  const fetchLeetCodeUser = async (
    onUserFound?: FetchCompletionCallback
  ): Promise<LeetCodeUser | null | undefined> => {
    try {
      const meResp = await fetch("https://leetcode.com/api/problems/algorithms/", {
        credentials: "include"
      })

      if (!meResp.ok) return null

      const meJson = await meResp.json()
      const username = meJson?.user_name || meJson?.userName || meJson?.username
      if (!username) return null

      const resp = await fetch("https://leetcode.com/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          query: `
            query getUser($username: String!) {
              matchedUser(username: $username) {
                username
                profile { userAvatar ranking }
              }
              userContestRanking(username: $username) {
                rating
              }
            }
          `,
          variables: { username }
        })
      })

      if (!resp.ok) return null

      const json = await resp.json()
      const user = json?.data?.matchedUser
      const contestRanking = json?.data?.userContestRanking

      if (user) {
        const formatted: LeetCodeUser = {
          username: user.username,
          avatar: user.profile?.userAvatar ?? "",
          ranking: user.profile?.ranking ?? 0,
          contestRating: contestRanking?.rating ? Math.round(contestRanking.rating) : undefined
        }

        setLeetCodeUser(formatted)

        if (onUserFound) {
          await onUserFound(formatted)
        }

        return formatted
      }
    } catch (error) {
      return undefined
    }

    return null
  }

  const logout = async () => {
    await removeChromeStorage(CHROME_STORAGE_KEYS.LEETCODE_USER)
    setLeetCodeUser(null)
  }

  return {
    leetcodeUser,
    setLeetCodeUser,
    restoreUserFromStorage,
    saveUserToStorage,
    fetchLeetCodeUser,
    logout
  }
}