// @ts-check
import { defineConfig } from "astro/config";

import react from "@astrojs/react";

import tailwindcss from "@tailwindcss/vite";

import netlify from "@astrojs/netlify";

// https://astro.build/config
export default defineConfig({
  integrations: [react()],

  vite: {
    plugins: [tailwindcss()],
    // The LearnCard monorepo hoists React 18 to the root for learn-card-app. Shared deps such as
    // react-markdown live at the root too, so pin every React import to this app's React 19.
    resolve: {
      dedupe: ["react", "react-dom"],
      // Bundle the React-consuming deps on the server (SSR and prerender) so their `react` import
      // goes through the dedupe above instead of Node resolving the root React 18 at runtime.
      noExternal: ["@nanostores/react", "react-markdown", "react-shiki"],
    },
  },

  adapter: netlify(),
});
