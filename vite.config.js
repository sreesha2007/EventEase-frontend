import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  if (mode === 'production' && !env.VITE_API_BASE_URL?.trim()) {
    throw new Error('Set VITE_API_BASE_URL to the deployed backend URL before building.')
  }

  return {
    plugins: [react()],
  }
})
