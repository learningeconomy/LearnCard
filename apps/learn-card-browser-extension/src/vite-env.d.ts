/// <reference types="vite/client" />

// Allow importing SVG files as URLs
declare module '*.svg' {
  const src: string;
  export default src;
}
