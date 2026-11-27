declare module '*.wasm?url' {}
declare module 'swiper/css/navigation' {}

// Side-effect stylesheet imports (`import './controls.css'`) in learn-card-base/ui. Vite bundles
// them; this keeps consumers without `vite/client` types (scouts) from reporting TS2882.
declare module '*.css' {}
