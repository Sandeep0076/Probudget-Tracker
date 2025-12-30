import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  // Log which env keys are loaded (will show in build output)
  console.log('[ViteConfig] Mode:', mode);
  console.log('[ViteConfig] VITE_API_BASE_URL from env:', env.VITE_API_BASE_URL || '(empty)');
  
  const geminiKey = env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY || '';
  const apiTarget = env.VITE_API_BASE_URL || 'http://localhost:4000';
  
  console.log('[ViteConfig] API Proxy target:', apiTarget);
  console.log('[ViteConfig] Gemini API Key:', geminiKey ? 'Set' : 'Not set');
  
  return {
    server: {
      port: 3000,
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
          secure: false,
          ws: true,
          configure: (proxy, options) => {
            proxy.on('error', (err, req, res) => {
              console.log('[Vite Proxy] Error:', err.message);
            });
            proxy.on('proxyReq', (proxyReq, req, res) => {
              console.log('[Vite Proxy] →', req.method, req.url, '→', options.target);
            });
            proxy.on('proxyRes', (proxyRes, req, res) => {
              console.log('[Vite Proxy] ←', proxyRes.statusCode, req.method, req.url);
            });
          }
        },
      },
    },
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(geminiKey),
      'process.env.GEMINI_API_KEY': JSON.stringify(geminiKey),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
