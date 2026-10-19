import { defineConfig, loadEnv, transformWithOxc } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "REACT_APP_");
  return {
    plugins: [
      {
        name: "jsx-in-source-js",
        enforce: "pre",
        transform(code, id) {
          // Existing CRA source files contain JSX with a .js extension.
          if (/\/src\/.*\.js$/.test(id)) {
            return transformWithOxc(code, id, {
              lang: "jsx",
              jsx: { runtime: "automatic" },
            });
          }
        },
      },
      react(),
    ],
    define: {
      "process.env.REACT_APP_API_URL": JSON.stringify(env.REACT_APP_API_URL || ""),
    },
    optimizeDeps: {
      rolldownOptions: { moduleTypes: { ".js": "jsx" } },
    },
    server: {
      port: 3000,
      strictPort: true,
      open: process.env.BROWSER !== "none",
      proxy: {
        "/api": { target: "http://127.0.0.1:3001", changeOrigin: true },
      },
    },
  };
});
