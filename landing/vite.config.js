import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const landingRoot = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  root: landingRoot,
  publicDir: join(landingRoot, 'public'),
  build: {
    outDir: join(landingRoot, 'build'),
    emptyOutDir: true,
  },
});
