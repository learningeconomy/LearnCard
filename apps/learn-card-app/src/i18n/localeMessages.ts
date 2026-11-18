// Served by the paraglideLazyLocales vite plugin: real loaders in production builds (where non-base
// locales are split out of the entry chunk), no-ops in dev and tests (every locale ships statically).
//   loadLocaleMessages(locale): load a locale's messages if the build split them out.
//   isLocaleMessagesLoaded(locale): true when the locale can render now.
export { loadLocaleMessages, isLocaleMessagesLoaded } from 'virtual:paraglide-lazy-locales';
