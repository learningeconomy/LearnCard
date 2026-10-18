---
"@learncard/react": major
"learn-card-base": patch
"learn-card-app": patch
"scoutpass-app": patch
---

Migrate styles to Tailwind 4.3. The published React styles now require Safari/iOS 16.4+, Chrome/Edge/Android WebView 111+, or Firefox 128+; this raises the supported browser floor and requires a major release of `@learncard/react`.

Keep importing `dist/main.css` for card styles and optionally `dist/base.css` for the global reset. Card palette and font utilities retain literal values rather than inheriting host Tailwind tokens. Existing global utility class names remain subject to the normal stylesheet cascade. See the package README for migration and native release requirements.
