import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig} from 'vite';

function githubPagesPlugin() {
  return {
    name: 'github-pages-plugin',
    closeBundle() {
      const distDir = path.resolve(import.meta.dirname, 'dist');
      if (fs.existsSync(distDir)) {
        const indexPath = path.join(distDir, 'index.html');
        const fallbackPath = path.join(distDir, '404.html');
        const noJekyllPath = path.join(distDir, '.nojekyll');
        
        if (fs.existsSync(indexPath)) {
          fs.copyFileSync(indexPath, fallbackPath);
        }
        fs.writeFileSync(noJekyllPath, '');
      }
    }
  };
}

export default defineConfig(() => {
  return {
    base: './',
    plugins: [react(), tailwindcss(), githubPagesPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        input: {
          main: path.resolve(import.meta.dirname, 'index.html'),
          customer: path.resolve(import.meta.dirname, 'customer.html'),
          vendor_access_panel: path.resolve(import.meta.dirname, 'vendor_access_panel.html'),
          vendor: path.resolve(import.meta.dirname, 'vendor.html'),
          orders: path.resolve(import.meta.dirname, 'orders.html'),
          order: path.resolve(import.meta.dirname, 'order.html'),
          rider: path.resolve(import.meta.dirname, 'rider.html'),
          admin: path.resolve(import.meta.dirname, 'admin.html'),
        },
      },
    },
    server: {
      hmr: false,
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
