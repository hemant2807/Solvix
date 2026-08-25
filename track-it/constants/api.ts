export const API_BASE_URL = "http://localhost:4000"

export function apiUrl(path: string) {
  return `${API_BASE_URL}${path}`
}
