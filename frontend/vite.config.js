import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    host: true,
    // Pre-transform the customer-facing entry chain at server startup instead
    // of waiting for the first real page request to trigger it — this is
    // what makes the very first page load (product listing, home) noticeably
    // slower than every load after it.
    warmup: {
      clientFiles: [
        './src/main.jsx',
        './src/App.jsx',
        './src/pages/Home.jsx',
        './src/pages/ProductListing.jsx',
        './src/pages/ProductDetails.jsx',
        './src/components/layout/StorefrontLayout.jsx',
      ],
    },
  },
  optimizeDeps: {
    // Listed explicitly so Vite pre-bundles them up front instead of
    // discovering them reactively off the first request. recharts is
    // deliberately excluded — it's only used on the admin dashboard, so
    // bundling it eagerly would slow down the customer-facing path for no
    // benefit; it still gets bundled lazily the first time /admin loads.
    include: ['react', 'react-dom', 'react-dom/client', 'react-router-dom', 'axios'],
  },
})
