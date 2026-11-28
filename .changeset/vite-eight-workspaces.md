---
'scoutpass-app': patch
'ai-passport-backend': patch
---

Build with Vite 8.3.8 (Rolldown). scouts moves to @vitejs/plugin-react-swc 4, vite-plugin-svgr 5 and @vitejs/plugin-basic-ssl 2, and its dev-server pre-bundling now provides `process`, `Buffer` and `global` through Oxc `inject`/`define` instead of the esbuild-only NodeGlobalsPolyfillPlugin. The ai-passport admin bundle is built with Vite 8.
