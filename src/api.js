const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();

if (!configuredApiBaseUrl && import.meta.env.PROD) {
  throw new Error(
    "VITE_API_BASE_URL must be set to the deployed backend URL."
  );
}

const apiBaseUrl = (
  configuredApiBaseUrl || "http://localhost:8080"
).replace(/\/+$/, "");

export const API_URL = `${apiBaseUrl}/api`;
