import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  build: {
    target: 'es2020',
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild',
    chunkSizeWarningLimit: 600, // Increase warning limit to 600kB
    rollupOptions: {
      output: {
        manualChunks: {
          // Split React and React-DOM into separate chunk
          'react-vendor': ['react', 'react-dom'],
          // Split CodeMirror into separate chunk (largest dependency)
          'codemirror': [
            '@codemirror/commands',
            '@codemirror/language',
            '@codemirror/search',
            '@codemirror/state',
            '@codemirror/view',
            '@uiw/react-codemirror'
          ],
          // Split Material-UI into separate chunk
          'mui-vendor': [
            '@mui/material',
            '@mui/icons-material',
            '@emotion/react',
            '@emotion/styled'
          ],
          // Split Capacitor plugins into separate chunk
          'capacitor': [
            '@capacitor/core',
            '@capacitor/app',
            '@capacitor/filesystem',
            '@capacitor/splash-screen'
          ],
          // Split Zustand state management
          'zustand': ['zustand']
        },
        // Optimize chunk file names
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    // Enable CSS code splitting
    cssCodeSplit: true,
    // Optimize assets
    assetsInlineLimit: 4096, // Inline assets smaller than 4kb
  },
  server: {
    port: 3000
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'zustand',
      '@capacitor/core',
      '@capacitor/app'
    ]
  }
});
