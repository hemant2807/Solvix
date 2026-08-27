export const API_BASE_URL = "https://solvix-backend.onrender.com"
export function apiUrl(path: string) {
  return `${API_BASE_URL}${path}`
}
