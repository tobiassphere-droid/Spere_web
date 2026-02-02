import { defineConfig } from 'vite';

export default defineConfig({
    build: {
        rollupOptions: {
            input: {
                main: 'index.html',
                termin: 'termin.html',
                impressum: 'impressum.html',
                datenschutz: 'datenschutz.html',
            },
        },
    },
});
