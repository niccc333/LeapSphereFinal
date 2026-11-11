import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Multi-page static site: every folder with an index.html is an entry point,
// so `npm run build` outputs all pages (not just /index.html).
export default defineConfig({
  plugins: [
    // Classic <script src> / non-bundled files are left as-is by Vite,
    // so copy them through to dist to keep the build working.
    viteStaticCopy({
      targets: [
        { src: 'js', dest: '.' },
        { src: 'GSAP/dist', dest: '.' },
        { src: 'vendor', dest: '.' },
        { src: 'assets/logo.png', dest: '.' },
        { src: 'robots.txt', dest: '.' },
        { src: 'sitemap.xml', dest: '.' },
      ],
    }),
  ],
  server: {
    port: 5173,
    strictPort: true,
    open: false,
  },
  preview: {
    port: 4173,
    strictPort: true,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        'why-us': resolve(__dirname, 'why-us/index.html'),
        'how-we-work': resolve(__dirname, 'how-we-work/index.html'),
        faq: resolve(__dirname, 'faq/index.html'),
        about: resolve(__dirname, 'about/index.html'),
        privacy: resolve(__dirname, 'privacy/index.html'),
        terms: resolve(__dirname, 'terms/index.html'),
        fr: resolve(__dirname, 'fr/index.html'),
        'fr/why-us': resolve(__dirname, 'fr/why-us/index.html'),
        'fr/how-we-work': resolve(__dirname, 'fr/how-we-work/index.html'),
        'fr/faq': resolve(__dirname, 'fr/faq/index.html'),
        'fr/about': resolve(__dirname, 'fr/about/index.html'),
        'fr/privacy': resolve(__dirname, 'fr/privacy/index.html'),
        'fr/terms': resolve(__dirname, 'fr/terms/index.html'),
        'fr/brand-questionnaire': resolve(__dirname, 'fr/brand-questionnaire/index.html'),
        'brand-questionnaire': resolve(__dirname, 'brand-questionnaire/index.html'),
      },
    },
  },
});
