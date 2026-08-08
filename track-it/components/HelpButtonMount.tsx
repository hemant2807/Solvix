import { createRoot } from "react-dom/client"
import HelpButton from "./HelpButton"

export function mountHelpButton(mountPoint: HTMLElement) {
  const root = createRoot(mountPoint)
  root.render(<HelpButton />)
}