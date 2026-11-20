import fluentEmojiCssUrl from './assets/fonts/fluent-emoji/FluentEmojiFlat.css?url';

const LINK_ATTRIBUTE = 'data-deferred-font';

/**
 * Font stylesheets nothing on the first screen needs, inserted from script so they never block first
 * paint the way the old `@import url(https://...)` rules in index.scss did (one cold start waited 30 s
 * on tetunori.github.io). Text using them renders in its fallback font and swaps once they arrive.
 * Poppins (the UI font) and Jacques Francois are self-hosted in index.scss instead.
 */
export const DEFERRED_FONT_STYLESHEETS = {
    // Fluent Emoji Flat (`font-fluentEmoji`): vendored CSS, woff2 subsets fetched from the upstream CDN.
    fluentEmoji: fluentEmojiCssUrl,
    // Noto Sans (`font-notoSans`, never on the first screen): Google's variable font covers every
    // weight and 8 scripts; self-hosting the static latin weights alone would add 363 KB.
    notoSans:
        'https://fonts.googleapis.com/css2?family=Noto+Sans:ital,wght@0,100..900;1,100..900&display=swap',
} as const;

export const loadDeferredFontStylesheets = (doc: Document = document): void => {
    for (const [name, href] of Object.entries(DEFERRED_FONT_STYLESHEETS)) {
        if (doc.head.querySelector(`link[${LINK_ATTRIBUTE}="${name}"]`)) continue;

        const link = doc.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        link.setAttribute(LINK_ATTRIBUTE, name);
        doc.head.appendChild(link);
    }
};
