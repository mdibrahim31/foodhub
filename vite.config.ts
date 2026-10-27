import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    base: './',
    plugins: [react(), tailwindcss()],
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
          vendor: path.resolve(import.meta.dirname, 'vendor.html'),
          orders: path.resolve(import.meta.dirname, 'orders.html'),
          rider: path.resolve(import.meta.dirname, 'rider.html'),
          admin: path.resolve(import.meta.dirname, 'admin.html'),
          subadmin: path.resolve(import.meta.dirname, 'subadmin.html'),
        },
      },
    },
    server: {
      hmr: false,
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
