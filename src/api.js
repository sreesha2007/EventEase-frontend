const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
const apiBaseUrl = (configuredApiBaseUrl || (
  import.meta.env.DEV ? "https://eventease-backend-rikz.onrender.com/" : ""
)).replace(/\/+$/, "");

export const API_URL = `${apiBaseUrl}/api`;

export function apiFetch(url, options) {
  if (!configuredApiBaseUrl && import.meta.env.PROD) {
    throw new Error(
      "The EventEase backend is not deployed yet. Please try again after it is available."
    );
  }

  return fetch(url, options);
}
