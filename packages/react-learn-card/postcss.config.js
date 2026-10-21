// Pass the plugin instance: rollup-plugin-styles' resolver predates exports-only packages.
const tailwindcss = require('@tailwindcss/postcss');
module.exports = { plugins: [tailwindcss({ optimize: { minify: true } })] };
