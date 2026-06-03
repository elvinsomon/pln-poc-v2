import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Dev server en :5173 (origen ya permitido por el CORS del backend).
export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
})
