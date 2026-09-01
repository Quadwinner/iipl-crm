import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Library build. React and every runtime dependency stay external so the
 * consuming app supplies one copy — bundling React here would give the apps
 * two copies and break hooks.
 */
export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
      formats: ['es'],
      fileName: () => 'index.js',
    },
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        'class-variance-authority',
        'clsx',
        'lucide-react',
        'radix-ui',
        'sonner',
        'tailwind-merge',
      ],
    },
    sourcemap: true,
    emptyOutDir: true,
  },
})
