import { defineConfig } from "vite";
import solid from "vite-plugin-solid";
import postcssPresetEnv from "postcss-preset-env";
import { createSvgIconsPlugin } from "vite-plugin-svg-icons-ng";
import path from "node:path";
import prismjs from "vite-plugin-prismjs";

const host = process.env.TAURI_DEV_HOST;

// https://vitejs.dev/config/
export default defineConfig(async () => ({
  plugins: [
    createSvgIconsPlugin({
      iconDirs: [path.resolve(process.cwd(), "src/icons")],
    }),
    prismjs({
      languages: ["json"],
    }),
    solid(),
  ],

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["solid-js", "solid-js/web"],
          virtua: ["virtua"],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. tell vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },
  optimizeDeps: {
    include: [
      "solid-js",
      "solid-markdown > micromark",
      "solid-markdown > unified",
    ],
    exclude: [],
  },
  css: {
    postcss: {
      plugins: [postcssPresetEnv()],
    },
  },
}));
