import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// 临时低内存构建配置：剥离 design-mode 插件、关闭 sourcemap、
// 手动分包，仅为绕过 2GB cgroup 内存上限完成本次 build。
// 用完即弃，不进仓库；项目正式构建仍以 vite.config.ts 为准。
export default defineConfig({
  plugins: [
    {
      name: 'dev-inject',
      enforce: 'post',
      transformIndexHtml(html) {
        if (!html.includes('data-id="dev-inject-monitor"')) {
          return html.replace(
            '</head>',
            `
    <script data-id="dev-inject-monitor">
      (function() {
        const remote = "/sdk/dev-monitor.js";
        const separator = remote.includes('?') ? '&' : '?';
        const script = document.createElement('script');
        script.src = remote + separator + 't=' + Date.now();
        script.dataset.id = 'dev-inject-monitor-script';
        script.defer = true;
        if (!document.querySelector('[data-id="dev-inject-monitor-script"]')) {
          document.head.appendChild(script);
        }
      })();
    </script>
  \n</head>`,
          );
        }
        return html;
      },
    },
    react(),
  ],
  resolve: {
    alias: {
      '@': path.resolve('/app/project_workspace/3792874922840064', './src'),
    },
  },
  build: {
    sourcemap: false,
    minify: 'esbuild',
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'radix-vendor': [
            '@radix-ui/react-accordion',
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-popover',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            '@radix-ui/react-tooltip',
          ],
        },
      },
    },
  },
});
