import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const isVercelBuild = env.VERCEL === "1" || process.env.VERCEL === "1";
  const resolvedApiBase = (
    isVercelBuild
      ? "/api"
      : (env.VITE_API_URL || env.VITE_API_BASE_URL || "http://localhost:3000")
  ).replace(/\/+$/, "");

  return {
    plugins: [react(), tailwindcss()],
    define: {
      "import.meta.env.VITE_API_URL": JSON.stringify(resolvedApiBase),
      "import.meta.env.VITE_API_BASE_URL": JSON.stringify(resolvedApiBase),
    },
    server: {
      proxy: {
        "/api": {
          target: "http://localhost:3000",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ""),
        },
      },
    },
  };
})
