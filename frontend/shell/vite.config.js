import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import federation from '@originjs/vite-plugin-federation';

export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, process.cwd(), 'VITE_'), ...process.env };
  const isProd = mode === 'production';

  const mfeUsuarioRemote =
    env.VITE_MFE_USUARIO_REMOTE ||
    (isProd
      ? '/mfe-usuario/assets/remoteEntry.js'
      : 'http://localhost:3001/assets/remoteEntry.js');
  const caronaMfeRemote =
    env.VITE_MFE_CARONA_REMOTE ||
    (isProd
      ? '/mfe-carona/assets/remoteEntry.js'
      : 'http://localhost:3003/assets/remoteEntry.js');
  const apartmentMfeRemote =
    env.VITE_MFE_APARTMENT_REMOTE ||
    (isProd
      ? '/mfe-apartment/assets/remoteEntry.js'
      : 'http://localhost:3002/assets/remoteEntry.js');
  const chatMfeRemote =
    env.VITE_MFE_CHAT_REMOTE ||
    (isProd
      ? '/mfe-chat/assets/remoteEntry.js'
      : 'http://localhost:3004/assets/remoteEntry.js');

  return {
    plugins: [
      react(),
      federation({
        name: 'shell',
        remotes: {
          mfeUsuario: mfeUsuarioRemote,
          caronaMfe: caronaMfeRemote,
          apartmentMfe: apartmentMfeRemote,
          chatMfe: chatMfeRemote,
        },
        shared: {
          react: { singleton: true, requiredVersion: '^18.0.0' },
          'react-dom': { singleton: true, requiredVersion: '^18.0.0' },
          '@mui/material': { singleton: true },
          '@emotion/react': { singleton: true },
          '@emotion/styled': { singleton: true },
        },
      }),
    ],
    build: {
      target: 'esnext',
    },
    server: {
      port: 3000,
    },
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test-setup.js'],
      include: ['src/**/*.{test,spec}.{js,jsx}'],
    },
  };
});
