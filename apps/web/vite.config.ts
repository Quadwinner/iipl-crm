import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // VITE_* variables live in the repo-root .env, shared by every app.
  envDir: fileURLToPath(new URL('../../', import.meta.url)),
  resolve: {
    alias: {
      // The rental trees are verbatim copies of the two portals. They keep their
      // own internal imports under a dedicated alias so `@/` always means the
      // superapp, never a module.
      '@rental-admin': fileURLToPath(new URL('./src/modules/rental/admin', import.meta.url)),
      '@rental-owner': fileURLToPath(new URL('./src/modules/rental/owner', import.meta.url)),
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5175,
  },
})
