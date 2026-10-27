import { build } from "vite";
import tailwind from "@tailwindcss/vite";
await build({ configFile: false, esbuild: { jsx: "automatic" }, root: new URL("../admin-web", import.meta.url).pathname, base: "/admin/assets/", plugins: [tailwind()], build: { outDir: new URL("../dist/admin", import.meta.url).pathname, emptyOutDir: true, rollupOptions: { output: { entryFileNames: "admin.js", assetFileNames: "admin.[ext]" } } } });
