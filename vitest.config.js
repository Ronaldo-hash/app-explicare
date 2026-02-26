import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    return {
        plugins: [react()],
        test: {
            globals: true,
            environment: 'happy-dom',
            setupFiles: './src/test/setup.js',
            css: false,
            env: env, // Inject env direct string object
        },
    };
});
