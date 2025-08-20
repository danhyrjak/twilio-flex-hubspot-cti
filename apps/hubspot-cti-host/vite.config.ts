import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths';

// https://vite.dev/config/
export default defineConfig({
  server: {
    allowedHosts: true
  },
  plugins: [
    react(),
     tsconfigPaths({
      // Resolve monorepo sibling packages
      root: '../../',
    })
  ],
  resolve: {
    preserveSymlinks: true  // Important for monorepos
  }
})
