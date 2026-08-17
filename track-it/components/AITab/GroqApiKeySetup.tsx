import { useState, useEffect } from "react"
import { ExternalLink, Key, CheckCircle2, AlertTriangle, Loader2, Eye, EyeOff, Trash2 } from "lucide-react"
import {
  readChromeStorage,
  writeChromeStorage,
  removeChromeStorage,
  onChromeStorageKeyChanged,
  CHROME_STORAGE_KEYS
} from "../../utils/storage"

type Props = {
  /** When set, shows an "invalid / expired" error banner above the form instead of the normal setup card. */
  errorMode?: "groq_key_invalid" | "groq_key_required" | null
  /** Called after a key is successfully saved so the parent can re-enable the chat UI. */
  onKeySaved?: () => void
  /** Called after a key is deleted so the parent can update gating state. */
  onKeyRemoved?: () => void
}

function maskKey(key: string): string {
  if (key.length <= 8) return "••••••••"
  return "••••••••••••" + key.slice(-4)
}

export default function GroqApiKeySetup({ errorMode, onKeySaved, onKeyRemoved }: Props) {
  const [savedKey, setSavedKey] = useState<string>("")
  const [isEditing, setIsEditing] = useState(false)
  const [inputValue, setInputValue] = useState("")
  const [showInput, setShowInput] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)
  const [validationError, setValidationError] = useState("")

  // Load existing key on mount and listen for storage changes
  useEffect(() => {
    let mounted = true
    readChromeStorage<string>(CHROME_STORAGE_KEYS.GROQ_API_KEY, "").then((key) => {
      if (!mounted) return
      setSavedKey(key || "")
      // If there is an error mode, immediately enter editing to let user fix the key
      if (errorMode && key) {
        setIsEditing(true)
        setInputValue("")
      }
    })

    const unsubscribe = onChromeStorageKeyChanged<string>(CHROME_STORAGE_KEYS.GROQ_API_KEY, (newKey) => {
      if (!mounted) return
      setSavedKey(newKey || "")
      if (!newKey) {
        setIsEditing(false)
        setIsConfirmingDelete(false)
      }
    })

    return () => {
      mounted = false
      unsubscribe()
    }
  }, [errorMode])

  const handleSave = async () => {
    const trimmed = inputValue.trim()
    if (!trimmed) {
      setValidationError("Please paste your Groq API key.")
      return
    }
    setValidationError("")
    setSaving(true)
    try {
      await writeChromeStorage(CHROME_STORAGE_KEYS.GROQ_API_KEY, trimmed)
      setSavedKey(trimmed)
      setIsEditing(false)
      setInputValue("")
      setShowInput(false)
      setIsConfirmingDelete(false)
      onKeySaved?.()
    } catch {
      setValidationError("Failed to save. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    setValidationError("")
    try {
      await removeChromeStorage(CHROME_STORAGE_KEYS.GROQ_API_KEY)
      setSavedKey("")
      setIsEditing(false)
      setInputValue("")
      setShowInput(false)
      setIsConfirmingDelete(false)
      onKeyRemoved?.()
    } catch {
      setValidationError("Failed to delete key. Please try again.")
    } finally {
      setDeleting(false)
    }
  }

  const handleUpdate = () => {
    setIsEditing(true)
    setIsConfirmingDelete(false)
    setInputValue("")
    setShowInput(false)
    setValidationError("")
  }

  const handleCancel = () => {
    setIsEditing(false)
    setIsConfirmingDelete(false)
    setInputValue("")
    setShowInput(false)
    setValidationError("")
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSave()
    if (e.key === "Escape") handleCancel()
  }

  // ── Configured + not editing ──────────────────────────────────────────────
  if (savedKey && !isEditing) {
    return (
      <div className="rounded-2xl border border-gray-700/50 bg-gray-900/60 backdrop-blur-md p-4 space-y-3">
        {/* Invalid key error banner */}
        {errorMode === "groq_key_invalid" && (
          <div className="flex items-start gap-2 rounded-xl bg-red-500/10 border border-red-500/30 p-3">
            <AlertTriangle size={15} className="text-red-400 shrink-0 mt-0.5" />
            <p className="text-xs text-red-300">
              Your Groq API key is invalid or expired. Please update your API key.
            </p>
          </div>
        )}

        <div className="flex items-center gap-2">
          <CheckCircle2 size={16} className="text-green-400" />
          <span className="text-sm font-semibold text-white">Groq API Key</span>
          <span className="ml-auto text-xs text-green-400 font-medium">✓ Configured</span>
        </div>

        <div className="flex items-center gap-2 bg-gray-800/60 rounded-xl px-3 py-2">
          <Key size={13} className="text-gray-500 shrink-0" />
          <span className="text-xs font-mono text-gray-400 flex-1 truncate">
            {maskKey(savedKey)}
          </span>
        </div>

        {isConfirmingDelete ? (
          <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 space-y-2">
            <p className="text-xs text-red-300 font-medium">
              Remove your saved Groq API key?
            </p>
            <div className="flex gap-2">
              <button
                id="solvix-confirm-delete-groq-key"
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-500 rounded-xl px-3 py-2 transition-all duration-200 disabled:opacity-50 shadow-md shadow-red-600/20"
              >
                {deleting ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    Deleting…
                  </>
                ) : (
                  <>
                    <Trash2 size={13} />
                    Delete API Key
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setIsConfirmingDelete(false)}
                disabled={deleting}
                className="text-xs text-gray-400 hover:text-gray-200 bg-gray-800/50 hover:bg-gray-700/60 border border-gray-700 rounded-xl px-3 py-2 transition-all duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <button
              id="solvix-update-groq-key"
              type="button"
              onClick={handleUpdate}
              className="flex-1 text-xs font-semibold text-gray-300 hover:text-white bg-gray-800/50 hover:bg-gray-700/60 border border-gray-700 hover:border-gray-500 rounded-xl px-3 py-2 transition-all duration-200"
            >
              Update API Key
            </button>
            <button
              id="solvix-delete-groq-key"
              type="button"
              onClick={() => setIsConfirmingDelete(true)}
              className="flex items-center justify-center gap-1.5 text-xs font-semibold text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/50 rounded-xl px-3 py-2 transition-all duration-200"
              title="Delete saved API key"
            >
              <Trash2 size={13} />
              Delete Key
            </button>
          </div>
        )}
      </div>
    )
  }

  // ── Setup / editing ───────────────────────────────────────────────────────
  return (
    <div className="rounded-2xl border border-yellow-500/20 bg-gray-900/70 backdrop-blur-md p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="p-1.5 bg-yellow-400/10 rounded-lg">
          <Key size={15} className="text-yellow-400" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white">Solvix AI Setup</h3>
          <p className="text-[11px] text-gray-400">Add your free Groq API key to use AI features.</p>
        </div>
      </div>

      {/* Invalid key error banner (editing mode) */}
      {errorMode === "groq_key_invalid" && (
        <div className="flex items-start gap-2 rounded-xl bg-red-500/10 border border-red-500/30 p-3">
          <AlertTriangle size={14} className="text-red-400 shrink-0 mt-0.5" />
          <p className="text-xs text-red-300">
            Your Groq API key is invalid or expired. Please enter a new key below or delete the existing key.
          </p>
        </div>
      )}

      {/* Steps */}
      <div className="space-y-3">
        {/* Step 1 */}
        <div className="flex items-start gap-3">
          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-yellow-400/20 text-yellow-400 text-[10px] font-bold flex items-center justify-center mt-0.5">
            1
          </span>
          <div className="space-y-1">
            <p className="text-xs font-medium text-gray-200">Get your free Groq API key</p>
            <a
              href="https://console.groq.com/keys"
              target="_blank"
              rel="noreferrer"
              id="solvix-groq-console-link"
              className="inline-flex items-center gap-1 text-[11px] text-yellow-400 hover:text-yellow-300 transition-colors font-medium"
            >
              Open Groq Console <ExternalLink size={11} />
            </a>
          </div>
        </div>

        {/* Step 2 */}
        <div className="flex items-start gap-3">
          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-yellow-400/20 text-yellow-400 text-[10px] font-bold flex items-center justify-center mt-0.5">
            2
          </span>
          <p className="text-xs text-gray-300 mt-0.5">
            Sign in, click <span className="font-semibold text-white">Create API Key</span>, and copy your key.
          </p>
        </div>

        {/* Step 3 */}
        <div className="flex items-start gap-3">
          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-yellow-400/20 text-yellow-400 text-[10px] font-bold flex items-center justify-center mt-0.5">
            3
          </span>
          <div className="w-full space-y-2">
            <p className="text-xs font-medium text-gray-200">Paste your API key below</p>

            {/* Input */}
            <div className="relative flex items-center">
              <input
                id="solvix-groq-api-key-input"
                type={showInput ? "text" : "password"}
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value)
                  if (validationError) setValidationError("")
                }}
                onKeyDown={handleKeyDown}
                placeholder="sk-••••••••••••••••••••••"
                autoComplete="off"
                spellCheck={false}
                className="w-full bg-gray-800/80 border border-gray-600/60 focus:border-yellow-400/60 rounded-xl px-3 py-2 pr-9 text-xs font-mono text-gray-200 placeholder-gray-600 focus:outline-none transition-colors duration-200"
              />
              <button
                type="button"
                onClick={() => setShowInput((v) => !v)}
                className="absolute right-2.5 text-gray-500 hover:text-gray-300 transition-colors"
                tabIndex={-1}
                aria-label={showInput ? "Hide key" : "Show key"}
              >
                {showInput ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
            </div>

            {validationError && (
              <p className="text-[11px] text-red-400">{validationError}</p>
            )}
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-2">
        <button
          id="solvix-save-groq-key"
          type="button"
          onClick={handleSave}
          disabled={saving || deleting}
          className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-300 hover:to-orange-400 text-black rounded-xl px-3 py-2 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-yellow-500/20"
        >
          {saving ? (
            <>
              <Loader2 size={13} className="animate-spin" />
              Saving…
            </>
          ) : (
            "Save API Key"
          )}
        </button>

        {isEditing && savedKey && (
          <>
            <button
              id="solvix-delete-groq-key-editing"
              type="button"
              onClick={handleDelete}
              disabled={saving || deleting}
              className="flex items-center justify-center gap-1.5 text-xs font-semibold text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/50 rounded-xl px-3 py-2 transition-all duration-200 disabled:opacity-50"
              title="Delete saved API key"
            >
              {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
              Delete
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={saving || deleting}
              className="text-xs text-gray-400 hover:text-gray-200 bg-gray-800/50 hover:bg-gray-700/60 border border-gray-700 rounded-xl px-3 py-2 transition-all duration-200"
            >
              Cancel
            </button>
          </>
        )}
      </div>

      <p className="text-[10px] text-gray-600 text-center">
        Your key is stored only in this browser. It is never shared or logged.
      </p>
    </div>
  )
}

