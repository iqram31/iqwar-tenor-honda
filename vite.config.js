import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base harus sama dengan nama repo GitHub agar jalan di GitHub Pages
export default defineConfig({
  plugins: [react()],
  base: '/iqwar-tenor-honda/',
})
